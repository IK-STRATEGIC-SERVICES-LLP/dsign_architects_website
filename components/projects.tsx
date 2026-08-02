"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowUpRight, MapPin } from "lucide-react";
import { PROJECTS, type Project } from "@/lib/projects";
import {
  easeLuxe,
  SectionHeading,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion-primitives";

// Helix geometry — projects wind around the vertical gold pillar like a
// spiral: the active card faces the viewer at the pole, previous cards curl
// up and behind it, upcoming cards curl down. Cards stay billboarded (never
// edge-on) so every project remains readable throughout the rotation.
const ANGLE_STEP = 80;
const RADIUS = 330;
const CURL_GAP = 130;
const CARD_W = 340;
const CARD_H = 230;

const DEG = Math.PI / 180;

function normalizeAngle(a: number) {
  let n = a % 360;
  if (n > 180) n -= 360;
  if (n < -180) n += 360;
  return n;
}

// 1 when the card faces the viewer, 0 when it is directly behind the pillar.
function frontness(a: number) {
  return (Math.cos(a * DEG) + 1) / 2;
}

// The helix keeps winding past a full turn, so a card several steps away can
// still be "facing" the viewer while sitting far up or down the pillar.
// Fade purely by distance along the spiral so only nearby cards register.
const VISIBLE_STEPS = 2.6;
function falloff(a: number) {
  return Math.max(0, 1 - Math.abs(a) / ANGLE_STEP / VISIBLE_STEPS);
}

function HelixCard({
  project,
  baseAngle,
  rotation,
}: {
  project: Project;
  baseAngle: number;
  rotation: MotionValue<number>;
}) {
  const rel = useTransform(rotation, (r) => baseAngle + r);

  const transform = useTransform(rel, (a) => {
    const x = Math.sin(a * DEG) * RADIUS;
    const y = (a / ANGLE_STEP) * CURL_GAP;
    const z = (Math.cos(a * DEG) - 1) * RADIUS;
    const scale = 0.55 + 0.45 * frontness(a);
    return `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(
      1
    )}px) scale(${scale.toFixed(3)})`;
  });
  const opacity = useTransform(rel, (a) => (0.35 + 0.65 * frontness(a)) * falloff(a));
  const zIndex = useTransform(rel, (a) => Math.round(frontness(a) * falloff(a) * 100));
  const pointerEvents = useTransform(rel, (a) =>
    Math.abs(normalizeAngle(a)) < ANGLE_STEP / 2 ? "auto" : "none"
  ) as MotionValue<"auto" | "none">;
  const labelOpacity = useTransform(rel, (a) =>
    Math.max(0, 1 - Math.abs(normalizeAngle(a)) / (ANGLE_STEP / 2))
  );

  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{
        width: CARD_W,
        height: CARD_H,
        marginLeft: -CARD_W / 2,
        marginTop: -CARD_H / 2,
        transform,
        opacity,
        zIndex,
        pointerEvents,
      }}
    >
      <Link
        href={`/projects/${project.slug}`}
        className="group relative block h-full w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
      >
        <Image
          src={project.image}
          alt={`${project.title} — ${project.category.toLowerCase()} project in ${project.location}`}
          fill
          sizes="340px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />
        <motion.div
          style={{ opacity: labelOpacity }}
          className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3"
        >
          <span className="rounded-full glass px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
            {project.category}
          </span>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 transition-all duration-300 group-hover:bg-gold group-hover:text-ink">
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </span>
        </motion.div>
      </Link>
    </motion.div>
  );
}

function truncate(text: string, max: number) {
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}…`;
}

function ActiveProjectPanel({ project }: { project: Project }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={project.slug}
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -28 }}
        transition={{ duration: 0.45, ease: easeLuxe }}
        className="flex flex-col items-start gap-4"
      >
        <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
          {project.category}
          {project.year ? ` · ${project.year}` : ""}
        </span>
        <h3 className="overflow-hidden font-display text-4xl leading-tight tracking-tight text-porcelain xl:text-5xl">
          <motion.span
            initial={{ y: "110%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 0.6, delay: 0.05, ease: easeLuxe }}
            className="block"
          >
            {project.title}
          </motion.span>
        </h3>
        <p className="flex items-center gap-2 text-sm text-mist">
          <MapPin className="h-4 w-4 text-gold" aria-hidden />
          {project.location}
        </p>
        <p className="max-w-md text-base leading-relaxed text-mist">
          {truncate(project.description, 140)}
        </p>
        <Link
          href={`/projects/${project.slug}`}
          className="group mt-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-soft px-6 py-3 text-sm font-semibold text-ink transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        >
          View Project
          <ArrowUpRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}

function ProjectsHelix() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const totalRotation = (PROJECTS.length - 1) * ANGLE_STEP;
  const rawRotation = useTransform(scrollYProgress, [0, 1], [0, -totalRotation]);
  const rotation = useSpring(rawRotation, {
    stiffness: 90,
    damping: 24,
    restDelta: 0.01,
  });
  const cueOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.min(
      PROJECTS.length - 1,
      Math.max(0, Math.round(v * (PROJECTS.length - 1)))
    );
    setActiveIndex(next);
  });

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="relative w-full bg-ink"
      style={{ height: `${PROJECTS.length * 110}vh` }}
    >
      <div className="sticky top-0 flex h-svh w-full flex-col overflow-hidden">
        <div className="px-6 pt-24">
          <SectionHeading
            eyebrow="Selected Work"
            title="Buildings That Speak for Themselves"
          />
        </div>

        <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-12 items-center gap-8 px-8">
          <div className="col-span-5">
            <ActiveProjectPanel project={PROJECTS[activeIndex]} />
          </div>

          <div className="relative col-span-7 h-full" style={{ perspective: 1200 }}>
            {/* The pillar — vertical axis of the helix */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-gold/50 to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_18px_4px_rgba(217,164,65,0.5)]"
            />

            {PROJECTS.map((project, i) => (
              <HelixCard
                key={project.slug}
                project={project}
                baseAngle={i * ANGLE_STEP}
                rotation={rotation}
              />
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute right-8 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-3">
          {PROJECTS.map((_, i) => (
            <span
              key={i}
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full bg-gold transition-all duration-300 ${
                i === activeIndex ? "scale-150 opacity-100" : "opacity-30"
              }`}
            />
          ))}
        </div>

        <motion.div
          style={{ opacity: cueOpacity }}
          className="pointer-events-none absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-mist/60"
        >
          <span className="text-[10px] uppercase tracking-[0.3em]">Scroll to rotate</span>
        </motion.div>

        <Link
          href="/projects"
          className="absolute bottom-8 right-8 z-20 inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-porcelain transition-colors duration-200 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        >
          View All Work
          <ArrowUpRight className="h-4 w-4 text-gold" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

function ProjectCard({ project, sizes }: { project: Project; sizes: string }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group relative block aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
    >
      <Image
        src={project.image}
        alt={`${project.title} — ${project.category.toLowerCase()} project in ${project.location}`}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
      <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4 rounded-2xl glass-strong p-5 transition-transform duration-300 group-hover:-translate-y-1">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
            {project.category}
          </span>
          <h3 className="mt-1 font-display text-lg text-porcelain">{project.title}</h3>
          <p className="text-sm text-mist">{project.location}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 transition-all duration-300 group-hover:bg-gold group-hover:text-ink">
          <ArrowUpRight className="h-5 w-5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

const AUTO_ADVANCE_MS = 4200;
// How long the carousel waits after a swipe before taking over again, so
// auto-advance never yanks the deck out from under someone browsing.
const RESUME_AFTER_MS = 7000;

function ProjectsMobileCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const resumeAtRef = useRef(0);

  const scrollToIndex = (i: number) => {
    const track = trackRef.current;
    const card = track?.children[i] as HTMLElement | undefined;
    if (!track || !card) return;
    track.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
  };

  // Track which card is snapped, so the dots and the auto-advance both agree
  // with wherever the user has swiped to.
  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    let nearest = 0;
    let best = Infinity;
    Array.from(track.children).forEach((child, i) => {
      const d = Math.abs((child as HTMLElement).offsetLeft - track.scrollLeft);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    activeRef.current = nearest;
    setActive(nearest);
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Idle in the background rather than advancing off-screen.
    let onScreen = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
      },
      { threshold: 0.35 }
    );
    io.observe(track);

    const id = window.setInterval(() => {
      if (!onScreen || Date.now() < resumeAtRef.current) return;
      scrollToIndex((activeRef.current + 1) % PROJECTS.length);
    }, AUTO_ADVANCE_MS);

    return () => {
      window.clearInterval(id);
      io.disconnect();
    };
  }, []);

  const holdAutoAdvance = () => {
    resumeAtRef.current = Date.now() + RESUME_AFTER_MS;
  };

  return (
    <section id="projects" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Selected Work"
          title="Buildings That Speak for Themselves"
          description="A cross-section of recent commissions — each one shaped by its site, its climate, and the people it serves."
        />
      </div>

      <div
        ref={trackRef}
        onScroll={handleScroll}
        onPointerDown={holdAutoAdvance}
        onTouchStart={holdAutoAdvance}
        className="relative mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {PROJECTS.map((project) => (
          <div
            key={project.slug}
            className="w-[85%] shrink-0 snap-center sm:w-[60%]"
          >
            <ProjectCard project={project} sizes="(min-width: 640px) 60vw, 85vw" />
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        {PROJECTS.map((project, i) => (
          <button
            key={project.slug}
            type="button"
            aria-label={`Show ${project.title}`}
            aria-current={i === active}
            onClick={() => {
              holdAutoAdvance();
              scrollToIndex(i);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold ${
              i === active ? "w-6 bg-gold" : "w-1.5 bg-gold/30"
            }`}
          />
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-porcelain transition-colors duration-200 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        >
          View All Work
          <ArrowUpRight className="h-4 w-4 text-gold" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

function ProjectsFallbackGrid() {
  return (
    <section
      id="projects"
      className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32 lg:px-8"
    >
      <SectionHeading
        eyebrow="Selected Work"
        title="Buildings That Speak for Themselves"
        description="A cross-section of recent commissions — each one shaped by its site, its climate, and the people it serves."
      />
      <StaggerGroup className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((project, i) => (
          <StaggerItem key={project.slug} className={i === 0 || i === 3 ? "lg:col-span-2" : ""}>
            <ProjectCard
              project={project}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}

export function Projects() {
  // The server always renders the helix; the first client render must match
  // it or React flags a hydration mismatch. Media-query state is therefore
  // read only after mount, swapping layout post-hydration.
  const [mode, setMode] = useState<"helix" | "carousel" | "grid">("helix");

  useEffect(() => {
    const mqCompact = window.matchMedia("(max-width: 1024px)");
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Reduced motion wins outright — a deck that advances itself is exactly
    // what that preference is asking us not to do.
    const update = () =>
      setMode(
        mqMotion.matches ? "grid" : mqCompact.matches ? "carousel" : "helix"
      );
    update();
    mqCompact.addEventListener("change", update);
    mqMotion.addEventListener("change", update);
    return () => {
      mqCompact.removeEventListener("change", update);
      mqMotion.removeEventListener("change", update);
    };
  }, []);

  if (mode === "grid") return <ProjectsFallbackGrid />;
  if (mode === "carousel") return <ProjectsMobileCarousel />;
  return <ProjectsHelix />;
}
