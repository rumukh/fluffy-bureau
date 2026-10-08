"""Turn ACE-Step FLAC renders into seamless game loops and register them in assets/music/index.json.

python tools/assets/audio/ace_loops.py <id>=<flac> [<id>=<flac> ...] [--pack shell] [--bars 16]

Finds a loop window on downbeats (bpm from the ACE metadata JSON next to the FLAC) that starts after
the intro, cross-fades the loop end into the loop start (equal-power, 1 beat) so the seam is inaudible,
writes the master WAV outside the repo, a 128 kbit/s stereo MP3 at -23 LUFS into assets/music, and
a comfort-lamp "-warm" variant (low-passed, slightly slower via rubberband-free resampling is avoided:
we keep tempo and soften brightness and level instead, plus the purr bed from music.py).
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import wave
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

REPO = Path(__file__).resolve().parents[3]
MASTERS = Path("F:/AI/GameAssets/fluffy-bureau/music/loops")
SR = 44100
sys.path.insert(0, str(Path(__file__).parent))


def decode(path: Path) -> np.ndarray:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


def write_wav(path: Path, x: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


def lowpass(x: np.ndarray, cutoff: float) -> np.ndarray:
    out = np.empty_like(x)
    for ch in range(2):
        spec = np.fft.rfft(x[:, ch])
        f = np.fft.rfftfreq(len(x), 1 / SR)
        out[:, ch] = np.fft.irfft(spec / np.sqrt(1 + (f / cutoff) ** 4), len(x))
    return out


def make_loop(x: np.ndarray, bpm: float, bars: int, skip_bars: int = 2) -> np.ndarray:
    beat = 60 / bpm
    bar = int(round(beat * 4 * SR))
    start = bar * skip_bars
    length = bar * bars
    if start + length + bar > len(x):
        bars = max(4, (len(x) - start - bar) // bar)
        length = bar * bars
    loop = x[start:start + length].copy()
    tail = x[start + length:start + length + int(beat * SR)]
    n = len(tail)
    fade = np.sin(np.linspace(0, np.pi / 2, n))[:, None]
    # Equal-power cross-fade: the material just after the loop end blends into the loop start.
    loop[:n] = loop[:n] * fade + tail * np.cos(np.linspace(0, np.pi / 2, n))[:, None]
    return loop


def encode(wav: Path, mp3: Path, lufs: float = -23.0) -> float:
    meas = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", str(wav), "-af", "ebur128", "-f", "null", "-"],
                          capture_output=True, text=True).stderr
    cur = float(meas.rsplit("I:", 1)[1].split("LUFS")[0])
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", str(wav), "-af",
                    f"volume={lufs - cur:.2f}dB,alimiter=limit=0.9:level=false", "-c:a", "libmp3lame", "-b:a", "128k", str(mp3)],
                   check=True)
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp3)],
                                capture_output=True, text=True).stdout)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("items", nargs="+")
    ap.add_argument("--pack", default="shell")
    ap.add_argument("--bars", type=int, default=16)
    a = ap.parse_args()
    from music import purr  # noqa: PLC0415
    out = REPO / "assets/music"
    idx_path = out / "index.json"
    index = json.loads(idx_path.read_text(encoding="utf-8")) if idx_path.exists() else {}
    for item in a.items:
        mid, flac = item.split("=", 1)
        flac = Path(flac)
        meta = json.loads(flac.with_suffix(".json").read_text(encoding="utf-8")) if flac.with_suffix(".json").exists() else {}
        bpm = float(meta.get("bpm") or meta.get("request", {}).get("bpm") or 90)
        seed = meta.get("seed") or meta.get("request", {}).get("seed")
        x = decode(flac)
        loop = make_loop(x, bpm, a.bars)
        warm = lowpass(loop, 2600) * 0.85
        bed = purr(len(warm) / SR + 0.1, 7)[: len(warm)]
        warm[:, 0] += bed * 0.05
        warm[:, 1] += bed * 0.05
        for tid, sig, note in ((mid, loop, None), (f"{mid}-warm", warm, mid)):
            wav = MASTERS / f"{tid}.wav"
            write_wav(wav, sig)
            dur = encode(wav, out / f"{tid}.mp3")
            index[tid] = {"file": f"{tid}.mp3", "durationMs": round(dur * 1000), "loopStart": 0,
                          "loopEnd": round(len(sig) / SR, 4), "bpm": bpm, "pack": a.pack, "comfortVariantOf": note,
                          "tool": "ACE-Step 1.5 XL-SFT (local) + tools/assets/audio/ace_loops.py",
                          "source": f"ACE render {flac.name} seed {seed}; prompt tools/assets/audio/music/{mid}.txt"
                                    + ("; comfort variant: low-pass 2.6 kHz, -1.4 dB, purr bed" if note else ""),
                          "createdAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                          "notes": "Seamless loop (equal-power cross-fade of one beat at the seam); -23 LUFS."}
            print(tid, round(dur, 2), "s")
    idx_path.write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
