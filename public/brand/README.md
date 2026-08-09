# D'sign Architects — logo assets

Vector lockups traced from the studio's delivered artwork
(`public/logo-nobg-original.png`, 1029×242), plus PNG and JPEG exports
rendered from the same paths. The script is hand-drawn signature artwork,
not a typeface, so these are a trace of the real thing rather than the name
re-set in a font — no font reproduces it.

Fidelity of the trace against the source alpha mask: **IoU 97.6%**.

## Vector — use these on the web

| File | Script | ARCHITECTS | Use on |
|---|---|---|---|
| `dsign-logo.svg` | gold | `currentColor` | inline SVG only — inherits text colour |
| `dsign-logo-on-dark.svg` | gold | porcelain `#f3f5f8` | dark surfaces |
| `dsign-logo-on-light.svg` | gold | ink `#080d17` | light surfaces |
| `dsign-logo-mono-white.svg` | white | white | photography, one-colour print, embroidery |
| `dsign-logo-mono-ink.svg` | ink | ink | engraving, watermarks, one-colour print |
| `dsign-logo-stacked.svg` | gold | `currentColor` | narrow columns, square-ish spaces |
| `dsign-monogram.svg` | gold | — | avatars, stamps, small marks |
| `dsign-monogram-tile.svg` | gold on ink tile | — | app icon, favicon, social avatar |
| `dsign-copyright-glyph.svg` | `currentColor` | — | the © on its own |

`dsign-logo.svg` is the primary. The `on-dark` / `on-light` pair exists
because `currentColor` only resolves when the SVG is inlined — an `<img>` or
a CSS `background-image` renders in its own document and cannot see the host
page's colour. Reach for those two whenever the logo is not inlined.

## Raster — use these for signatures, documents, print

In `raster/`. Rendered from the same paths at 4× supersampling, so they are
the same mark as the SVG, not a re-drawing.

**PNG keeps transparency.** Use it for email signatures, slides, documents —
anywhere the logo sits on a background you don't control.

| File | For |
|---|---|
| `dsign-logo-on-light-{512,1024,2048}.png` | light/white backgrounds — the usual choice for email |
| `dsign-logo-on-dark-{512,1024,2048}.png` | dark backgrounds |
| `dsign-logo-mono-white-1024.png` | over photography |
| `dsign-logo-mono-ink-1024.png` | one-colour reproduction |
| `dsign-monogram-tile-{64,128,256,512}.png` | avatars, app icons, social profiles |

**JPEG cannot hold transparency**, so the background is baked in. Only use it
where PNG is not accepted — some older systems and print workflows.

| File | Background |
|---|---|
| `dsign-logo-on-white-{1024,2048}.jpg` | white |
| `dsign-logo-on-ink-{1024,2048}.jpg` | ink `#080d17` |

For an **email signature**, use `dsign-logo-on-light-512.png` and set its
displayed width to about 180–220px. Mail clients scale badly, so supplying a
file 2–3× the display size is what keeps it crisp on high-DPI screens.

## Choosing a variant

The wordmark, not the script, is what breaks. The gold script holds up on
almost anything; ARCHITECTS is thin, flat-coloured, and disappears when it
matches its background. **Pick by what is behind the wordmark**, not by what
the page's theme is called.

The navbar is the case that makes this concrete: it has no backing at the top
of the home page, so the logo sits on a bright hero there and on dark glass
once scrolled. It swaps variants on the same flag that draws the backing
(`components/navbar.tsx`). A single baked colour is wrong on one of the two —
which is exactly why ARCHITECTS was invisible over the hero before.

## Clear space and minimum sizes

Clear space on all four sides is **25% of the lockup's height**. Nothing —
type, rules, image edges, other logos — inside that.

The lockup is 1026 × 207, and ARCHITECTS is only 23 units of that 207, so its
cap height is **11.1% of whatever height you set**:

| Lockup height | ARCHITECTS cap height | Verdict |
|---|---|---|
| 104px | 11.6px | fully readable |
| 56px | 6.2px | readable |
| 40px | 4.4px | decorative — reads as texture, not a word |
| below 32px | under 3.6px | do not use — switch to the monogram |

Below about 48px the wordmark is a texture rather than a word. Acceptable in
a navbar, where the script carries the recognition; not acceptable in print
or anywhere the studio's full name has to be legible. Use the stacked lockup
or the monogram instead.

The monogram tile draws the `D` alone, scaled so its **wider** dimension fills
78% of the tile. The `D` is 212 × 136 — wider than tall — so sizing it by
height overflows a square tile and clips both sides. Even fitted correctly, a
thin signature script is inherently weak at 16px; that is a property of this
mark, not a defect in the file.

## The ©

The © is part of the lockup. It is baked into the delivered master and is
what the production site serves, so the lockups keep it.

It is also the one element built two ways, because its two halves need
opposite treatment.

The **enclosing ring is drawn**, not traced: it is a plain circle with no
letterform in it, and a trace of a 31px circle stays polygonal however it is
smoothed. It uses the measured geometry — centreline r 14.03, stroke 3.39,
centred at (1009.49, 205.49) in lockup space — so it is exact at any size.

The **C inside is traced**, because it is a serif letterform with flared
terminals. Redrawing it as a round-capped arc looked cleaner in isolation and
was simply the wrong mark; it did not match the artwork.

Both generators implement this split, and they have to agree — otherwise the
PNG and the SVG drift into two slightly different marks.

## Don't

- Don't re-colour the script. The gold ramp is measured off the artwork.
- Don't add effects — drop shadows, bevels, outlines, glows.
- Don't stretch. Always scale proportionally.
- Don't rebuild the lockup by placing the script and wordmark by hand — the
  spacing is part of the artwork.
- Don't use JPEG where PNG will do. The script's edges sit on flat colour,
  which is exactly what JPEG's ringing shows up on.
- Don't use `logo.png` or `logo-nobg-original.png` for anything new. They are
  the raster originals, kept only as the trace's source of truth.

## Colour

| Token | Hex | Role |
|---|---|---|
| `--gold` | `#d9a441` | brand gold, the ramp's 72% stop |
| `--gold-soft` | `#f0d48a` | highlight |
| `--ink` | `#080d17` | wordmark on light, tile background |
| `--porcelain` | `#f3f5f8` | wordmark on dark |

The script's gold is a gradient, not a flat colour, measured off the artwork:
a mostly-vertical ramp (axis ≈106°, leaning slightly left) from deep bronze
`#6f5a26` through `#a38435` and `#d9a441` to `#ecc468`. The accented `E` in
ARCHITECTS is flat `#cab36a` — too small to carry a gradient, which would
read as a smudge across 22 units of letter.

## Regenerating

The assets are generated, not hand-edited, so no variant can drift out of
registration with the others. If the artwork is ever redelivered, re-run the
trace rather than editing these files. The trace verifies itself by
re-rasterising every bézier and comparing IoU against the source mask, and
the mask is blurred and re-thresholded before contours are taken — without
that step the smallest glyphs come out lumpy at poster scale.

## Weight

A lockup is ~37KB raw, **~13KB gzipped**, against 58KB for the PNG it
replaces — and resolution-independent at any size.
