"""Blurs the faces in the studio's staff portraits, in place.

    python scripts/blur-team-faces.py            # blur every portrait
    python scripts/blur-team-faces.py --check    # report only, write nothing
    python scripts/blur-team-faces.py member-09  # one portrait

The studio asked for their staff to be unidentifiable on the site. This is the
same call they had already made for one portrait — see WITHHELD_PORTRAITS in
lib/portfolio.ts — applied to all of them.

Staff only. The two founders are named and pictured as the face of the
practice and stay sharp; see EXCLUDED below.

WHY THE REGIONS ARE HARD-CODED

No face detector is used. OpenCV 5 no longer ships the Haar cascade data, and
the alternatives (YuNet, dlib, mediapipe) all mean pulling a model down from
somewhere. For eighteen fixed portraits that is a lot of moving parts to get
an answer that can be written down once and checked by eye. The boxes below
were read off the images directly and verified against the output.

The consequence is that this file is only correct for these exact images. If
scripts/extract-pdf-assets.py is re-run against a new profile PDF, the crops
move and these regions must be re-checked — they will not fail loudly, they
will simply blur the wrong part of the picture. --check prints the box it
would blur for each portrait without writing; check the results by eye.

IMPORTANT: extract-pdf-assets.py rewrites public/team/*.jpg from the source
PDF, which restores the unblurred originals. Re-run this script after it.

The originals are not kept anywhere on disk. A copy under public/ would be
served to anyone who guessed the path, which would defeat the exercise; git
history is the only place they survive.
"""

import argparse
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"

# Every directory under public/ holding photographs of people. Anything in
# one of these that is not in FACES below is reported as unblurred — the
# founders in particular appear as four separate photographs across three
# directories, and blurring only the obvious ones would leave the rest served
# to anyone who guessed the path.
#
# public/studio/office-*.jpg was checked and is not listed: those are empty
# interiors. office-05.jpg has one person at a desk, seen from behind, with
# no face in frame.
PORTRAIT_DIRS = ["team", "images/team", "images/owner"]

# Face regions as fractions of each image, so they survive the portraits being
# re-encoded or resized: (centre x, centre y, half width, half height).
# Sized to the whole head — hairline to chin, ear to ear — rather than just
# the features, because a blur that leaves the jaw and hairline sharp still
# identifies someone to anyone who knows them.
FACES = {
    # Staff portraits from the profile's team page.
    "team/member-04.jpg": (0.50, 0.32, 0.24, 0.29),
    "team/member-05.jpg": (0.49, 0.29, 0.21, 0.25),
    "team/member-06.jpg": (0.50, 0.21, 0.19, 0.18),
    "team/member-07.jpg": (0.49, 0.24, 0.20, 0.20),
    "team/member-08.jpg": (0.52, 0.24, 0.20, 0.19),
    "team/member-09.jpg": (0.50, 0.33, 0.22, 0.26),
    "team/member-10.jpg": (0.50, 0.32, 0.22, 0.26),
    "team/member-11.jpg": (0.49, 0.42, 0.22, 0.25),
    "team/member-12.jpg": (0.51, 0.52, 0.25, 0.27),
    "team/member-13.jpg": (0.50, 0.24, 0.18, 0.19),
    "team/member-14.jpg": (0.51, 0.22, 0.19, 0.19),
    "team/member-15.jpg": (0.50, 0.23, 0.16, 0.16),
    "team/member-16.jpg": (0.52, 0.23, 0.18, 0.18),
    "team/member-17.jpg": (0.52, 0.23, 0.18, 0.19),
    "team/member-18.jpg": (0.52, 0.27, 0.21, 0.22),
    "team/member-19.jpg": (0.51, 0.23, 0.19, 0.20),
}

# The two founders are deliberately left sharp: they front the practice under
# their own names and photographs, which is the opposite of what the staff
# blur is for. Listed explicitly so the unblurred check below stays silent
# about them, rather than warning on every run about a decision already made.
EXCLUDED = {
    "team/umar-kazi.jpg",
    "team/shaheer-tungekar.jpg",
    "images/team/umar-kazi.jpg",
    "images/team/shaheer-tungekar.jpg",
    "images/owner/Ar. Umar Kazi.jpeg",
    "images/owner/Ar. Shaheer Tungekar.jpeg",
}

# The regions above are read by eye, so they carry some error. Widening them
# before blurring costs a little of the surrounding hair and collar and buys
# the guarantee that no part of a face sits outside the mask.
MARGIN = 1.18

# Mosaic first, then blur. Blur alone is a filter and a strong enough prior can
# work back through it; averaging each block down to a single value throws the
# information away outright, and the blur afterwards is only there to stop the
# result looking like a QR code. Block size scales with the face so every
# portrait ends up equally unreadable regardless of its resolution.
BLOCKS_ACROSS = 7


def blur_face(img, region):
    h, w = img.shape[:2]
    cx, cy, rx, ry = region
    rx, ry = rx * MARGIN, ry * MARGIN

    # Pixel-space ellipse, clamped to the frame.
    ex, ey = int(cx * w), int(cy * h)
    ax, ay = max(2, int(rx * w)), max(2, int(ry * h))
    x0, x1 = max(0, ex - ax), min(w, ex + ax)
    y0, y1 = max(0, ey - ay), min(h, ey + ay)
    if x1 <= x0 or y1 <= y0:
        raise ValueError("region falls outside the image")

    patch = img[y0:y1, x0:x1].copy()
    ph, pw = patch.shape[:2]

    small = cv2.resize(
        patch,
        (max(1, BLOCKS_ACROSS), max(1, int(BLOCKS_ACROSS * ph / pw))),
        interpolation=cv2.INTER_AREA,
    )
    mosaic = cv2.resize(small, (pw, ph), interpolation=cv2.INTER_NEAREST)
    k = max(3, (min(pw, ph) // 6) | 1)
    mosaic = cv2.GaussianBlur(mosaic, (k, k), 0)

    # Feathered elliptical mask, so the redaction reads as a soft vignette
    # rather than a rectangle stamped on the portrait.
    mask = np.zeros((ph, pw), np.float32)
    cv2.ellipse(
        mask,
        (pw // 2, ph // 2),
        (int(pw * 0.5), int(ph * 0.5)),
        0, 0, 360, 1.0, -1,
    )
    feather = max(3, (min(pw, ph) // 8) | 1)
    mask = cv2.GaussianBlur(mask, (feather, feather), 0)[..., None]

    img[y0:y1, x0:x1] = (mosaic * mask + patch * (1 - mask)).astype(np.uint8)
    return (x0, y0, x1, y1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("only", nargs="*", help="portrait stems to process")
    ap.add_argument("--check", action="store_true", help="report, write nothing")
    args = ap.parse_args()

    targets = {
        name: r
        for name, r in FACES.items()
        if not args.only or Path(name).stem in args.only
    }
    if not targets:
        print(f"No portrait matched: {' '.join(args.only)}", file=sys.stderr)
        return 1

    # Every portrait on disk must be listed, or someone's face ships unblurred
    # because a file was added and this table was not updated.
    on_disk = {
        p.relative_to(PUBLIC).as_posix()
        for d in PORTRAIT_DIRS
        for p in (PUBLIC / d).glob("*")
        if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
    }
    unlisted = on_disk - set(FACES) - EXCLUDED
    if unlisted:
        print(
            f"  ! {len(unlisted)} portrait(s) not in FACES and so NOT blurred: "
            + ", ".join(sorted(unlisted)),
            file=sys.stderr,
        )

    failures = 0
    for name, region in sorted(targets.items()):
        path = PUBLIC / name
        if not path.exists():
            print(f"  [FAIL] {name}: missing")
            failures += 1
            continue
        img = cv2.imread(str(path))
        if img is None:
            print(f"  [FAIL] {name}: unreadable")
            failures += 1
            continue
        h, w = img.shape[:2]
        try:
            box = blur_face(img, region)
        except ValueError as e:
            print(f"  [FAIL] {name}: {e}")
            failures += 1
            continue
        if args.check:
            print(f"  [--]   {name}: {w}x{h} face {box}")
            continue
        # quality 92: these are small portraits already through one JPEG
        # generation from the PDF, and a second heavy pass shows on the skin.
        cv2.imwrite(str(path), img, [cv2.IMWRITE_JPEG_QUALITY, 92])
        print(f"  [ok]   {name}: {w}x{h} blurred {box}")

    print(f"\n{len(targets) - failures}/{len(targets)} portrait(s) processed.")
    return 1 if failures or unlisted else 0


if __name__ == "__main__":
    sys.exit(main())
