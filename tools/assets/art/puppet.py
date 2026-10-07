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

from PIL import Image, ImageDraw, ImageFilter

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
    cfg["_dir"] = MASTERS / "puppets" / cfg["id"]
    return cfg


def ellipse_mask(size, ellipse, offset=(0, 0), scale=1.0, feather=0):
    """White ellipse on black. ellipse = [cx, cy, rx, ry] in base coordinates."""
    cx, cy, rx, ry = ellipse
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    x0, y0 = (cx - rx - offset[0]) * scale, (cy - ry - offset[1]) * scale
    x1, y1 = (cx + rx - offset[0]) * scale, (cy + ry - offset[1]) * scale
    d.ellipse([x0, y0, x1, y1], fill=255)
    if feather:
        m = m.filter(ImageFilter.GaussianBlur(feather))
    return m


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
        m = ellipse_mask((1024, 1024), spec["ellipse"], (x, y), scale)
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
            pfile.write_text(prompt, encoding="utf-8")
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
    (cfg["_dir"] / "jobs_edits.json").write_text(json.dumps(jobs, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(jobs)} jobs -> {cfg['_dir'] / 'jobs_edits.json'}")


def pick(path: Path) -> Path:
    """gen_batch writes <name>-c1.png when count > 1 and <name>.png otherwise."""
    if path.exists():
        return path
    alt = path.with_name(path.stem + "-c1.png")
    if alt.exists():
        return alt
    raise FileNotFoundError(path)


def bbox_of(ellipse, pad=4):
    cx, cy, rx, ry = ellipse
    return (int(cx - rx - pad), int(cy - ry - pad), int(cx + rx + pad), int(cy + ry + pad))


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
    head.putalpha(Image.composite(alpha, Image.new("L", (W, H), 0), hm))
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
        box = bbox_of(spec["ellipse"], pad=spec.get("feather", 6) * 2)
        mask = ellipse_mask((W, H), spec["ellipse"], feather=spec.get("feather", 6))
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

    # Pack atlas (simple shelf packer, 2 px padding, no rotation).
    scaled = {k: (v.resize((max(1, round(v.width * scale)), max(1, round(v.height * scale))), Image.LANCZOS) if scale != 1 else v)
              for k, v in frames.items()}
    atlas_w = 2048
    order = sorted(scaled, key=lambda k: -scaled[k].height)
    pos, cx, cy, row_h = {}, 2, 2, 0
    for k in order:
        im = scaled[k]
        if cx + im.width + 2 > atlas_w:
            cx, cy, row_h = 2, cy + row_h + 4, 0
        pos[k] = (cx, cy)
        cx += im.width + 4
        row_h = max(row_h, im.height)
    atlas_h = cy + row_h + 2
    atlas_h = 1 << (atlas_h - 1).bit_length()
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
    (out_dir / f"{cid}.atlas.json").write_text(json.dumps(atlas_json, ensure_ascii=False, indent=1), encoding="utf-8")

    # Rig in logical px == base px * scale; atlas scale maps atlas px back to logical px 1:1 here,
    # so rig coordinates are in base pixels multiplied by `scale` (logical = atlas px).
    f = lambda v: round(v * scale, 2)
    feet_y = union[3]
    root = (W / 2, feet_y)
    pivot_head = cfg["neck"]["pivot"]
    hx, hy = origin_of["head"]
    bx, by = origin_of["body.rest"]
    body_pivot = (root[0] - bx, root[1] - by)
    parts = [{
        "id": "body", "pivot": {"x": f(body_pivot[0]), "y": f(body_pivot[1])}, "position": {"x": 0, "y": 0}, "z": 10,
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
    rig = {"format": "aegis-rig/1", "id": cid, "revision": str(cfg.get("revision", 1)), "atlases": [atlas_id],
           "origin": {"x": 0, "y": 0},
           "bounds": {"x": f(union[0] - root[0]), "y": f(min(hb[1], union[1]) - root[1]),
                      "width": f(union[2] - union[0]), "height": f(feet_y - min(hb[1], union[1]))},
           "parts": parts, "roles": roles}
    if expressions:
        rig["expressions"] = expressions
    for extra in ("slots", "tints", "anchors"):
        if extra in cfg:
            rig[extra] = cfg[extra]
    (out_dir / f"{cid}.rig.json").write_text(json.dumps(rig, ensure_ascii=False, indent=1), encoding="utf-8")
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
        assemble(cfg, Path(a.out) / cfg["id"], a.scale)


if __name__ == "__main__":
    main()

