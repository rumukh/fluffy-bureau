"""Case 2 vector art: cipher buttons, street icons, envelopes and the cipher poster frame pieces (R01, D17).

python tools/assets/art/cipher_kit.py

Writes assets/case02/cipher/:
  button-<color>-<holes>-<shape>.svg   every combination of 4 colours x 1-4 holes x 4 shapes (64 files)
  street-pirogovaya.svg (honeycomb), street-parkovaya.svg (leaf)
  envelope.svg (blank address area for an overlaid button), envelope-sealed.svg
  index.json describing the combinations and their accessible names.
Buttons differ by hole count and shape as well as colour, so the cipher reads without colour vision (Q10, R01).
"""
from __future__ import annotations

import json
import math
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
OUT = REPO / "assets/case02/cipher"
INK = "#4a3426"
COLORS = {  # name (as in content/case02/mechanics.ts): (fill, rim, Russian name)
    "honey": ("#e8b04a", "#c98d2a", "медовая"),
    "blue": ("#8fb3dc", "#5b7fa8", "голубая"),
    "rose": ("#d99a9a", "#b5686d", "розовая"),
    "green": ("#8fae86", "#5f7f58", "зелёная"),
}
SHAPES = {"circle": "круглая", "square": "квадратная", "flower": "цветок", "heart": "сердечко"}
HOLES = {1: "одна дырочка", 2: "две дырочки", 3: "три дырочки", 4: "четыре дырочки"}


def outline(shape: str) -> str:
    if shape == "circle":
        return '<circle cx="48" cy="48" r="40"/>'
    if shape == "square":
        return '<rect x="10" y="10" width="76" height="76" rx="18"/>'
    if shape == "flower":
        petals = "".join(f'<circle cx="{48 + 22 * math.cos(a):.1f}" cy="{48 + 22 * math.sin(a):.1f}" r="20"/>'
                         for a in (i * math.pi / 3 for i in range(6)))
        return petals + '<circle cx="48" cy="48" r="26"/>'
    # heart
    return '<path d="M48 84C30 70 10 56 10 34c0-12 9-22 21-22 8 0 14 4 17 10 3-6 9-10 17-10 12 0 21 10 21 22 0 22-20 36-38 50z"/>'


def holes(n: int, shape: str) -> str:
    cy = 50 if shape == "heart" else 48
    pts = {1: [(48, cy)], 2: [(38, cy), (58, cy)], 3: [(48, cy - 11), (38, cy + 7), (58, cy + 7)],
           4: [(38, cy - 10), (58, cy - 10), (38, cy + 10), (58, cy + 10)]}[n]
    return "".join(f'<circle cx="{x}" cy="{y}" r="5.5" fill="{INK}"/>' for x, y in pts)


def button(color: str, n: int, shape: str) -> str:
    fill, rim, _ = COLORS[color]
    body = outline(shape)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">'
            f'<g fill="{rim}" stroke="{INK}" stroke-width="4" stroke-linejoin="round">{body}</g>'
            f'<g fill="{fill}" transform="translate(48 48) scale(0.8) translate(-48 -48)">{body}</g>'
            f'<g fill="#ffffff" opacity="0.35" transform="translate(40 36) scale(0.25) translate(-48 -48)">{body}</g>'
            f'{holes(n, shape)}</svg>\n')


def honeycomb() -> str:
    cells = []
    for cx, cy in ((48, 30), (32, 58), (64, 58)):
        pts = " ".join(f"{cx + 16 * math.cos(math.pi / 3 * i + math.pi / 6):.1f},{cy + 16 * math.sin(math.pi / 3 * i + math.pi / 6):.1f}"
                       for i in range(6))
        cells.append(f'<polygon points="{pts}" fill="#e8b04a" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">{"".join(cells)}</svg>\n'


def leaf() -> str:
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">'
            f'<path d="M20 76C20 40 44 16 80 16c0 36-24 60-60 60z" fill="#8fae86" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>'
            f'<path d="M22 74C40 56 56 40 72 26" fill="none" stroke="{INK}" stroke-width="4" stroke-linecap="round"/></svg>\n')


def envelope(sealed: bool) -> str:
    seal = (f'<circle cx="120" cy="92" r="16" fill="#b5686d" stroke="{INK}" stroke-width="3"/>'
            f'<circle cx="120" cy="92" r="8" fill="none" stroke="#fbf3e2" stroke-width="2"/>') if sealed else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="240" height="160">'
            f'<rect x="6" y="6" width="228" height="148" rx="14" fill="#fbf3e2" stroke="{INK}" stroke-width="4"/>'
            f'<path d="M10 14l110 78 110-78" fill="none" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>'
            f'<rect x="150" y="104" width="72" height="40" rx="10" fill="#ffffff" stroke="#c98d2a" stroke-width="3" stroke-dasharray="6 5"/>'
            f'{seal}</svg>\n')


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    combos = []
    for c in COLORS:
        for n in HOLES:
            for s in SHAPES:
                name = f"button-{c}-{n}-{s}"
                (OUT / f"{name}.svg").write_text(button(c, n, s), encoding="utf-8", newline="\n")
                combos.append({"id": name, "color": c, "holes": n, "shape": s,
                               "label": f"{COLORS[c][2]} пуговица, {SHAPES[s]}, {HOLES[n]}"})
    (OUT / "street-pirogovaya.svg").write_text(honeycomb(), encoding="utf-8", newline="\n")
    (OUT / "street-parkovaya.svg").write_text(leaf(), encoding="utf-8", newline="\n")
    (OUT / "envelope.svg").write_text(envelope(False), encoding="utf-8", newline="\n")
    (OUT / "envelope-sealed.svg").write_text(envelope(True), encoding="utf-8", newline="\n")
    idx = {"format": "fluffy-cipher-kit", "schema": 1, "buttons": combos,
           "streets": {"pirog": {"icon": "street-pirogovaya.svg", "shapes": ["circle", "flower"], "label": "Пироговая улица — соты"},
                       "park": {"icon": "street-parkovaya.svg", "shapes": ["square", "heart"], "label": "Парковая улица — листик"}},
           "envelope": {"file": "envelope.svg", "sealed": "envelope-sealed.svg",
                        "addressBox": {"x": 150, "y": 104, "w": 72, "h": 40}}}
    (OUT / "index.json").write_text(json.dumps(idx, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    print(len(combos), "buttons")


if __name__ == "__main__":
    main()
