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

export type ScrollScrubProps = {
  /** Folder under /public/media containing frames/, poster.webp, meta.json. */
  slug: string;
  frameCount: number;
  poster: string;
  chapters?: Chapter[];
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

const framePath = (slug: string, i: number) =>
  `/media/${slug}/frames/${String(i + 1).padStart(4, "0")}.webp`;

// Captions clear before the very end so they never collide with whatever
// section follows.
const CAPTION_EXIT_AT = 0.94;

// The logo has cleared by the time the scrub is this far in — long enough to
// register as the opening title, short enough that it never sits over the
// walkthrough itself.
const LOGO_EXIT_AT = 0.1;

export function ScrollScrub({
  slug,
  frameCount,
  poster,
  chapters = [],
  startFrame = 0,
  scrollLength = 3.5,
  showScrollCue = true,
  logo = false,
  className,
}: ScrollScrubProps) {
  const first = Math.min(Math.max(0, startFrame), frameCount - 1);
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

  const [lite, setLite] = useState(true);
  const [ready, setReady] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [cueVisible, setCueVisible] = useState(true);

  // Decide up front whether this device gets the frame sequence at all.
  // Small screens, reduced-motion users and data-saver mode keep the poster:
  // downloading several MB of frames for them would be indefensible.
  useEffect(() => {
    // Phones and portrait tablets keep the poster; small laptops and up get
    // the sequence. Any wider a cutoff and ordinary laptop windows lose it.
    const compact = window.matchMedia("(max-width: 768px)");
    const conn = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    const update = () =>
      setLite(compact.matches || Boolean(reduceMotion) || Boolean(conn?.saveData));
    update();
    compact.addEventListener("change", update);
    return () => compact.removeEventListener("change", update);
  }, [reduceMotion]);

  // Progressive preload: a coarse pass first so scrubbing works almost
  // immediately, then backfill the gaps for full smoothness.
  useEffect(() => {
    if (lite) return;
    let cancelled = false;
    imagesRef.current = new Array(frameCount);

    const load = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new window.Image();
        img.onload = () => {
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
            imagesRef.current[i] = img;
            resolve();
          };
          if (typeof img.decode === "function") img.decode().then(publish, publish);
          else publish();
        };
        img.onerror = () => resolve();
        img.src = framePath(slug, i);
      });

    (async () => {
      // Deliberately NEIGHBOUR_LIMIT * 2, so that from the moment the coarse
      // pass lands every frame has a loaded neighbour close enough to stand in
      // for it. A wider stride leaves holes the paint loop can only answer by
      // freezing until the backfill catches up.
      const stride = NEIGHBOUR_LIMIT * 2;
      const coarse: number[] = [];
      for (let i = first; i < frameCount; i += stride) coarse.push(i);
      await Promise.all(coarse.map(load));
      if (cancelled) return;
      setReady(true);
      drawnRef.current = -1;

      const rest = Array.from(
        { length: frameCount - first },
        (_, i) => i + first
      ).filter((i) => !coarse.includes(i));
      // Small concurrent batches keep the network busy without stalling
      // interaction on the main thread.
      const size = 12;
      for (let i = 0; i < rest.length; i += size) {
        if (cancelled) return;
        await Promise.all(rest.slice(i, i + size).map(load));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, frameCount, lite, first]);

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
        frameCount - 1,
        first + Math.round(progressRef.current * (frameCount - 1 - first))
      );
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
          if (target + d < frameCount && imagesRef.current[target + d]) {
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
  }, [lite, ready, frameCount, first]);

  const activeChapter = chapter >= 0 ? chapters[chapter] : undefined;
  // Whether anything is written over the foot of the film — the logo doesn't
  // count, it sits higher up, carries its own shadow, and has cleared within
  // the first tenth of the scrub.
  const hasOverlayText = chapters.length > 0 || showScrollCue;

  return (
    <section
      ref={sectionRef}
      className={`relative w-full bg-ink ${className ?? ""}`}
      style={{ height: lite ? "100svh" : `${scrollLength * 100}vh` }}
    >
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {/* First paint. Where the sequence will actually run, this is the
            sequence's own opening frame, so the hand-off to the canvas is
            invisible — the poster is a still from partway through the film,
            and crossfading from that to frame one read as a glitch. Lite
            mode keeps the poster, since there it is the whole experience
            and an opening title card would make a poor hero. */}
        <Image
          src={lite ? poster : framePath(slug, first)}
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
