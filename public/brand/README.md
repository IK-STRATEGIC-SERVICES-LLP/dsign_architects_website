# D'sign Architects — logo assets

Vector lockups traced from the studio's delivered artwork
(`public/logo-nobg-original.png`, 1029×242). The script is hand-drawn
signature artwork, not a typeface, so these are a trace of the real thing
rather than the name re-set in a font — there is no font that reproduces it.

Fidelity of the trace against the source alpha mask: **IoU 98.28%**.

## Files

| File | Script | ARCHITECTS | Use on |
|---|---|---|---|
| `dsign-logo.svg` | gold | `currentColor` | inline SVG only — inherits text colour |
| `dsign-logo-on-dark.svg` | gold | porcelain `#f3f5f8` | dark surfaces |
| `dsign-logo-on-light.svg` | gold | ink `#080d17` | light surfaces, print, documents |
| `dsign-logo-mono-white.svg` | white | white | photography, single-colour print, embroidery |
| `dsign-logo-mono-ink.svg` | ink | ink | faxes, engraving, watermarks, single-colour print |
| `dsign-logo-stacked.svg` | gold | `currentColor` | narrow columns, square-ish spaces |
| `dsign-monogram.svg` | gold | — | avatars, favicons, stamps, small marks |
| `dsign-monogram-tile.svg` | gold on ink tile | — | app icon, favicon, social avatar |
| `dsign-copyright-glyph.svg` | `currentColor` | — | the © that was baked into the master |

`dsign-logo.svg` is the primary. The `on-dark` / `on-light` pair exists
because `currentColor` only resolves when the SVG is inlined — an `<img>` or
a CSS `background-image` renders in its own document and cannot see the host
page's colour. Reach for those two whenever the logo is not inlined.

## Choosing a variant

The wordmark, not the script, is what breaks. The gold script holds up on
almost anything; ARCHITECTS is thin, flat-coloured, and disappears when it
matches its background. **Pick the variant by what is behind the wordmark**,
not by what the page's theme is called.

The navbar is the case that makes this concrete: it has no backing at the top
of the home page, so the logo sits on a bright hero there and on dark glass
once scrolled. It swaps variants on the same flag that draws the backing
(`components/navbar.tsx`). A single baked colour is wrong on one of the two —
that is exactly why ARCHITECTS was invisible over the hero before.

## Clear space and minimum sizes

Clear space on all four sides is **25% of the lockup's height**. Nothing —
type, rules, image edges, other logos — inside that.

The lockup is 987 × 207, and ARCHITECTS is only 23 units of that 207, so its
cap height is **11.1% of whatever height you set**:

| Lockup height | ARCHITECTS cap height | Verdict |
|---|---|---|
| 104px (`xl`) | 11.6px | fully readable |
| 56px (`lg`) | 6.2px | readable |
| 40px (`md`) | 4.4px | decorative — reads as texture, not a word |
| below 32px | under 3.6px | do not use — switch to the monogram |

Below about 48px the wordmark is a texture rather than a word. That is
acceptable in a navbar, where the script carries the recognition, and not
acceptable in print or anywhere the studio's full name has to be legible.
Use `dsign-logo-stacked.svg` or `dsign-monogram.svg` instead.

The monogram tile is drawn with the `D` alone at 72% of the tile height. The
apostrophe sits 30px clear of the `D` in the master, and keeping it inside a
square tile shrinks the letter enough to matter at 16px. Even so, a thin
signature script is inherently weak at favicon size — that is a property of
this mark, not a defect in the file.

## Don't

- Don't re-colour the script. The gold ramp is measured off the artwork.
- Don't add effects. Drop shadows, bevels, outlines, glows: none.
- Don't stretch. Always scale proportionally.
- Don't rebuild the lockup by placing the script and wordmark by hand — the
  spacing is part of the artwork.
- Don't put the `©` back into a lockup. It is a legal notice, not part of the
  mark, and it is illegible below roughly 300px wide. Set it as type instead.
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
`#6f5a26` at the top through `#a38435` and `#d9a441` to `#ecc468` at the
bottom. The accented `E` in ARCHITECTS is flat `#cab36a` — it is too small to
carry a gradient, which would read as a smudge across 22 units of letter.

## Regenerating

The assets are generated, not hand-edited, so every variant stays in
registration. If the artwork is ever redelivered, re-run the trace rather
than editing these files. The pipeline is three steps — map the artwork's
connected components, trace them to béziers, compose the lockups — and lives
in the session notes for this branch; the trace verifies itself by
re-rasterising every béziers and comparing IoU against the source mask.

## Weight

18.6 KB gzipped for a lockup, against 58 KB for the PNG it replaces, and
resolution-independent at any size.
