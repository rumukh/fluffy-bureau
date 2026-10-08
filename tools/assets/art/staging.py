"""Staging kit for T25 cutscenes: clips, prop puppets, accessories and the effects atlas.

python tools/assets/art/staging.py

Writes into assets/staging/:
  clips/<id>.clip.json          aegis-clip/1 motions on body/head (rig-independent)
  props/<id>/                   single-part prop puppets (aegis-rig/1 + aegis-atlas/1)
  acc/<id>/                     avatar accessories (badges for the `badge` anchor, hats for the `hat` slot)
  fx/fx.atlas.{json,webp}       frames for consumer-registered stage effects
Sources: generated masters in F:/AI/GameAssets/fluffy-bureau/props (provenance JSON beside each)
and programmatic shapes drawn here. Everything is deterministic.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

REPO = Path(__file__).resolve().parents[3]
OUT = REPO / "assets/staging"
MASTERS = Path("F:/AI/GameAssets/fluffy-bureau")


def dump(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")


# ---- clips -------------------------------------------------------------------------------

def k(t, v, ease=None):
    d = {"t": round(t, 3), "v": v}
    if ease:
        d["ease"] = ease
    return d


CLIPS = {
    "nod": {"duration": 0.8, "tracks": [
        ("head", "y", [k(0, 0, "easeInOutSine"), k(0.2, 10, "easeInOutSine"), k(0.4, 0, "easeInOutSine"),
                       k(0.6, 10, "easeInOutSine"), k(0.8, 0)]),
        ("head", "rotation", [k(0, 0), k(0.2, 1.5), k(0.4, 0), k(0.6, 1.5), k(0.8, 0)])]},
    "sniff": {"duration": 1.2, "tracks": [
        ("head", "y", [k(0, 0, "easeOutSine"), k(0.2, -14), k(0.3, -9), k(0.4, -14), k(0.5, -9), k(0.6, -14),
                       k(0.7, -9), k(0.8, -14, "easeInOutSine"), k(1.2, 0)]),
        ("head", "rotation", [k(0, 0, "easeInOutSine"), k(0.3, -3), k(0.6, 3), k(0.9, -2, "easeInOutSine"), k(1.2, 0)]),
        ("body", "scaleY", [k(0, 1, "easeOutSine"), k(0.3, 1.015), k(0.9, 1.015, "easeInOutSine"), k(1.2, 1)])]},
    "bow": {"duration": 1.0, "tracks": [
        ("body", "scaleY", [k(0, 1, "easeInOutSine"), k(0.4, 0.94), k(0.6, 0.94, "easeInOutSine"), k(1.0, 1)]),
        ("head", "y", [k(0, 0, "easeInOutSine"), k(0.4, 26), k(0.6, 26, "easeInOutSine"), k(1.0, 0)]),
        ("head", "scaleY", [k(0, 1, "easeInOutSine"), k(0.4, 0.96), k(0.6, 0.96, "easeInOutSine"), k(1.0, 1)])]},
    "cheer": {"duration": 0.8, "tracks": [
        ("body", "y", [k(0, 0, "easeOutQuad"), k(0.3, -42, "easeInQuad"), k(0.55, 0, "easeOutSine"), k(0.65, 4, "easeOutSine"), k(0.8, 0)]),
        ("body", "scaleY", [k(0, 1), k(0.08, 0.95, "easeOutQuad"), k(0.3, 1.03, "easeInQuad"), k(0.58, 0.96, "easeOutSine"), k(0.8, 1)]),
        ("head", "rotation", [k(0, 0, "easeInOutSine"), k(0.3, -6, "easeInOutSine"), k(0.6, 4, "easeInOutSine"), k(0.8, 0)])]},
    "shrug-shy": {"duration": 1.0, "tracks": [
        ("head", "y", [k(0, 0, "easeInOutSine"), k(0.3, 12), k(0.8, 12, "easeInOutSine"), k(1.0, 0)]),
        ("head", "rotation", [k(0, 0, "easeInOutSine"), k(0.3, -5, "easeInOutSine"), k(0.6, 4, "easeInOutSine"), k(1.0, 0)]),
        ("body", "rotation", [k(0, 0, "easeInOutSine"), k(0.35, -1.5, "easeInOutSine"), k(0.7, 1.5, "easeInOutSine"), k(1.0, 0)])]},
    "look-around": {"duration": 1.6, "tracks": [
        ("head", "rotation", [k(0, 0, "easeInOutSine"), k(0.4, -8), k(0.7, -8, "easeInOutSine"), k(1.1, 8), k(1.3, 8, "easeInOutSine"), k(1.6, 0)]),
        ("head", "x", [k(0, 0, "easeInOutSine"), k(0.4, -10), k(0.7, -10, "easeInOutSine"), k(1.1, 10), k(1.3, 10, "easeInOutSine"), k(1.6, 0)])]},
    # Props and flyers.
    "hover": {"duration": 1.6, "loop": True, "blend": "additive", "tracks": [
        ("body", "y", [k(0, 0, "easeInOutSine"), k(0.8, -14, "easeInOutSine"), k(1.6, 0)]),
        ("body", "rotation", [k(0, -1.5, "easeInOutSine"), k(0.8, 1.5, "easeInOutSine"), k(1.6, -1.5)])]},
    "flutter": {"duration": 0.4, "loop": True, "blend": "additive", "tracks": [
        ("body", "rotation", [k(0, -3, "easeInOutSine"), k(0.2, 3, "easeInOutSine"), k(0.4, -3)]),
        ("body", "y", [k(0, 0, "easeInOutSine"), k(0.1, -5, "easeInOutSine"), k(0.2, 0, "easeInOutSine"), k(0.3, -5, "easeInOutSine"), k(0.4, 0)])]},
    "present": {"duration": 1.2, "tracks": [
        ("body", "scaleX", [k(0, 0.6, "easeOutBack"), k(0.6, 1.08, "easeInOutSine"), k(1.2, 1)]),
        ("body", "scaleY", [k(0, 0.6, "easeOutBack"), k(0.6, 1.08, "easeInOutSine"), k(1.2, 1)]),
        ("body", "y", [k(0, 40, "easeOutBack"), k(0.6, -20, "easeInOutSine"), k(1.2, 0)]),
        ("body", "opacity", [k(0, 0, "easeOutSine"), k(0.3, 1), k(1.2, 1)])]},
    "box-open": {"duration": 1.0, "tracks": [
        ("body", "rotation", [k(0, 0, "easeInOutSine"), k(0.15, -4), k(0.3, 4), k(0.45, 0)]),
        ("box", "variant", [k(0, "closed", "step"), k(0.45, "open", "step")]),
        ("body", "scaleY", [k(0.45, 0.94, "easeOutBack"), k(0.7, 1.03, "easeInOutSine"), k(1.0, 1)])]},
    "wobble": {"duration": 0.6, "tracks": [
        ("body", "rotation", [k(0, 0, "easeInOutSine"), k(0.15, -5), k(0.3, 5), k(0.45, -2, "easeInOutSine"), k(0.6, 0)])]},
    # Variant selectors for prop.sticker-pie (cutscene pose steps can only play clips).
    "stars-1": {"duration": 0.05, "tracks": [("stars", "variant", [k(0, "1", "step"), k(0.05, "1")])]},
    "stars-2": {"duration": 0.05, "tracks": [("stars", "variant", [k(0, "2", "step"), k(0.05, "2")])]},
    "stars-3": {"duration": 0.05, "tracks": [("stars", "variant", [k(0, "3", "step"), k(0.05, "3")])]},
}


def write_clips() -> list[str]:
    ids = []
    for cid, c in CLIPS.items():
        doc = {"format": "aegis-clip/1", "id": cid, "duration": c["duration"], "loop": c.get("loop", False),
               "blend": c.get("blend", "override"),
               "tracks": [{"part": p, "property": prop, "keys": keys} for p, prop, keys in c["tracks"]]}
        dump(OUT / "clips" / f"{cid}.clip.json", doc)
        ids.append(cid)
    return ids


# ---- single-frame and variant puppets ---------------------------------------------------

def trimmed(path: Path) -> Image.Image:
    im = Image.open(path).convert("RGBA")
    a = im.getchannel("A").point(lambda v: 0 if v < 10 else v)
    im.putalpha(a)
    return im.crop(a.getbbox())


def fit(im: Image.Image, width: int | None = None, height: int | None = None) -> Image.Image:
    s = (width / im.width) if width else (height / im.height)
    return im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)


def stars(im: Image.Image, n: int) -> Image.Image:
    """Add n honey stars under a sticker (difficulty ★, ★★, ★★★)."""
    r = max(26, im.width // 9)
    canvas = Image.new("RGBA", (im.width, im.height + r * 2 + 12), (0, 0, 0, 0))
    canvas.paste(im, (0, 0))
    d = ImageDraw.Draw(canvas)
    cy = im.height + r + 4
    for i in range(n):
        cx = im.width / 2 + (i - (n - 1) / 2) * r * 2.3
        pts = [(cx + (r if j % 2 == 0 else r * 0.45) * math.sin(j * math.pi / 5),
                cy - (r if j % 2 == 0 else r * 0.45) * math.cos(j * math.pi / 5)) for j in range(10)]
        d.polygon(pts, fill=(232, 176, 74, 255), outline=(74, 52, 38, 255), width=max(3, r // 8))
    return canvas


def puppet(rid: str, variants: dict[str, Image.Image], default: str, out_dir: Path, pivot: str = "bottom",
           vpart: str | None = None) -> None:
    """Pack same-size variant frames into one atlas; pivot bottom-centre (or centre).

    Without `vpart` the rig has one `body` part. With `vpart` the variants live on a child part of that
    name under an invisible 4x4 `body` anchor, so variant clips target a part only this rig has
    (E validates clips against every rig sharing their parts) while motion clips still move `body`.
    """
    fname = vpart or "body"
    W = max(v.width for v in variants.values())
    H = max(v.height for v in variants.values())
    frames = {}
    for name, im in variants.items():
        canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        canvas.paste(im, ((W - im.width) // 2, H - im.height))
        frames[name] = canvas
    cols = max(1, min(len(frames), 2048 // (W + 4)))
    rows = math.ceil(len(frames) / cols)
    aw = 1 << (cols * (W + 4)).bit_length() if cols * (W + 4) > 1 else 2
    aw = min(max(aw, 64), 4096)
    ah = 1 << (rows * (H + 4)).bit_length()
    ah = min(max(ah, 64), 4096)
    atlas = Image.new("RGBA", (aw, ah), (0, 0, 0, 0))
    fdoc = {}
    for i, (name, im) in enumerate(frames.items()):
        x, y = 2 + (i % cols) * (W + 4), 2 + (i // cols) * (H + 4)
        atlas.paste(im, (x, y))
        fdoc[f"{fname}.{name}"] = {"x": x, "y": y, "w": W, "h": H}
    out_dir.mkdir(parents=True, exist_ok=True)
    aid = f"{rid}.atlas"
    atlas.save(out_dir / f"{rid}.atlas.webp", "WEBP", quality=90, method=6, exact=True)
    dump(out_dir / f"{rid}.atlas.json", {"format": "aegis-atlas/1", "id": aid, "image": f"{rid}.atlas.webp",
                                         "width": aw, "height": ah, "scale": 1, "frames": fdoc})
    px, py = (W / 2, H - 0.5) if pivot == "bottom" else (W / 2, H / 2)
    part = {"id": fname, "pivot": {"x": px, "y": py}, "position": {"x": 0, "y": 0}, "z": 11 if vpart else 10}
    if len(frames) == 1:
        part["frame"] = f"{aid}#{fname}.{default}"
    else:
        part["variants"] = {n: f"{aid}#{fname}.{n}" for n in frames}
        part["variant"] = default
    parts = [part]
    if vpart:
        fdoc["body.anchor"] = {"x": aw - 6, "y": ah - 6, "w": 4, "h": 4}  # transparent atlas corner
        part["parent"] = "body"
        parts = [{"id": "body", "frame": f"{aid}#body.anchor", "pivot": {"x": 2, "y": 2},
                  "position": {"x": 0, "y": 0}, "z": 10}, part]
        dump(out_dir / f"{rid}.atlas.json", {"format": "aegis-atlas/1", "id": aid, "image": f"{rid}.atlas.webp",
                                             "width": aw, "height": ah, "scale": 1, "frames": fdoc})
    dump(out_dir / f"{rid}.rig.json", {"format": "aegis-rig/1", "id": rid, "revision": "1", "atlases": [aid],
                                       "origin": {"x": 0, "y": 0},
                                       "bounds": {"x": -W / 2, "y": -py, "width": W, "height": H},
                                       "parts": parts})


PROPS = {
    # id: ({variant: (master, width)}, default, pivot)
    "prop.postal-beetle": ({"rest": ("props/postal-beetle.png", 300)}, "rest", "center"),
    "prop.letter": ({"rest": ("props/letter.png", 220)}, "rest", "center"),
    "prop.badge-intern": ({"rest": ("props/badge-intern.png", 240)}, "rest", "center"),
    "prop.box-pie": ({"closed": ("props/pie-box-closed.png", 320), "open": ("props/box-pie-open.png", 340)}, "closed", "bottom", "box"),
    "prop.badge-pie-found": ({"rest": ("props/badge-pie-found.png", 320)}, "rest", "center"),
    "prop.blueberry-basket": ({"rest": ("props/blueberry-basket.png", 300)}, "rest", "bottom"),
    "prop.pie-baked": ({"rest": ("props/pie-baked.png", 340)}, "rest", "bottom"),
    "prop.garland-100": ({"rest": ("props/garland-100-c2.png", 1400)}, "rest", "center"),
    "prop.bunting": ({"rest": ("props/bunting.png", 2200)}, "rest", "center"),
    "prop.title-card": ({"rest": ("props/title-card-c1.png", 1400)}, "rest", "center"),
}


def pick(rel: str) -> Path:
    p = MASTERS / rel
    if p.exists():
        return p
    alt = p.with_name(p.stem + "-c1.png")
    if alt.exists():
        return alt
    raise FileNotFoundError(p)


def write_props() -> dict[str, list[str]]:
    sources: dict[str, list[str]] = {}
    for rid, (variants, default, pivot, *vpart) in PROPS.items():
        ims = {n: fit(trimmed(pick(rel)), width=w) for n, (rel, w) in variants.items()}
        puppet(rid, ims, default, OUT / "props" / rid, pivot, vpart[0] if vpart else None)
        sources[rid] = [rel for rel, _ in variants.values()]
    sticker = fit(trimmed(pick("props/sticker-pie.png")), width=300)
    puppet("prop.sticker-pie", {"1": stars(sticker, 1), "2": stars(sticker, 2), "3": stars(sticker, 3)}, "1",
           OUT / "props" / "prop.sticker-pie", "center", "stars")
    sources["prop.sticker-pie"] = ["props/sticker-pie.png"]
    return sources


ACCESSORIES = {
    # badges sit on the avatar's `badge` anchor; hats on the `hat` slot (bottom-centre pivot, brim at the slot)
    "acc.badge.intern": ("props/badge-intern.png", 96, "center"),
    "acc.badge.pie-found": ("props/badge-pie-found.png", 104, "center"),
    "acc.hat.detective": ("props/hat-detective.png", 330, "brim"),
    "acc.hat.beret": ("props/hat-beret.png", 300, "brim"),
    "acc.hat.flower": ("props/hat-flower.png", 340, "brim"),
    "acc.hat.acorn": ("props/hat-acorn.png", 300, "brim"),
}


def write_accessories() -> dict[str, list[str]]:
    sources = {}
    for rid, (rel, w, pivot) in ACCESSORIES.items():
        im = fit(trimmed(pick(rel)), width=w)
        d = OUT / "acc" / rid
        puppet(rid, {"rest": im}, "rest", d, "center" if pivot == "center" else "bottom")
        if pivot == "brim":
            rig = json.loads((d / f"{rid}.rig.json").read_text(encoding="utf-8"))
            # The brim sits ~15 % above the bottom of the hat image so the crown covers the head top.
            rig["parts"][0]["pivot"]["y"] = round(im.height * 0.85, 1)
            rig["bounds"]["y"] = -round(im.height * 0.85, 1)
            dump(d / f"{rid}.rig.json", rig)
        sources[rid] = [rel]
    return sources


# ---- effects atlas ----------------------------------------------------------------------

def radial(size: int, rgb: tuple, power: float = 2.0) -> Image.Image:
    im = Image.new("RGBA", (size, size), rgb + (0,))
    px = im.load()
    c = (size - 1) / 2
    for y in range(size):
        for x in range(size):
            r = math.hypot(x - c, y - c) / c
            px[x, y] = rgb + (int(255 * max(0.0, 1 - r) ** power),)
    return im


def petal(color: tuple, w: int = 40, h: int = 56) -> Image.Image:
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse([2, 2, w - 3, h - 3], fill=color + (255,), outline=(74, 52, 38, 255), width=2)
    d.line([(w / 2, 8), (w / 2, h - 10)], fill=(255, 250, 240, 160), width=2)
    return im


def write_fx() -> dict[str, list[str]]:
    frames = {
        "bubble": fit(trimmed(pick("props/bubble.png")), width=96),
        "sparkle": fit(trimmed(pick("props/sparkle.png")), width=72),
        "firefly": fit(trimmed(pick("props/firefly.png")), width=64),
        "glow": radial(256, (255, 196, 110), 1.8),
        "steam": radial(128, (255, 250, 240), 2.5).filter(ImageFilter.GaussianBlur(6)),
        "petal.honey": petal((232, 176, 74)),
        "petal.sage": petal((143, 174, 134)),
        "petal.rose": petal((217, 154, 154)),
        "heart": fit(trimmed(pick("props/heart-kindness.png")), width=64),
        "star": fit(trimmed(pick("props/sparkle.png")), width=40),
    }
    atlas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    x = y = 2
    row = 0
    fdoc = {}
    for name, im in frames.items():
        if x + im.width + 2 > 512:
            x, y, row = 2, y + row + 4, 0
        atlas.paste(im, (x, y))
        fdoc[name] = {"x": x, "y": y, "w": im.width, "h": im.height}
        x += im.width + 4
        row = max(row, im.height)
    d = OUT / "fx"
    d.mkdir(parents=True, exist_ok=True)
    atlas.save(d / "fx.atlas.webp", "WEBP", quality=92, method=6, exact=True)
    dump(d / "fx.atlas.json", {"format": "aegis-atlas/1", "id": "fx.atlas", "image": "fx.atlas.webp",
                               "width": 512, "height": 512, "scale": 1, "frames": fdoc})
    return {"fx.atlas": ["props/bubble.png", "props/sparkle.png", "props/firefly.png", "props/heart-kindness.png"]}


def main() -> None:
    clips = write_clips()
    sources = {**write_props(), **write_accessories(), **write_fx()}
    dump(MASTERS / "staging-sources.json", {"clips": clips, "sources": sources})
    print(len(clips), "clips;", len(sources), "rigs/atlases")


if __name__ == "__main__":
    main()
