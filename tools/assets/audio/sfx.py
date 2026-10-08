"""Synthesize every Fluffy Bureau sound effect from scratch (no samples, CC0-equivalent: own work).

python tools/assets/audio/sfx.py [--masters F:/AI/GameAssets/fluffy-bureau/sfx] [--out assets/sfx]

Writes a 48 kHz WAV master per effect outside the repository and a loudness-matched MP3
(mono, 44.1 kHz, 96 kbit/s) into assets/sfx. Everything is soft: no sharp attacks (>= 4 ms
fade-in), true peak <= -3 dBTP, effects normalized around -24 LUFS so they never startle.
Deterministic: fixed random seed per effect.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 48000
REPO = Path(__file__).resolve().parents[3]


def t(d: float) -> np.ndarray:
    return np.arange(int(SR * d)) / SR


def env(n: int, a: float = 0.005, r: float = 0.1, curve: float = 3.0) -> np.ndarray:
    x = np.ones(n)
    na, nr = min(n, max(1, int(a * SR))), min(n, max(1, int(r * SR)))
    x[:na] = np.linspace(0, 1, na) ** 2
    x[-nr:] *= np.linspace(1, 0, nr) ** curve
    return x


def exp_decay(d: float, tau: float, a: float = 0.004) -> np.ndarray:
    x = np.exp(-t(d) / tau)
    na = int(a * SR)
    x[:na] *= np.linspace(0, 1, na) ** 2
    return x


def mallet(f: float, d: float = 0.8, bright: float = 0.5, tau: float = 0.25) -> np.ndarray:
    """Wooden xylophone / marimba-like bar: inharmonic partials, fast decay of the upper ones."""
    tt = t(d)
    s = np.sin(2 * np.pi * f * tt) * np.exp(-tt / tau)
    s += bright * 0.5 * np.sin(2 * np.pi * f * 3.93 * tt) * np.exp(-tt / (tau * 0.25))
    s += bright * 0.25 * np.sin(2 * np.pi * f * 9.2 * tt) * np.exp(-tt / (tau * 0.1))
    return s * env(len(tt), 0.003, 0.05)


def bell(f: float, d: float = 1.6, tau: float = 0.6) -> np.ndarray:
    tt = t(d)
    s = sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt / (tau * k))
            for m, a, k in ((1, 1, 1), (2.0, 0.4, 0.6), (2.76, 0.25, 0.4), (5.4, 0.12, 0.2)))
    return s * env(len(tt), 0.004, 0.2)


def pluck(f: float, d: float = 0.6, damp: float = 0.996, seed: int = 0) -> np.ndarray:
    """Karplus-Strong pizzicato."""
    rng = np.random.default_rng(seed)
    n = int(SR * d)
    p = max(2, int(SR / f))
    buf = rng.uniform(-1, 1, p)
    buf = np.convolve(buf, np.ones(4) / 4, mode="same")
    out = np.empty(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = damp * 0.5 * (buf[i % p] + buf[(i + 1) % p])
    return out * env(n, 0.004, 0.08)


def noise(d: float, seed: int, color: str = "pink") -> np.ndarray:
    rng = np.random.default_rng(seed)
    w = rng.standard_normal(int(SR * d))
    if color == "white":
        return w
    spec = np.fft.rfft(w)
    f = np.fft.rfftfreq(len(w), 1 / SR)
    f[0] = 1
    spec /= np.sqrt(f) if color == "pink" else f
    x = np.fft.irfft(spec, len(w))
    return x / (np.abs(x).max() + 1e-9)


def bandpass(x: np.ndarray, lo: float, hi: float) -> np.ndarray:
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = 1 / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4)
    return np.fft.irfft(spec * g, len(x))


def place(total: float, *events: tuple[float, np.ndarray]) -> np.ndarray:
    out = np.zeros(int(SR * total))
    for start, sig in events:
        i = int(start * SR)
        j = min(len(out), i + len(sig))
        out[i:j] += sig[: j - i]
    return out


def reverb(x: np.ndarray, mix: float = 0.18, seed: int = 7) -> np.ndarray:
    ir = noise(0.9, seed, "pink") * np.exp(-t(0.9) / 0.22)
    ir = bandpass(ir, 200, 6000)
    n = len(x) + len(ir) - 1
    wet = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[: len(x) + int(0.9 * SR)]
    wet /= np.abs(wet).max() + 1e-9
    dry = np.concatenate([x, np.zeros(len(wet) - len(x))])
    return dry * (1 - mix) + wet * mix * np.abs(x).max()


NOTE = {n: 440 * 2 ** ((i - 9) / 12) for i, n in enumerate("C C# D D# E F F# G G# A A# B".split())}


def hz(name: str) -> float:
    pitch, octave = name[:-1], int(name[-1])
    return NOTE[pitch] * 2 ** (octave - 4)


def purr(d: float, seed: int = 3) -> np.ndarray:
    """Soft cat purr: low-passed noise amplitude-modulated at ~25 Hz."""
    tt = t(d)
    base = bandpass(noise(d, seed, "brown"), 40, 400)
    am = 0.55 + 0.45 * np.sin(2 * np.pi * 25 * tt) ** 2
    return base * am * env(len(tt), 0.15, 0.3)


def sfx() -> dict[str, tuple[np.ndarray, str]]:
    S: dict[str, tuple[np.ndarray, str]] = {}
    S["ui-tap"] = (mallet(hz("E6"), 0.18, 0.2, 0.05), "Soft wooden tap for buttons")
    S["ui-open"] = (place(0.5, (0, mallet(hz("C6"), 0.3, 0.3, 0.08)), (0.07, mallet(hz("G6"), 0.35, 0.3, 0.1))), "Panel opens: two rising wooden notes")
    S["ui-close"] = (place(0.5, (0, mallet(hz("G6"), 0.3, 0.3, 0.08)), (0.07, mallet(hz("C6"), 0.35, 0.3, 0.1))), "Panel closes: two falling wooden notes")
    S["ui-back"] = (mallet(hz("A5"), 0.25, 0.2, 0.06), "Back / cancel tap")
    S["sticker-check"] = (reverb(place(0.6, (0, mallet(hz("E6"), 0.4, 0.4, 0.12)), (0.06, bell(hz("B6"), 0.5, 0.15) * 0.4))), "Sticker ✔ placed")
    S["sticker-cross"] = (mallet(hz("A5"), 0.35, 0.2, 0.08) + 0.3 * bandpass(noise(0.35, 11), 1500, 5000) * exp_decay(0.35, 0.03), "Sticker ✖ placed: soft paper pat")
    S["sticker-question"] = (place(0.5, (0, mallet(hz("D6"), 0.3, 0.3, 0.08)), (0.09, mallet(hz("F#6"), 0.35, 0.3, 0.1))), "Sticker ? placed: curious up-step")
    pt = bandpass(noise(0.45, 21), 800, 7000) * np.sin(np.linspace(0, np.pi, int(0.45 * SR))) ** 2
    S["page-turn"] = (pt * 0.8, "Notebook page turn")
    bubbles = []
    rng = np.random.default_rng(5)
    for i in range(7):
        f0 = rng.uniform(900, 1800)
        d = 0.12
        tt = t(d)
        chirp = np.sin(2 * np.pi * (f0 * tt + 2500 * tt ** 2)) * exp_decay(d, 0.03)
        bubbles.append((i * 0.11 + rng.uniform(0, 0.04), chirp * rng.uniform(0.5, 1)))
    S["bubbles"] = (reverb(place(1.1, *bubbles), 0.25), "Soap bubbles: soft pops (Khvosts thinking)")
    yt = t(0.6)
    yarn = bandpass(noise(0.6, 31), 300, 2500) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * yt)) * env(len(yt), 0.05, 0.2)
    S["yarn-pull"] = (place(1.0, (0, yarn * 0.6), (0.45, bell(hz("A6"), 0.55, 0.2) * 0.5)), "Magic yarn ball thread pull with a sparkle")
    ring = []
    for k in range(2):
        for j, n in enumerate(["E6", "G6", "B6", "G6"]):
            ring.append((k * 1.0 + j * 0.09, bell(hz(n), 0.5, 0.12) * 0.5))
    S["shell-ring"] = (reverb(place(2.0, *ring), 0.3), "Soft shell-phone ring (two gentle trills)")
    bt = t(1.2)
    whirr = (np.sign(np.sin(2 * np.pi * 38 * bt)) * 0.3 + np.sin(2 * np.pi * 180 * bt + 3 * np.sin(2 * np.pi * 38 * bt)))
    whirr = bandpass(whirr, 120, 2500) * env(len(bt), 0.15, 0.4)
    ticks = place(1.2, *[(i * 0.083, mallet(3200, 0.03, 0, 0.004) * 0.25) for i in range(14)])
    S["postal-beetle"] = (whirr * 0.5 + ticks, "Clockwork postal beetle flying in: soft whirr and ticks")
    S["letter-chime"] = (reverb(place(1.4, (0, bell(hz("C6"), 1.2, 0.4) * 0.6), (0.18, bell(hz("G6"), 1.2, 0.4) * 0.5))), "Soft chime: a letter arrives")
    steps = []
    for i in range(4):
        st = bandpass(noise(0.12, 40 + i, "pink"), 80, 900) * exp_decay(0.12, 0.025)
        steps.append((i * 0.38, st * (0.9 if i % 2 else 0.75)))
    S["footsteps"] = (place(1.6, *steps), "Soft padded paw footsteps on a path")
    ot = t(2.0)
    crackle = place(2.0, *[(float(x), mallet(np.random.default_rng(int(x * 1000)).uniform(2000, 4000), 0.02, 0, 0.003) * 0.15)
                          for x in np.random.default_rng(9).uniform(0.1, 1.8, 18)])
    S["oven"] = (bandpass(noise(2.0, 51, "brown"), 60, 700) * env(len(ot), 0.4, 0.6) * 0.7 + crackle, "Honey-caramel oven: warm whoosh and gentle crackle")
    S["success"] = (reverb(place(1.4, (0, mallet(hz("C6"), 0.6, 0.4, 0.2)), (0.1, mallet(hz("E6"), 0.6, 0.4, 0.2)),
                                 (0.2, mallet(hz("G6"), 0.6, 0.4, 0.2)), (0.32, bell(hz("C7"), 1.0, 0.35) * 0.5))), "Gentle success arpeggio")
    S["not-yet"] = (reverb(place(1.0, (0, mallet(hz("E5"), 0.6, 0.15, 0.2)), (0.16, mallet(hz("D5"), 0.7, 0.15, 0.25)))) * 0.8,
                    "Gentle 'not yet': two soft low wooden notes, never punitive")
    sp = [(i * 0.05, bell(hz(n), 0.6, 0.15) * 0.35) for i, n in enumerate(["G6", "B6", "D7", "G7"])]
    S["sparkle"] = (reverb(place(1.0, *sp), 0.3), "Sparkle: something found or glowing")
    S["lamp-on"] = (reverb(place(1.6, (0, purr(1.4) * 0.5), (0.05, bell(hz("F5"), 1.4, 0.5) * 0.5), (0.15, bell(hz("A5"), 1.3, 0.5) * 0.4))), "Comfort lamp on: warm purr and soft glow chime")
    S["lamp-off"] = (reverb(place(1.0, (0, bell(hz("A5"), 0.9, 0.3) * 0.4), (0.12, bell(hz("F5"), 0.9, 0.3) * 0.35))), "Comfort lamp off")
    S["reward"] = (reverb(place(2.2, *[(i * 0.12, mallet(hz(n), 0.8, 0.5, 0.3)) for i, n in enumerate(["C6", "E6", "G6", "C7"])],
                                (0.5, bell(hz("E7"), 1.5, 0.5) * 0.4), (0.0, purr(1.8) * 0.25))), "Reward / badge fanfare, soft")
    S["button-coin"] = (place(0.6, (0, mallet(hz("A6"), 0.4, 0.6, 0.06)), (0.07, mallet(hz("E7"), 0.4, 0.6, 0.06))), "Button coin collected: wooden clack")
    S["heart"] = (reverb(place(1.0, (0, bell(hz("E6"), 0.9, 0.3) * 0.5), (0.15, bell(hz("A6"), 0.9, 0.3) * 0.45))), "Kindness heart earned")
    S["magnifier-find"] = (reverb(place(0.8, (0, mallet(hz("D6"), 0.5, 0.4, 0.12)), (0.08, bell(hz("A6"), 0.6, 0.2) * 0.4))), "Magnifier: hidden thing found")
    S["magnifier-miss"] = (mallet(hz("G5"), 0.25, 0.1, 0.05) * 0.6, "Magnifier: tap on nothing, very soft")
    flip = bandpass(noise(0.18, 61), 1000, 6000) * np.sin(np.linspace(0, np.pi, int(0.18 * SR))) ** 2
    S["card-flip"] = (flip * 0.7, "Card flip (scent pairs, timeline)")
    S["card-place"] = (place(0.4, (0, flip[: int(0.1 * SR)] * 0.5), (0.06, mallet(hz("C6"), 0.3, 0.2, 0.06) * 0.6)), "Card placed on the timeline")
    pour = bandpass(noise(1.0, 71), 2000, 9000) * env(int(SR), 0.1, 0.3) * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * t(1.0)))
    S["pour"] = (pour * 0.5, "Pouring flour/sugar/berries into the bowl")
    S["pick-up"] = (mallet(hz("B5"), 0.2, 0.3, 0.05), "Pick up an item")
    S["purr"] = (purr(2.5) * 0.8, "Soft purr: comfort and warmth")
    return S


def write_wav(path: Path, x: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    x = x / (np.abs(x).max() + 1e-9) * 0.7
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--masters", default="F:/AI/GameAssets/fluffy-bureau/sfx")
    ap.add_argument("--out", default=str(REPO / "assets/sfx"))
    a = ap.parse_args()
    out, masters = Path(a.out), Path(a.masters)
    out.mkdir(parents=True, exist_ok=True)
    catalog = {}
    for name, (sig, desc) in sfx().items():
        wav = masters / f"{name}.wav"
        write_wav(wav, sig)
        mp3 = out / f"{name}.mp3"
        subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", str(wav), "-af",
                        "loudnorm=I=-24:TP=-3:LRA=7,aresample=44100", "-ac", "1", "-ar", "44100",
                        "-c:a", "libmp3lame", "-b:a", "96k", str(mp3)], check=True)
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp3)],
                                   capture_output=True, text=True).stdout)
        catalog[name] = {"file": mp3.name, "durationMs": round(dur * 1000), "description": desc}
        print(name, round(dur, 2))
    (masters / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
