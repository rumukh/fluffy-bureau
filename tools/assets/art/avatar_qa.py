"""Avatar QA: compose all five species with tinted scarves, hats and face variants into one image.

python tools/assets/art/avatar_qa.py out.jpg
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageChops

REPO = Path(__file__).resolve().parents[3]


def compose(rig_path: Path, sel: dict, tint: tuple, hat: Path | None = None) -> Image.Image:
    rig = json.loads(rig_path.read_text(encoding="utf-8"))
    aj = json.loads((rig_path.parent / f"{rig['atlases'][0]}.json").read_text(encoding="utf-8"))
    atl = Image.open(rig_path.parent / aj["image"]).convert("RGBA")

    def frame(ref: str) -> Image.Image:
        f = aj["frames"][ref.split("#")[1]]
        return atl.crop((f["x"], f["y"], f["x"] + f["w"], f["y"] + f["h"]))

    b = rig["bounds"]
    W, H = int(b["width"]) + 80, int(b["height"]) + 200
    can = Image.new("RGBA", (W, H), (251, 243, 226, 255))
    ox, oy = -b["x"] + 40, -b["y"] + 160
    parts = {p["id"]: p for p in rig["parts"]}

    def world(pid: str) -> tuple[float, float]:
        p = parts[pid]
        x, y = p["position"]["x"], p["position"]["y"]
        if p.get("parent") in parts:
            px, py = world(p["parent"])
            x, y = x + px, y + py
        return x, y

    for p in sorted(rig["parts"], key=lambda p: p["z"]):
        im = frame(p.get("frame") or p["variants"][sel.get(p["id"], p["variant"])])
        if p.get("tint"):
            a = im.getchannel("A")
            im = ImageChops.multiply(im.convert("RGB"), Image.new("RGB", im.size, tint)).convert("RGBA")
            im.putalpha(a)
        wx, wy = world(p["id"])
        can.alpha_composite(im, (int(ox + wx - p["pivot"]["x"]), int(oy + wy - p["pivot"]["y"])))
    if hat:
        s = rig["slots"]["hat"]
        hx, hy = world("head")
        hx, hy = hx + s["position"]["x"], hy + s["position"]["y"]
        h = Image.open(hat).convert("RGBA")
        h.thumbnail((int(W * 0.42), 999))
        can.alpha_composite(h, (int(ox + hx - h.width / 2), int(oy + hy - h.height * 0.85)))
    return can


def main() -> None:
    species = ["kitten", "fox", "mouse", "squirrel", "puppy"]
    colours = [(91, 95, 158), (200, 85, 61), (143, 174, 134), (217, 154, 154), (232, 176, 74)]
    hats = ["hat-detective", "hat-beret", "hat-flower", "hat-acorn", None]
    sels = [{}, {"mouth": "D"}, {"eyes": "happy"}, {"brows": "up", "mouth": "E"}, {"eyes": "closed"}]
    row = Image.new("RGB", (5 * 340, 600), "white")
    for i, sp in enumerate(species):
        hat = REPO / f"assets/avatar/hats/{hats[i]}.webp" if hats[i] else None
        im = compose(REPO / f"assets/avatar/{sp}/avatar.{sp}.rig.json", sels[i], colours[i], hat)
        im.thumbnail((340, 600))
        row.paste(im.convert("RGB"), (i * 340, 0))
    row.save(sys.argv[1], quality=85)


if __name__ == "__main__":
    main()
