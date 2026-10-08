"""Overlay a coordinate grid on a 2560x1600 background (preview 1280x800) for hotspot authoring."""
import sys
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB").resize((1280, 800))
d = ImageDraw.Draw(im)
for x in range(0, 2560, 160):
    d.line([(x / 2, 0), (x / 2, 800)], fill=(255, 255, 0) if x % 640 == 0 else (0, 255, 255), width=1)
    d.text((x / 2 + 2, 2), str(x), fill=(255, 255, 255))
for y in range(0, 1600, 160):
    d.line([(0, y / 2), (1280, y / 2)], fill=(255, 255, 0) if y % 640 == 0 else (0, 255, 255), width=1)
    d.text((2, y / 2 + 2), str(y), fill=(255, 255, 255))
d.rectangle([230 / 2, 80 / 2, 2330 / 2, 1520 / 2], outline=(255, 0, 0), width=2)
for r in sys.argv[3:]:
    x, y, w, h = map(int, r.split(","))
    d.rectangle([x / 2, y / 2, (x + w) / 2, (y + h) / 2], outline=(255, 0, 255), width=3)
im.save(out, quality=85)
