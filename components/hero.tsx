"use client";

import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Play } from "lucide-react";
import { easeLuxe } from "@/components/motion-primitives";
import { PROJECTS } from "@/lib/projects";

// Still from the studio's own Shiv Shrushti film, so the hero shows real
// work rather than stock photography.
const HERO_IMAGE_SRC = "/media/shiv-shrushti/poster.webp";

// On compact screens the scroll-driven Ken Burns has very little scroll to
// work with, so the hero cycles the project posters instead. Desktop keeps
// the single still — there the helix already carries the work.
const HERO_SLIDES = [
  HERO_IMAGE_SRC,
  ...PROJECTS.map((p) => p.image).filter((src) => src !== HERO_IMAGE_SRC),
];
const SLIDE_MS = 5200;

function useHeroSlideshow(sectionRef: React.RefObject<HTMLElement | null>) {
  const reduceMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setEnabled(false);
      return;
    }
    const mq = window.matchMedia("(max-width: 1024px)");
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [reduceMotion]);

  useEffect(() => {
    if (!enabled) {
      setIndex(0);
      return;
    }
    const el = sectionRef.current;
    let onScreen = true;
    const io = el
      ? new IntersectionObserver(([e]) => (onScreen = e.isIntersecting), {
          threshold: 0.1,
        })
      : null;
    if (io && el) io.observe(el);

    const id = window.setInterval(() => {
      if (onScreen) setIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, SLIDE_MS);

    return () => {
      window.clearInterval(id);
      io?.disconnect();
    };
  }, [enabled, sectionRef]);

  return { enabled, index };
}

const HEADLINE_LINES = ["Architecture,", "Interiors", "and Execution"];

// Only claims the studio can evidence: the founding year, the disciplines
// listed in its profile, and the sectors it has delivered in. Previous
// figures here (18+ years, 250+ projects, 40+ awards, 12 countries) were
// placeholder copy and contradicted the 2015 founding date.
const STATS = [
  { value: "2015", label: "Established" },
  { value: "8", label: "Disciplines" },
  { value: "EPC", label: "Capable" },
  { value: "Pan-India", label: "& Overseas" },
];

function DustParticles() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  const particles = Array.from({ length: 22 }, (_, i) => ({
    left: (i * 43) % 100,
    top: (i * 67) % 100,
    size: 1.5 + ((i * 7) % 3),
    duration: 9 + (i % 6) * 2,
    delay: (i % 7) * 0.6,
  }));

  return (
    <div aria-hidden className="absolute inset-0 z-[2] overflow-hidden">
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-gold-soft/70"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -70, 0],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const bgScale = useTransform(scrollYProgress, [0, 1], [1, reduceMotion ? 1 : 1.22]);
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const bgBlur = useTransform(scrollYProgress, [0, 1], [0, 8]);
  const bgFilter = useTransform(bgBlur, (v) => `blur(${v}px)`);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.5], ["0%", "-6%"]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  const { enabled: slideshow, index: slide } = useHeroSlideshow(sectionRef);
  const slides = slideshow ? HERO_SLIDES : [HERO_IMAGE_SRC];

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative min-h-svh w-full overflow-hidden bg-ink"
      aria-label="D'Sign Architects introduction"
    >
      {/* Cinematic background — Ken Burns zoom + drift tied to scroll */}
      <motion.div
        aria-hidden
        style={{ scale: bgScale, y: bgY, filter: bgFilter }}
        className="absolute inset-0 z-0"
      >
        {slides.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover transition-opacity duration-[1400ms] ease-out"
            style={{ opacity: i === slide ? 1 : 0 }}
          />
        ))}
        {/* Cinematic grade + vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/30 to-ink" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(8,13,23,0.65)_100%)]" />
        <div className="grain-overlay" />
      </motion.div>

      <DustParticles />

      {/* Foreground content — natural flex flow so the headline block and the
          bottom bar share space instead of overlapping on short viewports */}
      <motion.div
        style={{ opacity: contentOpacity, y: contentY }}
        className="relative z-10 flex min-h-svh flex-col"
      >
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-28 text-center sm:px-8">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeLuxe }}
            className="mb-6 inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-gold"
          >
            <span className="h-px w-8 bg-gold/60" aria-hidden />
            Multidisciplinary Design &amp; EPC Practice
            <span className="h-px w-8 bg-gold/60" aria-hidden />
          </motion.span>

          <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-porcelain sm:text-6xl lg:text-7xl xl:text-8xl">
            {HEADLINE_LINES.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-1">
                <motion.span
                  initial={{ y: "110%" }}
                  animate={{ y: "0%" }}
                  transition={{
                    duration: 0.9,
                    delay: 0.3 + i * 0.14,
                    ease: easeLuxe,
                  }}
                  className={
                    i === 1
                      ? "block bg-gradient-to-br from-porcelain via-gold-soft to-gold bg-clip-text text-transparent"
                      : "block"
                  }
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.95, ease: easeLuxe }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-mist"
          >
            From private residences to landmark commercial spaces, we design
            buildings where light, material, and emotion meet — spaces that
            serve people today and endure for generations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1, ease: easeLuxe }}
            className="mt-8 flex flex-col items-center gap-6 sm:flex-row"
          >
            <a
              href="#contact"
              className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-soft px-8 py-4 text-sm font-semibold text-ink transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              Contact Us
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden
              />
            </a>
            <a
              href="#projects"
              className="group inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-porcelain/90 transition-colors duration-200 hover:text-porcelain focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 transition-colors duration-200 group-hover:border-gold group-hover:bg-gold/10">
                <Play className="h-3.5 w-3.5 fill-current" aria-hidden />
              </span>
              Explore Our Work
            </a>
          </motion.div>
        </div>

        {/* Bottom credit line + scroll cue — sits below the headline block, never over it */}
        <div className="flex shrink-0 flex-col items-center gap-6 pb-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.3, ease: easeLuxe }}
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-6 text-center text-[10px] uppercase tracking-[0.25em] text-mist/70 sm:gap-x-6 sm:text-xs"
          >
            {STATS.map((stat, i) => (
              <span key={stat.label} className="flex items-center gap-4 sm:gap-6">
                {i > 0 && <span className="h-3 w-px bg-white/15" aria-hidden />}
                <span>
                  <span className="font-semibold text-porcelain/90">{stat.value}</span>{" "}
                  {stat.label}
                </span>
              </span>
            ))}
          </motion.div>

          <motion.div
            style={{ opacity: cueOpacity }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.5, ease: easeLuxe }}
            className="flex flex-col items-center gap-2 text-mist/60"
          >
            <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, 6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="h-4 w-4" aria-hidden />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
