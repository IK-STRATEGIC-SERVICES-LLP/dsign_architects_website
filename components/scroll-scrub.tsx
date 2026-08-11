"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { easeLuxe } from "@/components/motion-primitives";

// Scroll-driven film scrubbing, the technique behind Apple's product pages:
// the studio's render is pre-exported to a WebP frame sequence (see
// scripts/build-media.mjs) and painted to a canvas at whatever frame the
// scroll position maps to. Unlike seeking a <video>, this scrubs backwards
// as smoothly as forwards and behaves identically across browsers.

export type Chapter = { kicker: string; title: string };

/**
 * A second, phone-sized build of the same film — see the `nashik-villa-mobile`
 * entry in scripts/media-manifest.mjs. Supplying one is what lets a phone
 * scrub at all; without it phones keep the poster, which is still the right
 * answer for a set that has no phone build.
 *
 * The frames are cropped to a portrait plate rather than 16:9, and are shown
 * as a plate — letterboxed against the ink — rather than full-bleed. Covering
 * a 16:9 frame into a portrait viewport throws away three quarters of its
 * width, so full-bleed would undo the crop's whole purpose.
 */
export type MobileVariant = {
  /** Folder under /public/media for the phone build. */
  slug: string;
  frameCount: number;
  /** Section height as a multiple of the viewport. Shorter than desktop. */
  scrollLength?: number;
  /** Plate aspect as width / height. Must match the set's `cropAspect`. */
  aspect?: number;
};

export type ScrollScrubProps = {
  /** Folder under /public/media containing frames/, poster.webp, meta.json. */
  slug: string;
  frameCount: number;
  poster: string;
  chapters?: Chapter[];
  /** Phone build of the same film. Omit and phones keep the poster. */
  mobile?: MobileVariant;
  /**
   * Frame the scrub opens on, for films whose first second or two is a
   * title card rather than the work. Everything before it is neither shown
   * nor downloaded.
   */
  startFrame?: number;
  /** Section height as a multiple of the viewport — controls scrub length. */
  scrollLength?: number;
  /** Shown once the sequence finishes, e.g. to hint at the section below. */
  showScrollCue?: boolean;
  /**
   * Lays the studio's own logo over the opening frame, fading it out as the
   * scrub starts. Use this instead of leaning on a title card burnt into the
   * film: the placement is ours, it stays sharp at any size, and it does not
   * drift when the footage is recut.
   */
  logo?: boolean;
  className?: string;
};

// How far a substitute frame may sit from the one actually wanted. The shots
// in these films run ~8 frames at their shortest, so anything beyond a couple
// of frames risks painting a different room entirely — the sequence would
// flick to the wrong shot and snap back once the real frame arrived. Within
// this window a substitute is always the same shot, a hair early or late.
const NEIGHBOUR_LIMIT = 2;

// Compact (phone) mode never holds the whole sequence decoded. A 640x800
// frame is 2MB of bitmap once decoded, so 90 of them is 180MB — comfortably
// past the point where iOS reloads the tab out from under the visitor. Only a
// band around the playhead is kept, plus the permanent coarse skeleton, which
// peaks around 80MB.
//
// The window is generous enough to cover a flick: 10 frames each way is a
// third of a viewport of scroll at the speed this runs at, and the loader
// refills ahead of the playhead long before it is reached.
const COMPACT_WINDOW = 10;
// Frames are only dropped once they are this far out, so scrolling back and
// forth across the window's edge does not thrash the same frames in and out.
const COMPACT_EVICT = 16;
// How far the playhead must move before residency is recomputed. Reconciling
// on every painted frame would walk the array 60 times a second for nothing.
const RECONCILE_STEP = 3;

// Pointing a pending <img> at a data URI cancels its outstanding request.
// Crossing the breakpoint has to abort the old set's downloads, not merely
// ignore them: a rotation that swaps sets mid-load would otherwise leave
// megabytes of the abandoned sequence still coming down the wire. Setting
// `src` to "" would also abort, but resolves against the document URL in
// some browsers and fetches the page again.
const ABORT_SRC =
  "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

const framePath = (slug: string, i: number) =>
  `/media/${slug}/frames/${String(i + 1).padStart(4, "0")}.webp`;

// Captions clear before the very end so they never collide with whatever
// section follows.
const CAPTION_EXIT_AT = 0.94;

// The logo has cleared by the time the scrub is this far in — long enough to
// register as the opening title, short enough that it never sits over the
// walkthrough itself.
const LOGO_EXIT_AT = 0.1;

/**
 * lite    — poster only: reduced motion, data-saver, or a phone with no
 *           phone build to give it.
 * compact — the phone build, scrubbed as a portrait plate.
 * full    — the desktop build, scrubbed full-bleed.
 */
type Mode = "lite" | "compact" | "full";

export function ScrollScrub({
  slug,
  frameCount,
  poster,
  chapters = [],
  mobile,
  startFrame = 0,
  scrollLength = 3.5,
  showScrollCue = true,
  logo = false,
  className,
}: ScrollScrubProps) {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<(HTMLImageElement | undefined)[]>([]);
  const progressRef = useRef(0);
  const drawnRef = useRef(-1);
  // Last frame actually painted, so a missing frame can hold the picture
  // steady instead of blanking or jumping.
  const paintedRef = useRef(-1);
  const rafRef = useRef(0);
  // Set once the phone build's coarse pass has landed; called by the paint
  // loop to slide the resident window along with the playhead.
  const residencyRef = useRef<((target: number) => void) | null>(null);
  const reconciledRef = useRef(-Infinity);

  const [mode, setMode] = useState<Mode>("lite");
  // Which set the canvas is ready to paint, rather than a bare boolean:
  // crossing the breakpoint swaps the whole sequence out, and readiness has to
  // fall with it. Comparing against the active slug does that on render,
  // without an effect reaching back to reset a flag it just set.
  const [readySlug, setReadySlug] = useState<string | null>(null);
  const [chapter, setChapter] = useState(0);
  const [cueVisible, setCueVisible] = useState(true);

  const hasMobileBuild = Boolean(mobile);

  // Decide up front which build this device gets. Reduced motion and
  // data-saver always win: neither wants megabytes of frames, whatever the
  // screen. Below the breakpoint a phone gets the phone build if one exists,
  // and the poster if it does not — shipping it the desktop set would be
  // indefensible on both weight and framing.
  useEffect(() => {
    // Phones and tablets take the compact path; small laptops and up get the
    // full one. Any wider a cutoff and ordinary laptop windows lose it.
    //
    // The second clause is not redundant: a phone turned landscape is wider
    // than 768px — an iPhone Pro Max is 932 — and on width alone it would
    // cross into full mode and start pulling the 20MB desktop set on cellular.
    // `pointer: coarse` reports the *primary* input, so a touchscreen laptop
    // still reads as fine and keeps the full sequence.
    const small = window.matchMedia(
      "(max-width: 768px), (pointer: coarse) and (max-width: 1024px)"
    );
    const conn = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    const update = () => {
      if (reduceMotion || conn?.saveData) return setMode("lite");
      if (!small.matches) return setMode("full");
      setMode(hasMobileBuild ? "compact" : "lite");
    };
    update();
    small.addEventListener("change", update);
    return () => small.removeEventListener("change", update);
  }, [reduceMotion, hasMobileBuild]);

  const lite = mode === "lite";
  const compact = mode === "compact";
  const activeSlug = compact && mobile ? mobile.slug : slug;
  const activeCount = compact && mobile ? mobile.frameCount : frameCount;
  const activeLength =
    compact && mobile ? (mobile.scrollLength ?? 3) : scrollLength;
  // startFrame is expressed against the desktop set, so a phone build with
  // half the frames needs it rescaled rather than taken literally.
  const requested = Math.min(Math.max(0, startFrame), frameCount - 1);
  const first =
    compact && mobile
      ? Math.min(
          activeCount - 1,
          Math.round((requested / frameCount) * activeCount)
        )
      : requested;
  const ready = readySlug === activeSlug;

  // Progressive preload: a coarse pass first so scrubbing works almost
  // immediately, then either backfill the gaps (desktop) or keep a sliding
  // window resident around the playhead (phones).
  useEffect(() => {
    if (lite) return;
    let cancelled = false;
    imagesRef.current = new Array(activeCount);
    drawnRef.current = -1;
    paintedRef.current = -1;
    reconciledRef.current = -Infinity;

    const inflight = new Set<HTMLImageElement>();

    const load = (i: number) =>
      new Promise<void>((resolve) => {
        if (imagesRef.current[i]) return resolve();
        const img = new window.Image();
        inflight.add(img);
        img.onload = () => {
          inflight.delete(img);
          // Decode before publishing the frame, never on the way to the
          // canvas. drawImage on a frame that is loaded but still encoded
          // decodes it synchronously on the main thread — measured at 23ms
          // average and 371ms worst case for these stills, once per frame,
          // which is what makes the scrub hitch as you scroll. decode() does
          // the same work off-thread, after which drawImage costs ~0.02ms.
          //
          // Only frames that actually decoded get stored: keeping a broken
          // image would let the nearest-frame search paint a blank.
          const publish = () => {
            // Dropped if the set has been swapped out underneath us, so a
            // stale frame can never be painted against the new sequence.
            if (!cancelled) imagesRef.current[i] = img;
            resolve();
          };
          if (typeof img.decode === "function") img.decode().then(publish, publish);
          else publish();
        };
        img.onerror = () => {
          inflight.delete(img);
          resolve();
        };
        img.src = framePath(activeSlug, i);
      });

    // Deliberately NEIGHBOUR_LIMIT * 2, so that from the moment the coarse
    // pass lands every frame has a loaded neighbour close enough to stand in
    // for it. A wider stride leaves holes the paint loop can only answer by
    // freezing until the backfill catches up.
    const stride = NEIGHBOUR_LIMIT * 2;
    const skeleton = new Set<number>();
    for (let i = first; i < activeCount; i += stride) skeleton.add(i);

    (async () => {
      await Promise.all([...skeleton].map(load));
      if (cancelled) return;
      setReadySlug(activeSlug);
      drawnRef.current = -1;

      if (!compact) {
        const rest = Array.from(
          { length: activeCount - first },
          (_, i) => i + first
        ).filter((i) => !skeleton.has(i));
        // Small concurrent batches keep the network busy without stalling
        // interaction on the main thread.
        const size = 12;
        for (let i = 0; i < rest.length; i += size) {
          if (cancelled) return;
          await Promise.all(rest.slice(i, i + size).map(load));
        }
        return;
      }

      // Phones instead keep only a band around the playhead in memory. The
      // skeleton is never evicted, so a flick that outruns the loader still
      // finds something within NEIGHBOUR_LIMIT to paint rather than freezing.
      let busy = false;
      residencyRef.current = async (target: number) => {
        if (busy || cancelled) return;
        for (let i = first; i < activeCount; i++) {
          if (skeleton.has(i)) continue;
          if (Math.abs(i - target) > COMPACT_EVICT) imagesRef.current[i] = undefined;
        }

        // Nearest-first, so the frames about to be needed arrive first.
        const want: number[] = [];
        for (let d = 0; d <= COMPACT_WINDOW; d++) {
          for (const i of d === 0 ? [target] : [target + d, target - d]) {
            if (i >= first && i < activeCount && !imagesRef.current[i]) want.push(i);
          }
        }
        if (want.length === 0) return;

        busy = true;
        const size = 6;
        for (let i = 0; i < want.length; i += size) {
          if (cancelled) break;
          await Promise.all(want.slice(i, i + size).map(load));
        }
        busy = false;
      };
      // Prime it: the paint loop only reconciles once the playhead moves, and
      // a visitor who has not scrolled yet would otherwise sit on skeleton
      // frames alone.
      residencyRef.current(
        Math.min(
          activeCount - 1,
          first + Math.round(progressRef.current * (activeCount - 1 - first))
        )
      );
    })();

    return () => {
      cancelled = true;
      residencyRef.current = null;
      for (const img of inflight) {
        img.onload = null;
        img.onerror = null;
        img.src = ABORT_SRC;
      }
      inflight.clear();
      // Let the whole set go at once rather than waiting for each frame to
      // fall out of scope — this runs when the breakpoint is crossed, which
      // is exactly when the old set is dead weight.
      imagesRef.current = [];
    };
  }, [activeSlug, activeCount, lite, compact, first]);

  // Progress is measured from the section's live bounding rect rather than
  // framer's useScroll: this component mounts late (client-only import),
  // which leaves cached scroll offsets stale after a mid-page reload.
  useEffect(() => {
    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const range = rect.height - window.innerHeight;
      const p = range > 0 ? Math.min(1, Math.max(0, -rect.top / range)) : 0;
      progressRef.current = p;

      setChapter(
        chapters.length === 0 || p >= CAPTION_EXIT_AT
          ? -1
          : Math.min(chapters.length - 1, Math.floor(p * chapters.length))
      );
      setCueVisible(p < 0.06);

      // Driven straight from the scroll handler rather than through state:
      // this runs on every scroll event, and a re-render per frame would
      // compete with the canvas for the same budget.
      if (logoRef.current) {
        logoRef.current.style.opacity = String(
          Math.max(0, 1 - p / LOGO_EXIT_AT)
        );
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [chapters.length]);

  // Paint loop — only touches the canvas when the target frame changes.
  useEffect(() => {
    if (lite || !ready) return;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const target = Math.min(
        activeCount - 1,
        first + Math.round(progressRef.current * (activeCount - 1 - first))
      );

      // Compact mode only: slide the resident band along with the playhead.
      if (
        residencyRef.current &&
        Math.abs(target - reconciledRef.current) >= RECONCILE_STEP
      ) {
        reconciledRef.current = target;
        residencyRef.current(target);
      }

      // Nearest already-loaded frame, so gaps during backfill never blank out
      // — but only within NEIGHBOUR_LIMIT, since these films are cut reels and
      // a distant substitute would be a different room. The search stays at or
      // after `first` so a trimmed title card can't be pulled back in.
      let index = -1;
      if (imagesRef.current[target]) {
        index = target;
      } else {
        for (let d = 1; d <= NEIGHBOUR_LIMIT; d++) {
          if (target - d >= first && imagesRef.current[target - d]) {
            index = target - d;
            break;
          }
          if (target + d < activeCount && imagesRef.current[target + d]) {
            index = target + d;
            break;
          }
        }
      }
      // Nothing near enough has loaded: hold the picture rather than cut to
      // the wrong shot. The backfill will free it within a frame or two.
      if (index < 0) index = paintedRef.current;
      const img = index >= 0 ? imagesRef.current[index] : undefined;
      if (!img) return;

      // Resizing the backing store clears the canvas, so a resize has to force
      // a repaint even when the frame itself has not changed — otherwise a
      // viewport change while the frame holds steady (mobile hiding its
      // address bar mid-scroll) would leave the picture stretched or blank.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const resized = canvas.width !== w * dpr || canvas.height !== h * dpr;
      if (!resized && index === drawnRef.current) return;
      if (resized) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // object-fit: cover
      const scale = Math.max(
        (w * dpr) / img.naturalWidth,
        (h * dpr) / img.naturalHeight
      );
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, (w * dpr - dw) / 2, (h * dpr - dh) / 2, dw, dh);
      drawnRef.current = index;
      paintedRef.current = index;
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [lite, ready, activeCount, first]);

  const activeChapter = chapter >= 0 ? chapters[chapter] : undefined;
  // Whether anything is written over the foot of the film — the logo doesn't
  // count, it sits higher up, carries its own shadow, and has cleared within
  // the first tenth of the scrub.
  const hasOverlayText = chapters.length > 0 || showScrollCue;
  // On phones the film is a plate — full width, its own aspect, centred in the
  // viewport against the ink — rather than full-bleed. See MobileVariant.
  const plate = compact && mobile;
  const plateAspect = mobile?.aspect ?? 0.8;
  // Fit the plate inside the viewport on both axes. Width alone is enough in
  // portrait, but a landscape phone is far shorter than a 4:5 plate at full
  // width would be, and the picture would run off the top and bottom. Capping
  // the width at (viewport height x aspect) makes height the binding
  // constraint whenever the screen is the shorter way round. 92 rather than
  // 100 keeps a margin of ink so it still reads as a plate, not a crop.
  const plateStyle = {
    aspectRatio: String(plateAspect),
    width: `min(100%, ${(92 * plateAspect).toFixed(2)}dvh)`,
  };

  return (
    <section
      ref={sectionRef}
      className={`relative w-full bg-ink ${className ?? ""}`}
      // The scrub length stays in `vh` deliberately. `dvh` would shrink the
      // section as the address bar slides back in, moving the very scroll
      // range progress is measured against and making the film stutter
      // backwards. The sticky child below is the part that has to track the
      // visible viewport, and it does.
      style={{ height: lite ? "100dvh" : `${activeLength * 100}vh` }}
    >
      {/* `dvh`, not `svh`: at `svh` this is shorter than the viewport whenever
          the address bar is hidden, which leaves a band of bare ink under the
          film for the whole of the scroll. On desktop the two are identical. */}
      <div className="sticky top-0 flex h-dvh w-full items-center justify-center overflow-hidden">
        <div
          className={plate ? "relative overflow-hidden" : "absolute inset-0"}
          style={plate ? plateStyle : undefined}
        >
          {/* First paint. Where the sequence will actually run, this is the
              sequence's own opening frame, so the hand-off to the canvas is
              invisible — the poster is a still from partway through the film,
              and crossfading from that to frame one read as a glitch. Lite
              mode keeps the poster, since there it is the whole experience
              and an opening title card would make a poor hero. */}
          <Image
            src={lite ? poster : framePath(activeSlug, first)}
            alt=""
            fill
            priority
            sizes="100vw"
            className={`object-cover transition-opacity duration-700 ${
              ready && !lite ? "opacity-0" : "opacity-100"
            }`}
          />

          {!lite ? (
            <canvas
              ref={canvasRef}
              aria-hidden
              className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${
                ready ? "opacity-100" : "opacity-0"
              }`}
            />
          ) : null}

          {/* Cinematic grade, weighted to the edges rather than laid evenly over
              the picture: a short pass at the top to seat the navbar, and a
              gentle vignette. Nothing at the bottom.

              Scrubs with type over them get one extra layer at the foot, and
              only those. It replaces a grade that ran to solid ink at the
              bottom of the frame — that buried the bottom quarter of the
              picture, which was a poor trade once the masters became clean 4K
              renders.

              It cannot be dropped altogether, though, and the type's own shadow
              is not a substitute. Measured across this film, the frame behind
              the caption reaches luma 198 mean and 252 peak on the lit paving
              of the dusk shots. The porcelain title survives that on shadow
              alone; the 11px gold kicker (rgb 217,164,65) does not come close —
              it is the layer's binding constraint, and it fails WCAG AA even
              with the old solid grade, at 2.31:1 worst case.

              So the curve is shaped around the kicker's line at 80% depth,
              where it holds the same 0.60 alpha the old grade had — the point
              is to stop blacking out the picture, not to make the type harder
              to read than it already was. Everywhere else it is lighter than
              before, and it tops out at 0.72 instead of solid, so the foot of
              the frame still reads where previously there was nothing to see.
              Raising the kicker to AA needs ~0.76 alpha, which is essentially
              the old wash back again — a colour or size change to the kicker
              would buy it far more cheaply. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(8,13,23,0.36)_0%,transparent_22%,transparent_100%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_70%,rgba(8,13,23,0.26)_100%)]"
          />
          {hasOverlayText ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_55%,rgba(8,13,23,0.6)_80%,rgba(8,13,23,0.72)_100%)]"
            />
          ) : null}
          {/* Flat variant deliberately — see globals.css. The canvas underneath
              repaints on every scroll, and a blended layer over it re-blends
              each time. */}
          <div className="grain-overlay grain-overlay--flat" />

          {/* Our own mark, laid over the opening frame and faded out by the
              scroll handler. Sized in vw so it holds the same share of the
              frame at every width, and capped so it never outgrows the film.

              Legibility comes from stacked drop-shadows rather than a pool of
              ink behind the mark. Both hold the pale "ARCHITECTS" letters
              against a bright sky, but a radial scrim reads as a dark smudge
              sitting on the villa, while a shadow stack hugs the letterforms
              and leaves the render untouched around them. */}
          {logo ? (
            <div
              ref={logoRef}
              aria-hidden
              className="pointer-events-none absolute inset-0 z-20"
            >
              {/* Bottom-right, clear of the navbar. The 22% inset started as
                  clearance for burnt-in shot captions that the current masters
                  no longer carry, so dropping the mark nearer the corner is now
                  open if it is ever wanted. Kept where it is because it also
                  sits the mark on the frame's lower third rather than jammed
                  into the corner, which is the better placement regardless. */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: easeLuxe }}
                className="absolute bottom-[22%] right-[6%]"
              >
                {/* The vector lockup, not the raster master: this is the one
                    place the mark is drawn large — up to 360px wide from a
                    1029px source — so the PNG's edges were visibly stepped
                    here in a way they never are at navbar size. on-dark keeps
                    the pale wordmark the shadow stack above is tuned for. */}
                <Image
                  src="/brand/dsign-logo-on-dark.svg"
                  alt=""
                  width={1017}
                  height={207}
                  priority
                  unoptimized
                  // A tight, dense halo rather than a wide diffuse one: the
                  // mark has to hold over bright foliage as well as sky, and a
                  // soft glow simply washes out there. Wider on phones, where
                  // the portrait crop leaves it small.
                  className="h-auto w-[min(64vw,260px)] sm:w-[min(42vw,360px)] [filter:drop-shadow(0_1px_2px_rgba(8,13,23,1))_drop-shadow(0_0_7px_rgba(8,13,23,0.95))_drop-shadow(0_0_18px_rgba(8,13,23,0.9))]"
                />
              </motion.div>
            </div>
          ) : null}

          {chapters.length > 0 ? (
            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-end px-6 pb-24 text-center sm:pb-28">
              <AnimatePresence mode="wait">
                {activeChapter ? (
                  <motion.div
                    key={chapter}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.35, ease: easeLuxe }}
                    // A tight halo plus one wide soft pass, inherited by both
                    // lines. This has to hold pale type over the brightest
                    // frames in these films — sunlit curtains, white sofas —
                    // where a single soft glow simply washes out.
                    className="flex flex-col items-center [text-shadow:0_1px_2px_rgba(8,13,23,0.95),0_0_10px_rgba(8,13,23,0.9),0_0_30px_rgba(8,13,23,0.75)]"
                  >
                    <span className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-gold">
                      {activeChapter.kicker}
                    </span>
                    <h2 className="max-w-3xl font-display text-3xl text-porcelain sm:text-4xl lg:text-5xl">
                      {activeChapter.title}
                    </h2>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : null}
        </div>

        {/* Outside the plate: the cue belongs to the viewport, so on phones it
            sits in the ink below the film rather than over the picture. */}
        {showScrollCue && !lite ? (
          <motion.div
            animate={{ opacity: cueVisible ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            // drop-shadow rather than the caption's text-shadow: the chevron
            // is an SVG, which text-shadow does not touch.
            className="pointer-events-none absolute inset-x-0 bottom-8 z-20 flex flex-col items-center gap-2 text-mist/70 [filter:drop-shadow(0_1px_2px_rgba(8,13,23,0.95))_drop-shadow(0_0_10px_rgba(8,13,23,0.85))]"
          >
            <span className="text-[10px] uppercase tracking-[0.3em]">
              Scroll to explore
            </span>
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, 6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="h-4 w-4" aria-hidden />
            </motion.div>
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}
