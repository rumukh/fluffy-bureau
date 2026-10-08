"""Raster pieces for Stage 2 drawn in code: cipher poster, light-signal strip, scarf patterns, cart-track compare.

python tools/assets/art/raster_kit.py

Writes masters into F:/AI/GameAssets/fluffy-bureau/props/ (PNG, transparent) so staging.py and build.py treat them
like generated props (each gets an own-work provenance JSON beside it).
Lettering uses Nunito (SIL OFL 1.1), the game's own UI font (T09).
"""
from __future__ import annotations

import json
import math
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

REPO = Path(__file__).resolve().parents[3]
R = Path("F:/AI/GameAssets/fluffy-bureau")
FONT = R / "fonts/Nunito.ttf"
INK = (74, 52, 38, 255)
CREAM = (251, 243, 226, 255)
HONEY = (232, 176, 74, 255)
COLORS = {"honey": ((232, 176, 74), (201, 141, 42)), "blue": ((143, 179, 220), (91, 127, 168)),
          "rose": ((217, 154, 154), (181, 104, 109)), "green": ((143, 174, 134), (95, 127, 88))}
GLYPHS = [("Г", "honey", 1, "circle"), ("Н", "blue", 2, "square"), ("Е", "rose", 3, "flower"), ("З", "green", 4, "heart"),
          ("Д", "honey", 2, "circle"), ("О", "blue", 3, "square"), ("Ж", "rose", 4, "flower"), ("Ь", "green", 1, "heart"),
          ("У", "honey", 3, "circle"), ("Б", "blue", 4, "square"), ("А", "rose", 1, "flower"), ("Р", "green", 2, "heart"),
          ("М", "honey", 4, "circle"), ("Л", "blue", 1, "square"), ("В", "rose", 2, "flower"), ("К", "green", 3, "heart")]


def font(size, weight=800):
    f = ImageFont.truetype(str(FONT), size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:  # noqa: BLE001
        pass
    return f


def shape_mask(shape: str, s: int) -> Image.Image:
    k = 4
    m = Image.new("L", (s * k, s * k), 0)
    d = ImageDraw.Draw(m)
    S = s * k
    if shape == "circle":
        d.ellipse([S * 0.08, S * 0.08, S * 0.92, S * 0.92], fill=255)
    elif shape == "square":
        d.rounded_rectangle([S * 0.1, S * 0.1, S * 0.9, S * 0.9], radius=S * 0.18, fill=255)
    elif shape == "flower":
        for i in range(6):
            a = i * math.pi / 3
            cx, cy = S / 2 + S * 0.23 * math.cos(a), S / 2 + S * 0.23 * math.sin(a)
            d.ellipse([cx - S * 0.21, cy - S * 0.21, cx + S * 0.21, cy + S * 0.21], fill=255)
        d.ellipse([S * 0.22, S * 0.22, S * 0.78, S * 0.78], fill=255)
    else:  # heart
        d.ellipse([S * 0.1, S * 0.14, S * 0.52, S * 0.56], fill=255)
        d.ellipse([S * 0.48, S * 0.14, S * 0.9, S * 0.56], fill=255)
        d.polygon([(S * 0.12, S * 0.42), (S * 0.88, S * 0.42), (S * 0.5, S * 0.9)], fill=255)
    return m.resize((s, s), Image.LANCZOS)


def button(color: str, holes: int, shape: str, s: int = 120) -> Image.Image:
    fill, rim = COLORS[color]
    m = shape_mask(shape, s)
    out = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    outline = m.filter(ImageFilter.MaxFilter(5))
    out.paste(Image.new("RGBA", (s, s), INK), (0, 0), outline)
    out.paste(Image.new("RGBA", (s, s), rim + (255,)), (0, 0), m)
    inner = m.resize((int(s * 0.8), int(s * 0.8)), Image.LANCZOS)
    out.paste(Image.new("RGBA", inner.size, fill + (255,)), (int(s * 0.1), int(s * 0.1)), inner)
    d = ImageDraw.Draw(out)
    cy = s * (0.52 if shape == "heart" else 0.5)
    pts = {1: [(0.5, 0)], 2: [(0.4, 0), (0.6, 0)], 3: [(0.5, -0.11), (0.4, 0.07), (0.6, 0.07)],
           4: [(0.4, -0.1), (0.6, -0.1), (0.4, 0.1), (0.6, 0.1)]}[holes]
    r = s * 0.055
    for px, py in pts:
        x, y = s * px, cy + s * py
        d.ellipse([x - r, y - r, x + r, y + r], fill=INK)
    return out


def cipher_poster(n: int = 16) -> Image.Image:
    W, H = 1200, 1500
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([10, 10, W - 10, H - 10], radius=60, fill=(201, 141, 42, 255), outline=INK, width=8)
    d.rounded_rectangle([60, 60, W - 60, H - 60], radius=36, fill=CREAM, outline=INK, width=5)
    for x, y in ((60, 60), (W - 60, 60), (60, H - 60), (W - 60, H - 60)):
        im.alpha_composite(button("rose", 4, "circle", 70), (x - 35, y - 35))
    # Title: the cipher's own buttons spell nothing; a picture header (envelope + button) instead of words.
    d.rounded_rectangle([W / 2 - 150, 100, W / 2 + 150, 270], radius=20, fill=(255, 250, 240, 255), outline=INK, width=5)
    d.line([(W / 2 - 146, 106), (W / 2, 200), (W / 2 + 146, 106)], fill=INK, width=5, joint="curve")
    im.alpha_composite(button("honey", 2, "circle", 90), (int(W / 2 - 45), 180))
    f = font(92)
    cols = 4
    cw, ch = 250, 270
    x0, y0 = (W - cols * cw) / 2, 330
    for i, (letter, color, holes, shape) in enumerate(GLYPHS[:n]):
        cx, cy = x0 + (i % cols) * cw, y0 + (i // cols) * ch
        d.rounded_rectangle([cx + 14, cy + 10, cx + cw - 14, cy + ch - 14], radius=26, fill=(255, 250, 240, 255),
                            outline=(201, 141, 42, 255), width=3)
        im.alpha_composite(button(color, holes, shape, 130), (int(cx + cw / 2 - 65), int(cy + 22)))
        tw = d.textlength(letter, font=f)
        d.text((cx + cw / 2 - tw / 2, cy + 150), letter, font=f, fill=INK)
    return im


def signal_strip() -> Image.Image:
    """«Азбука огоньков» strip: glowing dot/dash slots on a brass rail (no fixed message; G draws the lit pattern)."""
    W, H = 1400, 220
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([10, 40, W - 10, H - 40], radius=70, fill=(201, 141, 42, 255), outline=INK, width=7)
    d.rounded_rectangle([40, 62, W - 40, H - 62], radius=48, fill=(74, 52, 38, 255))
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    x = 90
    for kind in ("dot", "dot", "dash", "dot", "dash", "dash"):
        w = 70 if kind == "dot" else 210
        gd.rounded_rectangle([x - 10, 80, x + w + 10, 140], radius=34, fill=(255, 210, 120, 140))
        d.rounded_rectangle([x, 88, x + w, 132], radius=22, fill=HONEY, outline=(255, 245, 210, 255), width=3)
        x += w + 40
    glow = glow.filter(ImageFilter.GaussianBlur(10))
    return Image.alpha_composite(glow, im)


def pattern(kind: str, s: int = 256) -> Image.Image:
    """Tileable cream motif overlay for a tinted scarf; G draws it inside the scarf mask (multiply-safe light motifs)."""
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = (255, 250, 238, 210)
    if kind == "stripes":
        for y in range(0, s, 64):
            d.rectangle([0, y + 8, s, y + 30], fill=c)
    elif kind == "dots":
        for y in range(0, s, 64):
            for x in range(0, s, 64):
                ox = 32 if (y // 64) % 2 else 0
                d.ellipse([x + ox + 18, y + 18, x + ox + 46, y + 46], fill=c)
                if x + ox + 46 > s:
                    d.ellipse([x + ox + 18 - s, y + 18, x + ox + 46 - s, y + 46], fill=c)
    elif kind == "hearts":
        h = shape_mask("heart", 52)
        for y in range(0, s, 64):
            for x in range(0, s, 64):
                ox = 32 if (y // 64) % 2 else 0
                for dx in (0, -s):
                    im.paste(Image.new("RGBA", (52, 52), c), (x + ox + 6 + dx, y + 6), h)
    else:  # stars
        def star(cx, cy, r):
            return [(cx + (r if i % 2 == 0 else r * 0.45) * math.sin(i * math.pi / 5),
                     cy - (r if i % 2 == 0 else r * 0.45) * math.cos(i * math.pi / 5)) for i in range(10)]
        for y in range(0, s, 64):
            for x in range(0, s, 64):
                ox = 32 if (y // 64) % 2 else 0
                for dx in (0, -s):
                    d.polygon(star(x + ox + 32 + dx, y + 34, 22), fill=c)
    return im


def preview_swatch(kind: str) -> Image.Image:
    base = Image.new("RGBA", (256, 256), (200, 85, 61, 255))
    base.alpha_composite(pattern(kind))
    return base


def save(im: Image.Image, name: str, note: str) -> None:
    out = R / "props" / f"{name}.png"
    im.save(out)
    (R / "props" / f"{name}.json").write_text(json.dumps({
        "operation": "own-work", "tool": "tools/assets/art/raster_kit.py", "notes": note,
        "font": "Nunito (SIL OFL 1.1)" if "poster" in name else None,
        "createdAt": datetime.now(timezone.utc).isoformat(timespec="seconds")}, ensure_ascii=False, indent=1), encoding="utf-8")


def main() -> None:
    save(cipher_poster(16), "cipher-poster", "Case 2 reward poster: the full 16-glyph button cipher (content/case02/mechanics.ts).")
    save(signal_strip(), "light-signal-strip", "Case 3 «Азбука огоньков» signal rail (sample pattern dot-dot-dash-dot-dash-dash).")
    for k in ("stripes", "dots", "hearts", "stars"):
        save(pattern(k), f"scarf-pattern-{k}", "Tileable 256 px overlay for the tinted avatar scarf (T29 shop).")
        save(preview_swatch(k), f"scarf-pattern-{k}-swatch", "Shop swatch: pattern over the default scarf colour.")
    print("ok")


if __name__ == "__main__":
    main()
