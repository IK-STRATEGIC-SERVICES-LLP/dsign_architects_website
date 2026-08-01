"""Pull the studio's portfolio imagery out of its practice profile PDF.

The profile is 96 pages, effectively one full-bleed project render per page
with a caption, plus a clients page of logos, an office page and a team page.
This script turns that into web assets:

    public/portfolio/<slug>.jpg   one image per project page
    public/clients/<n>.png        client logos from the CLIENTS page
    public/studio/office-<n>.jpg  office photographs
    lib/portfolio.generated.json  title / location / category manifest

Run:  python scripts/extract-pdf-assets.py
Requires PyMuPDF (already present) and Pillow.
"""

import io
import json
import re
import unicodedata
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "public" / "pdf" / "D’sign Architects - Profile.pdf"
OUT_PORTFOLIO = ROOT / "public" / "portfolio"
OUT_CLIENTS = ROOT / "public" / "clients"
OUT_STUDIO = ROOT / "public" / "studio"
OUT_TEAM = ROOT / "public" / "team"
MANIFEST = ROOT / "lib" / "portfolio.generated.json"

# 1-based page ranges → category, taken from the section divider pages.
SECTIONS = [
    (10, 15, "Master Planning"),
    (17, 23, "Landscape"),
    (25, 30, "Government"),
    (32, 42, "Commercial"),
    (44, 52, "Institutional"),
    (54, 65, "Residential"),
    (67, 95, "Interior"),
]

CLIENTS_PAGE = 5
OFFICE_PAGE = 4
TEAM_PAGE = 2
# On the team page the first two rasters are a backdrop and a project render.
# Images 2 and 3 are the founders, in the order the page captions them
# (Ar. Shaheer Tungekar, then Ar. Umar Kazi); everything after is staff.
TEAM_SKIP_FIRST = 4
TEAM_FOUNDERS = {2: "shaheer-tungekar", 3: "umar-kazi"}

# The same D'sign watermark sits on every project page; it is always this
# size, so skip it rather than mistaking it for artwork.
WATERMARK_DIMS = {(1035, 582)}
MAX_WIDTH = 1600
JPEG_QUALITY = 82


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return re.sub(r"-{2,}", "-", text)


def page_lines(page) -> list[str]:
    return [ln.strip() for ln in page.get_text().splitlines() if ln.strip()]


def _is_caps(line: str) -> bool:
    letters = [c for c in line if c.isalpha()]
    return bool(letters) and all(c.isupper() for c in letters)


def parse_caption(lines: list[str]) -> tuple[str, str]:
    """Captions pair a mixed-case title with an ALL-CAPS location.

    Page layout puts them in either order, so split by case rather than by
    position — otherwise pages like "HYDERABAD / Super Select" come out with
    the city as the project name.
    """
    if not lines:
        return ("Untitled", "")
    if len(lines) == 1:
        return (lines[0], "")

    caps = [ln for ln in lines if _is_caps(ln)]
    mixed = [ln for ln in lines if not _is_caps(ln)]
    if mixed:
        # Some pages repeat the city; keep the first occurrence only.
        seen, unique_caps = set(), []
        for ln in caps:
            if ln not in seen:
                seen.add(ln)
                unique_caps.append(ln)
        return (" ".join(mixed), " ".join(unique_caps))
    # Everything is capitalised (e.g. "ABIL AVANTI" / "PUNE") — assume the
    # first line names the project.
    return (lines[0], " ".join(lines[1:]))


def largest_image(doc, page):
    """Biggest embedded raster on the page, ignoring the watermark."""
    best = None
    for xref, *_ in page.get_images(full=True):
        try:
            data = doc.extract_image(xref)
        except Exception:
            continue
        dims = (data["width"], data["height"])
        if dims in WATERMARK_DIMS:
            continue
        area = dims[0] * dims[1]
        if best is None or area > best[0]:
            best = (area, data)
    return best[1] if best else None


def save_jpeg(raw: bytes, dest: Path, max_width: int = MAX_WIDTH) -> int:
    img = Image.open(io.BytesIO(raw))
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    if img.width > max_width:
        h = round(img.height * max_width / img.width)
        img = img.resize((max_width, h), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
    return dest.stat().st_size


def _trim_white_margin(img: Image.Image, threshold: int = 242) -> Image.Image:
    """Crop a uniform near-white or fully transparent border from a logo."""
    w, h = img.size
    px = img.convert("RGB").load()
    alpha = img.getchannel("A").load() if "A" in img.getbands() else None

    def is_bg(x: int, y: int) -> bool:
        # Transparent pixels flatten to black in the RGB view, so alpha has
        # to be consulted first or a keyed-out margin never gets trimmed.
        if alpha is not None and alpha[x, y] < 12:
            return True
        return min(px[x, y]) >= threshold

    def row_is_white(y: int) -> bool:
        return all(is_bg(x, y) for x in range(0, w, max(1, w // 60)))

    def col_is_white(x: int) -> bool:
        return all(is_bg(x, y) for y in range(0, h, max(1, h // 60)))

    top, bottom, left, right = 0, h - 1, 0, w - 1
    while top < bottom and row_is_white(top):
        top += 1
    while bottom > top and row_is_white(bottom):
        bottom -= 1
    while left < right and col_is_white(left):
        left += 1
    while right > left and col_is_white(right):
        right -= 1

    # Leave a small breathing margin, and ignore nonsense crops.
    pad = max(2, round(min(w, h) * 0.02))
    box = (
        max(0, left - pad),
        max(0, top - pad),
        min(w, right + 1 + pad),
        min(h, bottom + 1 + pad),
    )
    if box[2] - box[0] < w * 0.15 or box[3] - box[1] < h * 0.15:
        return img
    return img.crop(box)


def background_tint(img: Image.Image) -> str | None:
    """The solid colour a logo is drawn on, or None if it has no such canvas.

    Roughly a third of the client marks arrive as artwork baked onto a solid
    dark rectangle (Super Select, Lemon Tree, both police crests). Dropped
    onto the site's white logo tile those read as black boxes with a white
    frame around them. Reporting the colour here lets the tile adopt it, so
    the mark meets the tile edge instead of floating in a mismatched card.

    Near-white canvases return None: white is already the tile default.
    """
    rgb = img.convert("RGB")
    w, h = rgb.size
    px = rgb.load()

    step_x = max(1, w // 60)
    step_y = max(1, h // 60)
    edge = (
        [(x, 0) for x in range(0, w, step_x)]
        + [(x, h - 1) for x in range(0, w, step_x)]
        + [(0, y) for y in range(0, h, step_y)]
        + [(w - 1, y) for y in range(0, h, step_y)]
    )

    # A logo that was keyed out in the source has no canvas to match — the
    # tile should show through it, so report no tint.
    if "A" in img.getbands():
        alpha = img.getchannel("A").load()
        if sum(1 for p in edge if alpha[p] < 12) / len(edge) > 0.3:
            return None

    border = [px[p] for p in edge]

    # Median per channel is a cheap stand-in for the modal border colour and
    # shrugs off the odd pixel where the mark runs to the edge.
    med = tuple(sorted(c[i] for c in border)[len(border) // 2] for i in range(3))
    close = sum(
        1 for c in border if max(abs(c[i] - med[i]) for i in range(3)) <= 24
    )
    if close / len(border) < 0.72:
        return None  # patterned or multi-colour edge — leave the tile white
    if min(med) >= 242:
        return None  # already white
    return "#%02x%02x%02x" % med


def save_logo(
    raw: bytes,
    dest: Path,
    mask_raw: bytes | None = None,
    max_width: int = 520,
) -> tuple[int, int, str | None]:
    """Save a client logo exactly as it appears in the profile.

    Nothing is keyed out or recoloured here: several marks carry their
    background as part of the artwork (Maharashtra Police's blue, for one),
    and removing it misrepresents the brand. Only downscaling happens.

    Seven of the logos are stored in the PDF as an opaque JPEG plus a
    separate soft mask holding the transparency. Read without the mask they
    come out as artwork stranded on a solid black rectangle — which is
    exactly how they used to render on the site. `mask_raw` is that mask, and
    reattaching it as the alpha channel restores the intended cut-out.

    Returns the saved pixel size and the mark's own background colour, both
    of which the site needs to lay the logo out without upscaling it or
    stranding it on a mismatched tile.
    """
    img = Image.open(io.BytesIO(raw))
    img = img.convert("RGBA" if "A" in img.getbands() else "RGB")

    if mask_raw is not None:
        mask = Image.open(io.BytesIO(mask_raw)).convert("L")
        if mask.size != img.size:
            mask = mask.resize(img.size, Image.LANCZOS)
        img = img.convert("RGBA")
        img.putalpha(mask)

    # Several logos are exported with a wide white margin baked in, which
    # makes the mark look tiny inside its tile. Crop that dead space — but
    # only when the margin is genuinely near-white, so marks that sit on
    # their own dark card (Super Select, Lemon Tree) are left whole.
    img = _trim_white_margin(img)

    if img.width > max_width:
        h = round(img.height * max_width / img.width)
        img = img.resize((max_width, h), Image.LANCZOS)

    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "PNG", optimize=True)
    return img.width, img.height, background_tint(img)


def main() -> None:
    doc = fitz.open(PDF)
    entries = []
    seen_slugs: dict[str, int] = {}

    for start, end, category in SECTIONS:
        for pno in range(start, end + 1):
            page = doc[pno - 1]
            title, location = parse_caption(page_lines(page))
            data = largest_image(doc, page)
            if not data:
                print(f"  ! p{pno}: no image found ({title})")
                continue

            base = slugify(f"{title}-{location}") or f"project-{pno}"
            seen_slugs[base] = seen_slugs.get(base, 0) + 1
            slug = base if seen_slugs[base] == 1 else f"{base}-{seen_slugs[base]}"

            dest = OUT_PORTFOLIO / f"{slug}.jpg"
            size = save_jpeg(data["image"], dest)
            entries.append(
                {
                    "slug": slug,
                    "title": title,
                    "location": location,
                    "category": category,
                    "image": f"/portfolio/{slug}.jpg",
                    "page": pno,
                }
            )
            print(f"  p{pno:>2} [{category:<15}] {title[:44]:<44} {size // 1024}KB")

    # Client logos — many small rasters on a single page. They arrive with a
    # mix of solid black and solid white backgrounds, so key the background
    # out to transparency; the site then renders them all on one neutral
    # tile instead of a patchwork of black and white rectangles.
    clients_page = doc[CLIENTS_PAGE - 1]
    logos = []
    # The page separates "PAN INDIA CLIENTS" from "INTERNATIONAL CLIENTS";
    # anything sitting below the international heading belongs to it.
    intl_heading = clients_page.search_for("INTERNATIONAL CLIENTS")
    intl_y = intl_heading[0].y0 if intl_heading else float("inf")
    for i, (xref, smask, *_) in enumerate(clients_page.get_images(full=True)):
        try:
            data = doc.extract_image(xref)
        except Exception:
            continue
        if data["width"] < 80 or data["height"] < 40:
            continue  # decorative slivers
        # `smask` is the xref of this image's soft mask, or 0 when it has
        # none. Without it the keyed-out logos come through on solid black.
        mask_raw = None
        if smask:
            try:
                mask_raw = doc.extract_image(smask)["image"]
            except Exception:
                mask_raw = None
        dest = OUT_CLIENTS / f"client-{i:02d}.png"
        px_w, px_h, tint = save_logo(data["image"], dest, mask_raw)
        # Record how large the logo is drawn on the page. Normalising every
        # mark into one box flattens the careful size relationships in the
        # original layout, so the site scales them from these figures.
        rects = clients_page.get_image_rects(xref)
        w_pt = round(rects[0].width) if rects else data["width"]
        h_pt = round(rects[0].height) if rects else data["height"]
        group = (
            "International" if rects and rects[0].y0 >= intl_y else "Pan India"
        )
        logos.append(
            {
                "src": f"/clients/client-{i:02d}.png",
                "w": w_pt,
                "h": h_pt,
                "px": [px_w, px_h],
                "tint": tint,
                "group": group,
            }
        )
    print(f"\n  clients: {len(logos)} logos")

    # Office photographs.
    office = []
    office_page = doc[OFFICE_PAGE - 1]
    for i, (xref, *_) in enumerate(office_page.get_images(full=True)):
        try:
            data = doc.extract_image(xref)
        except Exception:
            continue
        if data["width"] < 400:
            continue
        dest = OUT_STUDIO / f"office-{i:02d}.jpg"
        save_jpeg(data["image"], dest, max_width=1400)
        office.append(f"/studio/office-{i:02d}.jpg")
    print(f"  office: {len(office)} photos")

    # Team page: the founders' own portraits, then the staff photographs.
    team, founders = [], {}
    team_page = doc[TEAM_PAGE - 1]
    for i, (xref, *_) in enumerate(team_page.get_images(full=True)):
        try:
            data = doc.extract_image(xref)
        except Exception:
            continue
        if i in TEAM_FOUNDERS:
            name = TEAM_FOUNDERS[i]
            save_jpeg(data["image"], OUT_TEAM / f"{name}.jpg", max_width=600)
            founders[name] = f"/team/{name}.jpg"
            continue
        if i < TEAM_SKIP_FIRST or data["width"] < 200:
            continue
        dest = OUT_TEAM / f"member-{i:02d}.jpg"
        save_jpeg(data["image"], dest, max_width=600)
        team.append(f"/team/member-{i:02d}.jpg")
    print(f"  team: {len(team)} staff + {len(founders)} founder portraits")

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(
        json.dumps(
            {
                "projects": entries,
                "clients": logos,
                "office": office,
                "team": team,
                "founderPortraits": founders,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"\nWrote {len(entries)} projects to {MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
