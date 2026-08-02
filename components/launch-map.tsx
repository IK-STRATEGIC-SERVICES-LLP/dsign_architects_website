"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Logo } from "@/components/logo";
import { WORLD_LAND } from "@/lib/world-land.generated";
import {
  CITY_LIGHTS,
  CITY_MARKERS,
  CITY_WEBS,
  FULL_VIEW,
  INDIA_BOUNDARY,
  INDIA_VIEW,
  MAHIM_BAY,
  MAP_H,
  MAP_W,
  MESH_NODES,
  MUMBAI_ARTERIALS,
  MUMBAI_COAST,
  MUMBAI_STREETS,
  MUMBAI_VIEW,
  NATIONAL_CORRIDORS,
  RIVERS,
  ROAD_MESH,
  project,
  toPath,
} from "@/lib/india-map";

const INDIA_PATH = toPath(INDIA_BOUNDARY, true);
// Two rings in one path: with evenodd, the bay reads as water cut out of the
// land rather than as a second island sitting on top of it.
const COAST_PATH = `${toPath(MUMBAI_COAST, true)} ${toPath(MAHIM_BAY, true)}`;
const ARTERIAL_PATHS = MUMBAI_ARTERIALS.map((line) => toPath(line));
const CORRIDOR_PATHS = NATIONAL_CORRIDORS.map((line) => toPath(line));
const RIVER_PATHS = RIVERS.map((line) => toPath(line));
const CITY_WEB_PATHS = CITY_WEBS.map((line) => toPath(line));
const ROAD_MESH_PATHS = ROAD_MESH.map((line) => toPath(line));
const MESH_POINTS = MESH_NODES.map((node) => project(node));
const GLOW_LIGHTS = CITY_LIGHTS.filter((l) => l.glow);
const POINT_LIGHTS = CITY_LIGHTS.filter((l) => !l.glow);
const CONTINENT_PATHS = WORLD_LAND;
const STREET_PATHS = MUMBAI_STREETS.map((line) => toPath(line));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

const centreOf = (b: typeof FULL_VIEW) => [b.x + b.w / 2, b.y + b.h / 2];

/** World → India → Mumbai. The scroll runs straight through both legs. */
const STAGES = [FULL_VIEW, INDIA_VIEW, MUMBAI_VIEW];
/** Where in the scroll each stage is reached. */
const STOPS = [0, 0.46, 1];

function buildViewBox(t: number) {
  const p = clamp01(t);
  const leg = p < STOPS[1] ? 0 : 1;
  const span = STOPS[leg + 1] - STOPS[leg];
  const k = easeInOutCubic(clamp01((p - STOPS[leg]) / span));

  const from = STAGES[leg];
  const to = STAGES[leg + 1];
  const [fx, fy] = centreOf(from);
  const [tx, ty] = centreOf(to);

  // Geometric, not linear — this zoom covers three orders of magnitude, and
  // interpolating the scale linearly would crawl at the start then lurch.
  const h = from.h * Math.pow(to.h / from.h, k);
  const w = from.w * Math.pow(to.w / from.w, k);
  const cx = lerp(fx, tx, k);
  const cy = lerp(fy, ty, k);

  return `${(cx - w / 2).toFixed(4)} ${(cy - h / 2).toFixed(4)} ${w.toFixed(
    4
  )} ${h.toFixed(4)}`;
}

export function LaunchMap() {
  const trackRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const reduceMotion = useReducedMotion();

  // The launch sequence owns the whole document, so document progress is the
  // sequence's progress — no element measurement to go stale.
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 26,
    restDelta: 0.0005,
  });

  // Driving the viewBox rather than a CSS transform keeps the zoom exact and
  // lets `vector-effect` hold every stroke at true hairline weight throughout.
  const viewBox = useTransform(progress, buildViewBox);
  useMotionValueEvent(viewBox, "change", (v) => {
    svgRef.current?.setAttribute("viewBox", v);
  });

  /**
   * Level of detail. India's ~2,900 individual settlement dots are sub-pixel
   * at world zoom — invisible, but the rasteriser still pays for every one of
   * them on every frame, which drops the opening from 60fps to about 3. Only
   * the 134 regional blooms are drawn until India actually fills the frame.
   */
  const [nearDetail, setNearDetail] = useState(false);
  const nearRef = useRef(false);
  useMotionValueEvent(progress, "change", (v) => {
    const near = v > 0.26;
    if (near !== nearRef.current) {
      nearRef.current = near;
      setNearDetail(near);
    }
  });

  // The world layer has to be gone before the India stage arrives — at that
  // zoom its gold fill would flood the frame as a flat wash.
  const worldOpacity = useTransform(progress, [0, 0.16, 0.34], [1, 0.9, 0]);
  // India's lights are lit from the opening frame, so the world map already
  // shows where this is going.
  const countryOpacity = useTransform(progress, [0, 0.78, 0.9], [1, 1, 0]);
  // Roads and rivers use non-scaling strokes, so at world zoom they would be
  // fixed-width lines packed into ~100px and read as a smudge. They arrive
  // only once India is large enough to carry them.
  const linesOpacity = useTransform(progress, [0.2, 0.44], [0, 1]);
  const cityOpacity = useTransform(progress, [0.26, 0.44, 0.7], [0, 1, 0]);
  const mumbaiOpacity = useTransform(progress, [0.7, 0.9], [0, 1]);
  const logoOpacity = useTransform(progress, [0.88, 0.99], [0, 1]);
  const logoScale = useTransform(progress, [0.88, 0.99], [0.94, 1]);
  const hintOpacity = useTransform(progress, [0, 0.06], [1, 0]);

  // Reduced motion gets the destination without the journey — no scroll
  // required, no zoom, just the mark and a way in.
  if (reduceMotion) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-10 bg-ink px-6 text-center">
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          className="h-[45svh] w-auto"
          aria-hidden
        >
          <path
            d={INDIA_PATH}
            fill="none"
            stroke="rgba(217,164,65,0.5)"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <Link
          href="/"
          className="flex flex-col items-center gap-6 rounded-3xl px-8 py-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        >
          <Logo size="xl" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
            Enter Site
          </span>
        </Link>
      </main>
    );
  }

  return (
    <main ref={trackRef} className="relative w-full bg-ink" style={{ height: "500svh" }}>
      <div className="sticky top-0 flex h-svh w-full items-center justify-center overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={buildViewBox(0)}
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
          aria-hidden
        >
          <defs>
            {/* A soft-edged lamp. Cheaper than an feGaussianBlur bloom, which
                would re-rasterise on every frame of the zoom. */}
            <radialGradient id="city-light">
              <stop offset="0%" stopColor="#fff3d2" stopOpacity="1" />
              <stop offset="14%" stopColor="#ffd88a" stopOpacity="0.85" />
              <stop offset="38%" stopColor="#f0b455" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#e0a83f" stopOpacity="0" />
            </radialGradient>
            {/* Landmass fill — warmer toward the equator so the flat gold
                silhouette still has some depth to it. */}
            <linearGradient id="land-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c9973a" />
              <stop offset="45%" stopColor="#e6b45c" />
              <stop offset="100%" stopColor="#b8862f" />
            </linearGradient>
            {/* Keeps every road, river and city web inside the coastline */}
            <clipPath id="india-clip">
              <path d={INDIA_PATH} />
            </clipPath>
            <clipPath id="mumbai-clip">
              <path d={COAST_PATH} clipRule="evenodd" />
            </clipPath>
          </defs>

          {/* Opening frame — the inhabited planet */}
          <motion.g style={{ opacity: worldOpacity }}>
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {CONTINENT_PATHS.map((d, i) => (
                <path
                  key={`land-${i}`}
                  d={d}
                  fill="url(#land-gold)"
                  stroke="rgba(255,214,128,0.55)"
                  strokeWidth={0.8}
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {/* India is cut dark out of the gold so its lights can burn
                  through it from the very first frame. */}
              <path
                d={INDIA_PATH}
                fill="#070c16"
                stroke="#ffe3a6"
                strokeWidth={1.1}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </motion.g>
          </motion.g>

          {/* National outline, drawn in on load */}
          <motion.g style={{ opacity: countryOpacity }}>
            <motion.path
              d={INDIA_PATH}
              fill="rgba(12,18,40,0.55)"
              stroke="rgba(217,164,65,0.35)"
              strokeWidth={1.1}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2.6, ease: [0.22, 1, 0.36, 1] }}
            />

            {/* The network inside the landmass */}
            <motion.g
              clipPath="url(#india-clip)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.6, delay: 1.4, ease: "easeOut" }}
            >
              {/* Stroke layers — held back until India is big enough to carry
                  them; see linesOpacity. */}
              <motion.g style={{ opacity: linesOpacity }}>
              {RIVER_PATHS.map((d, i) => (
                <path
                  key={`river-${i}`}
                  d={d}
                  fill="none"
                  stroke="rgba(120,140,175,0.28)"
                  strokeWidth={0.8}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {/* Roads read as the faint threads between lit places */}
              {ROAD_MESH_PATHS.map((d, i) => (
                <path
                  key={`mesh-${i}`}
                  d={d}
                  fill="none"
                  stroke="rgba(217,164,65,0.16)"
                  strokeWidth={0.5}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {CITY_WEB_PATHS.map((d, i) => (
                <path
                  key={`web-${i}`}
                  d={d}
                  fill="none"
                  stroke="rgba(245,199,107,0.2)"
                  strokeWidth={0.5}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              </motion.g>

              {/* Regional blooms — the only points that pay for a gradient */}
              {GLOW_LIGHTS.map((light, i) => (
                <circle
                  key={`glow-${i}`}
                  cx={light.x}
                  cy={light.y}
                  r={light.r}
                  fill="url(#city-light)"
                />
              ))}
              {/* Individual settlements — near detail only, see nearDetail */}
              {nearDetail &&
                POINT_LIGHTS.map((light, i) => (
                  <circle
                    key={`light-${i}`}
                    cx={light.x}
                    cy={light.y}
                    r={light.r}
                    fill="#ffd489"
                    fillOpacity={0.75}
                  />
                ))}
              {/* Hot cores, so the metros keep a hard bright centre */}
              {nearDetail &&
                MESH_POINTS.map(([cx, cy], i) => (
                  <circle
                    key={`node-${i}`}
                    cx={cx}
                    cy={cy}
                    r={0.9}
                    fill="rgba(255,236,190,0.9)"
                  />
                ))}
              <motion.g style={{ opacity: linesOpacity }}>
                {CORRIDOR_PATHS.map((d, i) => (
                  <path
                    key={`road-${i}`}
                    d={d}
                    fill="none"
                    stroke="rgba(217,164,65,0.62)"
                    strokeWidth={1}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </motion.g>
            </motion.g>
          </motion.g>

          {/* Where the studio has built */}
          <motion.g style={{ opacity: cityOpacity }}>
            {CITY_MARKERS.map((city) => {
              const [cx, cy] = project(city.at);
              const isMumbai = city.name === "Mumbai";
              return (
                <circle
                  key={city.name}
                  cx={cx}
                  cy={cy}
                  r={isMumbai ? 5 : 3}
                  fill={isMumbai ? "var(--gold)" : "rgba(243,245,248,0.55)"}
                />
              );
            })}
          </motion.g>

          {/* Mumbai close-up — shoreline and arterials */}
          <motion.g style={{ opacity: mumbaiOpacity }}>
            <path
              d={COAST_PATH}
              fillRule="evenodd"
              fill="rgba(217,164,65,0.05)"
              stroke="rgba(255,214,128,0.85)"
              strokeWidth={1.5}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <g clipPath="url(#mumbai-clip)">
              {STREET_PATHS.map((d, i) => (
                <path
                  key={`street-${i}`}
                  d={d}
                  fill="none"
                  stroke="rgba(240,196,120,0.42)"
                  strokeWidth={0.65}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
            {/* Trunk roads, drawn twice: a soft wide pass for the glow, then a
                bright hairline on top. Same trick a lit road map uses. */}
            {ARTERIAL_PATHS.map((d, i) => (
              <path
                key={`glowline-${i}`}
                d={d}
                fill="none"
                stroke="rgba(255,196,90,0.22)"
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {ARTERIAL_PATHS.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="#ffd27a"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </motion.g>
        </svg>

        {/* Scroll cue */}
        <motion.div
          style={{ opacity: hintOpacity }}
          className="pointer-events-none absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-mist/70"
        >
          <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
          <ChevronDown className="h-4 w-4 animate-bounce" aria-hidden />
        </motion.div>

        {/* The mark, and the way in */}
        <motion.div
          style={{ opacity: logoOpacity, scale: logoScale }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* Sinks the street grid behind the mark so it stays legible */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 42% 32% at 50% 50%, rgba(8,13,23,0.92) 0%, rgba(8,13,23,0.75) 45%, transparent 100%)",
            }}
          />
          <Link
            href="/"
            className="group relative flex flex-col items-center gap-7 rounded-3xl px-10 py-8 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          >
            <Logo size="xl" />
            <span className="inline-flex items-center gap-2 rounded-full glass-gold px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold transition-colors duration-300 group-hover:bg-white/10">
              Enter Site
            </span>
          </Link>
        </motion.div>
      </div>

      {/* Always reachable, so the entry is never gated behind scrolling. */}
      <Link
        href="/"
        className="fixed bottom-6 right-6 z-20 rounded-full glass px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-porcelain/70 transition-colors duration-200 hover:bg-white/15 hover:text-porcelain focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
      >
        Skip
      </Link>
    </main>
  );
}
