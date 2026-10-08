"""Prompts and jobs for C's Stage 2 asset requests (docs/content/ASSET_REQUESTS.md at e4f11fb) not yet covered.

python tools/assets/art/stage2_jobs_c.py <jobs.json>
"""
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
R = Path("F:/AI/GameAssets/fluffy-bureau")
STYLE = R / "style/style_office_v1-c2.png"
P = REPO / "tools/assets/art/prompts/s2c"
P.mkdir(parents=True, exist_ok=True)
NOCOPY = "Do not copy anything from Image 1 except its painting style."
OBJ = ("Single isolated object for a children's picture-book game, centered, fully visible with generous margin, on a fully "
       "transparent background, no ground shadow, no text, no letters, no numbers. Soft hand-painted gouache and watercolor "
       "style, soft dark-brown outlines (never black), rounded friendly shapes, palette honey yellow, sage green, dusty rose, "
       "cream and warm browns, warm light. Image 1 is the style authority. " + NOCOPY)
DREAM = ("Square dream card for a children's picture-book game: the picture floats inside a soft round cloud of lilac, honey "
         "and rose mist with tiny stars, dreamy soft-focus edges, gentle glow, calm and magical, never scary, no text, no "
         "letters. Show only the described subject, no room, no furniture, no window unless described. Soft gouache and "
         "watercolor style. Image 1 is the style authority. " + NOCOPY)
BG = ("Medium: soft hand-painted 2D children's picture-book illustration, gouache and watercolor texture, soft dark-brown "
      "outlines (never black), rounded shapes everywhere. Palette: honey yellow, sage green, dusty rose, cream, warm browns; "
      "warm golden light, soft shadows, calm and safe, never scary. Image 1 is the STYLE AUTHORITY for rendering, line, "
      "texture, palette and light. Wide 16:10 landscape game background. Keep every important object inside the central 82 "
      "percent of the width and 90 percent of the height. No characters, no animals, no people, no text, no letters, no "
      "numbers, no watermark.")
jobs = []


def job(jid, text, base, size="1024x1024", transparent=True, quality="medium", count=1, sub="props", refs=()):
    f = P / f"{jid}.txt"
    f.write_text(text + "\n" + base, encoding="utf-8")
    j = {"id": jid, "prompt_file": str(f), "out": str(R / sub / f"{jid}.png"), "size": size, "quality": quality,
         "refs": [str(STYLE)] + [str(r) for r in refs], "count": count}
    if transparent:
        j["background"] = "transparent"
    jobs.append(j)


for jid, text in {
    "post-office": "Interior of the little round post office: a wooden counter with a brass bell and a cubby-hole wall of letter slots behind it, parcels tied with string, a big round window; on the left wall hangs a large framed chart of many different colored buttons pinned in rows (button shapes only, no letters, no writing), a clock on the wall, a moss rug, the clockwork postal beetle resting on the counter. Leave open floor in front of the counter.",
    "post-clock": "Close-up of a round brass post office wall clock with a cream dial with simple round dot markers instead of numerals and two hands, set in a carved honey-wood frame with a little envelope ornament on top, a few loose cream cards scattered on a wooden shelf below it. Front view, centered.",
    "cellar-steps": "The bottom of a long curving stone staircase in a cellar, seen from below: a firefly lantern glows on every step, the lowest three wide steps and the smooth floor in front of them are covered with an even layer of pale fine dust, ready for footprints; jam shelves at the edges, a vaulted brick ceiling. Warm and brightly lit everywhere, cozy, never dark.",
    "mayor-cellar-shelves": "Close-up of a long wooden shelf in a jam cellar, front view at child eye level: rows of jam jars with cloth lids on the upper shelves catching warm light, the middle shelf in the center is partly empty and dusty with a smooth clear area, below it a clean swept stone floor with a little clear space; firefly lanterns hang at both sides. Warm, bright, cozy.",
}.items():
    job(f"bg-{jid}", text, BG, size="2560x1600", transparent=False, quality="high", count=2, sub="backgrounds")

for jid, text in {
    "dream-narrow-door": "A tall narrow wooden door, slightly open.",
    "dream-stairs-overhead": "Wooden stair steps seen from directly below them, the underside of a staircase overhead.",
    "dream-ribbon": "A single dusty-rose ribbon bow.",
    "dream-bubble": "A single big iridescent soap bubble.",
    "dream-umbrella-smell": "An old folded umbrella with soft wavy scent lines rising from it, as if smelling dusty and old.",
    "dream-mouse-door": "A tiny round door, the size of a mouse, with a button doorknob.",
    "dream-creaking-stairs": "Wooden stair steps with little curved creak lines drawn above them, as if they squeak.",
    "dream-tied-ribbon": "A ribbon tied in a neat bow around the neck of a jar, only the jar neck and ribbon visible.",
    "dream-circled-calendar": "A small wall calendar page with a grid of empty squares, one square circled in red, no numbers.",
    "dream-hush-finger": "A furry paw with one finger raised to a smiling muzzle in a gentle 'shh' gesture, only paw and muzzle.",
    "dream-magnifier": "A brass magnifying glass.",
    "dream-office-key": "An old brass door key with a paw-print bow.",
}.items():
    job(jid, text, DREAM, transparent=False, sub="cards")

for jid, text in {
    "dry-letters": "A neat stack of dry cream envelopes and letters tied with a twine bow, a magpie feather tucked under the twine.",
    "letter-garland": "A long string hanging in a gentle curve with many cream envelopes and illustrated letters pegged on it with little wooden clothes pegs, wide horizontal composition.",
    "chamomile-note": "A small chamomile flower with white petals and a yellow center tied with a thin string loop, as if it was tied to something.",
    "empty-jam-jar": "An empty clean glass jam jar without a lid, a few berry-colored smudges at the bottom.",
    "fact-cards": "Three cream illustrated fact cards fanned out, each with a small picture (a firefly, a bat, an owl) and a little 'true' check seal, no text.",
    "firefly-lantern": "A handheld brass and glass firefly lantern with a round wooden handle, a few gently glowing fireflies inside.",
    "jam-jars-group": "Twelve jam jars with cloth lids tied with dusty-rose ribbon bows, arranged in two neat rows of six on a wooden board, front view.",
    "note-khvosts": "A small folded cream paper note decorated with a doodle of soap bubbles and a badger paw print, no words.",
    "notebook-secret": "An open detective notebook with a sage cover lying flat; the left page has a small pressed chamomile flower, the right page has two empty dotted frames, no writing.",
    "paddle-repaired": "A single wooden rowing oar with a fresh cloth patch bound around the blade and a small white chamomile flower tied to it with string, diagonal.",
    "tea-table-long": "A long wooden festive table with a sage and rose tablecloth, a gleaming copper samovar in the middle, teacups, plates of pastries and jam jars with bows, three-quarter front view, wide horizontal composition.",
    "trophy-shelf": "A small wooden wall shelf for awards with little brass cups and empty spaces, carved paw-print brackets.",
    "rug-daisy": "A round cream knitted rug with a big daisy flower pattern in white and honey with sage leaves, seen from above at a slight angle.",
    "cipher-board": "An empty wooden notice board in a carved honey-wood frame with a cream paper sheet pinned at the corners with buttons, the sheet blank, front view.",
}.items():
    job(jid, text, OBJ)

Path(sys.argv[1]).write_text(json.dumps(jobs, ensure_ascii=False, indent=1), encoding="utf-8")
print(len(jobs), "jobs")
