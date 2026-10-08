"""Add Stage 2 (cases 2-4, cozy) entries to tools/assets/catalog.json using C's asset IDs (ASSET_REQUESTS at e4f11fb).

python tools/assets/art/stage2_catalog.py
"""
import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
CAT = REPO / "tools/assets/catalog.json"
c = json.loads(CAT.read_text(encoding="utf-8"))
B, P = c["backgrounds"], c["props"]


def bg(bid, master, pack, location, notes, hotspots=None, layers=None):
    B[bid] = {"master": master, "pack": pack, "location": location, "hotspots": hotspots or {}, "notes": notes}
    if layers:
        B[bid]["layers"] = layers


# Case 2
bg("bg.post-office", "backgrounds/bg-post-office-c1.png", "case02", "post-office", "Post office interior with the button chart on the wall (cipher hub).",
   {"cipher": {"x": 150, "y": 70, "w": 340, "h": 560}, "clock": {"x": 560, "y": 150, "w": 180, "h": 300}, "fitilyok": {"x": 490, "y": 420, "w": 220, "h": 250}, "porch": {"x": 1560, "y": 100, "w": 600, "h": 520}, "mice": {"x": 260, "y": 880, "w": 300, "h": 240}, "mayor": {"x": 1600, "y": 760, "w": 180, "h": 200}})
bg("bg.post-porch", "backgrounds/post-porch-c1.png", "case02", "post-porch", "Windblown post office porch (magnifier).",
   {"umbrella": {"x": 260, "y": 1120, "w": 300, "h": 260}, "feather": {"x": 1250, "y": 1250, "w": 240, "h": 140},
    "note": {"x": 900, "y": 820, "w": 220, "h": 140}, "paper": {"x": 1700, "y": 1180, "w": 260, "h": 180},
    "pollen": {"x": 560, "y": 760, "w": 240, "h": 160}},
   [{"asset": "minigame.umbrella-inverted", "target": "umbrella", "x": 260, "y": 1120, "w": 300, "h": 260},
    {"asset": "minigame.feather", "target": "feather", "x": 1250, "y": 1250, "w": 240, "h": 140},
    {"asset": "minigame.note-blank", "target": "note", "x": 900, "y": 820, "w": 220, "h": 140},
    {"asset": "minigame.newspaper-scrap", "target": "paper", "x": 1700, "y": 1180, "w": 260, "h": 180, "levels": [2, 3]},
    {"asset": "minigame.pollen", "target": "pollen", "x": 560, "y": 760, "w": 240, "h": 160, "levels": [3]}])
bg("bg.post-clock", "backgrounds/bg-post-clock-c1.png", "case02", "post-clock", "Post office clock (timeline, L2-L3).")
bg("bg.library-door", "backgrounds/library-entrance-c1.png", "case02", "library-door", "Quiet Burrow library door and the Shurshik mouse door with paper bunting.")
bg("bg.old-oak", "backgrounds/old-oak-c1.png", "case02", "old-oak", "Old Oak: nest high in the crown, hollow low among the roots (two clearly different places).",
   {"nest": {"x": 1680, "y": 40, "w": 340, "h": 300}, "hollow": {"x": 1520, "y": 680, "w": 260, "h": 280}})
bg("bg.town-square", "backgrounds/letters-exhibition-c1.png", "case02", "town-square", "Town square dressed for the Exhibition of Letters (case 2).")
bg("bg.lamp-booth", "backgrounds/lamp-booth-c1.png", "case02", "lamp-booth", "Firefly-lantern keeper's booth at dawn (L3).")
# Case 3
bg("bg.office-evening", "backgrounds/office-evening-c1.png", "case03", "office-evening", "The Office at dusk, warm lamps.")
bg("bg.honey-pond", "backgrounds/pond-shore-dusk-c1.png", "case03", "honey-pond", "Honey Pond at dusk, lighthouse across the water (hub).",
   {"room": {"x": 1420, "y": 50, "w": 140, "h": 200}, "door": {"x": 1400, "y": 250, "w": 320, "h": 250}, "sounds": {"x": 2180, "y": 680, "w": 150, "h": 320}, "fitilyok": {"x": 460, "y": 160, "w": 120, "h": 200}, "tracks": {"x": 500, "y": 760, "w": 580, "h": 240}, "log": {"x": 2160, "y": 440, "w": 170, "h": 200}, "mice": {"x": 560, "y": 1200, "w": 400, "h": 200}, "blink": {"x": 1100, "y": 640, "w": 100, "h": 120}})
bg("bg.pond-bank", "backgrounds/pond-shore-dusk-c2.png", "case03", "pond-bank", "Pond bank where the mice play the recording shell.")
bg("bg.lighthouse-door", "backgrounds/lighthouse-door-c1.png", "case03", "lighthouse-door", "Lighthouse door and Damka's boat with the patched oar and the chamomile.",
   {"paddle": {"x": 360, "y": 740, "w": 520, "h": 220}})
bg("bg.lighthouse-room", "backgrounds/lantern-room-c1.png", "case03", "lighthouse-room", "Lantern room at the top of the lighthouse (magnifier, timeline, signals).",
   {"cord": {"x": 1520, "y": 570, "w": 120, "h": 300}, "book": {"x": 250, "y": 650, "w": 280, "h": 150},
    "wax": {"x": 1700, "y": 960, "w": 220, "h": 110}, "window": {"x": 340, "y": 220, "w": 360, "h": 420},
    "tools": {"x": 1880, "y": 1130, "w": 260, "h": 200}, "closed-book": {"x": 250, "y": 650, "w": 280, "h": 150}},
   [{"asset": "minigame.shutter-cord", "target": "cord", "x": 1520, "y": 570, "w": 120, "h": 300},
    {"asset": "minigame.book-open-bookmark", "target": "book", "x": 250, "y": 650, "w": 280, "h": 150, "levels": [1, 2]},
    {"asset": "minigame.book-closed", "target": "closed-book", "x": 250, "y": 650, "w": 280, "h": 150, "levels": [3]},
    {"asset": "minigame.wax-drops", "target": "wax", "x": 1700, "y": 960, "w": 220, "h": 110},
    {"asset": "minigame.toolbox-dusty", "target": "tools", "x": 1880, "y": 1130, "w": 260, "h": 200, "levels": [2, 3]}])
bg("bg.lighthouse-stairs", "backgrounds/lighthouse-stairs-c1.png", "case03", "lighthouse-stairs", "Dusty lower steps of the lighthouse stairs (tracks).")
bg("bg.pond-night", "backgrounds/pond-shore-night-c1.png", "case03", "pond-night", "Pond shore at night for the «Азбука огоньков» finale.")
# Case 4
bg("bg.mayor-cellar", "backgrounds/cellar-c1.png", "case04", "mayor-cellar", "Town hall jam cellar, lit on every step (hub, dreams).",
   {"shelves": {"x": 940, "y": 360, "w": 420, "h": 600}, "mayor": {"x": 1760, "y": 640, "w": 240, "h": 320}, "tracks": {"x": 360, "y": 860, "w": 480, "h": 260}, "dreams": {"x": 2060, "y": 20, "w": 140, "h": 200}, "diary": {"x": 2060, "y": 860, "w": 260, "h": 240}, "kartofan": {"x": 1600, "y": 740, "w": 200, "h": 200}, "cart": {"x": 160, "y": 1180, "w": 240, "h": 320}})
bg("bg.mayor-cellar-entrance", "backgrounds/townhall-front-c2.png", "case04", "mayor-cellar-entrance", "Town hall with the little cellar door at the right (Kartofan at the entrance, L3).")
bg("bg.mayor-cellar-shelves", "backgrounds/bg-mayor-cellar-shelves-c1.png", "case04", "mayor-cellar-shelves", "Jam shelf close-up (magnifier).",
   {"jar-circles": {"x": 960, "y": 620, "w": 640, "h": 200}, "clean-floor": {"x": 700, "y": 1290, "w": 520, "h": 180},
    "cart-track": {"x": 1350, "y": 1290, "w": 520, "h": 180}, "patch": {"x": 1900, "y": 1300, "w": 200, "h": 150},
    "soil": {"x": 460, "y": 1300, "w": 220, "h": 150}},
   [{"asset": "minigame.jar-circles", "target": "jar-circles", "x": 960, "y": 620, "w": 640, "h": 200},
    {"asset": "minigame.track-narrow-star", "target": "cart-track", "x": 1350, "y": 1290, "w": 520, "h": 180},
    {"asset": "minigame.soil-clumps", "target": "soil", "x": 460, "y": 1300, "w": 220, "h": 150, "levels": [3]}])
bg("bg.cellar-steps", "backgrounds/bg-cellar-steps-c1.png", "case04", "cellar-steps", "Dusty bottom steps of the cellar (tracks).")
bg("bg.office-pantry", "backgrounds/office-pantry-c1.png", "case04", "office-pantry", "Pantry under the Office stairs with twelve jars and a note.")
bg("bg.office-diary", "backgrounds/office-evening-c2.png", "case04", "office-diary", "Watsoni's desk in the evening (diary timeline).")
bg("bg.mayor-yard-carts", "backgrounds/townhall-front-c1.png", "case04", "mayor-yard-carts", "Town hall yard with soft earth for wheel tracks (L3 whose cart).")
bg("bg.town-square-tea", "backgrounds/tea-square-c1.png", "case04", "tea-square", "Town square laid for the Big Tea Party (case 4).")
bg("bg.dream-mist", "backgrounds/dream-mist-c1.png", "case04", "dream-mist", "Misty lantern backdrop for dream cards.")

# Dream cards (case 4); C's ids; shared images where the description is the same.
dream = {
    "l1": {"door-stairs": "dream-door-stairs", "magnifier-sign": "dream-magnifier-sign", "old-umbrellas": "dream-old-umbrellas",
           "jars-ribbons": "dream-jars-bows", "jubilee-flag": "dream-jubilee-flag", "exclamation-note": "dream-note-exclaim",
           "soap-bubbles": "dream-bubbles", "muzzle-stripes": "dream-stripes", "detective-hat": "dream-detective-hat"},
    "l2": {"umbrellas-corner": "dream-old-umbrellas", "narrow-door": "dream-narrow-door", "stairs-overhead": "dream-stairs-overhead",
           "ribbon": "dream-ribbon", "jubilee-flag": "dream-jubilee-flag", "exclamation-note": "dream-note-exclaim",
           "bubble": "dream-bubble", "detective-hat": "dream-detective-hat", "muzzle-stripes": "dream-stripes"},
    "l3": {"umbrella-smell": "dream-umbrella-smell", "mouse-door": "dream-mouse-door", "creaking-stairs": "dream-creaking-stairs",
           "tied-ribbon": "dream-tied-ribbon", "circled-calendar": "dream-circled-calendar", "hush-finger": "dream-hush-finger",
           "bubble": "dream-bubble", "magnifier": "dream-magnifier", "office-key": "dream-office-key"},
}
for lv, cards in dream.items():
    for cid, master in cards.items():
        P[f"dream.c4.{lv}.{cid}"] = {"master": f"cards/{master}.png", "pack": "case04", "kind": "minigame", "size": 768,
                                    "dir": "case04/dreams", "file": f"{lv}.{cid}", "opaque": True,
                                    "notes": "Private dream card (D16, T31)."}


def prop(pid, master, pack, size=512, kind="minigame", d="props", **kw):
    P[pid] = {"master": master, "pack": pack, "kind": kind, "size": size, "dir": d, "notes": "", **kw}


for n in ["umbrella-inverted", "note-blank", "newspaper-scrap", "pollen", "smell-nuts", "smell-seeds", "smell-leaves",
          "smell-honey-wax", "smell-twigs", "place-library", "place-office", "place-townhall", "place-lodge", "place-burrow",
          "place-booth", "place-nest", "place-lighthouse"]:
    prop(f"minigame.{n}", f"props/{n}.png", "case02")
for n in ["tl2-0730", "tl2-0800", "tl2-0830", "tl2-0900", "tl2-0930"]:
    prop(f"minigame.{n}", f"cards/{n}.png", "case02", 640, opaque=True)
for n in ["shutter-cord", "book-open-bookmark", "book-closed", "wax-drops", "toolbox-dusty", "logbook", "shell-recorder",
          "mice-drawing", "fp-owl", "fp-firefly", "fp-beaver"]:
    prop(f"minigame.{n}", f"props/{n}.png", "case03")
for n in ["log3-1900", "log3-2000", "log3-2030", "log3-2100", "log3-2200"]:
    prop(f"minigame.{n}", f"cards/{n}.png", "case03", 640, opaque=True)
for n in ["jar-circles", "cart-office", "cart-kartofan", "jam-jar-bow", "jam-rosette", "tea-table", "samovar", "diary-good-deeds",
          "fp-badger", "fp-hedgehog", "track-narrow-star", "track-wide"]:
    prop(f"minigame.{n}", f"props/{n}.png", "case04", 640 if n.startswith("track") else 512)
for n in ["diary4-count", "diary4-mayor", "diary4-cart", "diary4-knit", "diary4-potato"]:
    prop(f"minigame.{n}", f"cards/{n}.png", "case04", 640, opaque=True)
prop("compare.c4.cart-track", "props/track-narrow-star.png", "case04", 640)
for n, pack in [("badge-letters-saved", "case02"), ("badge-lighthouse-light", "case03"), ("badge-honest-jam", "case04"),
                ("sticker-letters", "case02"), ("sticker-lighthouse", "case03"), ("sticker-jam", "case04"),
                ("rank-assistant", "case02"), ("rank-junior", "case04")]:
    prop(f"reward.{n}", f"props/{n}.png", pack, 512)
prop("reward.cipher-poster", "props/cipher-poster.png", "case02", 1200)
# Cozy day (T28/T29): decor, hats, scarf patterns.
for n, cid in [("decor-geranium", "decor.geranium"), ("decor-star-lamp", "decor.firefly-lamp"), ("rug-daisy", "decor.rug-daisy"),
               ("trophy-shelf", "decor.trophy-shelf"), ("decor-lantern-garland", "decor.lantern-garland"),
               ("decor-town-painting", "decor.town-painting"), ("decor-cuckoo-clock", "decor.cuckoo-clock"),
               ("decor-honey-shelf", "decor.honey-shelf"), ("decor-teaset", "decor.teaset"), ("decor-armchair", "decor.armchair"),
               ("decor-bookstack", "decor.bookstack"), ("decor-rug", "decor.rug-patchwork")]:
    prop(cid, f"props/{n}.png", "cozy", 512, kind="ui", d="cozy/decor", file=cid.split(".", 1)[1])
for k in ("stripes", "dots", "hearts", "stars"):
    prop(f"scarf.pattern.{k}", f"props/scarf-pattern-{k}.png", "shell", 256, kind="avatar-layer", d="avatar/scarf-patterns",
         file=k, notes="Tileable cream overlay drawn inside the scarf mask over the tint.")
    prop(f"scarf.pattern.{k}.swatch", f"props/scarf-pattern-{k}-swatch.png", "cozy", 256, kind="ui", d="cozy/swatches", file=k)
for n in ("hat-bobble", "hat-captain", "hat-flower-crown", "hat-top"):
    P[f"avatar.{n}"] = {"master": f"props/{n}.png", "pack": "shell", "kind": "avatar-layer", "size": 320, "dir": "avatar/hats",
                        "notes": "Hat layer; attach at the avatar rig's hat slot."}

CAT.write_text(json.dumps(c, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")
print(len(B), "backgrounds,", len(P), "props")
