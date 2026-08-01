// Maps each delivered master film to the web media set generated for it.
//
// `start`/`duration` select the continuous stretch of footage that gets
// scrubbed on scroll — deliberately skipping the title card at the head of
// every film and the "Thank You"/credits card at the tail, neither of which
// belongs in a scroll animation.
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
    start: 8,
    duration: 45,
    frames: 120,
    posterAt: 20,
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
