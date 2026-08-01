"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
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

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Carousel container */}
      <div className="relative h-[400px] sm:h-[500px] lg:h-[550px] w-full overflow-hidden rounded-3xl">
        {/* Slides */}
        {projects.map((project, i) => {
          const isActive = i === activeIndex;
          const isPrev = (i + 1) % projects.length === activeIndex;
          const isNext = i === (activeIndex + 1) % projects.length;

          return (
            <motion.div
              key={project.slug}
              initial={false}
              animate={{
                opacity: isActive ? 1 : isPrev ? 0.3 : 0,
                x: isActive ? 0 : isPrev ? -100 : 100,
              }}
              transition={{ duration: 0.75, ease: easeLuxe }}
              className="absolute inset-0"
            >
              <Link
                href={`/projects/${project.slug}`}
                className="group relative block h-full w-full overflow-hidden rounded-3xl border border-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                <Image
                  src={project.image}
                  alt={`${project.title} — ${project.location}`}
                  fill
                  sizes="(min-width: 1024px) 100vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  priority={isActive}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/25 to-transparent" />

                {/* Content overlay - only visible when active */}
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: easeLuxe }}
                    className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 sm:p-8"
                  >
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
                        {project.category}
                      </span>
                      <h3 className="mt-1 font-display text-2xl sm:text-3xl text-porcelain">
                        {project.title}
                      </h3>
                      <p className="text-sm text-mist">{project.location}</p>
                    </div>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 transition-all duration-300 group-hover:bg-gold group-hover:text-ink">
                      <ArrowUpRight className="h-6 w-6" aria-hidden />
                    </span>
                  </motion.div>
                )}
              </Link>
            </motion.div>
          );
        })}
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

      {/* Thumbnail preview strip on the right */}
      <div className="mt-8 hidden lg:flex gap-3">
        {projects.map((project, i) => (
          <motion.button
            key={project.slug}
            onClick={() => {
              setActiveIndex(i);
              setPaused(true);
            }}
            className="group relative h-20 w-20 overflow-hidden rounded-lg border border-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            whileHover={{ scale: 1.05 }}
            aria-label={`View ${project.title}`}
            aria-current={i === activeIndex}
          >
            <Image
              src={project.image}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
            />
            <motion.div
              animate={{ opacity: i === activeIndex ? 0 : 0.5 }}
              className="pointer-events-none absolute inset-0 bg-ink"
            />
            {i === activeIndex && (
              <motion.div
                layoutId="active-thumbnail-border"
                className="absolute inset-0 rounded-lg border-2 border-gold"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
