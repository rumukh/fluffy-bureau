"""Build an animation-lab consumer folder for previewing cutscenes in E's preview route.

python tools/assets/art/preview_manifest.py <cutscene dir> <out dir> [--engine <aegis-engine checkout>]

The out dir gets: a junction `a` -> repo assets/, copies of the cutscene documents, aegis-cues/1
files for every spoken line they use, and manifest.json (format: docs/api/animation.md section 12).
Then: npm run preview:labs -- --dir out\\labs --consumer <out dir>
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
ASSETS = REPO / "assets"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("cutscenes")
    ap.add_argument("out")
    ap.add_argument("--engine", default="F:/AI/GameAssets/fluffy-bureau/_aegis-preview")
    ap.add_argument("--species", type=int, default=1, help="avatar species to load (memory budget)")
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    link = out / "a"
    if not link.exists():
        subprocess.run(["cmd", "/c", "mklink", "/J", str(link), str(ASSETS)], check=True, capture_output=True)
    man = json.loads((ASSETS / "manifest.json").read_text(encoding="utf-8"))
    by_id = {x["id"]: x for x in man["assets"]}
    paths: dict[str, str] = {}
    documents: list[str] = []
    images: list[str] = []

    def add_doc(asset_id: str) -> None:
        rel = by_id[asset_id]["path"]
        doc = json.loads((ASSETS / rel).read_text(encoding="utf-8"))
        paths[doc["id"]] = "a/" + rel
        documents.append(doc["id"])
        if doc.get("format") == "aegis-atlas/1":
            img_rel = str(Path(rel).parent / doc["image"]).replace("\\", "/")
            paths[doc["image"]] = "a/" + img_rel

    docs_in = [json.loads(f.read_text(encoding="utf-8")) for f in sorted(Path(a.cutscenes).rglob("*.json"))]
    docs_in = [d for d in docs_in if d.get("format") == "aegis-cutscene/1"]
    used_rigs = {c["rig"] for d in docs_in for c in d["cast"].values() if c.get("rig")}
    used_bgs = {s["asset"] for d in docs_in for s in d["steps"] if s.get("op") == "background"}
    used_bgs |= {s["comfort"]["asset"] for d in docs_in for s in d["steps"]
                 if s.get("op") == "background" and s.get("comfort", {}).get("asset")}
    rig_assets = {}
    for c in list(man["characters"].values()) + list(man["avatar"].values()):
        rig_assets[json.loads((ASSETS / by_id[c["rig"]]["path"]).read_text(encoding="utf-8"))["id"]] = c
    rig_assets.update(man["staging"]["rigs"])
    species = [k for k in rig_assets if k.startswith("avatar.")][: a.species]
    for rid in sorted(used_rigs | set(species) | {"acc.badge.intern", "acc.badge.pie-found"}):
        add_doc(rig_assets[rid]["atlas"]); add_doc(rig_assets[rid]["rig"])
    for cid in man["staging"]["clips"].values():
        add_doc(cid)
    # Preview-only shim: E's lab always attaches `acc.scarf.long` to a `scarf` slot. Our scarf is a tinted
    # part, so give copies of the avatar rigs an empty `scarf` slot and an invisible accessory.
    shim = out / "shim"
    shim.mkdir(exist_ok=True)
    from PIL import Image  # noqa: PLC0415

    Image.new("RGBA", (8, 8), (0, 0, 0, 0)).save(shim / "empty.png")
    (shim / "empty.atlas.json").write_text(json.dumps({"format": "aegis-atlas/1", "id": "shim.atlas", "image": "shim.empty.png",
                                                       "width": 8, "height": 8, "scale": 1,
                                                       "frames": {"e": {"x": 2, "y": 2, "w": 4, "h": 4}}}), encoding="utf-8")
    (shim / "acc.scarf.long.json").write_text(json.dumps({"format": "aegis-rig/1", "id": "acc.scarf.long", "revision": "1",
                                                          "atlases": ["shim.atlas"], "origin": {"x": 0, "y": 0},
                                                          "bounds": {"x": 0, "y": 0, "width": 4, "height": 4},
                                                          "parts": [{"id": "body", "frame": "shim.atlas#e", "pivot": {"x": 2, "y": 2},
                                                                     "position": {"x": 0, "y": 0}, "z": 1}]}), encoding="utf-8")
    paths.update({"shim.atlas": "shim/empty.atlas.json", "shim.empty.png": "shim/empty.png", "acc.scarf.long": "shim/acc.scarf.long.json"})
    documents.extend(["shim.atlas", "acc.scarf.long"])
    for sp in species:
        rig = json.loads((out / paths[sp]).read_text(encoding="utf-8"))
        for part in rig["parts"]:
            if part["id"] == "scarf":
                part["id"] = "scarf.part"
        for anchor in rig.get("anchors", {}).values():
            if anchor.get("part") == "scarf":
                anchor["part"] = "scarf.part"
        rig.setdefault("slots", {})["scarf"] = {"parent": "body", "position": {"x": 0, "y": 0}, "z": 16}
        (shim / f"{sp}.rig.json").write_text(json.dumps(rig, ensure_ascii=False), encoding="utf-8")
        paths[sp] = f"shim/{sp}.rig.json"
    add_doc(man["staging"]["fx"]["atlas"])
    for bid in sorted(used_bgs) or ["bg.office"]:
        paths[bid] = "a/" + by_id[bid]["path"]
        images.append(bid)
    for k, v in {**man["music"], **man["sfx"]}.items():
        paths[v] = "a/" + by_id[v]["path"]

    cutscenes, lines = [], set()
    # G's presenter presets (apps/game/src/presenter.ts). E's lab declares only `close`, so the preview
    # copies get explicit framings; the shipped documents are untouched.
    presets = {"close-left": {"x": 900, "y": 950, "zoom": 1.4}, "close-center": {"x": 1280, "y": 950, "zoom": 1.4},
               "close-right": {"x": 1660, "y": 950, "zoom": 1.4}, "sky": {"x": 1280, "y": 500, "zoom": 1.2}}
    for f in sorted(Path(a.cutscenes).rglob("*.json")):
        doc = json.loads(f.read_text(encoding="utf-8"))
        if doc.get("format") != "aegis-cutscene/1":
            continue
        for s in doc["steps"]:
            if s.get("op") == "camera" and s.get("preset") in presets:
                s["to"] = dict(presets[s.pop("preset")])
        (out / f.name).write_text(json.dumps(doc, ensure_ascii=False), encoding="utf-8")
        paths[doc["id"]] = f.name
        documents.append(doc["id"])
        cutscenes.append(doc["id"])
        lines |= {s["line"] for s in doc["steps"] if s.get("op") == "line"}

    voice = man["voice"]
    vidx = json.loads((ASSETS / "voice/index.json").read_text(encoding="utf-8"))["lines"]
    cli = Path(a.engine) / "packages/browser/bin/aegis-animation.mjs"
    (out / "cues").mkdir(exist_ok=True)
    audio_assets, audio_lines = [], []
    for lid in sorted(lines):
        if lid not in voice:
            print("MISSING VOICE", lid)
            continue
        src = vidx[voice[lid]["asset"].split(".", 1)[1]]
        cue_id = f"{lid}.cues"
        dst = out / "cues" / f"{lid}.cues.json"
        subprocess.run(["node", str(cli), "import-rhubarb", str(ASSETS / "voice" / src["cues"]), "--line", lid,
                        "--revision", str(src["revision"]), "--out", str(dst)], check=True, capture_output=True)
        paths[cue_id] = f"cues/{dst.name}"
        documents.append(cue_id)
        audio_assets.append({"id": lid, "src": "a/voice/" + src["file"]})
        audio_lines.append({"id": lid, "asset": lid, "caption": lid, "cues": cue_id})

    manifest = {
        "paths": paths, "documents": documents, "images": images, "background": images[0],
        "audio": {"id": "voice", "revision": "1", "assets": audio_assets, "lines": audio_lines},
        "cutscenes": cutscenes,
        "effects": {
            "bubbles": {"frame": "fx.atlas#bubble", "count": 10, "life": 2.4, "spread": 160, "rise": 320},
            "sparkles": {"frame": "fx.atlas#sparkle", "count": 14, "life": 1.2},
            "fireflies": {"frame": "fx.atlas#firefly", "count": 12, "life": 3.0, "spread": 600, "rise": 120},
            "confetti": {"frame": "fx.atlas#petal.rose", "count": 24, "life": 2.0, "spread": 900, "rise": -200},
            "steam": {"frame": "fx.atlas#steam", "count": 8, "life": 2.0, "spread": 80, "rise": 260},
            "glow": {"frame": "fx.atlas#glow", "count": 1, "life": 2.0, "spread": 0, "rise": 0, "scale": 3},
            "hearts": {"frame": "fx.atlas#heart", "count": 8, "life": 1.6},
        },
        "avatars": {"species": species,
                    "scarfColors": {"Мёд": "#e8b04a", "Шалфей": "#8fae86", "Роза": "#d99a9a", "Небо": "#6f9fd8",
                                    "Черника": "#5b5f9e", "Мята": "#9fd8c2"},
                    "hats": [],
                    "badge": "acc.badge.intern"},
    }
    (out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(documents)} documents, {len(images)} images, {len(cutscenes)} cutscenes, {len(audio_lines)} lines")


if __name__ == "__main__":
    main()
