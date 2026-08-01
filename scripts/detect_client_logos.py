"""Auto-detect logo bounding boxes on the client sheet screenshots.

Pure Pillow (no numpy): threshold non-white pixels, dilate with MaxFilter
to bridge small gaps inside a single logo (separate letters/glyphs), then
flood-fill label the dilated mask to get connected blobs. Each blob's
bounding box is computed from the *original* (non-dilated) mask so the
crop hugs the real artwork, not the dilated blob.
"""
import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

SRC_DIR = Path(__file__).resolve().parent.parent / "public" / "clients" / "New folder"

WHITE_THRESHOLD = 245  # pixel counts as "background" if min(r,g,b) >= this (and low alpha diff)
DILATE_RADIUS = 9  # px; bridges gaps within one logo's own glyphs
MIN_AREA = 400  # discard tiny specks


def load_mask(path: Path):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    px = im.load()
    mask = bytearray(w * h)
    for y in range(h):
        row_off = y * w
        for x in range(w):
            r, g, b = px[x, y]
            if not (r >= WHITE_THRESHOLD and g >= WHITE_THRESHOLD and b >= WHITE_THRESHOLD):
                mask[row_off + x] = 1
    return im, w, h, mask


def dilate(mask, w, h, radius):
    mimg = Image.frombytes("L", (w, h), bytes(b * 255 for b in mask))
    mimg = mimg.filter(ImageFilter.MaxFilter(2 * radius + 1))
    dpx = mimg.load()
    dmask = bytearray(w * h)
    for y in range(h):
        row_off = y * w
        for x in range(w):
            if dpx[x, y] > 0:
                dmask[row_off + x] = 1
    return dmask


def label_components(dmask, w, h):
    visited = bytearray(w * h)
    boxes = []
    for start in range(w * h):
        if dmask[start] == 0 or visited[start]:
            continue
        stack = [start]
        visited[start] = 1
        minx = maxx = start % w
        miny = maxy = start // w
        count = 0
        pts = []
        while stack:
            idx = stack.pop()
            x = idx % w
            y = idx // w
            count += 1
            if x < minx:
                minx = x
            if x > maxx:
                maxx = x
            if y < miny:
                miny = y
            if y > maxy:
                maxy = y
            # 4-neighbors
            if x > 0:
                n = idx - 1
                if dmask[n] and not visited[n]:
                    visited[n] = 1
                    stack.append(n)
            if x < w - 1:
                n = idx + 1
                if dmask[n] and not visited[n]:
                    visited[n] = 1
                    stack.append(n)
            if y > 0:
                n = idx - w
                if dmask[n] and not visited[n]:
                    visited[n] = 1
                    stack.append(n)
            if y < h - 1:
                n = idx + w
                if dmask[n] and not visited[n]:
                    visited[n] = 1
                    stack.append(n)
        boxes.append((minx, miny, maxx, maxy, count))
    return boxes


def tight_bbox(mask, w, h, box):
    minx, miny, maxx, maxy, _ = box
    minx = max(0, minx - DILATE_RADIUS)
    miny = max(0, miny - DILATE_RADIUS)
    maxx = min(w - 1, maxx + DILATE_RADIUS)
    maxy = min(h - 1, maxy + DILATE_RADIUS)
    tminx, tminy, tmaxx, tmaxy = w, h, -1, -1
    for y in range(miny, maxy + 1):
        row_off = y * w
        for x in range(minx, maxx + 1):
            if mask[row_off + x]:
                if x < tminx:
                    tminx = x
                if x > tmaxx:
                    tmaxx = x
                if y < tminy:
                    tminy = y
                if y > tmaxy:
                    tmaxy = y
    if tmaxx < 0:
        return None
    return (tminx, tminy, tmaxx, tmaxy)


def process(path: Path):
    im, w, h, mask = load_mask(path)
    dmask = dilate(mask, w, h, DILATE_RADIUS)
    comps = label_components(dmask, w, h)
    results = []
    for box in comps:
        area = (box[2] - box[0] + 1) * (box[3] - box[1] + 1)
        if area < MIN_AREA:
            continue
        bbox = tight_bbox(mask, w, h, box)
        if bbox is None:
            continue
        results.append(bbox)
    # reading order: sort by row band (cluster by y-center proximity), then x
    results.sort(key=lambda b: ((b[1] + b[3]) / 2, b[0]))
    print(f"\n{path.name}: {len(results)} boxes")
    for b in results:
        print(f"  {b}  size={b[2]-b[0]+1}x{b[3]-b[1]+1}")
    return im, results


if __name__ == "__main__":
    for name in ["Clients1.PNG", "Clients2.PNG", "international3.PNG"]:
        process(SRC_DIR / name)
