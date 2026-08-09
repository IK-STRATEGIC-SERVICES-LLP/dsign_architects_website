"""Removes the burnt-in shot-name caption chip ("Living Room", "Backyard",
etc.) from a built frame sequence, in place — run right after build-media.mjs
for any slug whose master carries these:

    pip install opencv-python-headless numpy
    python scripts/remove-captions.py nashik-villa
    python scripts/remove-captions.py nashik-villa --review   # sample only, no writes

Only ever run this on a freshly built sequence. It overwrites frames in
place, so running it twice inpaints already-inpainted pixels and compounds
the smearing; rebuild with `build-media.mjs --force <slug>` first.

HOW IT FINDS THE CHIP

Detection keys on the chip's WHITE TEXT, not its dark background — the
background's brightness alone can't be trusted to tell chip from scene (one
of this film's chips sits on wet asphalt nearly as dark as the chip itself).
Text edges are steadier: a sharp bright-to-dark transition in a very short
pixel span. Edge pixels are then connected-component clustered, because a
naive per-row hit count over-triggers on specular noise — wet-road
reflections read as "text" almost as readily as glyphs do.

WHY IT WORKS PER SHOT, NOT PER FRAME

The caption animates in and out at each end of a shot: a partial chip, a
thin sliver, a wipe triangle. Those frames carry too few text edges to
detect reliably, so a purely per-frame pass leaves fragments behind
("Front En", a lone chip corner) — which is exactly what a first version of
this did. Since the chip occupies the same place for the whole shot, the
fix is to detect per frame, union the confident boxes across each shot, and
then inpaint that one union box on every frame of the shot. Partial and
animating chips are covered by the full extent.

Shot boundaries are found by frame-to-frame difference rather than read
from the manifest, so this stays correct if the cut changes.

Inpainted with OpenCV's Telea algorithm, which reconstructs a masked region
from its surrounding pixels. This is a texture-synthesis method, not a
generative one — it works well on the plain-ish surfaces these chips
usually sit over (floors, walls, paving) and will visibly smear a caption
sitting over fine detail (patterned rugs, foliage, framed art). Run with
--review first on any footage not already checked.
"""
import argparse
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent

BAND = 150          # search only the bottom N px, where captions live
EDGE_SPAN = 2
EDGE_DROP = 65          # brightness drop across EDGE_SPAN px that counts as a text edge
BRIGHT = 205             # the bright side of the edge must be at least this
PAD_TOP, PAD_SIDE, PAD_BOTTOM = 14, 16, 18
EDGE_ZONE = 24                # a component within this many px of a side counts as "anchored"
MAX_COMPONENT_H = 130            # a two-line caption chip is never taller than this
MERGE_GAP = 40                     # max gap between title and category-line components to merge
INPAINT_RADIUS = 7

# Shot detection: mean abs difference between consecutive frames, downscaled.
CUT_FACTOR = 6.0     # a cut is this many times the median inter-frame difference
CUT_FLOOR = 12.0       # ...and at least this, so a static shot doesn't split


def edge_mask(gray, y0):
    band = gray[y0:, :].astype(np.int16)
    h, w = band.shape
    mask = np.zeros((h, w), dtype=np.uint8)
    left = band[:, : -2 * EDGE_SPAN]
    right = band[:, 2 * EDGE_SPAN :]
    mid = band[:, EDGE_SPAN:-EDGE_SPAN]
    drop = mid - np.minimum(left, right)
    hit = (mid >= BRIGHT) & (drop > EDGE_DROP)
    mask[:, EDGE_SPAN:-EDGE_SPAN] = hit.astype(np.uint8) * 255
    return mask


def detect_caption_box(gray):
    """Per-frame detection. Returns (x0, y0, x1, y1, anchored_left) or None."""
    h, w = gray.shape
    y0 = h - BAND
    mask = edge_mask(gray, y0)

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (17, 9))
    closed = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    n, _labels, stats, _centroids = cv2.connectedComponentsWithStats(closed, connectivity=8)
    comps = []
    for i in range(1, n):
        x, y, cw, ch, area = stats[i]
        if ch > MAX_COMPONENT_H or area < 60:
            continue
        anchored_left = x <= EDGE_ZONE
        anchored_right = (x + cw) >= (w - EDGE_ZONE)
        if not (anchored_left or anchored_right):
            continue
        comps.append((x, y, cw, ch, area, anchored_left))

    if not comps:
        return None
    x, y, cw, ch, _area, anchored_left = max(comps, key=lambda c: c[4])

    # Two lines (title + category); the category line is the smaller
    # component, so biggest-area alone only ever finds the title.
    y_bottom = y + ch
    for cx, cy, ccw, cch, _carea, canchor in comps:
        if canchor != anchored_left:
            continue
        if 0 <= cy - y_bottom <= MERGE_GAP:
            y_bottom = max(y_bottom, cy + cch)
            x = min(x, cx) if anchored_left else x
            cw = max(cw, cx + ccw - x) if anchored_left else max(cw, x + cw - cx)

    if anchored_left:
        box_x0, box_x1 = 0, min(w, x + cw + PAD_SIDE)
    else:
        box_x0, box_x1 = max(0, x - PAD_SIDE), w

    box_y0 = max(0, y0 + y - PAD_TOP)
    box_y1 = min(h, y0 + y_bottom + PAD_BOTTOM)
    return (box_x0, box_y0, box_x1, box_y1, anchored_left)


def find_shots(paths):
    """Frame indices where a new shot starts, via inter-frame difference."""
    sigs = []
    for p in paths:
        img = cv2.imread(str(p), cv2.IMREAD_GRAYSCALE)
        sigs.append(cv2.resize(img, (64, 36)).astype(np.int16))
    diffs = [0.0] + [float(np.abs(sigs[i] - sigs[i - 1]).mean()) for i in range(1, len(sigs))]
    body = sorted(diffs[1:])
    median = body[len(body) // 2] if body else 0.0
    threshold = max(CUT_FLOOR, median * CUT_FACTOR)

    starts = [0]
    for i in range(1, len(diffs)):
        if diffs[i] > threshold:
            starts.append(i)
    return starts


def shot_ranges(paths):
    starts = find_shots(paths)
    bounds = starts + [len(paths)]
    return [(bounds[i], bounds[i + 1]) for i in range(len(bounds) - 1)]


def union_box(boxes, w, h):
    """Robust union of a shot's per-frame boxes.

    Outliers are dropped by area before unioning: one bad detection that
    swallowed half the frame would otherwise drag the union out with it.
    """
    if not boxes:
        return None
    areas = sorted((b[2] - b[0]) * (b[3] - b[1]) for b in boxes)
    med = areas[len(areas) // 2]
    kept = [b for b in boxes if (b[2] - b[0]) * (b[3] - b[1]) <= max(med * 3, 1)]
    if not kept:
        kept = boxes
    x0 = min(b[0] for b in kept)
    y0 = min(b[1] for b in kept)
    x1 = max(b[2] for b in kept)
    y1 = max(b[3] for b in kept)
    return (max(0, x0), max(0, y0), min(w, x1), min(h, y1))


def plan(paths):
    """Returns {frame_index: box} — the union box for each frame's shot."""
    per_frame = {}
    grays = {}
    for i, p in enumerate(paths):
        img = cv2.imread(str(p))
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        grays[i] = gray.shape
        got = detect_caption_box(gray)
        if got:
            per_frame[i] = got

    result = {}
    for a, b in shot_ranges(paths):
        boxes = [per_frame[i][:4] for i in range(a, b) if i in per_frame]
        if not boxes:
            continue
        h, w = grays[a]
        box = union_box(boxes, w, h)
        for i in range(a, b):
            result[i] = box
    return result


def apply_box(img, box):
    x0, y0, x1, y1 = box
    mask = np.zeros(img.shape[:2], dtype=np.uint8)
    mask[y0:y1, x0:x1] = 255
    return cv2.inpaint(img, mask, INPAINT_RADIUS, cv2.INPAINT_TELEA)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--quality", type=int, default=70)
    ap.add_argument("--review", action="store_true",
                    help="write a contact sheet of sampled frames instead of overwriting anything")
    args = ap.parse_args()

    media_dir = ROOT / "public" / "media" / args.slug
    frames_dir = media_dir / "frames"
    if not frames_dir.is_dir():
        sys.exit(f"no frames directory at {frames_dir} — run build-media.mjs first")

    paths = sorted(frames_dir.glob("*.webp"))
    shots = shot_ranges(paths)
    boxes = plan(paths)

    print(f"{args.slug}: {len(paths)} frames, {len(shots)} shot(s) detected")
    for a, b in shots:
        box = boxes.get(a)
        where = f"box={box}" if box else "no caption in this shot"
        print(f"  frames {a + 1:>4}-{b:<4}  {where}")

    if args.review:
        sample = sorted(boxes)[:: max(1, len(boxes) // 8)][:8]
        rows = []
        for i in sample:
            img = cv2.imread(str(paths[i]))
            out = apply_box(img, boxes[i])
            pair = np.hstack([img, out])
            cv2.rectangle(pair, (0, 0), (pair.shape[1], 24), (16, 18, 24), -1)
            cv2.putText(pair, f"{paths[i].name}  box={boxes[i]}", (6, 17),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (60, 220, 60), 1, cv2.LINE_AA)
            rows.append(pair)
        out_path = media_dir / "_caption-review.png"
        cv2.imwrite(str(out_path), np.vstack(rows))
        print(f"\nwrote {out_path} — before | after, nothing else touched")
        return

    touched = 0
    for i, p in enumerate(paths):
        if i not in boxes:
            continue
        img = cv2.imread(str(p))
        if img is None:
            print(f"  ! could not read {p.name}, skipping")
            continue
        cv2.imwrite(str(p), apply_box(img, boxes[i]), [cv2.IMWRITE_WEBP_QUALITY, args.quality])
        touched += 1

    # The poster is a separate still, outside any shot — handle per frame.
    poster = media_dir / "poster.webp"
    if poster.exists():
        img = cv2.imread(str(poster))
        got = detect_caption_box(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
        if got:
            cv2.imwrite(str(poster), apply_box(img, got[:4]), [cv2.IMWRITE_WEBP_QUALITY, 82])
            print("  poster: caption removed")

    print(f"\n{args.slug}: {touched} of {len(paths)} frame(s) inpainted")


if __name__ == "__main__":
    main()
