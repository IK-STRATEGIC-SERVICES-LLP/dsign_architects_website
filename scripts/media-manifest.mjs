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

const DESKTOP = [
  {
    slug: "ulwe-penthouse",
    source: "public/videos/homehero/PROPOSED INTERIOR WORK FOR 4 BHK PENT HOUSE AT 12th FLOOR ULWE FOR Mr. FAYAZ MUJAHID. (1).mp4",
    start: 4,
    duration: 46,
    frames: 150,
    // The living room, and the studio's mark and phone number cropped off the
    // top of it. See posterCropTop in build-media.mjs.
    posterAt: 26,
    posterCropTop: 0.13,
  },
  {
    // Recut so the film ends by going through the gate.
    //
    // The master never shows that. What it has, at 86-97s, is the camera
    // standing inside the gate and retreating as the great timber doors
    // swing closed — the monument avenue narrowing to a slit. Run backwards
    // it is precisely the ending wanted: the doors part and the camera walks
    // through into the grounds. Hence `reverse` on the last window; see
    // build-media.mjs for why that is safe in a scrub.
    slug: "shiv-shrushti",
    source: "public/videos/01. Shiv Shrushti - Landmark of Baramati.mov",
    // Ordered to the studio's brief: come in on the left of the precinct,
    // travel right along the ramparts, settle on the centre, then go through
    // the gate. The master does not run in that order, so the windows below
    // are lifted out of it and concatenated — which is what `segments` is
    // for. Each ends clear of the fades between shots (30s, 84s), or the
    // scrub would pass through black.
    segments: [
      { start: 9, end: 29, label: "Left — approach along the ramparts" },
      { start: 66, end: 83, label: "Right — warrior niches and fountains" },
      { start: 54, end: 64, label: "Middle — the gateway head-on" },
      // Ends at 86 rather than 85: the shot crossfades in until 86, and
      // reversed that fade would have been the final frame of the film.
      // Starts at 97.4, just before the cut to the exterior at ~98.
      { start: 86, end: 97.4, reverse: true, label: "Gates open (reversed)" },
    ],
    // Up from 120. The cut is 58s against the old 45s and now carries four
    // beats rather than one continuous move, so this is a denser sample as
    // well as a longer one — 3.1 frames/sec against 2.7. Frames are shared
    // by window length, which gives the gate opening about 35 of them.
    frames: 180,
    posterAt: 30,
    posterCropTop: 0.11,
  },
  {
    slug: "yamai-lake",
    source: "public/videos/03. Yamai Devi Lake Redevelopment.mp4",
    start: 12,
    duration: 45,
    frames: 120,
    posterAt: 30,
    posterCropTop: 0.10,
  },
  {
    slug: "ss-villa-lucknow",
    source: "public/videos/06. Lucknow Villa .avi",
    start: 10,
    duration: 45,
    frames: 120,
    // 48s, not 22s: the old still carried "ELEVATION / Front Side" burnt
    // across its foot. This one is a clean three-quarter view. The top band
    // has to go regardless — every frame of this master is stamped with
    // another practice's logo, "GLOBAL DESIGN ... ARCHITECTS & INTERIOR
    // DESIGNER", which must not appear on the studio's own site.
    posterAt: 48,
    posterCropTop: 0.20,
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
    // This order is the studio's own, sent as their "Sequence for the Cover
    // Page" — six shots, not a cut assembled here. Do not reorder it or add
    // to it without them: the four clips left out (8, 12, Clip 4, Clip 7)
    // were dropped by them, not for any technical reason.
    //
    // It happens to run day -> dusk and outside -> inside -> outside, so no
    // extra work is needed to stop the light jumping backwards across a cut.
    segments: [
      { source: `${NASHIK_HQ}Clip 1.mp4`, label: "Street arrival" },
      { source: `${NASHIK_HQ}Clip 10.mp4`, label: "Front entrance" },
      { source: `${NASHIK_HQ}6.mp4`, label: "Living room" },
      { source: `${NASHIK_HQ}7.mp4`, label: "Entrance lobby" },
      { source: `${NASHIK_HQ}Clip 11.mp4`, label: "Pool deck" },
      { source: `${NASHIK_HQ}Clip 6.mp4`, label: "Covered walkway" },
    ],
    // 30 frames per shot, held constant as shots are added or dropped so the
    // apparent camera speed stays the same across edits — six shots want 180.
    // They are shared out by shot length rather than evenly, so the longer
    // clips do not appear to speed up.
    frames: 180,
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
    // 66s, not 34s: 34s is a night aerial that reads as a dark smudge in a
    // project card. This is the arcade and lit windows, the best-lit frame
    // in the film. Trimmed top and bottom for the phone number and the
    // "PARKING AREA" caption.
    posterAt: 66,
    posterCropTop: 0.16,
    posterCropBottom: 0.15,
  },
];

// Frame width in px — the canvas cover-scales from this, so it sets the
// ceiling on sharpness. 1280 @ q62 measured visually indistinguishable from
// 1440 @ q68 on these renders while cutting ~25% off the payload
// (~52KB/frame vs ~68KB).
export const FRAME_WIDTH = 1280;
/** libwebp quality (0-100). */
export const FRAME_QUALITY = 62;

// 640px wide at 4:5 is 640x800, which is 2x a 320pt phone plate. Going wider
// buys nothing visible and costs both payload and, more sharply, decoded
// bitmap: every extra 100px of width is another ~0.5MB per frame held
// resident on a device that will kill the tab for it.
const MOBILE_FRAME_WIDTH = 640;
const MOBILE_FRAME_QUALITY = 58;
/** Plate aspect, width / height. Mirrored by `aspect` in lib/projects.ts. */
export const MOBILE_ASPECT = 0.8;

/**
 * Derives the phone build of a desktop entry: same source, same cut, same
 * shot order — only the framing and the weight change.
 *
 * A phone cannot be handed the desktop set. Nashik's is 20MB on the wire and
 * roughly a gigabyte of decoded bitmap. But the reason for a separate build
 * is framing, not weight: a 16:9 frame covered into a 390x844 portrait
 * viewport shows the middle 26% of its width, which turns the studio's wide
 * shots into a slice of wall. Cropped to 4:5 and shown as a plate rather than
 * full-bleed, 45% of the width survives.
 *
 * Derived rather than written out per set so the two builds of a film can
 * never drift apart. Recut a film and its phone build follows automatically —
 * only the frame counts in lib/projects.ts need updating alongside.
 *
 * Half the desktop frame count, run over a shorter scroll (scrollLength 3 on
 * the client), lands at ~30 frames per viewport against the desktop's 36 —
 * near enough that the motion reads the same.
 */
const mobileOf = (entry) => ({
  ...entry,
  slug: `${entry.slug}-mobile`,
  frames: Math.round(entry.frames / 2),
  frameWidth: MOBILE_FRAME_WIDTH,
  frameQuality: MOBILE_FRAME_QUALITY,
  cropAspect: MOBILE_ASPECT,
});

export const MEDIA = [...DESKTOP, ...DESKTOP.map(mobileOf)];
