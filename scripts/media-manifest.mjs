// Maps each delivered master film to the web media set generated for it.
//
// `start`/`duration` select the continuous stretch of footage that gets
// scrubbed on scroll — deliberately skipping the title card at the head of
// every film and the "Thank You"/credits card at the tail, neither of which
// belongs in a scroll animation.
//
// `segments` is the alternative to `start`/`duration`, for masters that are
// cut as a reel of separate shots rather than one continuous move. Each entry
// is a `{ start, end }` window into the master, and the built sequence is the
// windows concatenated in listed order. Frames are shared out in proportion to
// each window's length, so the apparent camera speed stays even across the cut.
//
// Masters live in public/videos (gitignored). Output lands in public/media.

export const MEDIA = [
  {
    slug: "ulwe-penthouse",
    source: "public/videos/homehero/PROPOSED INTERIOR WORK FOR 4 BHK PENT HOUSE AT 12th FLOOR ULWE FOR Mr. FAYAZ MUJAHID. (1).mp4",
    start: 4,
    duration: 46,
    frames: 150,
    posterAt: 26,
  },
  {
    slug: "shiv-shrushti",
    source: "public/videos/01. Shiv Shrushti - Landmark of Baramati.mov",
    start: 9,
    duration: 45,
    frames: 120,
    posterAt: 30,
  },
  {
    slug: "yamai-lake",
    source: "public/videos/03. Yamai Devi Lake Redevelopment.mp4",
    start: 12,
    duration: 45,
    frames: 120,
    posterAt: 30,
  },
  {
    slug: "ss-villa-lucknow",
    source: "public/videos/06. Lucknow Villa .avi",
    start: 10,
    duration: 45,
    frames: 120,
    posterAt: 22,
  },
  {
    slug: "nashik-villa",
    source: "public/videos/240297- Full Render Clip.mp4",
    // This master is a 4:33 reel, not a continuous move: 13.5s of stock
    // hillside footage carrying the title cards, then 40 hard-cut shots, then
    // a "Thank You" card. Scrubbing all 40 inside a hero-length scroll puts a
    // cut every ~60px of travel, which strobes. So this takes the shots that
    // carry the journey — arrival, then the grounds, then inside — and drops
    // the near-duplicate angles (the reel covers each of the six bedrooms
    // three times over, and the living room three times).
    //
    // Several of the reel's shot changes fade through black rather than cut,
    // and a window straddling one bakes black frames into the middle of the
    // scrub. Measured dips in this master, all avoided below:
    //   12.70-14.30  20.20-20.90  34.50-35.00
    //   103.00-105.20  162.30-162.60  268.00-273.50
    // The editor burnt the studio's logo into the top-left of the picture at
    // y 68-112 (measured by median-stacking frames from unrelated shots, so
    // only the static overlay survives). ffmpeg's `delogo` was tried first and
    // is unusable here — the mark sits over tree canopy on the opening shot
    // and interpolating it produces vertical smears far worse than the logo.
    // Cropping it off is clean; the cost is that the frame gets wider, so
    // filling the viewport crops ~20% off the sides.
    cropTop: 122,
    segments: [
      // Starts at 15.7 rather than 14.6: the fade up from the title card only
      // finishes at 15.65s, so an earlier start opens the whole page on a
      // half-exposed frame (luma 82 against this shot's 118).
      { start: 15.7, end: 20.1, label: "Birds eye view" },
      { start: 21.1, end: 27.1, label: "Front entrance" },
      { start: 27.5, end: 34.3, label: "Car entrance gate" },
      { start: 35.2, end: 41.6, label: "Car parking and entrance steps" },
      { start: 49.4, end: 57.6, label: "Pool area to dining" },
      { start: 58.1, end: 66.3, label: "Sunken bonfire sit-out" },
      { start: 74.1, end: 80.9, label: "Deck with barbeque gazebo" },
      { start: 88.6, end: 95.5, label: "Pool sit-out with fountain" },
      { start: 105.5, end: 111.5, label: "Living room" },
      { start: 132.5, end: 138.9, label: "Entrance lobby" },
      { start: 139.3, end: 145.7, label: "Staircase sit-out" },
      { start: 153.7, end: 157.6, label: "Kitchen and dining" },
      { start: 162.8, end: 168.7, label: "Bedroom 1" },
      { start: 218.2, end: 222.7, label: "Bedroom 4" },
      { start: 253.6, end: 258.2, label: "Bedroom 6" },
    ],
    frames: 180,
    // These renders are foliage-heavy and cost ~78KB/frame at the default
    // quality — 180 of those would be a 14MB hero. 54 holds up on this
    // material and keeps the set in line with the other slugs.
    frameQuality: 54,
    // The establishing aerial the sequence opens on, so the poster the mobile
    // and pre-load paths show is the same shot the scrub starts from.
    posterAt: 17.5,
  },
  {
    slug: "apti-villa",
    source: "public/videos/Apti,Mr Sajid Lakdawala 3D HD.mp4",
    start: 8,
    duration: 45,
    frames: 120,
    posterAt: 34,
  },
];

// Frame width in px — the canvas cover-scales from this, so it sets the
// ceiling on sharpness. 1280 @ q62 measured visually indistinguishable from
// 1440 @ q68 on these renders while cutting ~25% off the payload
// (~52KB/frame vs ~68KB).
export const FRAME_WIDTH = 1280;
/** libwebp quality (0-100). */
export const FRAME_QUALITY = 62;
