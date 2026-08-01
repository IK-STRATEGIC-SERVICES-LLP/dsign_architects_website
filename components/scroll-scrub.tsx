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
  /** Section height as a multiple of the viewport — controls scrub length. */
  scrollLength?: number;
  /** Shown once the sequence finishes, e.g. to hint at the section below. */
  showScrollCue?: boolean;
  className?: string;
};

const framePath = (slug: string, i: number) =>
  `/media/${slug}/frames/${String(i + 1).padStart(4, "0")}.webp`;

// Captions clear before the very end so they never collide with whatever
// section follows.
const CAPTION_EXIT_AT = 0.94;

export function ScrollScrub({
  slug,
  frameCount,
  poster,
  chapters = [],
  scrollLength = 3.5,
  showScrollCue = true,
  className,
}: ScrollScrubProps) {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | undefined)[]>([]);
  const progressRef = useRef(0);
  const drawnRef = useRef(-1);
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

  // Progressive preload: every 8th frame first so scrubbing works almost
  // immediately, then backfill the gaps for full smoothness.
  useEffect(() => {
    if (lite) return;
    let cancelled = false;
    imagesRef.current = new Array(frameCount);

    const load = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new window.Image();
        img.onload = () => {
          // Only keep frames that actually decoded — storing a broken image
          // would make the nearest-frame search pick a blank.
          imagesRef.current[i] = img;
          resolve();
        };
        img.onerror = () => resolve();
        img.src = framePath(slug, i);
      });

    (async () => {
      const stride = 8;
      const coarse: number[] = [];
      for (let i = 0; i < frameCount; i += stride) coarse.push(i);
      await Promise.all(coarse.map(load));
      if (cancelled) return;
      setReady(true);
      drawnRef.current = -1;

      const rest = Array.from({ length: frameCount }, (_, i) => i).filter(
        (i) => i % stride !== 0
      );
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
  }, [slug, frameCount, lite]);

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
        Math.round(progressRef.current * (frameCount - 1))
      );
      // Nearest already-loaded frame, so gaps during backfill never blank out.
      let index = target;
      if (!imagesRef.current[index]) {
        for (let d = 1; d < frameCount; d++) {
          if (imagesRef.current[target - d]) {
            index = target - d;
            break;
          }
          if (imagesRef.current[target + d]) {
            index = target + d;
            break;
          }
        }
      }
      const img = imagesRef.current[index];
      if (!img || index === drawnRef.current) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
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
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [lite, ready, frameCount]);

  const activeChapter = chapter >= 0 ? chapters[chapter] : undefined;

  return (
    <section
      ref={sectionRef}
      className={`relative w-full bg-ink ${className ?? ""}`}
      style={{ height: lite ? "100svh" : `${scrollLength * 100}vh` }}
    >
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {/* Poster: first paint, and the whole experience in lite mode. */}
        <Image
          src={poster}
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

        {/* Cinematic grade so overlaid type always stays legible. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/20 to-ink"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(8,13,23,0.7)_100%)]"
        />
        <div className="grain-overlay" />

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
                  className="flex flex-col items-center"
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
            className="pointer-events-none absolute inset-x-0 bottom-8 z-20 flex flex-col items-center gap-2 text-mist/70"
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
