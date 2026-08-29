"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Images, MapPin, X } from "lucide-react";
import {
  PORTFOLIO_CATEGORIES,
  PORTFOLIO_PROJECTS,
  type PortfolioProject,
} from "@/lib/portfolio";
import { FocusSliceCarousel } from "@/components/focus-slice-carousel";
import { easeLuxe } from "@/components/motion-primitives";

const ALL = "All Work" as const;

export function PortfolioGrid() {
  const [filter, setFilter] = useState<string>(ALL);
  const [active, setActive] = useState<PortfolioProject | null>(null);
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);

  const closeLightbox = () => {
    setActive(null);
    setZoomedIndex(null);
  };

  const tabs = useMemo(() => {
    const present = PORTFOLIO_CATEGORIES.filter((c) =>
      PORTFOLIO_PROJECTS.some((p) => p.category === c)
    );
    return [ALL, ...present];
  }, []);

  const works = useMemo(
    () =>
      filter === ALL
        ? PORTFOLIO_PROJECTS
        : PORTFOLIO_PROJECTS.filter((p) => p.category === filter),
    [filter]
  );

  return (
    <div>
      {/* Category filter */}
      <div className="flex flex-wrap justify-center gap-2">
        {tabs.map((tab) => {
          const selected = tab === filter;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              aria-pressed={selected}
              className={`relative rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold ${
                selected
                  ? "text-ink"
                  : "glass text-mist hover:text-porcelain"
              }`}
            >
              {selected ? (
                <motion.span
                  layoutId="portfolio-filter-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-gold to-gold-soft"
                  transition={{ duration: 0.35, ease: easeLuxe }}
                />
              ) : null}
              <span className="relative">{tab}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-center text-sm text-mist">
        {works.length} {works.length === 1 ? "project" : "projects"}
      </p>

      {/* Masonry-ish grid */}
      <motion.div
        layout
        className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {works.map((work) => (
            <motion.button
              key={work.slug}
              layout
              type="button"
              onClick={() => setActive(work)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.4, ease: easeLuxe }}
              className="group relative block aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              {/* Projects the profile spreads over several pages show every
                  page here rather than claiming a tile each. */}
              <FocusSliceCarousel
                images={work.images}
                alt={`${work.title}${work.location ? ` — ${work.location}` : ""}`}
                className="absolute inset-0"
                showIndicator={false}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/25 to-transparent" />
              {work.images.length > 1 ? (
                <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink/70 px-2.5 py-1 text-[10px] font-semibold text-porcelain backdrop-blur-sm">
                  <Images className="h-3 w-3 text-gold" aria-hidden />
                  {work.images.length}
                </span>
              ) : null}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
                  {work.category}
                </span>
                <h3 className="mt-1 font-display text-base leading-snug text-porcelain">
                  {work.title}
                </h3>
                {work.location ? (
                  <p className="mt-0.5 text-xs text-mist">{work.location}</p>
                ) : null}
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {active ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeLightbox}
            role="dialog"
            aria-modal="true"
            aria-label={active.title}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 p-4 backdrop-blur-sm sm:p-8"
          >
            <button
              type="button"
              onClick={closeLightbox}
              aria-label="Close"
              className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full glass text-porcelain transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            <motion.figure
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35, ease: easeLuxe }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-full w-full max-w-7xl flex-col gap-4"
            >
              <div className="relative aspect-[2/1] w-full overflow-hidden rounded-2xl border border-gold/25">
                {active.images.length > 1 ? (
                  <FocusSliceCarousel
                    images={active.images}
                    alt={active.title}
                    className="absolute inset-0"
                    interactive
                    interval={3600}
                    focusRatio={5}
                    showArrows
                    sizes="(min-width: 1280px) 80vw, (min-width: 640px) 90vw, 100vw"
                    onSliceClick={setZoomedIndex}
                  />
                ) : (
                  <Image
                    src={active.images[0]}
                    alt={active.title}
                    fill
                    sizes="100vw"
                    className="cursor-zoom-in object-contain"
                    onClick={() => setZoomedIndex(0)}
                  />
                )}
              </div>
              <figcaption className="text-center">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                  {active.category}
                </span>
                <h3 className="mt-1 font-display text-2xl text-porcelain">
                  {active.title}
                </h3>
                {active.location ? (
                  <p className="mt-1 inline-flex items-center gap-2 text-sm text-mist">
                    <MapPin className="h-4 w-4 text-gold" aria-hidden />
                    {active.location}
                  </p>
                ) : null}
              </figcaption>
            </motion.figure>

            {/* Fullscreen image zoom — click overlay or bottom-center button to close */}
            <AnimatePresence>
              {zoomedIndex !== null ? (
                <motion.div
                  key="zoom-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setZoomedIndex(null)}
                  className="fixed inset-0 z-[110] flex cursor-zoom-out items-center justify-center bg-ink/95 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: easeLuxe }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative flex h-full w-full items-center justify-center"
                  >
                    <Image
                      src={active.images[zoomedIndex]}
                      alt={active.title}
                      fill
                      sizes="100vw"
                      className="object-contain"
                      priority
                    />
                    <button
                      type="button"
                      onClick={() => setZoomedIndex(null)}
                      aria-label="Close zoom"
                      className="absolute bottom-8 left-1/2 flex h-12 w-12 items-center justify-center -translate-x-1/2 rounded-full glass text-porcelain transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                    >
                      <X className="h-5 w-5" aria-hidden />
                    </button>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
