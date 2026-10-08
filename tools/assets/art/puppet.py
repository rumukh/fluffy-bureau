"""Build layered puppets (aegis-rig/1 + aegis-atlas/1) from one generated base figure.

Pipeline (masters stay in F:/AI/GameAssets/fluffy-bureau, T20):
  prepare  <config>  -> edit crops, masks, prompts and a gen_batch jobs file for
                        eye, brow, mouth (and optional body pose) variants
  assemble <config>  -> cut head/body, extract feature patches, pack the atlas,
                        write <id>.atlas.webp, <id>.atlas.json, <id>.rig.json into assets/

Feature variants come from masked edits of a 2x upscaled head crop. Only pixels inside
the feathered feature mask are kept, so drift outside the mask never reaches the game.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps

MASTERS = Path("F:/AI/GameAssets/fluffy-bureau")
REPO = Path(__file__).resolve().parents[3]
PROMPTS = REPO / "tools/assets/art/prompts/puppets"

MOUTH = {
    "A": "the mouth closed with the lips pressed together firmly, as when saying 'M' or 'B'",
    "B": "the mouth only slightly open with the teeth almost together, a narrow gap, as when saying 'S' or 'EE'",
    "C": "the mouth open to a medium relaxed oval, as when saying 'EH'",
    "D": "the mouth wide open with the jaw dropped and a little pink tongue visible, as when saying 'AH'",
    "E": "the mouth open in a slightly rounded oval, as when saying 'OH'",
    "F": "the lips pushed forward into a small round pucker, as when saying 'OO'",
    "G": "the upper teeth resting on the lower lip, as when saying 'F' or 'V'",
    "H": "the mouth open with the tongue tip raised behind the upper teeth, as when saying 'L'",
}
EYES = {
    "half": "both eyes half closed, the upper eyelids lowered to cover the top half of each eye, mid-blink",
    "closed": "both eyes fully and gently closed, each eye drawn as a soft curved eyelid line, peaceful blink",
    "happy": "both eyes closed in happy upward curved arcs, smiling eyes",
}
BROWS = {
    "up": "both eyebrows raised high in gentle surprise",
    "worried": "both eyebrows tilted with the inner ends raised, a gentle worried look",
    "neutral": "relaxed neutral eyebrows",
}
PHRASES = {"mouth": MOUTH, "eyes": EYES, "brows": BROWS}


def load(cfg_path: str) -> dict:
    cfg = json.loads(Path(cfg_path).read_text(encoding="utf-8"))
    cfg["_dir"] = MASTERS / "puppets" / cfg.get("dir", cfg["id"])
    return cfg


def ellipse_mask(size, ellipse, offset=(0, 0), scale=1.0, feather=0):
    """White ellipses on black. Each ellipse = [cx, cy, rx, ry] in base coordinates."""
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    for cx, cy, rx, ry in ellipse:
        x0, y0 = (cx - rx - offset[0]) * scale, (cy - ry - offset[1]) * scale
        x1, y1 = (cx + rx - offset[0]) * scale, (cy + ry - offset[1]) * scale
        d.ellipse([x0, y0, x1, y1], fill=255)
    if feather:
        m = m.filter(ImageFilter.GaussianBlur(feather))
    return m


def ellipses_of(spec: dict) -> list:
    return spec.get("ellipses") or [spec["ellipse"]]


def prepare(cfg: dict) -> None:
    out = cfg["_dir"] / "edits"
    out.mkdir(parents=True, exist_ok=True)
    PROMPTS.mkdir(parents=True, exist_ok=True)
    base = Image.open(MASTERS / cfg["base"]).convert("RGBA")
    x, y, s = cfg["editCrop"]
    crop = base.crop((x, y, x + s, y + s)).resize((1024, 1024), Image.LANCZOS)
    # Flatten onto a neutral cream so the edit model sees a normal painting.
    flat = Image.new("RGBA", crop.size, (246, 238, 220, 255))
    flat.alpha_composite(crop)
    crop_path = out / "crop.png"
    flat.save(crop_path)
    scale = 1024 / s
    jobs = []
    for feat, spec in cfg["features"].items():
        m = ellipse_mask((1024, 1024), ellipses_of(spec), (x, y), scale)
        rgba = Image.new("RGBA", (1024, 1024), (0, 0, 0, 255))
        rgba.putalpha(Image.eval(m, lambda v: 255 - v))  # transparent = editable
        mpath = out / f"mask_{feat}.png"
        rgba.save(mpath)
        for var in spec["variants"]:
            phrase = spec.get("phrases", {}).get(var) or PHRASES[feat][var]
            prompt = (
                f"This is a close-up of the face of {cfg['creature']} from a children's picture-book puppet. "
                f"Edit ONLY the transparent masked area: change it to show {phrase}. "
                "Keep the identical character, fur colors and markings, soft dark-brown outlines, gouache texture "
                "and warm lighting, matching the surrounding pixels seamlessly. Everything outside the mask stays identical. "
                "Same framing and scale, no text."
            )
            pfile = PROMPTS / f"{cfg['id']}_{feat}_{var}.txt"
            pfile.write_text(prompt, encoding="utf-8", newline="\n")
            jobs.append({"id": f"{cfg['id']}_{feat}_{var}", "prompt_file": str(pfile),
                         "out": str(out / f"{feat}_{var}.png"), "size": "1024x1024",
                         "quality": cfg.get("editQuality", "medium"), "refs": [str(crop_path)], "mask": str(mpath)})
    for var, spec in cfg.get("bodyVariants", {}).items():
        pfile = PROMPTS / f"{cfg['id']}_body_{var}.txt"
        jobs.append({"id": f"{cfg['id']}_body_{var}", "prompt_file": str(pfile),
                     "out": str(cfg["_dir"] / f"body_{var}.png"), "size": "1024x1536", "quality": "high",
                     "refs": [str(MASTERS / cfg["base"])], "mask": str(cfg["_dir"] / f"mask_body_{var}.png"),
                     "background": "transparent"})
        bm = Image.new("RGBA", base.size, (0, 0, 0, 255))
        d = ImageDraw.Draw(bm)
        d.rectangle([0, cfg["neck"]["y"] + spec.get("maskTopOffset", 30), base.size[0], base.size[1]], fill=(0, 0, 0, 0))
        for poly in spec.get("extraMask", []):
            d.polygon([tuple(p) for p in poly], fill=(0, 0, 0, 0))
        bm.save(cfg["_dir"] / f"mask_body_{var}.png")
    (cfg["_dir"] / "jobs_edits.json").write_text(json.dumps(jobs, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")
    print(f"{len(jobs)} jobs -> {cfg['_dir'] / 'jobs_edits.json'}")


def pick(path: Path) -> Path:
    """gen_batch writes <name>-c1.png when count > 1 and <name>.png otherwise."""
    if path.exists():
        return path
    alt = path.with_name(path.stem + "-c1.png")
    if alt.exists():
        return alt
    raise FileNotFoundError(path)


def scarf_mask_of(base: Image.Image, spec: dict, folder: Path) -> Image.Image:
    """Scarf region from masked edits that painted the scarf flat magenta (scarf_magenta*.png).

    Edits are used only as masks (their union); scarf pixels themselves come from the untouched base.
    """
    import numpy as np  # noqa: PLC0415

    m = None
    for f in sorted(folder.glob("scarf_magenta*.png")):
        ed = Image.open(f).convert("RGB").resize(base.size, Image.LANCZOS)
        rgb = np.asarray(ed).astype(np.int16)
        r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        cur = (r > 170) & (b > 150) & (g < 120) & (r - g > 90) & (b - g > 70)
        m = cur if m is None else (m | cur)
    if m is None:
        raise FileNotFoundError(folder / "scarf_magenta.png")
    win = np.zeros_like(m)
    win[spec["y"][0]:spec["y"][1], spec["x"][0]:spec["x"][1]] = True
    m &= win & (np.asarray(base.getchannel("A")) > 0)
    # The edit can drift a little: add nearby neutral-grey pixels (the real scarf is light grey) and
    # drop painted pixels whose original colour is clearly saturated (shirt, fur).
    src = np.asarray(base.convert("RGB")).astype(np.float32) / 255
    mx, mn = src.max(axis=2), src.min(axis=2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    greyish = (sat < min(spec.get("satMax", 0.24), 0.21)) & (mx > spec.get("valMin", 0.5))
    near = np.asarray(Image.fromarray((m * 255).astype("uint8"), "L").filter(ImageFilter.MaxFilter(41))) > 0
    m = ((m | (greyish & near)) & (sat < 0.235)) & win
    img = Image.fromarray((m * 255).astype("uint8"), "L")
    img = img.filter(ImageFilter.MaxFilter(11)).filter(ImageFilter.MinFilter(11)).filter(ImageFilter.MedianFilter(3))
    # Drop stray islands (edit spill on the shirt): keep components >= 8% of the largest.
    from scipy import ndimage  # noqa: PLC0415

    lab, n = ndimage.label(np.asarray(img) > 127)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
        keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 0.08 * sizes.max()])
        img = Image.fromarray((keep * 255).astype("uint8"), "L")
    img = ImageChops.multiply(img, base.getchannel("A").point(lambda v: 255 if v > 0 else 0))
    return img.filter(ImageFilter.GaussianBlur(0.8))

def skyline_pack(sizes: dict[str, tuple[int, int]], width: int) -> dict[str, tuple[int, int]]:
    """Bottom-left skyline packing; sizes include padding. Returns top-left positions."""
    sky = [(0, width, 0)]  # segments (x, w, y)
    out = {}
    for key in sorted(sizes, key=lambda k: (-sizes[k][1], -sizes[k][0])):
        w, h = sizes[key]
        best = None
        for i in range(len(sky)):
            x = sky[i][0]
            if x + w > width:
                break
            y, span, j = 0, 0, i
            while span < w:
                y = max(y, sky[j][2])
                span += sky[j][1]
                j += 1
                if j == len(sky) and span < w:
                    break
            if span < w:
                continue
            if best is None or (y, x) < (best[0], best[1]):
                best = (y, x)
        y, x = best
        out[key] = (x, y)
        new = []
        for sx, sw, sy in sky:
            if sx + sw <= x or sx >= x + w:
                new.append((sx, sw, sy))
                continue
            if sx < x:
                new.append((sx, x - sx, sy))
            if sx + sw > x + w:
                new.append((x + w, sx + sw - x - w, sy))
        new.append((x, w, y + h))
        new.sort()
        merged = []
        for seg in new:
            if merged and merged[-1][2] == seg[2] and merged[-1][0] + merged[-1][1] == seg[0]:
                merged[-1] = (merged[-1][0], merged[-1][1] + seg[1], seg[2])
            else:
                merged.append(seg)
        sky = merged
    return out


def bbox_of(ellipses, pad=4):
    return (int(min(e[0] - e[2] for e in ellipses) - pad), int(min(e[1] - e[3] for e in ellipses) - pad),
            int(max(e[0] + e[2] for e in ellipses) + pad), int(max(e[1] + e[3] for e in ellipses) + pad))


def assemble(cfg: dict, out_dir: Path, scale: float) -> None:
    cid = cfg["id"]
    base = Image.open(MASTERS / cfg["base"]).convert("RGBA")
    W, H = base.size
    alpha = base.getchannel("A")
    ny, ov = cfg["neck"]["y"], cfg["neck"]["overlap"]
    x, y, s = cfg["editCrop"]
    frames: dict[str, Image.Image] = {}
    origin_of: dict[str, tuple[int, int]] = {}  # frame top-left in base coordinates

    # Head: everything above the neck line plus a feathered overlap band.
    hm = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(hm)
    d.rectangle([0, 0, W, ny], fill=255)
    for i in range(ov):
        d.line([(0, ny + i), (W, ny + i)], fill=int(255 * (1 - (i + 1) / (ov + 1))))
    head = base.copy()
    head_alpha = Image.composite(alpha, Image.new("L", (W, H), 0), hm)
    scarf_mask = None
    if "avatar" in cfg:
        scarf_mask = scarf_mask_of(base, cfg["avatar"]["scarf"], cfg["_dir"])
        # The scarf is its own tinted part; keep untinted head pixels from drawing over it.
        head_alpha = ImageChops.multiply(head_alpha, ImageChops.invert(scarf_mask))
        scarf = ImageOps.grayscale(base).convert("RGBA")
        scarf.putalpha(ImageChops.multiply(alpha, scarf_mask))
        sb = scarf.getbbox()
        frames["scarf"] = scarf.crop(sb)
        origin_of["scarf"] = sb[:2]
    head.putalpha(head_alpha)
    hb = head.getbbox()
    frames["head"] = head.crop(hb)
    origin_of["head"] = hb[:2]

    def body_from(img: Image.Image) -> Image.Image:
        bm = Image.new("L", (W, H), 0)
        ImageDraw.Draw(bm).rectangle([0, ny - 2, W, H], fill=255)
        b = img.copy()
        b.putalpha(Image.composite(img.getchannel("A"), Image.new("L", (W, H), 0), bm))
        return b

    body_imgs = {"rest": body_from(base)}
    for var in cfg.get("bodyVariants", {}):
        v = Image.open(pick(cfg["_dir"] / f"body_{var}.png")).convert("RGBA").resize((W, H), Image.LANCZOS)
        body_imgs[var] = body_from(v)
    union = None
    for img in body_imgs.values():
        bb = img.getbbox()
        union = bb if union is None else (min(union[0], bb[0]), min(union[1], bb[1]), max(union[2], bb[2]), max(union[3], bb[3]))
    for var, img in body_imgs.items():
        frames[f"body.{var}"] = img.crop(union)
        origin_of[f"body.{var}"] = union[:2]

    # Feature patches.
    edits = cfg["_dir"] / "edits"
    for feat, spec in cfg["features"].items():
        box = bbox_of(ellipses_of(spec), pad=spec.get("feather", 6) * 2)
        mask = ellipse_mask((W, H), ellipses_of(spec), feather=spec.get("feather", 6))
        default = {"eyes": "open", "brows": "neutral", "mouth": "X"}[feat]
        sources = {default: base}
        for var in spec["variants"]:
            ed = Image.open(pick(edits / f"{feat}_{var}.png")).convert("RGBA").resize((s, s), Image.LANCZOS)
            full = base.copy()
            full.paste(ed, (x, y))
            sources[var] = full
        for var, src in sources.items():
            patch = src.crop(box)
            a = Image.composite(mask.crop(box), Image.new("L", patch.size, 0), alpha.crop(box))
            if var == default:
                # Never let the default patch alter the head; it is the head's own pixels.
                pass
            patch.putalpha(a)
            frames[f"{feat}.{var}"] = patch
            origin_of[f"{feat}.{var}"] = box[:2]
        if feat == "mouth" and "A" not in sources:
            raise ValueError("mouth needs A")

    # Pack atlas (skyline bottom-left, 2 px padding, no rotation); try several widths, keep the smallest area.
    scaled = {k: (v.resize((max(1, round(v.width * scale)), max(1, round(v.height * scale))), Image.LANCZOS) if scale != 1 else v)
              for k, v in frames.items()}
    best = None
    for atlas_w in (512, 640, 768, 896, 1024, 1152, 1280, 1536, 2048):
        if max(im.width for im in scaled.values()) + 4 > atlas_w:
            continue
        packed = skyline_pack({k: (im.width + 4, im.height + 4) for k, im in scaled.items()}, atlas_w)
        h = max(y + scaled[k].height + 4 for k, (x, y) in packed.items())
        h = (h + 3) // 4 * 4
        if best is None or atlas_w * h < best[0] * best[1]:
            best = (atlas_w, h, packed)
    atlas_w, atlas_h, packed = best
    pos = {k: (x + 2, y + 2) for k, (x, y) in packed.items()}
    if atlas_h > 4096:
        raise ValueError(f"atlas too tall: {atlas_h}")
    atlas = Image.new("RGBA", (atlas_w, atlas_h), (0, 0, 0, 0))
    for k, (px, py) in pos.items():
        atlas.paste(scaled[k], (px, py))
    out_dir.mkdir(parents=True, exist_ok=True)
    atlas_id = f"{cid}.atlas"
    img_name = f"{cid}.atlas.webp"
    atlas.save(out_dir / img_name, "WEBP", quality=90, method=6, exact=True)
    atlas_json = {"format": "aegis-atlas/1", "id": atlas_id, "image": img_name, "width": atlas_w, "height": atlas_h,
                  "scale": 1,
                  "frames": {k: {"x": p[0], "y": p[1], "w": scaled[k].width, "h": scaled[k].height} for k, p in pos.items()}}
    (out_dir / f"{cid}.atlas.json").write_text(json.dumps(atlas_json, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")

    # Rig in logical px == base px * scale; atlas scale maps atlas px back to logical px 1:1 here,
    # so rig coordinates are in base pixels multiplied by `scale` (logical = atlas px).
    f = lambda v: round(v * scale, 2)
    # Root on the bottom pixel row (not its outer edge) so the body pivot stays inside the frame (AEG-ANIM-0012).
    feet_y = union[3] - 1
    root = (W / 2, feet_y)
    pivot_head = cfg["neck"]["pivot"]
    hx, hy = origin_of["head"]
    bx, by = origin_of["body.rest"]
    body_pivot = (root[0] - bx, root[1] - by)
    bw, bh = round((union[2] - union[0]) * scale), round((union[3] - union[1]) * scale)
    parts = [{
        "id": "body", "pivot": {"x": min(f(body_pivot[0]), bw - 0.5), "y": min(f(body_pivot[1]), bh - 0.5)},
        "position": {"x": 0, "y": 0}, "z": 10,
        "variants": {v: f"{atlas_id}#body.{v}" for v in body_imgs}, "variant": "rest"}]
    parts.append({"id": "head", "parent": "body", "frame": f"{atlas_id}#head",
                  "pivot": {"x": f(pivot_head[0] - hx), "y": f(pivot_head[1] - hy)},
                  "position": {"x": f(pivot_head[0] - root[0]), "y": f(pivot_head[1] - root[1])}, "z": 20})
    z = {"eyes": 21, "brows": 22, "mouth": 23}
    for feat, spec in cfg["features"].items():
        default = {"eyes": "open", "brows": "neutral", "mouth": "X"}[feat]
        ox, oy = origin_of[f"{feat}.{default}"]
        fw, fh = frames[f"{feat}.{default}"].size
        variants = {v: f"{atlas_id}#{feat}.{v}" for v in [default, *spec["variants"]]}
        part = {"id": feat, "parent": "head", "pivot": {"x": f(fw / 2), "y": f(fh / 2)},
                "position": {"x": f(ox + fw / 2 - pivot_head[0]), "y": f(oy + fh / 2 - pivot_head[1])},
                "z": z[feat], "variants": variants, "variant": default}
        parts.append(part)
    expressions = {"neutral": {}}
    if "brows" in cfg["features"]:
        expressions["neutral"]["brows"] = "neutral"
        for var in cfg["features"]["brows"]["variants"]:
            expressions[{"up": "surprised", "worried": "worried"}.get(var, var)] = {"brows": var}
    if "eyes" in cfg["features"]:
        expressions["neutral"]["eyes"] = "open"
        if "happy" in cfg["features"]["eyes"]["variants"]:
            expressions["happy"] = {"eyes": "happy"}
    roles = {"head": "head", "lookAt": "head"}
    for feat in cfg["features"]:
        roles[feat] = feat
    for k in [k for k in expressions if not expressions[k]]:
        del expressions[k]
    if cfg.get("expressions"):
        expressions = cfg["expressions"]
    if "eyes" in cfg["features"] and "happy" in cfg["features"]["eyes"]["variants"]:
        expressions.setdefault("happy", {"eyes": "happy"})
    puppet_scale = cfg.get("scale", 1.0)
    if puppet_scale != 1.0:
        parts[0]["scale"] = {"x": puppet_scale, "y": puppet_scale}
    if cfg.get("emotes"):
        rig_emotes = cfg["emotes"]
    else:
        rig_emotes = {"joy": {"expression": "happy" if "happy" in expressions else "neutral", "clip": "cheer"},
                      "nod": {"expression": "neutral", "clip": "nod"}}
    if "scarf" in frames:
        sx_, sy_ = origin_of["scarf"]
        sw, sh = frames["scarf"].size
        parts.append({"id": "scarf", "parent": "body", "frame": f"{atlas_id}#scarf",
                      "pivot": {"x": f(sw / 2), "y": f(sh * 0.2)},
                      "position": {"x": f(sx_ + sw / 2 - root[0]), "y": f(sy_ + sh * 0.2 - root[1])},
                      "z": 15, "tint": {"channel": "scarf"}})
        # Hat slot: top of the head along the centre column, in head space.
        hcol = alpha.crop((pivot_head[0] - 30, 0, pivot_head[0] + 30, ny)).point(lambda v: 255 if v > 128 else 0)
        top_y = hcol.getbbox()[1]
        cfg.setdefault("slots", {})["hat"] = {"parent": "head", "position": {"x": 0, "y": f(top_y + 40 - pivot_head[1])}, "z": 40}
        cfg.setdefault("tints", {})["scarf"] = {"default": "#c8553d"}
        cfg.setdefault("anchors", {})["badge"] = {"part": "scarf", "x": f(sw * 0.5), "y": f(sh * 0.45)}
    ps = puppet_scale
    rig = {"format": "aegis-rig/1", "id": cid, "revision": str(cfg.get("revision", 1)), "atlases": [atlas_id],
           "origin": {"x": 0, "y": 0},
           "bounds": {"x": round(f(union[0] - root[0]) * ps, 2), "y": round(f(min(hb[1], union[1]) - root[1]) * ps, 2),
                      "width": round(f(union[2] - union[0]) * ps, 2), "height": round(f(feet_y - min(hb[1], union[1])) * ps, 2)},
           "parts": parts, "roles": roles}
    if expressions:
        rig["expressions"] = expressions
    if cfg.get("withEmotes", True):
        rig["emotes"] = rig_emotes
    for extra in ("slots", "tints", "anchors"):
        if extra in cfg:
            rig[extra] = cfg[extra]
    (out_dir / f"{cid}.rig.json").write_text(json.dumps(rig, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")
    # Static exports for runtimes that do not load rigs yet: rest pose and scarf tint mask on one canvas.
    full = alpha.getbbox()
    size = (round((full[2] - full[0]) * scale), round((full[3] - full[1]) * scale))
    base.crop(full).resize(size, Image.LANCZOS).save(out_dir / "base.webp", "WEBP", quality=90, method=6, exact=True)
    if scarf_mask is not None:
        m = ImageChops.multiply(alpha, scarf_mask).crop(full).resize(size, Image.LANCZOS)
        white = Image.new("RGBA", size, (255, 255, 255, 0))
        white.putalpha(m)
        white.save(out_dir / "scarf-mask.webp", "WEBP", quality=95, method=6, exact=True)
    digest = hashlib.sha256((out_dir / img_name).read_bytes()).hexdigest()
    print(json.dumps({"rig": str(out_dir / f"{cid}.rig.json"), "atlas": [atlas_w, atlas_h], "frames": len(frames), "sha256": digest}))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("command", choices=["prepare", "assemble"])
    ap.add_argument("config")
    ap.add_argument("--out", default=str(REPO / "assets/characters"))
    ap.add_argument("--scale", type=float, default=0.6, help="logical (and atlas) px per master px")
    a = ap.parse_args()
    cfg = load(a.config)
    if a.command == "prepare":
        prepare(cfg)
    else:
        sub = Path(a.out) if a.out != str(REPO / "assets/characters") or "avatar" not in cfg else REPO / "assets/avatar"
        assemble(cfg, sub / cfg.get("outName", cfg["id"].split(".")[-1]), a.scale)


if __name__ == "__main__":
    main()


