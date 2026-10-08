"""Compose and render the Fluffy Bureau music loops programmatically (T08 fallback to ACE-Step).

python tools/assets/audio/music.py [--masters F:/AI/GameAssets/fluffy-bureau/music] [--out assets/music]

Every track is written from a deterministic score (seeded), rendered with simple physical-ish
instruments (Karplus-Strong pizzicato, wooden xylophone/marimba bars, celesta bells, soft pad
and a low "purr" drone), and made seamless: the render is two loop lengths long and the second
pass (which already carries the first pass's reverb tail) is kept, so the loop seam is inaudible.
Comfort-lamp variants are warmer: brighter partials removed, slower attack, more pad and purr.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import wave
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

SR = 44100
REPO = Path(__file__).resolve().parents[3]
NOTE_NAMES = "C C# D D# E F F# G G# A A# B".split()


def midi(name: str) -> int:
    p, o = name[:-1], int(name[-1])
    return NOTE_NAMES.index(p) + 12 * (o + 1)


def hz(m: float) -> float:
    return 440 * 2 ** ((m - 69) / 12)


def tt(d: float) -> np.ndarray:
    return np.arange(int(SR * d)) / SR


def adsr(n: int, a: float, r: float) -> np.ndarray:
    e = np.ones(n)
    na, nr = min(n, max(1, int(a * SR))), min(n, max(1, int(r * SR)))
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return e


# ---- instruments -------------------------------------------------------------------------

def pizz(m: float, d: float, seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    n = int(SR * min(d, 1.4))
    p = max(2, int(round(SR / hz(m))))
    buf = np.convolve(rng.uniform(-1, 1, p), np.ones(3) / 3, mode="same")
    damp = 0.994 if m < 55 else 0.990
    chunks = []
    for _ in range(n // p + 1):
        chunks.append(buf)
        buf = damp * 0.5 * (buf + np.roll(buf, -1))
    out = np.concatenate(chunks)[:n]
    return out * adsr(n, 0.004, 0.06)


def mallet(m: float, d: float, warm: bool, tau: float = 0.35) -> np.ndarray:
    t = tt(min(d + 0.6, 1.6))
    f = hz(m)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / tau)
    if not warm:
        s += 0.35 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t / (tau * 0.2))
    s += 0.15 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / (tau * 0.5))
    return s * adsr(len(t), 0.003 if not warm else 0.012, 0.08)


def celesta(m: float, d: float, warm: bool) -> np.ndarray:
    t = tt(min(d + 1.0, 2.2))
    f = hz(m)
    parts = ((1, 1, 0.9), (2, 0.35, 0.5), (3, 0.12, 0.3)) if not warm else ((1, 1, 1.0), (2, 0.18, 0.5))
    s = sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t / tau) for k, a, tau in parts)
    return s * adsr(len(t), 0.004 if not warm else 0.02, 0.2)


def piano(m: float, d: float, warm: bool) -> np.ndarray:
    t = tt(min(d + 0.8, 3.0))
    f = hz(m)
    s = sum(a * np.sin(2 * np.pi * f * k * t * (1 + 0.0004 * k * k)) * np.exp(-t / (1.2 / k))
            for k, a in ((1, 1), (2, 0.4), (3, 0.15 if not warm else 0.05), (4, 0.06 if not warm else 0)))
    return s * adsr(len(t), 0.006 if not warm else 0.02, 0.3)


def pad(m: float, d: float, warm: bool) -> np.ndarray:
    t = tt(d + 0.6)
    f = hz(m)
    s = sum(np.sin(2 * np.pi * f * det * t + ph) for det, ph in ((1, 0), (1.003, 1.3), (0.997, 2.1)))
    s += 0.25 * np.sin(2 * np.pi * f * 2 * t)
    return s / 3.5 * adsr(len(t), 0.5 if warm else 0.3, 0.6)


def purr(d: float, seed: int, rate: float = 24.0) -> np.ndarray:
    rng = np.random.default_rng(seed)
    n = int(SR * d)
    w = rng.standard_normal(n)
    spec = np.fft.rfft(w)
    f = np.fft.rfftfreq(n, 1 / SR)
    spec *= 1 / (1 + (f / 180) ** 4) / (1 + (40 / np.maximum(f, 1)) ** 2)
    x = np.fft.irfft(spec, n)
    x /= np.abs(x).max() + 1e-9
    t = np.arange(n) / SR
    breath = 0.6 + 0.4 * np.sin(2 * np.pi * t / 3.2) ** 2
    return x * (0.5 + 0.5 * np.sin(2 * np.pi * rate * t) ** 2) * breath


def woodblock(accent: float) -> np.ndarray:
    t = tt(0.08)
    return (np.sin(2 * np.pi * 1250 * t) + 0.4 * np.sin(2 * np.pi * 2100 * t)) * np.exp(-t / 0.012) * accent


# ---- scoring helpers --------------------------------------------------------------------

CHORDS = {
    "I": [0, 4, 7], "ii": [2, 5, 9], "iii": [4, 7, 11], "IV": [5, 9, 12], "V": [7, 11, 14],
    "vi": [9, 12, 16], "i": [0, 3, 7], "iv": [5, 8, 12], "v": [7, 10, 14], "VI": [8, 12, 15],
    "VII": [10, 14, 17], "III": [3, 7, 10], "V7": [7, 11, 14, 17], "Imaj7": [0, 4, 7, 11], "IVmaj7": [5, 9, 12, 16],
    "ii7": [2, 5, 9, 12], "vi7": [9, 12, 16, 19],
}


class Track:
    def __init__(self, bpm: float, bars: int, beats: int = 4):
        self.spb = 60 / bpm
        self.bar = self.spb * beats
        self.beats = beats
        self.length = self.bar * bars
        self.n = int(round(self.length * SR))
        self.buf = np.zeros(self.n * 2 + SR * 4)
        self.stems: dict[str, np.ndarray] = {}

    def add(self, stem: str, start: float, sig: np.ndarray, gain: float = 1.0, pan: float = 0.0) -> None:
        for rep in (0, 1):
            i = int(round((start + rep * self.length) * SR))
            arr = self.stems.setdefault(stem, np.zeros((len(self.buf), 2)))
            j = min(len(arr), i + len(sig))
            l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
            arr[i:j, 0] += sig[: j - i] * gain * l
            arr[i:j, 1] += sig[: j - i] * gain * r

    def render(self, mix: dict[str, float], reverb: float) -> np.ndarray:
        out = np.zeros((len(self.buf), 2))
        for stem, arr in self.stems.items():
            out += arr * mix.get(stem, 1.0)
        out = add_reverb(out, reverb)
        seg = out[self.n: 2 * self.n]
        return seg / (np.abs(seg).max() + 1e-9) * 0.8


def add_reverb(x: np.ndarray, mix: float) -> np.ndarray:
    rng = np.random.default_rng(99)
    L = int(1.8 * SR)
    t = np.arange(L) / SR
    out = x.copy()
    for ch in range(2):
        ir = rng.standard_normal(L) * np.exp(-t / 0.45)
        spec = np.fft.rfft(ir)
        f = np.fft.rfftfreq(L, 1 / SR)
        spec *= 1 / (1 + (f / 5000) ** 2) / (1 + (150 / np.maximum(f, 1)) ** 2)
        ir = np.fft.irfft(spec, L)
        ir /= np.sqrt(np.sum(ir ** 2))
        n = len(x) + L - 1
        wet = np.fft.irfft(np.fft.rfft(x[:, ch], n) * np.fft.rfft(ir, n), n)[: len(x)]
        out[:, ch] = x[:, ch] + mix * wet * 0.5
    return out


# ---- compositions ------------------------------------------------------------------------

def compose(spec: dict, warm: bool) -> np.ndarray:
    rng = np.random.default_rng(spec["seed"])
    tr = Track(spec["bpm"] * (0.94 if warm else 1.0), len(spec["prog"]) * spec.get("repeat", 2), spec.get("beats", 4))
    root = midi(spec["key"])
    scale = spec["scale"]
    prog = spec["prog"] * spec.get("repeat", 2)
    beats = tr.beats
    for bi, ch in enumerate(prog):
        t0 = bi * tr.bar
        tones = [root + i for i in CHORDS[ch]]
        bass = tones[0] - 12
        # pizzicato bass walk
        pattern = spec.get("bass", [0, None, 7, None])
        for k, step in enumerate(pattern[:beats]):
            if step is None:
                continue
            tr.add("bass", t0 + k * tr.spb, pizz(bass + step, tr.spb * 1.5, seed=bi * 10 + k), 0.9, -0.1)
        # comping: pad or pizzicato chords
        if spec.get("pad"):
            for m in tones:
                tr.add("pad", t0, pad(m, tr.bar, warm), 0.18, 0.0)
        if spec.get("comp", True):
            for k in range(1, beats, 2):
                for j, m in enumerate(tones):
                    tr.add("comp", t0 + k * tr.spb + j * 0.012, pizz(m + 12, tr.spb, seed=bi * 100 + k * 7 + j), 0.28, 0.3)
        if spec.get("tick"):
            for k in range(beats):
                tr.add("tick", t0 + k * tr.spb, woodblock(0.5 if k else 0.8), 0.12, 0.4)
    # melody: phrase-based motif generator in the scale, following chord tones on strong beats
    inst = {"mallet": mallet, "celesta": celesta, "piano": piano}[spec["lead"]]
    deg = [root + 12 + s for s in scale] + [root + 24 + s for s in scale]
    motif_rhythm = spec["rhythm"]
    pos = len(scale)
    motif_cache: dict[int, list] = {}
    for bi, ch in enumerate(prog):
        t0 = bi * tr.bar
        phrase = bi % len(spec["prog"])
        if spec.get("rest_bars") and phrase in spec["rest_bars"]:
            continue
        chord_pcs = {(root + i) % 12 for i in CHORDS[ch]}
        if phrase in motif_cache and bi >= len(spec["prog"]) and rng.random() < 0.7:
            notes = motif_cache[phrase]
        else:
            notes = []
            t = 0.0
            for dur in motif_rhythm:
                if rng.random() < 0.12 and t > 0:
                    t += dur
                    continue
                strong = abs(t - round(t)) < 1e-6
                step = int(rng.choice([-2, -1, -1, 0, 1, 1, 2]))
                pos = int(np.clip(pos + step, 2, len(deg) - 3))
                if strong:
                    near = [k for k in range(len(deg)) if deg[k] % 12 in chord_pcs]
                    pos = min(near, key=lambda k: abs(k - pos))
                notes.append((t, deg[pos], dur))
                t += dur
            motif_cache[phrase] = notes
        for t, m, dur in notes:
            tr.add("lead", t0 + t * tr.spb, inst(m, dur * tr.spb, warm), 0.5, -0.25)
            if spec.get("double") and not warm:
                tr.add("sparkle", t0 + t * tr.spb + 0.01, celesta(m + 12, dur * tr.spb, warm), 0.12, 0.35)
    if spec.get("purr", 0) or warm:
        tr.add("purr", 0, purr(tr.length + 2, spec["seed"]), 1.0, 0.0)
    mix = {"bass": 1.0, "comp": 0.8, "pad": 1.0, "lead": 1.0, "sparkle": 0.9, "tick": 1.0,
           "purr": (spec.get("purr", 0.0) + (0.08 if warm else 0.0))}
    if warm:
        mix.update({"comp": 0.55, "tick": 0.0, "pad": 1.5, "sparkle": 0.0})
    return tr.render(mix, 0.35 if warm else 0.25)


MAJ = [0, 2, 4, 5, 7, 9, 11]
MIN = [0, 2, 3, 5, 7, 8, 10]
PENT = [0, 2, 4, 7, 9]

TRACKS = {
    "title-office": {"bpm": 92, "key": "F3", "scale": MAJ, "prog": ["I", "vi", "ii", "V", "I", "IV", "ii", "V"], "lead": "mallet",
                     "rhythm": [1, 0.5, 0.5, 1, 1], "tick": True, "double": True, "purr": 0.05, "seed": 11, "repeat": 2},
    "town-map": {"bpm": 104, "key": "C3", "scale": MAJ, "prog": ["I", "IV", "V", "I", "vi", "IV", "ii", "V"], "lead": "mallet",
                 "rhythm": [0.5, 0.5, 1, 0.5, 0.5, 1], "bass": [0, 7, 12, 7], "seed": 23, "repeat": 2},
    "investigation": {"bpm": 84, "key": "D3", "scale": MIN, "prog": ["i", "iv", "i", "V", "i", "VI", "iv", "V"], "lead": "mallet",
                      "rhythm": [0.5, 0.5, 0.5, 0.5, 1, 1], "bass": [0, 3, 7, 3], "tick": True, "seed": 37, "repeat": 2},
    "gentle-mystery": {"bpm": 72, "key": "A2", "scale": MIN, "prog": ["i", "VI", "III", "VII", "i", "iv", "VI", "V"], "lead": "celesta",
                       "rhythm": [1, 1, 2], "bass": [0, None, None, None], "pad": True, "comp": False, "purr": 0.06, "seed": 41, "repeat": 2},
    "heartfelt": {"bpm": 66, "key": "G2", "scale": MAJ, "prog": ["Imaj7", "vi7", "IVmaj7", "V", "I", "iii", "IV", "V"], "lead": "piano",
                  "rhythm": [1.5, 0.5, 2], "bass": [0, None, 7, None], "pad": True, "comp": False, "purr": 0.07, "seed": 53, "repeat": 2},
    "celebration-baking": {"bpm": 116, "key": "A#2", "scale": PENT, "prog": ["I", "IV", "I", "V", "I", "IV", "V", "I"], "lead": "mallet",
                           "rhythm": [0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5], "bass": [0, 7, 12, 7], "tick": True, "double": True, "seed": 67, "repeat": 2},
    # Stage 2 (cases 2-4).
    "dusk-lighthouse": {"bpm": 76, "key": "E2", "scale": MAJ, "prog": ["Imaj7", "vi7", "IVmaj7", "V", "Imaj7", "iii", "IV", "V"], "lead": "celesta",
                        "rhythm": [1, 0.5, 0.5, 2], "bass": [0, None, 7, None], "pad": True, "comp": True, "double": True,
                        "purr": 0.04, "seed": 71, "repeat": 2},
    "dreams": {"bpm": 64, "key": "D3", "scale": PENT, "prog": ["I", "vi", "IV", "I", "ii", "IV", "V", "I"], "lead": "celesta",
               "rhythm": [2, 1, 1], "bass": [0, None, None, None], "pad": True, "comp": False, "purr": 0.05, "seed": 83, "repeat": 2},
    "tea-party": {"bpm": 108, "key": "G2", "scale": MAJ, "prog": ["I", "IV", "V", "I", "vi", "ii", "V", "I"], "lead": "mallet",
                  "rhythm": [0.5, 0.5, 1, 0.5, 0.5, 1], "bass": [0, 7, 12, 7], "tick": True, "double": True, "seed": 97, "repeat": 2},
}
PACK = {"title-office": "shell", "town-map": "shell", "investigation": "shell", "gentle-mystery": "shell",
        "heartfelt": "shell", "celebration-baking": "case01", "dusk-lighthouse": "case03", "dreams": "case04",
        "tea-party": "case04"}


def write_wav(path: Path, x: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--masters", default="F:/AI/GameAssets/fluffy-bureau/music/programmatic")
    ap.add_argument("--out", default=str(REPO / "assets/music"))
    ap.add_argument("--only", default="")
    a = ap.parse_args()
    out, masters = Path(a.out), Path(a.masters)
    out.mkdir(parents=True, exist_ok=True)
    idx_path = out / "index.json"
    index = json.loads(idx_path.read_text(encoding="utf-8")) if idx_path.exists() else {}
    only = set(filter(None, a.only.split(",")))
    for name, spec in TRACKS.items():
        if only and name not in only:
            continue
        for warm in (False, True):
            tid = f"{name}{'-warm' if warm else ''}"
            x = compose(spec, warm)
            wav = masters / f"{tid}.wav"
            write_wav(wav, x)
            # Loudness-normalize as one linear gain so the loop seam stays sample-exact.
            m = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", str(wav), "-af", "ebur128", "-f", "null", "-"],
                               capture_output=True, text=True).stderr
            lufs = float(m.rsplit("I:", 1)[1].split("LUFS")[0])
            gain = -23.0 - lufs
            dst = out / f"{tid}.mp3"
            subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", str(wav), "-af", f"volume={gain:.2f}dB",
                            "-c:a", "libmp3lame", "-b:a", "128k", str(dst)], check=True)
            dur = len(x) / SR
            index[tid] = {"file": dst.name, "durationMs": round(dur * 1000), "loopStart": 0, "loopEnd": round(dur, 4),
                          "bpm": spec["bpm"] * (0.94 if warm else 1.0), "pack": PACK[name], "comfortVariantOf": name if warm else None,
                          "tool": "tools/assets/audio/music.py (programmatic synthesis, numpy)",
                          "source": f"score '{name}' seed {spec['seed']}{' comfort-lamp variant' if warm else ''}",
                          "createdAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                          "notes": "Seamless loop; -23 LUFS integrated. MP3 encoder delay: use loopStart/loopEnd with decoded audio."}
            print(tid, round(dur, 2), "s")
    idx_path.write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
