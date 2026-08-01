"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
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
  className = "absolute inset-0",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
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
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
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
            transition={{ duration: 0.75, ease: easeLuxe }}
            style={{ flexBasis: 0 }}
            className="relative min-w-0 overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            {...(interactive
              ? {
                  type: "button" as const,
                  onClick: () => setFocused(i),
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
              transition={{ duration: 0.75, ease: easeLuxe }}
              className="pointer-events-none absolute inset-0 bg-ink"
            />
          </Slice>
        );
      })}

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
