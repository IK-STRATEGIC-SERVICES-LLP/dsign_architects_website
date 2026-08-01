"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { Project } from "@/lib/projects";
import { easeLuxe } from "@/components/motion-primitives";

type Props = {
  projects: Project[];
  interval?: number;
};

export function ProjectsCarousel({ projects, interval = 4000 }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { margin: "-10% 0px" });
  const reduceMotion = useReducedMotion();

  const running = inView && !paused && !reduceMotion && projects.length > 1;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % projects.length);
    }, interval);
    return () => clearInterval(id);
  }, [running, interval, projects.length]);

  const getIndex = (offset: number) => (activeIndex + offset + projects.length) % projects.length;

  const handlePrev = () => {
    setActiveIndex((i) => (i - 1 + projects.length) % projects.length);
    setPaused(true);
  };

  const handleNext = () => {
    setActiveIndex((i) => (i + 1) % projects.length);
    setPaused(true);
  };

  const getProject = (index: number) => projects[index];

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Five-item carousel container with depth effect */}
      <div className="relative h-[400px] sm:h-[500px] lg:h-[550px] w-full" style={{ overflow: 'visible' }}>
        <div className="relative h-full w-full px-4 lg:px-0" style={{ perspective: '1000px' }}>
          {/* Left-Left project (back left, most blurred) */}
          <motion.div
            key={`left-left-${getIndex(-2)}`}
            initial={false}
            animate={{
              opacity: 0.15,
              x: -380,
              y: 30,
              scale: 0.5,
              zIndex: 0
            }}
            transition={{ duration: 0.6, ease: easeLuxe }}
            className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-1/5"
            style={{ willChange: 'transform' }}
          >
            <Link
              href={`/projects/${getProject(getIndex(-2)).slug}`}
              className="group relative block h-full w-full overflow-hidden rounded-2xl border border-white/10"
            >
              <Image
                src={getProject(getIndex(-2)).image}
                alt={`${getProject(getIndex(-2)).title}`}
                fill
                sizes="(min-width: 1024px) 25vw, 0"
                className="object-cover blur-sm"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/50 to-transparent" />
            </Link>
          </motion.div>

          {/* Left project (front left, slightly blurred) */}
          <motion.div
            key={`left-${getIndex(-1)}`}
            initial={false}
            animate={{
              opacity: 0.4,
              x: -260,
              y: 16,
              scale: 0.65,
              zIndex: 2
            }}
            transition={{ duration: 0.6, ease: easeLuxe }}
            className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-1/4"
            style={{ willChange: 'transform' }}
          >
            <Link
              href={`/projects/${getProject(getIndex(-1)).slug}`}
              className="group relative block h-full w-full overflow-hidden rounded-2xl border border-white/10"
            >
              <Image
                src={getProject(getIndex(-1)).image}
                alt={`${getProject(getIndex(-1)).title}`}
                fill
                sizes="(min-width: 1024px) 33vw, 0"
                className="object-cover blur-xs"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />
            </Link>
          </motion.div>

          {/* Center project (main, sharp and prominent) */}
          <motion.div
            key={`center-${activeIndex}`}
            initial={false}
            animate={{
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
              zIndex: 5
            }}
            transition={{ duration: 0.6, ease: easeLuxe }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full lg:w-7/12"
            style={{ willChange: 'transform' }}
          >
            <Link
              href={`/projects/${getProject(activeIndex).slug}`}
              className="group relative block h-full w-full overflow-hidden rounded-3xl border-2 border-white/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold shadow-2xl"
            >
              <Image
                src={getProject(activeIndex).image}
                alt={`${getProject(activeIndex).title} — ${getProject(activeIndex).location}`}
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/25 to-transparent" />

              {/* Content overlay */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: easeLuxe }}
                className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 sm:p-8"
              >
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
                    {getProject(activeIndex).category}
                  </span>
                  <h3 className="mt-1 font-display text-2xl sm:text-3xl text-porcelain">
                    {getProject(activeIndex).title}
                  </h3>
                  <p className="text-sm text-mist">{getProject(activeIndex).location}</p>
                </div>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 transition-all duration-300 group-hover:bg-gold group-hover:text-ink">
                  <ArrowUpRight className="h-6 w-6" aria-hidden />
                </span>
              </motion.div>
            </Link>
          </motion.div>

          {/* Right project (front right, slightly blurred) */}
          <motion.div
            key={`right-${getIndex(1)}`}
            initial={false}
            animate={{
              opacity: 0.4,
              x: 260,
              y: 16,
              scale: 0.65,
              zIndex: 2
            }}
            transition={{ duration: 0.6, ease: easeLuxe }}
            className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-1/4"
            style={{ willChange: 'transform' }}
          >
            <Link
              href={`/projects/${getProject(getIndex(1)).slug}`}
              className="group relative block h-full w-full overflow-hidden rounded-2xl border border-white/10"
            >
              <Image
                src={getProject(getIndex(1)).image}
                alt={`${getProject(getIndex(1)).title}`}
                fill
                sizes="(min-width: 1024px) 33vw, 0"
                className="object-cover blur-xs"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />
            </Link>
          </motion.div>

          {/* Right-Right project (back right, most blurred) */}
          <motion.div
            key={`right-right-${getIndex(2)}`}
            initial={false}
            animate={{
              opacity: 0.15,
              x: 380,
              y: 30,
              scale: 0.5,
              zIndex: 0
            }}
            transition={{ duration: 0.6, ease: easeLuxe }}
            className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-1/5"
            style={{ willChange: 'transform' }}
          >
            <Link
              href={`/projects/${getProject(getIndex(2)).slug}`}
              className="group relative block h-full w-full overflow-hidden rounded-2xl border border-white/10"
            >
              <Image
                src={getProject(getIndex(2)).image}
                alt={`${getProject(getIndex(2)).title}`}
                fill
                sizes="(min-width: 1024px) 25vw, 0"
                className="object-cover blur-sm"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/50 to-transparent" />
            </Link>
          </motion.div>
        </div>

        {/* Navigation arrows */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none flex justify-between px-2 lg:px-4 z-20">
          <motion.button
            type="button"
            onClick={handlePrev}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 transition-all duration-300 hover:bg-gold hover:text-ink hover:ring-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            aria-label="Previous project"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </motion.button>

          <motion.button
            type="button"
            onClick={handleNext}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 transition-all duration-300 hover:bg-gold hover:text-ink hover:ring-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            aria-label="Next project"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </motion.button>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {projects.map((_, i) => (
          <motion.button
            key={i}
            type="button"
            onClick={() => {
              setActiveIndex(i);
              setPaused(true);
            }}
            animate={{
              scaleX: i === activeIndex ? 2.5 : 1,
              opacity: i === activeIndex ? 1 : 0.4,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-1.5 w-1.5 rounded-full bg-gold transition-all duration-300"
            aria-label={`Go to project ${i + 1}`}
            aria-current={i === activeIndex}
          />
        ))}
      </div>
    </div>
  );
}
