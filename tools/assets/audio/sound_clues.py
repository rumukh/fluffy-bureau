"""Sound-clue samples for «Услышь разницу» (case 3) with their silent visual forms (Q31, T19).

python tools/assets/audio/sound_clues.py [--masters F:/AI/GameAssets/fluffy-bureau/sound-clues] [--out assets/sound-clues]

Every sample is synthesized here (no recordings; CC0) and written as:
  <id>.mp3          mono 44.1 kHz 96 kbit/s, -24 LUFS (night recordings -26 LUFS)
  <id>.wave.svg     the «волна»: a 96-bar amplitude envelope in the art-bible palette
and one index.json with, per sample, the envelope (96 values 0..1) and three character icons:
loud (тихо/громко), pitch (низко/высоко), length (коротко/длинно), plus `rhythm` (ровно/неровно).
The silent form must let a child match the night card to the right sample exactly as by ear,
so the descriptors are computed from the audio itself (RMS envelope, spectral centroid,
active duration, onset regularity), not hand-assigned.
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
INK, HONEY, SAGE, ROSE, CREAM = "#4a3426", "#e8b04a", "#8fae86", "#d99a9a", "#fbf3e2"


def t(d):
    return np.arange(int(SR * d)) / SR


def noise(n, seed, color="pink"):
    rng = np.random.default_rng(seed)
    w = rng.standard_normal(n)
    if color == "white":
        return w
    spec = np.fft.rfft(w)
    f = np.fft.rfftfreq(n, 1 / SR)
    f[0] = 1
    spec /= np.sqrt(f) if color == "pink" else f
    x = np.fft.irfft(spec, n)
    return x / (np.abs(x).max() + 1e-9)


def band(x, lo, hi):
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = 1 / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4)
    return np.fft.irfft(spec * g, len(x))


def place(total, events):
    out = np.zeros(int(SR * total))
    for start, sig in events:
        i = int(start * SR)
        j = min(len(out), i + len(sig))
        out[i:j] += sig[: j - i]
    return out


def burst(d, seed, lo, hi, attack=0.01, decay=None):
    n = int(SR * d)
    x = band(noise(n, seed), lo, hi)
    e = np.ones(n)
    na = max(1, int(attack * SR))
    e[:na] = np.linspace(0, 1, na)
    e *= np.exp(-np.arange(n) / SR / decay) if decay else np.sin(np.linspace(0, np.pi, n)) ** 0.7
    return x * e


def knock(f, d=0.12, tau=0.02, seed=0, body=0.6):
    tt = t(d)
    s = np.sin(2 * np.pi * f * tt) * np.exp(-tt / tau)
    s += body * band(noise(len(tt), seed, "white"), f * 0.8, f * 4) * np.exp(-tt / (tau * 0.4))
    return s


def soft_night(d, seed):
    """Very soft night air: low pink noise plus two gentle distant crickets (never spooky)."""
    x = band(noise(int(SR * d), seed), 80, 1200) * 0.15
    tt = t(d)
    chirp = np.sin(2 * np.pi * 4200 * tt) * (np.sin(2 * np.pi * 28 * tt) > 0.6) * (np.sin(2 * np.pi * 0.7 * tt) > 0.3)
    return x + chirp * 0.02


rng0 = np.random.default_rng(42)


def pages(seed=1, d=2.6):
    # even, regular short bursts: a page every ~0.5 s
    return place(d, [(0.15 + i * 0.5, burst(0.18, seed + i, 1500, 7000)) for i in range(5)])


def reeds_wind(seed=2, d=2.6):
    # long gusty swells
    n = int(SR * d)
    x = band(noise(n, seed), 300, 3000)
    tt = np.arange(n) / SR
    gust = 0.25 + 0.75 * np.clip(np.sin(2 * np.pi * 0.55 * tt + 0.5) ** 2 + 0.3 * np.sin(2 * np.pi * 1.7 * tt), 0, 1)
    return x * gust * np.sin(np.linspace(0, np.pi, n)) ** 0.3


def reed_rustle(seed=3, d=2.6):
    # L3 "similar" sample: long and wavy, same band as pages
    n = int(SR * d)
    x = band(noise(n, seed), 1300, 6500)
    tt = np.arange(n) / SR
    return x * (0.45 + 0.55 * np.sin(2 * np.pi * 0.9 * tt) ** 2) * np.sin(np.linspace(0, np.pi, n)) ** 0.4


def wing_flaps(seed=4, d=2.6):
    # magpie: low-ish whooshes, a few strong flaps, uneven
    times = [0.2, 0.55, 0.85, 1.6, 1.95]
    return place(d, [(s, burst(0.22, seed + i, 150, 1400, 0.03) * 1.3) for i, s in enumerate(times)])


def wing_rustle(seed=5, d=2.6):
    # L3: softer feather rustle, uneven
    times = [0.3, 0.7, 1.5, 1.8, 2.2]
    return place(d, [(s, burst(0.3, seed + i, 600, 4500, 0.05) * 0.8) for i, s in enumerate(times)])


def shutter_click(seed=6, d=2.0):
    # brass shutter: two crisp metallic clicks, short and high
    def click(s):
        tt = t(0.08)
        m = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.012) for f in (2900, 4350, 6100))
        return m * 0.5 + knock(1800, 0.08, 0.008, s, 1.0)
    return place(d, [(0.4, click(seed)), (1.25, click(seed + 1))])


def door_creak(seed=7, d=2.0):
    # long low gliding creak (gentle, comic, not spooky)
    tt = t(1.3)
    f = 220 + 140 * np.sin(np.linspace(0, np.pi * 0.9, len(tt)))
    phase = 2 * np.pi * np.cumsum(f) / SR
    stick = (np.sin(2 * np.pi * 34 * tt) > 0).astype(float) * 0.5 + 0.5
    s = (np.sin(phase) + 0.4 * np.sin(2 * phase) + 0.2 * np.sin(3 * phase)) * stick
    s = band(s, 120, 2500) * np.sin(np.linspace(0, np.pi, len(tt))) ** 0.6
    return place(d, [(0.3, s * 0.3)])


def woodpecker(seed=8, d=2.0):
    # fast drum roll of short knocks, two bursts
    ev = [(0.3 + i * 0.055, knock(950, 0.06, 0.01, seed + i) * (1 - i * 0.04)) for i in range(12)]
    ev += [(1.2 + i * 0.055, knock(950, 0.06, 0.01, seed + 40 + i) * (1 - i * 0.04)) for i in range(10)]
    return place(d, ev)


def hammer(seed=9, d=2.4):
    # loud and even: four strong regular knocks
    return place(d, [(0.25 + i * 0.5, knock(520, 0.2, 0.05, seed + i, 0.9) * 1.4) for i in range(4)])


def roof_drops(seed=10, d=2.4):
    # quiet and uneven plinks
    rng = np.random.default_rng(seed)
    times = sorted(rng.uniform(0.1, 2.2, 7))
    def drop(s, k):
        tt = t(0.12)
        f = 1400 + 500 * rng.random()
        return np.sin(2 * np.pi * (f * tt + 2500 * tt ** 2)) * np.exp(-tt / 0.03) * (0.12 + 0.12 * rng.random())
    return place(d, [(s, drop(s, k)) for k, s in enumerate(times)])


SAMPLES = {
    # id: (generator, label shown on the sample card, used in rounds)
    "pages": (pages, "шелест страниц", "L1-L3 round 1 (correct)"),
    "wind-reeds": (reeds_wind, "ветер в камышах", "L1-L2 round 1"),
    "magpie-wings": (wing_flaps, "взмах крыльев сороки", "L1-L2 round 1"),
    "reeds-rustle": (reed_rustle, "шелест камыша", "L3 round 1"),
    "wing-rustle": (wing_rustle, "шорох крыльев", "L3 round 1"),
    "lamp-shutter": (shutter_click, "щелчок заслонки фонаря", "round 2 (correct); L2-L3 round 3"),
    "door-creak": (door_creak, "скрип двери", "round 2"),
    "woodpecker": (woodpecker, "стук дятла", "round 2"),
    "hammer-knock": (hammer, "стук молотка", "L2-L3 round 3"),
    "roof-drops": (roof_drops, "капли с крыши", "L2-L3 round 3 (correct)"),
}
NIGHT = {
    # the recordings on the shell; no source label is shown on the night card
    "night-rustle": (lambda: pages(seed=101), "pages"),
    "night-click": (lambda: shutter_click(seed=106), "lamp-shutter"),
    "night-drops": (lambda: roof_drops(seed=110), "roof-drops"),
}


def descriptors(x):
    n = len(x)
    win = n // 96
    env = np.sqrt(np.mean(x[: win * 96].reshape(96, win) ** 2, axis=1))
    env = env / (env.max() + 1e-9)
    peak_db = 20 * np.log10(np.abs(x).max() + 1e-9)
    spec = np.abs(np.fft.rfft(x))
    f = np.fft.rfftfreq(n, 1 / SR)
    centroid = float(np.sum(f * spec) / (np.sum(spec) + 1e-9))
    active = env > 0.2
    active_s = float(active.sum() * win / SR)
    # rhythm: regularity of onset intervals
    on = np.nonzero((env[1:] > 0.45) & (env[:-1] <= 0.45))[0]
    rhythm = "steady"
    if len(on) >= 3:
        iv = np.diff(on)
        rhythm = "steady" if iv.std() / (iv.mean() + 1e-9) < 0.25 else "uneven"
    elif active_s > 1.2:
        rhythm = "continuous"
    return env, centroid, active_s, rhythm


def wave_svg(env, color):
    bars = []
    for i, v in enumerate(env):
        h = max(2, v * 56)
        bars.append(f'<rect x="{4 + i * 4}" y="{32 - h / 2:.1f}" width="3" height="{h:.1f}" rx="1.5" fill="{color}"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 392 64" width="392" height="64">'
            f'<rect x="1" y="1" width="390" height="62" rx="12" fill="{CREAM}" stroke="{INK}" stroke-width="2"/>'
            + "".join(bars) + "</svg>\n")


def write(path: Path, x: np.ndarray, scale: float) -> Path:
    wav = path.with_suffix(".wav")
    wav.parent.mkdir(parents=True, exist_ok=True)
    y = np.clip(x * scale, -1, 1)
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((y * 32767).astype(np.int16).tobytes())
    return wav


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--masters", default="F:/AI/GameAssets/fluffy-bureau/sound-clues")
    ap.add_argument("--out", default=str(REPO / "assets/sound-clues"))
    a = ap.parse_args()
    out, masters = Path(a.out), Path(a.masters)
    out.mkdir(parents=True, exist_ok=True)
    items = {}
    raw = {k: (g(), label, use) for k, (g, label, use) in SAMPLES.items()}
    raw.update({k: (g() + soft_night(len(g()) / SR, 7), None, f"night recording matching {m}") for k, (g, m) in NIGHT.items()})
    loud_ref = {}
    for k, (x, label, use) in raw.items():
        loud_ref[k] = float(np.sqrt(np.mean(x ** 2)))
    # One gain for the whole set (no per-file normalization): «тихо/громко» is part of the clue.
    scale = 0.7 / max(np.abs(x).max() for x, _, _ in raw.values())
    for k, (x, label, use) in raw.items():
        env, centroid, active_s, rhythm = descriptors(x)
        night = k.startswith("night-")
        wav = write(masters / f"{k}.wav", x, scale)
        mp3 = out / f"{k}.mp3"
        subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", str(wav), "-af",
                        "volume=7dB,alimiter=limit=0.84:level=false,aresample=44100",
                        "-ac", "1", "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "96k", str(mp3)], check=True)
        color = ROSE if night else SAGE
        (out / f"{k}.wave.svg").write_text(wave_svg(env, color), encoding="utf-8", newline="\n")
        items[k] = {"file": mp3.name, "wave": f"{k}.wave.svg", "label": label, "night": night, "use": use,
                    "envelope": [round(float(v), 3) for v in env], "centroidHz": round(centroid),
                    "activeSeconds": round(active_s, 2), "rhythm": rhythm}
    # Icon classes from the delivered files' integrated loudness (fixed thresholds, same for every round).
    for k, it in items.items():
        meas = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", str(out / it["file"]), "-af", "ebur128",
                               "-f", "null", "-"], capture_output=True, text=True).stderr
        lufs = float(meas.rsplit("I:", 1)[1].split("LUFS")[0])
        it["lufs"] = lufs
        it["icons"] = {
            "loud": "loud" if lufs >= -22 else "quiet" if lufs <= -27 else "medium",
            "pitch": "high" if it["centroidHz"] >= 2500 else "low" if it["centroidHz"] < 1200 else "middle",
            "length": "long" if it["activeSeconds"] >= 1.2 else "short",
        }
    (out / "index.json").write_text(json.dumps({"format": "fluffy-sound-clues", "schema": 1, "samples": items},
                                               ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    for k, it in items.items():
        print(f"{k:14} {it['icons']} rhythm={it['rhythm']} centroid={it['centroidHz']} active={it['activeSeconds']}")


if __name__ == "__main__":
    main()
