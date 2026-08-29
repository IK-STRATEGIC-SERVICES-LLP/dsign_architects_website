"use client";

import Image from "next/image";
import type { MouseEvent, PointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { easeLuxe } from "@/components/motion-primitives";

/**
 * An expanding-slice gallery: the focused image holds most of the width
 * while the rest compress into vertical slices beside it, and focus walks
 * rightward on its own. Used for the projects the practice profile gives
 * several pages to, so one project stays one tile.
 *
 * The auto-advance is deliberately well-behaved — it only runs while the
 * carousel is on screen, stops while a visitor is hovering or tabbing
 * through it, and never starts at all under `prefers-reduced-motion`, where
 * the images become a plain static row instead.
 */

type Props = {
  images: string[];
  /** Describes the project; each slice is numbered off it for screen readers. */
  alt: string;
  /** Milliseconds each image holds focus before the carousel moves right. */
  interval?: number;
  /** How many times wider the focused slice is than an unfocused one. */
  focusRatio?: number;
  /** Renders slices as buttons so a visitor can pick one. Off inside a tile
   *  that is itself a button, since nested buttons are invalid. */
  interactive?: boolean;
  /** Shows the project's image count and a progress rail. */
  showIndicator?: boolean;
  /** Shows prev/next chevrons so a visitor can scroll focus manually. */
  showArrows?: boolean;
  /** Fires when an interactive slice is clicked, passing its index. */
  onSliceClick?: (index: number) => void;
  /**
   * Must position the carousel itself — the slices fill it absolutely, so
   * the root has to be a containing block with a height of its own. The
   * default covers the nearest positioned ancestor, which is what a tile
   * wants; anything passed here needs to do the same job.
   */
  className?: string;
  sizes?: string;
};

export function FocusSliceCarousel({
  images,
  alt,
  interval = 2800,
  focusRatio = 4,
  interactive = false,
  showIndicator = true,
  showArrows = false,
  className = "absolute inset-0",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  onSliceClick,
}: Props) {
  const [focused, setFocused] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  const reduceMotion = useReducedMotion();

  const running = inView && !paused && !reduceMotion && images.length > 1;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(
      () => setFocused((i) => (i + 1) % images.length),
      interval
    );
    return () => clearInterval(id);
  }, [running, interval, images.length]);

  // Wraps in both directions, so the last arrow-click from image one steps
  // back to the last image rather than doing nothing.
  const step = (direction: 1 | -1) =>
    setFocused((i) => (i + direction + images.length) % images.length);

  // Finger-swipe / drag support, on top of the arrow buttons. Tracked with
  // refs rather than state since a drag fires many pointer-move events and
  // none of them need to trigger a re-render themselves.
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const didSwipe = useRef(false);
  const SWIPE_THRESHOLD = 40;

  const onPointerDown = (e: PointerEvent) => {
    dragStart.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent) => {
    const start = dragStart.current;
    dragStart.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    // Ignore drags that are more vertical than horizontal, so a visitor
    // scrolling the page past the carousel doesn't also flip its focus.
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    setPaused(true);
    step(dx < 0 ? 1 : -1);
    // A swipe still ends in a click event on whatever slice the finger
    // lifted off of — flagged here and swallowed by onClickCapture below,
    // so dragging to the next image doesn't also zoom into it.
    didSwipe.current = true;
  };
  const onClickCapture = (e: MouseEvent) => {
    if (!didSwipe.current) return;
    didSwipe.current = false;
    e.stopPropagation();
    e.preventDefault();
  };

  // Trackpad two-finger swipe fires `wheel` events with a horizontal delta,
  // not the pointer events above — handled separately, and as a native
  // listener rather than React's onWheel, since React binds wheel listeners
  // passively and a passive listener can't preventDefault the browser's own
  // horizontal-scroll/back-navigation gesture.
  useEffect(() => {
    if (!showArrows) return;
    const el = ref.current;
    if (!el) return;

    let accumulated = 0;
    let locked = false;
    let gestureEndTimer: ReturnType<typeof setTimeout> | undefined;
    const GESTURE_GAP_MS = 150;
    const THRESHOLD = 60;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      // A horizontal component this size is unambiguously the visitor
      // steering the carousel, not an accidental page scroll — safe to
      // take over from the browser's own edge-swipe navigation.
      e.preventDefault();

      // A two-finger swipe reports dozens of small-delta events over its
      // ~300ms lifetime. Rearming this timeout on every one of them, rather
      // than on a fixed delay from the first, means `locked` covers the
      // whole gesture regardless of how long it runs — one swipe, one step
      // — and only clears once the events actually stop.
      clearTimeout(gestureEndTimer);
      gestureEndTimer = setTimeout(() => {
        accumulated = 0;
        locked = false;
      }, GESTURE_GAP_MS);

      if (locked) return;

      accumulated += e.deltaX;
      if (Math.abs(accumulated) > THRESHOLD) {
        setPaused(true);
        const direction = accumulated > 0 ? 1 : -1;
        setFocused((i) => (i + direction + images.length) % images.length);
        locked = true;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      clearTimeout(gestureEndTimer);
    };
  }, [showArrows, images.length]);

  // A single image needs none of this machinery.
  if (images.length === 1) {
    return (
      <div className={className}>
        <Image
          src={images[0]}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`flex gap-1 ${className}`}
      // pan-y leaves vertical page scrolling to the browser but stops it
      // eating a horizontal drag as a scroll gesture before onPointerUp
      // ever sees it.
      style={showArrows ? { touchAction: "pan-y" } : undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      {...(showArrows
        ? { onPointerDown, onPointerUp, onClickCapture }
        : {})}
    >
      {images.map((src, i) => {
        const isFocused = i === focused;
        const Slice = interactive ? motion.button : motion.div;

        return (
          <Slice
            key={src}
            // `flex-basis: 0` on every slice makes grow the sole arbiter of
            // width, so the ratio holds however many images there are.
            animate={{ flexGrow: isFocused ? focusRatio : 1 }}
            transition={{ duration: 0.4, ease: easeLuxe }}
            style={{ flexBasis: 0 }}
            className="relative min-w-0 overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            {...(interactive
              ? {
                  type: "button" as const,
                  onClick: () => {
                    setFocused(i);
                    onSliceClick?.(i);
                  },
                  "aria-label": `${alt} — image ${i + 1} of ${images.length}`,
                  "aria-current": isFocused,
                }
              : { "aria-hidden": !isFocused })}
          >
            <Image
              src={src}
              alt={interactive ? "" : isFocused ? alt : ""}
              fill
              sizes={sizes}
              className="object-cover"
            />
            {/* Unfocused slices sit back so the focused one leads the eye. */}
            <motion.div
              aria-hidden
              animate={{ opacity: isFocused ? 0 : 0.45 }}
              transition={{ duration: 0.4, ease: easeLuxe }}
              className="pointer-events-none absolute inset-0 bg-ink"
            />
          </Slice>
        );
      })}

      {showArrows ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPaused(true);
              step(-1);
            }}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink/60 text-porcelain backdrop-blur-sm transition-colors hover:bg-ink/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPaused(true);
              step(1);
            }}
            aria-label="Next image"
            className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink/60 text-porcelain backdrop-blur-sm transition-colors hover:bg-ink/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </>
      ) : null}

      {showIndicator ? (
        <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/70 px-2.5 py-1 backdrop-blur-sm">
          {images.map((src, i) => (
            <span
              key={src}
              className={`block h-1 rounded-full transition-all duration-500 ${
                i === focused ? "w-4 bg-gold" : "w-1 bg-porcelain/40"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
