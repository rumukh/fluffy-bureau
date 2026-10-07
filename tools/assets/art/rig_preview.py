"""Compose a rig pose to PNG for visual QA: python rig_preview.py rig.json out.png part=variant ..."""
import json, sys
from pathlib import Path
from PIL import Image

rig_path = Path(sys.argv[1]); out = sys.argv[2]
sel = dict(a.split("=") for a in sys.argv[3:])
rig = json.loads(rig_path.read_text(encoding="utf-8"))
atlases = {}
for aid in rig["atlases"]:
    aj = json.loads((rig_path.parent / f"{aid}.json").read_text(encoding="utf-8"))
    atlases[aid] = (aj, Image.open(rig_path.parent / aj["image"]).convert("RGBA"))

def frame(ref):
    aid, fid = ref.split("#")
    aj, im = atlases[aid]
    f = aj["frames"][fid]
    return im.crop((f["x"], f["y"], f["x"] + f["w"], f["y"] + f["h"]))

b = rig["bounds"]
canvas = Image.new("RGBA", (int(b["width"]) + 40, int(b["height"]) + 40), (255, 255, 255, 255))
ox, oy = -b["x"] + 20, -b["y"] + 20
parts = {p["id"]: p for p in rig["parts"]}
def world(pid):
    p = parts[pid]
    x, y = p["position"]["x"], p["position"]["y"]
    if p.get("parent"):
        px, py = world(p["parent"]); x += px; y += py
    return x, y
for p in sorted(rig["parts"], key=lambda p: p["z"]):
    ref = p.get("frame") or p["variants"][sel.get(p["id"], p["variant"])]
    im = frame(ref)
    wx, wy = world(p["id"])
    canvas.alpha_composite(im, (int(round(ox + wx - p["pivot"]["x"])), int(round(oy + wy - p["pivot"]["y"]))))
canvas.convert("RGB").save(out)
