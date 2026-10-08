"""Generate the Fluffy Bureau SVG UI kit (icons, stickers, buttons, panels) into assets/ui.

python tools/assets/art/ui_kit.py

Hand-authored vector shapes in the art-bible palette. Icons use a 96x96 viewBox, a 6 px
dark-brown outline and rounded joins so they read at 48 px and stay crisp at 200% text.
Stickers differ by shape as well as colour (Q10, R01): ✔ round seal, ✖ rounded square, ? cloud.
"""
from __future__ import annotations

from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
OUT = REPO / "assets/ui"

INK = "#4a3426"      # outline, text-grade dark brown (contrast 11.8:1 on cream)
CREAM = "#fbf3e2"
HONEY = "#e8b04a"
HONEY_D = "#c98d2a"
SAGE = "#8fae86"
SAGE_D = "#5f7f58"
ROSE = "#d99a9a"
ROSE_D = "#b5686d"
BERRY = "#5b5f9e"
WHITE = "#fffaf0"

S = f'stroke="{INK}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"'


def svg(body: str, size: int = 96, w: int | None = None, h: int | None = None) -> str:
    w = w or size
    h = h or size
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
            f"{body}</svg>\n")


ICONS = {
    "ear": f'<path d="M30 40c0-14 10-24 22-24s22 10 22 24c0 10-6 15-11 19-4 3-5 6-5 10 0 7-5 12-12 12-6 0-10-3-12-8" fill="{ROSE}" {S}/>'
           f'<path d="M44 44c0-6 4-10 9-10s9 4 9 9c0 4-3 6-5 8" fill="none" {S}/>'
           f'<path d="M78 30c4 5 6 10 6 16M84 22c6 7 9 15 9 24" fill="none" stroke="{HONEY_D}" stroke-width="5" stroke-linecap="round"/>',
    "replay": f'<path d="M24 48a24 24 0 1 0 8-18" fill="none" {S}/><path d="M18 18l14 12-16 6z" fill="{HONEY}" {S}/>'
              f'<circle cx="48" cy="48" r="8" fill="{HONEY}" {S}/>',
    "pause": f'<circle cx="48" cy="48" r="36" fill="{SAGE}" {S}/><rect x="34" y="30" width="10" height="36" rx="4" fill="{CREAM}" {S}/>'
             f'<rect x="52" y="30" width="10" height="36" rx="4" fill="{CREAM}" {S}/>',
    "play": f'<circle cx="48" cy="48" r="36" fill="{SAGE}" {S}/><path d="M40 30l26 18-26 18z" fill="{CREAM}" {S}/>',
    "lamp": f'<path d="M36 22h24l6 10H30z" fill="{HONEY_D}" {S}/><rect x="30" y="32" width="36" height="36" rx="14" fill="{HONEY}" {S}/>'
            f'<circle cx="42" cy="46" r="4" fill="{WHITE}"/><circle cx="54" cy="54" r="3" fill="{WHITE}"/><circle cx="50" cy="42" r="2.5" fill="{WHITE}"/>'
            f'<path d="M28 74h40" {S}/><path d="M48 14v8" {S}/>',
    "shell": f'<path d="M20 64c0-26 14-44 28-44s28 18 28 44c-10 8-46 8-56 0z" fill="{ROSE}" {S}/>'
             f'<path d="M48 22v44M34 28l6 38M62 28l-6 38" fill="none" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>'
             f'<path d="M30 72c6 6 30 6 36 0" fill="none" {S}/>',
    "yarn": f'<circle cx="46" cy="50" r="28" fill="{HONEY}" {S}/><path d="M24 40c12 4 34 2 44-8M22 56c14 4 36 0 48-12M30 72c10-6 26-22 30-40" fill="none" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>'
            f'<path d="M72 64c6 4 10 10 14 18" fill="none" {S}/>',
    "notebook": f'<rect x="22" y="16" width="52" height="66" rx="8" fill="{SAGE}" {S}/><path d="M34 16v66" {S}/>'
                f'<circle cx="56" cy="44" r="9" fill="{HONEY}" {S}/><path d="M64 82v8l5-4 5 4v-8" fill="{ROSE}" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>',
    "map": f'<path d="M14 26l22-8 24 8 22-8v52l-22 8-24-8-22 8z" fill="{CREAM}" {S}/><path d="M36 18v52M60 26v52" fill="none" {S}/>'
           f'<path d="M48 36c-6 0-10 4-10 9 0 7 10 15 10 15s10-8 10-15c0-5-4-9-10-9z" fill="{ROSE}" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>',
    "back": f'<circle cx="48" cy="48" r="36" fill="{CREAM}" {S}/><path d="M54 30L36 48l18 18" fill="none" {S}/>',
    "next": f'<circle cx="48" cy="48" r="36" fill="{HONEY}" {S}/><path d="M42 30l18 18-18 18" fill="none" {S}/>',
    "close": f'<circle cx="48" cy="48" r="36" fill="{CREAM}" {S}/><path d="M36 36l24 24M60 36L36 60" fill="none" {S}/>',
    "settings": f'<path d="M48 14l8 8 11-2 3 11 9 6-5 10 5 10-9 6-3 11-11-2-8 8-8-8-11 2-3-11-9-6 5-10-5-10 9-6 3-11 11 2z" fill="{SAGE}" {S}/>'
                f'<circle cx="48" cy="48" r="11" fill="{CREAM}" {S}/>',
    "magnifier": f'<circle cx="40" cy="40" r="22" fill="{WHITE}" {S}/><path d="M56 56l22 22" stroke="{HONEY_D}" stroke-width="12" stroke-linecap="round"/>'
                 f'<path d="M56 56l22 22" fill="none" {S}/><path d="M30 34a12 12 0 0 1 10-8" fill="none" stroke="{SAGE}" stroke-width="4" stroke-linecap="round"/>',
    "home": f'<path d="M16 46L48 18l32 28" fill="none" {S}/><path d="M24 40v38h48V40" fill="{CREAM}" {S}/><path d="M40 78V58h16v20" fill="{ROSE}" {S}/>',
    "star": f'<path d="M48 14l10 21 23 3-17 16 4 23-20-11-20 11 4-23-17-16 23-3z" fill="{HONEY}" {S}/>',
    "heart": f'<path d="M48 80S14 60 14 36c0-12 9-20 19-20 7 0 12 4 15 9 3-5 8-9 15-9 10 0 19 8 19 20 0 24-34 44-34 44z" fill="{ROSE}" {S}/>',
    "button-coin": f'<circle cx="48" cy="48" r="34" fill="{HONEY}" {S}/><circle cx="48" cy="48" r="24" fill="none" stroke="{HONEY_D}" stroke-width="4"/>'
                   + "".join(f'<circle cx="{x}" cy="{y}" r="5" fill="{INK}"/>' for x, y in ((40, 40), (56, 40), (40, 56), (56, 56))),
    "sound-on": f'<path d="M18 38h14l18-14v48L32 58H18z" fill="{SAGE}" {S}/><path d="M62 36c5 4 5 20 0 24M70 28c10 8 10 32 0 40" fill="none" {S}/>',
    "sound-off": f'<path d="M18 38h14l18-14v48L32 58H18z" fill="{SAGE}" {S}/><path d="M62 38l18 20M80 38L62 58" fill="none" {S}/>',
    "help": f'<circle cx="48" cy="48" r="36" fill="{HONEY}" {S}/><path d="M38 38c0-7 5-11 11-11s11 4 11 10c0 8-11 9-11 17" fill="none" {S}/>'
            f'<circle cx="49" cy="68" r="4" fill="{INK}"/>',
    "cocoa": f'<path d="M22 34h46v26c0 12-10 20-23 20s-23-8-23-20z" fill="{ROSE}" {S}/><path d="M68 40h6c6 0 8 4 8 9s-3 9-10 9h-4" fill="none" {S}/>'
             f'<path d="M34 24c-4-4 4-6 0-12M48 24c-4-4 4-6 0-12" fill="none" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>',
    "paw": f'<ellipse cx="48" cy="60" rx="18" ry="15" fill="{HONEY}" {S}/>'
           + "".join(f'<ellipse cx="{x}" cy="{y}" rx="7" ry="9" fill="{HONEY}" {S}/>' for x, y in ((26, 38), (40, 26), (56, 26), (70, 38))),
    "encyclopedia": f'<path d="M14 24c10-6 24-6 34 2 10-8 24-8 34-2v52c-10-6-24-6-34 2-10-8-24-8-34-2z" fill="{CREAM}" {S}/><path d="M48 26v52" {S}/>'
                    f'<path d="M24 40h14M24 52h14M58 40h14M58 52h14" stroke="{SAGE_D}" stroke-width="4" stroke-linecap="round"/>',
    "glossary": f'<rect x="20" y="16" width="56" height="66" rx="8" fill="{HONEY}" {S}/><path d="M32 34h32M32 46h32M32 58h20" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>',
    "album": f'<rect x="16" y="20" width="64" height="58" rx="8" fill="{ROSE}" {S}/><circle cx="38" cy="44" r="9" fill="{HONEY}" {S}/>'
             f'<path d="M58 36l4 8 9 1-6 6 1 9-8-4-8 4 1-9-6-6 9-1z" fill="{CREAM}" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>',
    "parent": f'<rect x="22" y="40" width="52" height="40" rx="8" fill="{SAGE}" {S}/><path d="M34 40V30a14 14 0 0 1 28 0v10" fill="none" {S}/>'
              f'<circle cx="48" cy="58" r="6" fill="{CREAM}" {S}/>',
    "invite": f'<rect x="16" y="26" width="64" height="44" rx="8" fill="{CREAM}" {S}/><path d="M16 30l32 22 32-22" fill="none" {S}/>'
              f'<circle cx="48" cy="58" r="8" fill="{ROSE}" {S}/>',
    "guess": f'<path d="M20 70V30c0-6 4-10 10-10h36c6 0 10 4 10 10v24c0 6-4 10-10 10H40z" fill="{HONEY}" {S}/>'
             f'<circle cx="36" cy="42" r="4" fill="{INK}"/><circle cx="48" cy="42" r="4" fill="{INK}"/><circle cx="60" cy="42" r="4" fill="{INK}"/>',
    "lock": f'<rect x="24" y="44" width="48" height="36" rx="8" fill="{HONEY}" {S}/><path d="M34 44V32a14 14 0 0 1 28 0v12" fill="none" {S}/>',
    "turn-device": f'<rect x="14" y="30" width="68" height="44" rx="8" fill="{CREAM}" {S}/><circle cx="72" cy="52" r="3" fill="{INK}"/>'
                   f'<path d="M30 20c8-8 26-8 34 2" fill="none" {S}/><path d="M64 10v12H52" fill="none" {S}/>',
    # Silent form of sound clues (Q31): тихо/громко, высоко/низко, коротко/длинно, ровно/неровно.
    "sound-quiet": f'<path d="M22 40h12l16-12v40L34 56H22z" fill="{SAGE}" {S}/><path d="M62 42c3 3 3 9 0 12" fill="none" {S}/>',
    "sound-medium": f'<path d="M18 40h12l16-12v40L30 56H18z" fill="{HONEY}" {S}/><path d="M58 40c4 4 4 12 0 16M66 34c7 7 7 21 0 28" fill="none" {S}/>',
    "sound-loud": f'<path d="M14 40h12l16-12v40L26 56H14z" fill="{ROSE}" {S}/><path d="M54 40c4 4 4 12 0 16M62 34c7 7 7 21 0 28M70 28c10 10 10 30 0 40" fill="none" {S}/>',
    "pitch-high": f'<path d="M14 76h68" stroke="{SAGE_D}" stroke-width="4" stroke-linecap="round"/><path d="M48 66V22" {S}/><path d="M34 36l14-14 14 14" fill="none" {S}/>'
                  f'<circle cx="48" cy="18" r="6" fill="{HONEY}" {S}/>',
    "pitch-middle": f'<path d="M14 76h68" stroke="{SAGE_D}" stroke-width="4" stroke-linecap="round"/><circle cx="48" cy="48" r="10" fill="{HONEY}" {S}/>',
    "pitch-low": f'<path d="M14 76h68" stroke="{SAGE_D}" stroke-width="4" stroke-linecap="round"/><path d="M48 22v38" {S}/><path d="M34 46l14 14 14-14" fill="none" {S}/>'
                 f'<circle cx="48" cy="66" r="6" fill="{HONEY}" {S}/>',
    "length-short": f'<rect x="36" y="38" width="24" height="20" rx="10" fill="{HONEY}" {S}/>',
    "length-long": f'<rect x="12" y="38" width="72" height="20" rx="10" fill="{HONEY}" {S}/>',
    "rhythm-steady": "".join(f'<rect x="{14 + i * 18}" y="34" width="10" height="28" rx="5" fill="{SAGE}" {S}/>' for i in range(4)),
    "rhythm-uneven": "".join(f'<rect x="{x}" y="{48 - h / 2}" width="10" height="{h}" rx="5" fill="{ROSE}" {S}/>'
                             for x, h in ((12, 20), (30, 40), (56, 14), (74, 30))),
    # «Азбука огоньков»: точка и чёрточка, огонёк выключен и включён.
    "signal-dot": f'<circle cx="48" cy="48" r="16" fill="{HONEY}" {S}/>',
    "signal-dash": f'<rect x="12" y="34" width="72" height="28" rx="14" fill="{HONEY}" {S}/>',
    "lantern-off": f'<path d="M38 16h20l4 8H34z" fill="{HONEY_D}" {S}/><rect x="28" y="24" width="40" height="48" rx="16" fill="{CREAM}" {S}/><path d="M32 80h32" {S}/>',
    "lantern-on": f'<circle cx="48" cy="48" r="44" fill="{HONEY}" opacity="0.35"/><path d="M38 16h20l4 8H34z" fill="{HONEY_D}" {S}/>'
                  f'<rect x="28" y="24" width="40" height="48" rx="16" fill="{HONEY}" {S}/><circle cx="48" cy="46" r="9" fill="{WHITE}"/><path d="M32 80h32" {S}/>',
}

STICKERS = {
    # ✔ round sage seal with a white check
    "sticker-check": f'<circle cx="48" cy="48" r="38" fill="{SAGE}" {S}/><circle cx="48" cy="48" r="29" fill="none" stroke="{CREAM}" stroke-width="3" stroke-dasharray="4 6"/>'
                     f'<path d="M30 50l12 12 24-26" fill="none" stroke="{WHITE}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>',
    # ✖ rounded dusty-rose square with a cream cross
    "sticker-cross": f'<rect x="12" y="12" width="72" height="72" rx="18" fill="{ROSE_D}" {S}/>'
                     f'<path d="M34 34l28 28M62 34L34 62" fill="none" stroke="{WHITE}" stroke-width="10" stroke-linecap="round"/>',
    # ? honey cloud with a question mark
    "sticker-question": f'<path d="M26 72c-10 0-16-7-16-15s6-14 14-14c0-12 10-22 22-22 10 0 18 6 21 14 2-1 4-1 6-1 9 0 15 7 15 15 0 9-6 16-15 16-4 4-9 7-15 7H26z" fill="{HONEY}" {S}/>'
                        f'<path d="M38 40c0-6 5-10 10-10s10 4 10 9c0 7-10 8-10 15" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>'
                        f'<circle cx="48" cy="64" r="4.5" fill="{INK}"/>',
}


def button(fill: str, edge: str) -> str:
    return svg(f'<rect x="4" y="8" width="232" height="80" rx="40" fill="{edge}"/>'
               f'<rect x="4" y="4" width="232" height="78" rx="39" fill="{fill}" stroke="{INK}" stroke-width="4"/>'
               f'<rect x="24" y="12" width="192" height="14" rx="7" fill="{WHITE}" opacity="0.35"/>', w=240, h=92)


def panel() -> str:
    return svg(f'<rect x="6" y="10" width="500" height="372" rx="44" fill="{INK}" opacity="0.18"/>'
               f'<rect x="4" y="4" width="500" height="372" rx="44" fill="{CREAM}" stroke="{INK}" stroke-width="5"/>'
               f'<rect x="20" y="20" width="468" height="340" rx="32" fill="none" stroke="{HONEY}" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>',
               w=512, h=388)


def notebook_page() -> str:
    lines = "".join(f'<path d="M70 {y}h500" stroke="{SAGE}" stroke-width="2" opacity="0.6"/>' for y in range(120, 760, 56))
    holes = "".join(f'<circle cx="32" cy="{y}" r="9" fill="{ROSE}" stroke="{INK}" stroke-width="3"/>' for y in range(90, 800, 90))
    return svg(f'<rect x="4" y="4" width="600" height="800" rx="28" fill="{CREAM}" stroke="{INK}" stroke-width="5"/>'
               f'<path d="M56 4v800" stroke="{ROSE}" stroke-width="3"/>{lines}{holes}', w=608, h=808)


def speech_bubble() -> str:
    return svg(f'<path d="M40 4h560c20 0 36 16 36 36v120c0 20-16 36-36 36H140l-50 40 10-40H40c-20 0-36-16-36-36V40C4 20 20 4 40 4z" '
               f'fill="{CREAM}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>', w=640, h=244)


def main() -> None:
    (OUT / "icons").mkdir(parents=True, exist_ok=True)
    (OUT / "stickers").mkdir(parents=True, exist_ok=True)
    for name, body in ICONS.items():
        (OUT / "icons" / f"{name}.svg").write_text(svg(body), encoding="utf-8", newline="\n")
    for name, body in STICKERS.items():
        (OUT / "stickers" / f"{name}.svg").write_text(svg(body), encoding="utf-8", newline="\n")
    (OUT / "button-primary.svg").write_text(button(HONEY, HONEY_D), encoding="utf-8", newline="\n")
    (OUT / "button-secondary.svg").write_text(button(SAGE, SAGE_D), encoding="utf-8", newline="\n")
    (OUT / "button-quiet.svg").write_text(button(CREAM, "#d9c8a8"), encoding="utf-8", newline="\n")
    (OUT / "panel.svg").write_text(panel(), encoding="utf-8", newline="\n")
    (OUT / "notebook-page.svg").write_text(notebook_page(), encoding="utf-8", newline="\n")
    (OUT / "speech-bubble.svg").write_text(speech_bubble(), encoding="utf-8", newline="\n")
    print(len(ICONS), "icons,", len(STICKERS), "stickers")


if __name__ == "__main__":
    main()
