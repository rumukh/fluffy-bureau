"""Write prompt files and a gen_batch jobs file for Stage 2 (cases 2-4) props, cards and minigame art.

python tools/assets/art/stage2_jobs.py <jobs.json>
"""
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
R = Path("F:/AI/GameAssets/fluffy-bureau")
STYLE = R / "style/style_office_v1-c2.png"
P = REPO / "tools/assets/art/prompts/s2"
P.mkdir(parents=True, exist_ok=True)

OBJ = ("Single isolated object for a children's picture-book game, centered, fully visible with generous margin, on a fully "
       "transparent background, no ground shadow, no text, no letters, no numbers. Soft hand-painted gouache and watercolor "
       "style, soft dark-brown outlines (never black), rounded friendly shapes, palette honey yellow, sage green, dusty rose, "
       "cream and warm browns, warm light. Image 1 is the style authority.")
CARD = ("Square illustrated story card for a children's picture-book game: a small vignette scene on a soft cream paper "
        "background with a rounded soft edge, no frame, no text, no numbers, no clock face. Soft gouache and watercolor style, "
        "soft dark-brown outlines, honey, sage and dusty-rose palette, warm light. Image 1 is the style authority.")
DREAM = ("Square dream card for a children's picture-book game: the picture floats inside a soft round cloud of lilac, honey "
         "and rose mist with tiny stars, dreamy soft-focus edges, gentle glow, calm and magical, never scary, no text, no "
         "letters. Soft gouache and watercolor style, soft outlines. Image 1 is the style authority.")
PRINT = ("A single clear footprint seen from directly above, pressed into soft pale dust on wooden floor, drawn in soft brown "
         "tones, on a transparent background, centered, large, no text.")

SHEETS = {k: R / f"characters/sheet_{v}-c1.png" for k, v in {
    "khvosts": "khvosts", "watsony": "vatsoni", "pudding": "puding", "tyopa": "tyopa", "stella": "stella",
    "kartofan": "kartofan", "damka": "damka", "mice": "shurshiki", "fitilyok": "fitilyok", "pukhlik": "pukhlik"}.items()}

jobs = []


def job(jid, text, base, size="1024x1024", refs=(), transparent=True, quality="medium", count=1, sub="props"):
    f = P / f"{jid}.txt"
    ids = ", ".join(f"Image {i + 2} is the identity authority for {name}; keep the exact design"
                    for i, name in enumerate(n for n, _ in refs))
    f.write_text((text + (" " + ids + "." if ids else "") + "\n" + base).strip(), encoding="utf-8")
    j = {"id": jid, "prompt_file": str(f), "out": str(R / sub / f"{jid}.png"), "size": size, "quality": quality,
         "refs": [str(STYLE)] + [str(p) for _, p in refs], "count": count}
    if transparent:
        j["background"] = "transparent"
    jobs.append(j)


C = lambda *names: [(n, SHEETS[n]) for n in names]  # noqa: E731

# Dream cards (D16, case 4 solo and family).
for jid, text in {
    "dream-door-stairs": "A tiny rounded wooden door under a wooden staircase, slightly open, little warm lights twinkling behind it.",
    "dream-magnifier-sign": "A hanging wooden sign above a doorway carved with a brass magnifying glass emblem, no letters.",
    "dream-old-umbrellas": "A few old folded umbrellas, including a red toadstool umbrella, leaning in a cozy corner.",
    "dream-jars-bows": "A row of jam jars with ribbon bows on a wooden shelf, glowing softly.",
    "dream-jubilee-flag": "A single festive triangular jubilee flag on a string with a little star, fluttering.",
    "dream-note-exclaim": "A small folded paper note with only one big exclamation mark drawn on it, no other marks.",
    "dream-bubbles": "Many iridescent soap bubbles floating upward.",
    "dream-stripes": "Soft black and white stripes like a badger's face markings, abstract and gentle, filling the cloud.",
    "dream-detective-hat": "A honey-brown tweed deerstalker detective hat, floating.",
}.items():
    job(jid, text, DREAM, transparent=False, sub="cards")

# Timeline cards, case 2 (L2/L3).
for jid, text, cast in [
    ("tl2-0730", "At early dawn the firefly magician Fitilyok yawns, puts out the street lanterns one by one and flies off home to sleep.", C("fitilyok")),
    ("tl2-0800", "The beaver Damka walks along the path toward the pond carrying a big armful of tree bark, no letters.", C("damka")),
    ("tl2-0830", "The hamster mayor Pudding sets down a big postal bag full of letters on the porch of the little post office and walks away.", C("pudding")),
    ("tl2-0900", "A gust of wind lifts the postal bag off the empty post office porch, leaves and letters swirling, no characters.", ()),
    ("tl2-0930", "Grey-blue rain clouds gather over the little town and the first raindrops begin to fall, cozy not scary, no characters.", ()),
]:
    job(jid, text, CARD, refs=cast, transparent=False, sub="cards")

# Keeper's logbook sheets, case 3 (L2/L3): a sheet of lined paper with a small drawing, no writing.
SHEET = ("Drawn as a loose sheet of a keeper's logbook: cream lined paper with a soft torn edge and a small hand-drawn colored "
         "pencil illustration in the middle, no writing, no letters, no numbers. " + CARD)
for jid, text, cast in [
    ("log3-1900", "The beaver Damka locks the lighthouse door with a big key at dusk and heads home.", C("damka")),
    ("log3-2000", "Street lanterns light up one by one along the pond shore in the evening.", ()),
    ("log3-2030", "The raccoon Tyopa puts out the small fire under his soap cauldron on the pond shore in the evening.", C("tyopa")),
    ("log3-2100", "The lantern at the top of the lighthouse blinks on and off at night, little rays drawn around it.", ()),
    ("log3-2200", "A view from the round window of a cozy beaver lodge at night: across the water the lighthouse top blinks.", ()),
]:
    job(jid, text, SHEET, refs=cast, transparent=False, sub="cards")

# Diary pages, case 4 (L2/L3): Watsoni's Diary of Good Deeds.
PAGE = ("Drawn as a page from a hedgehog doctor's Diary of Good Deeds: cream paper with a dusty-rose ribbon edge and a little "
        "colored pencil doodle, no writing, no letters, no numbers. " + CARD)
for jid, text, cast in [
    ("diary4-count", "Two little mice proudly count a row of twelve jam jars on a shelf.", C("mice")),
    ("diary4-mayor", "The hamster mayor wags a finger kindly beside jam jars: the jam waits for the jubilee.", C("pudding")),
    ("diary4-cart", "The badger Khvosts walks away at evening pulling a little wooden cart with jars, the path fades into blank paper.", C("khvosts")),
    ("diary4-knit", "The hedgehog doctor Watsoni knits colorful scarves at home in an armchair by a lamp in the evening.", C("watsony")),
    ("diary4-potato", "In daylight the mole Kartofan leaves a sack of potatoes at a doorstep with his wide-wheeled cart.", C("kartofan")),
]:
    job(jid, text, PAGE, refs=cast, transparent=False, sub="cards")

# Magnifier targets and clue props.
for jid, text in {
    "umbrella-inverted": "A red toadstool umbrella with white spots blown inside-out by the wind, lying on its side.",
    "note-blank": "A small creased paper note, blank, slightly crumpled, cream paper.",
    "newspaper-scrap": "A torn scrap of an old newspaper with only wavy grey lines instead of text, a little paper flag cut from it.",
    "pollen": "A small sprinkle of glowing golden firefly lantern pollen dust on the ground, soft sparkles.",
    "shutter-cord": "A soft braided cord with a wooden toggle hanging from a brass lantern shutter hinge.",
    "book-open-bookmark": "An open picture book lying flat with a ribbon bookmark, pages showing rows of little dots and dashes drawn as lights, no letters.",
    "book-closed": "A closed small book with a honey cover decorated with a little lighthouse and dots and dashes of light, no letters.",
    "wax-drops": "A few small drops of honey-colored candle wax on a wooden windowsill.",
    "toolbox-dusty": "A small wooden toolbox with a hammer and a wrench, covered in a thin layer of pale dust and a cobweb-free cloth.",
    "jar-circles": "Seen from directly above: a dusty wooden shelf with four clean round circles in the dust where jars used to stand.",
    "cart-office": "A small wooden hand cart with two narrow wheels; one wheel has a little star-shaped patch, three-quarter view.",
    "cart-kartofan": "A sturdy garden hand cart with two wide wheels without patches, a few potatoes inside, three-quarter view.",
    "jam-jar-bow": "A single jar of blueberry jam with a cloth lid tied with a dusty-rose ribbon bow.",
    "jam-rosette": "A small round glass jam dish (rosette) with a spoonful of berry jam.",
    "tea-table": "A small round wooden table with a lace cloth, empty, three-quarter view from above.",
    "samovar": "A gleaming round copper samovar with a little teapot on top and honey-caramel embers glowing at its base.",
    "logbook": "A keeper's logbook lying open on a wooden desk with a pencil, pages with pencil sketches only, no writing.",
    "diary-good-deeds": "A hedgehog doctor's notebook 'Diary of Good Deeds' with a dusty-rose cover, a little heart and a feather quill, closed.",
    "shell-recorder": "A pearly spiral seashell with a tiny brass horn and a little dial, a magical sound-recording shell.",
    "mice-drawing": "A child's crayon drawing on a scrap of paper: a little lighthouse with two short light dots and one long dash beside it.",
    "smell-nuts": "A small heap of hazelnuts with a soft wavy scent line above.",
    "smell-seeds": "A small heap of sunflower seeds with a soft wavy scent line above.",
    "smell-leaves": "A few oak leaves with a soft wavy scent line above.",
    "smell-honey-wax": "A round honey-colored sealing wax seal and a little honey drip, with a soft wavy scent line above.",
    "smell-twigs": "A small bundle of thin twigs tied with grass, with a soft wavy scent line above.",
}.items():
    job(jid, text, OBJ)

# Footprints and wheel tracks.
for jid, text in {
    "fp-owl": "An owl footprint: two toes pointing forward and two toes pointing back like an X, small and light.",
    "fp-firefly": "The tiniest firefly footprints: six minute dots in two rows, barely visible, with a faint glow.",
    "fp-beaver": "A beaver hind footprint: a big webbed foot with five toes joined by webbing.",
    "fp-badger": "A badger footprint: a broad pad with five toes in a row and five long claw marks in front.",
    "fp-hedgehog": "A hedgehog footprint: a small hand-like print with five thin toes.",
    "track-narrow-star": "Seen from directly above: a narrow wheel track in soft earth, a straight thin groove, with a small star shape pressed into it every so often.",
    "track-wide": "Seen from directly above: a wide wheel track in soft earth, a broad smooth groove without marks.",
}.items():
    job(jid, text, PRINT if jid.startswith("fp-") else OBJ)

# Postman houses for the minigame (residents' homes), same style as the existing place-* cards.
for jid, text in {
    "place-library": "The Quiet Burrow library: a round door in a grassy hill with a carved open-book emblem, standalone building icon.",
    "place-office": "The detective bureau cottage with a round window and a magnifying-glass sign, standalone building icon.",
    "place-townhall": "The little town hall with a clock tower and a flag, standalone building icon.",
    "place-lodge": "The beaver Damka's cozy log lodge by the water with a round window, standalone building icon.",
    "place-burrow": "The Shurshik mouse family's tiny round burrow door under a flowering bush, standalone icon.",
    "place-booth": "A tiny round firefly-lantern keeper's booth with a domed lantern roof, standalone building icon.",
    "place-nest": "A round magpie nest with a domed roof of twigs high in an oak branch, standalone icon.",
    "place-lighthouse": "A slim cream-and-honey striped lighthouse on a little rock, standalone icon.",
}.items():
    job(jid, text, OBJ)

# Rewards (badges, stickers) for cases 2-4 and ranks (D12).
for jid, text in {
    "badge-letters-saved": "A paw-shaped golden badge with a little envelope with a wax seal engraved in the center pad, sage enamel toe pads, short dusty-rose ribbon.",
    "badge-lighthouse-light": "A paw-shaped golden badge with a tiny glowing lighthouse engraved in the center pad, sage enamel toe pads, short dusty-rose ribbon.",
    "badge-honest-jam": "A paw-shaped golden badge with a little jam jar with a bow engraved in the center pad, sage enamel toe pads, short dusty-rose ribbon.",
    "sticker-letters": "A round die-cut vinyl sticker: a cheerful envelope with a magpie feather and a button, cream background, white border, no text.",
    "sticker-lighthouse": "A round die-cut vinyl sticker: a little lighthouse sending light dots to a smiling owlet, cream background, white border, no text.",
    "sticker-jam": "A round die-cut vinyl sticker: a jam jar with a bow next to a teacup, cream background, white border, no text.",
    "rank-assistant": "A round brass rank medal with a single star above a paw print, sage ribbon, for an assistant detective, no text.",
    "rank-junior": "A round brass rank medal with two stars above a paw print and a tiny magnifying glass, honey ribbon, for a junior detective, no text.",
    "poster-cipher-frame": "An empty wooden picture frame with a cream paper poster inside, blank, with small buttons pinned at the corners, for the office wall.",
}.items():
    job(jid, text, OBJ, quality="high")

# Shop: hats (T29) and office decorations.
for jid, text in {
    "hat-bobble": "A small child-size knitted bobble hat in honey and cream stripes, front view, no head inside.",
    "hat-captain": "A small child-size sailor captain cap in cream with a sage band and a tiny anchor badge, front view, no head inside.",
    "hat-flower-crown": "A small child-size flower crown of daisies and dusty-rose blossoms with sage leaves, front view, no head inside.",
    "hat-top": "A small child-size little top hat in dusty rose with a honey ribbon, front view, no head inside.",
    "decor-geranium": "A clay pot with a flowering dusty-rose geranium, for decorating a room.",
    "decor-lantern-garland": "A string of small glowing firefly paper lanterns in honey, sage and rose, gentle curve, wide.",
    "decor-rug": "A round patchwork rug in honey, sage and rose patches, seen from above at a slight angle.",
    "decor-town-painting": "A framed little painting of the round animal town with a lighthouse, honey wooden frame.",
    "decor-cuckoo-clock": "A carved wooden cuckoo clock with a little bird, round face with dots instead of numbers.",
    "decor-honey-shelf": "A small wall shelf with three honey jars and a tiny plant.",
    "decor-star-lamp": "A little star-shaped table lamp glowing warmly on a round wooden base.",
    "decor-teaset": "A cozy teapot with two cups and a plate of cookies on a tray.",
    "decor-armchair": "A soft round armchair in sage velvet with a dusty-rose cushion.",
    "decor-bookstack": "A tidy stack of rounded storybooks with a tiny potted fern on top.",
}.items():
    job(jid, text, OBJ)

Path(sys.argv[1]).write_text(json.dumps(jobs, ensure_ascii=False, indent=1), encoding="utf-8")
print(len(jobs), "jobs")
