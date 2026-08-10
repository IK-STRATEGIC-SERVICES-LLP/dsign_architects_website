// Maps each delivered master film to the web media set generated for it.
//
// `start`/`duration` select the continuous stretch of footage that gets
// scrubbed on scroll — deliberately skipping the title card at the head of
// every film and the "Thank You"/credits card at the tail, neither of which
// belongs in a scroll animation.
//
// `segments` is the alternative to `start`/`duration`, for films that are cut
// as a reel of separate shots rather than one continuous move. Each entry is a
// `{ start, end }` window, and the built sequence is the windows concatenated
// in listed order. Frames are shared out in proportion to each window's length,
// so the apparent camera speed stays even across the cut.
//
// A segment may also carry its own `source`, which is how a set is assembled
// when the studio delivers each shot as a separate file instead of one reel.
// Such a segment usually wants the whole clip, so `start`/`end` can be left
// off — the build probes the file and uses its full length. `posterSource`
// likewise picks which clip the poster still is grabbed from, since the
// opening shot is rarely the best one to hold on.
//
// Masters live in public/videos (gitignored). Output lands in public/media.

// The studio's per-shot 4K masters for the Nashik villa, delivered one file
// per shot. Names are the studio's own and are not in running order — the
// order below is the cut, not the numbering.
const NASHIK_HQ = "public/videos/homehero/hightQualityClips/";

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
    // Built from the studio's per-shot 4K masters, not the 240297 reel this
    // set used to come from. That reel was a 1080p export with the studio's
    // logo burnt into the top-left and a caption chip burnt into every shot,
    // which cost a 122px top crop plus an inpainting pass
    // (scripts/remove-captions.py) and still left the frames soft. These
    // clips are clean 3840x2160 masters — no overlays, no crop, no inpaint.
    //
    // The cut is a walkthrough: arrive from the street, up to the door,
    // through the lobby into the living rooms, then out to the pool deck.
    // It also runs day -> evening -> dusk, so the light never jumps
    // backwards across a cut.
    segments: [
      { source: `${NASHIK_HQ}Clip 1.mp4`, label: "Street arrival" },
      { source: `${NASHIK_HQ}Clip 10.mp4`, label: "Front entrance" },
      // The beat that makes the cut into the house read as a walk rather
      // than a jump: this is the room behind the front door, and the living
      // room's own sofa and dining area are visible at its edge, so the
      // shots that follow land somewhere already seen.
      { source: `${NASHIK_HQ}7.mp4`, label: "Entrance lobby" },
      { source: `${NASHIK_HQ}8.mp4`, label: "Lobby, living-room side" },
      { source: `${NASHIK_HQ}6.mp4`, label: "Living room" },
      { source: `${NASHIK_HQ}12.mp4`, label: "Family lounge" },
      { source: `${NASHIK_HQ}Clip 6.mp4`, label: "Covered walkway" },
      { source: `${NASHIK_HQ}Clip 4.mp4`, label: "Rear elevation" },
      { source: `${NASHIK_HQ}Clip 11.mp4`, label: "Pool deck" },
      { source: `${NASHIK_HQ}Clip 7.mp4`, label: "Pool deck with screen" },
    ],
    // 30 frames per shot, held constant as shots are added or dropped so the
    // apparent camera speed stays the same across edits — the old 5-shot cut
    // wanted 150, these 10 want 300. They are shared out by shot length
    // rather than evenly, so the longer clips do not appear to speed up.
    frames: 300,
    // Worth spending here in a way the old reel never was: at 1080p, asking
    // for more than 1280px only enlarged the master's own compression. From
    // a 4K source 1600px is real detail, and it is the width at which the
    // canvas stops softening on a 1440p laptop.
    frameWidth: 1600,
    frameQuality: 72,
    // The dusk pool deck, not the opening shot. This still is only ever seen
    // in lite mode (phones, reduced-motion, data-saver), where it stands in
    // for the whole sequence — so it should be the most striking frame in
    // the film, not the one the scrub happens to start on.
    posterSource: `${NASHIK_HQ}Clip 11.mp4`,
    posterAt: 3,
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
