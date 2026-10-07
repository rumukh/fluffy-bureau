"""Synthesize Fluffy Bureau voice lines with Azure Speech and derive mouth cues.

python tools/assets/voice/synth.py --manifest <C voice-manifest.json> [--only ID,ID] [--assess]
       [--masters F:/AI/GameAssets/fluffy-bureau/voice/masters] [--out assets/voice]

For every manifest entry:
  * SSML from casting.json (voice + prosody + delivery) and lexicon.json (<phoneme> IPA);
  * a 24 kHz WAV master plus Azure viseme events (kept outside the repo, T20);
  * a loudness-normalized MP3 (mono, 44.1 kHz, 96 kbit/s, -18 LUFS, -1.5 dBTP);
  * a Rhubarb-format mouth-cue JSON (A-H + X) mapped from Azure viseme IDs (aegis animation.md 5.1);
  * an entry in assets/voice/index.json.
Files are keyed by line id + a hash of the SSML (text + voice configuration), so changed text
or casting re-synthesizes automatically and stale files are removed from the index.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import subprocess
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
sys.path.insert(0, str(HERE))

AZURE_TO_RHUBARB = ["X", "C", "D", "E", "C", "E", "B", "F", "F", "D", "E",
                    "D", "B", "E", "H", "B", "B", "B", "G", "B", "B", "A"]
MIN_HOLD = 0.05
WORD = re.compile(r"[A-Za-zА-Яа-яЁё\u0301-]+")


def load_json(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def offline_pack(packs: list[str]) -> str:
    mapped = set()
    for p in packs:
        if p.startswith("case"):
            mapped.add(p.split("-")[0])
        elif p == "prologue":
            mapped.add("prologue")
        else:
            mapped.add("shell")
    return mapped.pop() if len(mapped) == 1 else "shell"


def pct(base: str, delta: float) -> str:
    v = float(base.rstrip("%")) + delta
    return f"{v:+.0f}%"


class Builder:
    def __init__(self, casting: dict, lexicon: dict):
        self.casting = casting
        self.forms: dict[str, str] = {}
        for e in lexicon["entries"]:
            for form, ipa in e["forms"].items():
                self.forms[form.lower()] = ipa

    def ssml(self, entry: dict) -> tuple[str, str]:
        spk = self.casting["speakers"].get(entry["speaker"])
        if not spk:
            raise KeyError(f"no casting for speaker {entry['speaker']!r} ({entry['id']})")
        voice = entry.get("voiceOverride") or spk["voice"]
        dl = self.casting["delivery"].get(entry.get("delivery") or "neutral", self.casting["delivery"]["neutral"])
        pitch, rate = pct(spk["pitch"], dl["pitch"]), pct(spk["rate"], dl["rate"])
        volume = dl.get("volume")
        text = unicodedata.normalize("NFC", entry["ttsText"]).replace("\u0301", "")

        def repl(m: re.Match) -> str:
            w = m.group(0)
            ipa = self.forms.get(w.lower())
            if ipa:
                return f'<phoneme alphabet="ipa" ph="{ipa}">{html.escape(w)}</phoneme>'
            return html.escape(w)

        parts, last = [], 0
        for m in WORD.finditer(text):
            parts.append(html.escape(text[last:m.start()]))
            parts.append(repl(m))
            last = m.end()
        parts.append(html.escape(text[last:]))
        body = "".join(parts)
        attrs = f'pitch="{pitch}" rate="{rate}"' + (f' volume="{volume}"' if volume else "")
        inner = f"<prosody {attrs}>{body}</prosody>"
        if not voice.startswith("ru-RU-"):
            inner = f'<lang xml:lang="ru-RU">{inner}</lang>'
        ssml = ('<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" '
                f'xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="ru-RU"><voice name="{voice}">{inner}</voice></speak>')
        return ssml, voice


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")


def loudness(path: Path) -> float | None:
    done = run(["ffmpeg", "-nostdin", "-hide_banner", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"])
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", done.stderr)
    if not m:
        return None
    v = float(m[-1])
    return None if v <= -69 else v


def duration(path: Path) -> float:
    done = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)])
    return float(done.stdout.strip())


def encode(master: Path, out_mp3: Path, post: dict) -> float:
    lufs = loudness(master)
    gain = (post["targetLufs"] - lufs) if lufs is not None else 0.0
    limit = 10 ** (post["truePeakDb"] / 20)
    out_mp3.parent.mkdir(parents=True, exist_ok=True)
    done = run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", str(master), "-af",
                f"volume={gain:.2f}dB,aresample={post['sampleRate']}:resampler=soxr,alimiter=limit={limit:.4f}:level=false",
                "-ac", "1", "-ar", str(post["sampleRate"]), "-c:a", "libmp3lame", "-b:a", post["mp3Bitrate"], str(out_mp3)])
    if done.returncode:
        raise RuntimeError(done.stderr[-400:])
    return loudness(out_mp3) or 0.0


def cues_from(visemes: list, dur: float) -> list[dict]:
    raw = [(round(t, 3), AZURE_TO_RHUBARB[v] if 0 <= v < len(AZURE_TO_RHUBARB) else "B") for t, v in visemes]
    raw.sort()
    seq: list[list] = []
    if not raw or raw[0][0] > 0:
        seq.append([0.0, "X"])
    for t, s in raw:
        t = min(t, dur)
        if seq and abs(t - seq[-1][0]) < 1e-6:
            seq[-1][1] = s
            continue
        seq.append([t, s])
    # Merge flickers shorter than MIN_HOLD into the previous shape, then collapse repeats.
    out: list[list] = []
    for i, (t, s) in enumerate(seq):
        nxt = seq[i + 1][0] if i + 1 < len(seq) else dur
        if out and nxt - t < MIN_HOLD and s != "X":
            continue
        if out and out[-1][1] == s:
            continue
        out.append([t, s])
    if out[-1][1] != "X":
        out.append([max(out[-1][0] + MIN_HOLD, dur - 0.05), "X"])
    res = []
    for i, (t, s) in enumerate(out):
        end = out[i + 1][0] if i + 1 < len(out) else dur
        if end - t <= 0:
            continue
        res.append({"start": round(t, 2), "end": round(end, 2), "value": s})
    return res


def norm_tokens(s: str) -> list[str]:
    s = unicodedata.normalize("NFD", s.lower().replace("ё", "е"))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^\w-]+", " ", s).replace("-", " ").split()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--masters", default="F:/AI/GameAssets/fluffy-bureau/voice/masters")
    ap.add_argument("--out", default=str(REPO / "assets/voice"))
    ap.add_argument("--only", default="")
    ap.add_argument("--assess", action="store_true")
    ap.add_argument("--index", default=None, help="index path (default <out>/index.json)")
    a = ap.parse_args()

    from azure_speech import assess, synthesize  # noqa: PLC0415 (needs the Azure SDK venv)

    casting = load_json(HERE / "casting.json")
    lexicon = load_json(HERE / "lexicon.json")
    manifest = load_json(Path(a.manifest))
    b = Builder(casting, lexicon)
    out = Path(a.out)
    masters = Path(a.masters)
    index_path = Path(a.index) if a.index else out / "index.json"
    index = load_json(index_path) if index_path.exists() else {"format": "fluffy-voice-index", "schema": 1, "lines": {}}
    only = set(filter(None, a.only.split(",")))
    report = []
    entries = [e for e in manifest["entries"] if not only or e["id"] in only]
    for n, e in enumerate(entries, 1):
        ssml, voice = b.ssml(e)
        key = hashlib.sha256(ssml.encode("utf-8")).hexdigest()[:10]
        pack = offline_pack(e.get("packs", []))
        rel = f"{pack}/{e['id']}.{key}"
        mp3, cue_path = out / f"{rel}.mp3", out / f"{rel}.cues.json"
        prev = index["lines"].get(e["id"])
        if prev and prev.get("key") == key and (out / prev["file"]).exists() and (out / prev["cues"]).exists():
            continue
        wav = masters / f"{e['id']}.{key}.wav"
        ev_path = wav.with_suffix(".events.json")
        if wav.exists() and ev_path.exists():
            events = load_json(ev_path)
        else:
            events = synthesize(ssml, wav)
            ev_path.write_text(json.dumps(events, ensure_ascii=False), encoding="utf-8")
            wav.with_suffix(".ssml").write_text(ssml, encoding="utf-8")
        lufs = encode(wav, mp3, casting["postprocess"])
        dur = duration(mp3)
        cues = cues_from(events["visemes"], dur)
        cue_path.write_text(json.dumps({"metadata": {"soundFile": mp3.name, "duration": round(dur, 3)},
                                        "mouthCues": cues}, ensure_ascii=False), encoding="utf-8")
        if prev and prev.get("file") != f"{rel}.mp3":
            for old in (prev.get("file"), prev.get("cues")):
                if old and (out / old).exists():
                    (out / old).unlink()
        rec = {"id": e["id"], "revision": e.get("revision", 1), "ttsHash": e.get("ttsHash"), "speaker": e["speaker"],
               "voice": voice, "key": key, "pack": pack, "file": f"{rel}.mp3", "cues": f"{rel}.cues.json",
               "durationMs": round(dur * 1000), "lufs": round(lufs, 1),
               "provenance": {"tool": "Azure AI Speech neural TTS (REST/SDK 1.51) via tools/assets/voice/synth.py",
                              "voice": voice, "region": casting["region"],
                              "createdAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                              "licence": "Generated with Azure AI Speech prebuilt neural voice under the owner's Azure subscription; commercial use per Microsoft Product Terms. No third-party copyright.",
                              "notes": "Mouth cues from Azure viseme events mapped to Rhubarb A-H,X."}}
        if a.assess:
            r = assess(wav, None)
            heard = norm_tokens(r.get("display", ""))
            want = norm_tokens(e["ttsText"])
            rec["qa"] = {"heard": r.get("display", ""), "match": heard == want}
            if heard != want:
                report.append({"id": e["id"], "want": e["ttsText"], "heard": r.get("display", "")})
        index["lines"][e["id"]] = rec
        print(f"[{n}/{len(entries)}] {e['id']} {voice} {dur:.2f}s {lufs:.1f} LUFS", flush=True)
    index_path.parent.mkdir(parents=True, exist_ok=True)
    index["lines"] = dict(sorted(index["lines"].items()))
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")
    if report:
        (masters / "assess-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"{len(report)} transcript mismatches -> {masters / 'assess-report.json'}")


if __name__ == "__main__":
    main()
