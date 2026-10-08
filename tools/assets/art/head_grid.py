"""Grid preview of a puppet base's head region for picking feature coordinates."""
import sys
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGBA")
bb = im.getbbox()
w = bb[2] - bb[0]
cx = (bb[0] + bb[2]) // 2
size = int(sys.argv[3]) if len(sys.argv) > 3 else 512
x0 = max(0, cx - size // 2); y0 = max(0, bb[1] - 16)
top = int(sys.argv[4]) if len(sys.argv) > 4 else y0
bg = Image.new("RGBA", im.size, (255, 0, 255, 255)); bg.alpha_composite(im)
c = bg.crop((x0, top, x0 + size, top + size)).resize((1024, 1024))
d = ImageDraw.Draw(c)
k = 1024 / size
for i in range(0, size, 32):
    col = (255, 255, 0) if i % 128 == 0 else (0, 255, 255)
    d.line([(i * k, 0), (i * k, 1024)], fill=col); d.line([(0, i * k), (1024, i * k)], fill=col)
    d.text((i * k + 2, 2), str(x0 + i), fill="black"); d.text((2, i * k + 2), str(top + i), fill="black")
c.convert("RGB").save(out, quality=85)
print(bb, x0, top)
