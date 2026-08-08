"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/logo";
import {
  PUNE_ROADS,
  PUNE_VIEW,
  decodeWay,
  projectPune,
} from "@/lib/pune-roads.generated";

/**
 * Pune street map as a poster.
 *
 * Canvas rather than SVG: there are ~12,900 real streets here, far more
 * geometry than the DOM wants to hold. The network is stroked once,
 * synchronously, when the canvas is sized — no animation loop is involved in
 * getting it on screen, so a throttled or suspended rAF can't leave the page
 * blank. The reveal and the marker pulse are both CSS, which the compositor
 * runs on its own.
 */

type Tier = "minor" | "mid" | "major";

const TIER_STYLE: Record<Tier, { stroke: string; width: number; glow?: string }> =
  {
    // Grey fabric underneath, gold for the routes that shape the city.
    minor: { stroke: "rgba(150,161,178,0.40)", width: 0.7 },
    mid: { stroke: "rgba(200,180,142,0.60)", width: 1.05 },
    major: { stroke: "rgba(217,164,65,0.7)", width: 1.7, glow: "rgba(217,164,65,0.16)" },
  };

/** Places the studio has built in and around the city. */
const MARKERS: Array<[number, number]> = [
  [73.8478, 18.5308],
  [73.8797, 18.515],
  [73.8077, 18.5074],
  [73.926, 18.5089],
  [73.8077, 18.559],
  [73.9436, 18.5515],
  [73.9143, 18.5679],
  [73.78, 18.559],
  [73.8567, 18.47],
  [73.886, 18.559],
];

/** Arterials that carry the traffic streaks, and how many streaks each gets. */
const TRAFFIC_ROUTES = 30;

/** Secondary streets get their own, sparser stream of traffic so coverage
    isn't limited to the handful of longest arterials. */
const MID_TRAFFIC_ROUTES = 18;

/** Scattered lights along the minor/mid streets — the city's windows at night. */
const TWINKLE_COUNT = 110;

/** The Chandni Chowk–Wakad stretch (NH48/old Mumbai-Pune highway through
    Bavdhan and Baner) — identified by proximity to those two junctions
    rather than by length, since OSM breaks it into many short way segments
    at intersections. Indices into PUNE_ROADS.major. Called out for heavier,
    denser two-way traffic than the general arterial treatment gives it.
    Extends a little past Wakad itself (idx 389/840/383/388) — without that,
    every one of these routes ends at exactly the same junction, and that's
    where all of them fade in/out, which reads as a static bright cluster
    rather than traffic that keeps moving through. */
const CHANDNI_WAKAD_MAJOR_INDICES = [
  347, 374, 382, 381, 452, 453, 454, 455, 457, 458, 448, 456, 1043, 1042, 375,
  959, 81, 961, 389, 840, 383, 388,
];

/** Below the top ranked-by-length roads, ~1,000 more major roads exist and
    previously carried no traffic at all — every one of them is a real gold
    line on the canvas, so leaving them dark read as dead patches on the map.
    This floor gives longer major ways one gentle, ambient streak so nothing
    prominent sits still, without animating every last short stub. */
const BASE_MAJOR_MIN_LEN = 30;

export function CityPoster({ onEnter }: { onEnter?: () => void } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dots, setDots] = useState<Array<{ x: number; y: number }>>([]);
  const [routes, setRoutes] = useState<string[]>([]);
  const [routesIncoming, setRoutesIncoming] = useState<string[]>([]);
  const [midRoutes, setMidRoutes] = useState<string[]>([]);
  const [corridorRoutes, setCorridorRoutes] = useState<string[]>([]);
  const [corridorRoutesIncoming, setCorridorRoutesIncoming] = useState<string[]>([]);
  const [baseMajorRoutes, setBaseMajorRoutes] = useState<string[]>([]);
  const [twinkles, setTwinkles] = useState<
    Array<{ x: number; y: number; delay: number; duration: number; size: number }>
  >([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Cover the viewport, keeping the city centred.
      const scale = Math.max(w / PUNE_VIEW.w, h / PUNE_VIEW.h) * 1.06;
      const ox = (w - PUNE_VIEW.w * scale) / 2;
      const oy = (h - PUNE_VIEW.h * scale) / 2;

      for (const tier of ["minor", "mid", "major"] as Tier[]) {
        const style = TIER_STYLE[tier];
        const passes = style.glow
          ? [
              { stroke: style.glow, width: style.width * 3.4 },
              { stroke: style.stroke, width: style.width },
            ]
          : [{ stroke: style.stroke, width: style.width }];

        for (const pass of passes) {
          ctx.beginPath();
          ctx.strokeStyle = pass.stroke;
          ctx.lineWidth = pass.width;
          for (const encoded of PUNE_ROADS[tier]) {
            const pts = decodeWay(encoded);
            ctx.moveTo(ox + pts[0] * scale, oy + pts[1] * scale);
            for (let i = 2; i < pts.length; i += 2) {
              ctx.lineTo(ox + pts[i] * scale, oy + pts[i + 1] * scale);
            }
          }
          ctx.stroke();
        }
      }

      setDots(
        MARKERS.map(([lon, lat]) => {
          const [px, py] = projectPune(lon, lat);
          return { x: ox + px * scale, y: oy + py * scale };
        })
      );

      // The longest streets in each tier become motion paths for the traffic
      // streaks. Screen coordinates, because CSS offset-path works in
      // element space — same ox/oy/scale the canvas just painted with, so a
      // streak always sits on the line it was ranked from.
      const rankWays = (ways: readonly string[], count: number) =>
        ways
          .map((encoded) => {
            const pts = decodeWay(encoded);
            let len = 0;
            for (let i = 2; i < pts.length; i += 2) {
              len += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
            }
            return { pts, len };
          })
          .sort((a, b) => b.len - a.len)
          .slice(0, count)
          .map(({ pts }) => pts);

      const buildPath = (pts: number[], reverse: boolean) => {
        let d = "";
        const start = reverse ? pts.length - 2 : 0;
        const end = reverse ? -2 : pts.length;
        const step = reverse ? -2 : 2;
        for (let i = start; i !== end; i += step) {
          const x = (ox + pts[i] * scale).toFixed(1);
          const y = (oy + pts[i + 1] * scale).toFixed(1);
          d += `${i === start ? "M" : "L"}${x} ${y}`;
        }
        return d;
      };

      const majorWays = rankWays(PUNE_ROADS.major, TRAFFIC_ROUTES);
      // Highways carry traffic both ways — the same arterials, walked in
      // each direction, rather than doubling up on distinct streets.
      setRoutes(majorWays.map((pts) => buildPath(pts, false)));
      setRoutesIncoming(majorWays.map((pts) => buildPath(pts, true)));
      setMidRoutes(
        rankWays(PUNE_ROADS.mid, MID_TRAFFIC_ROUTES).map((pts) =>
          buildPath(pts, false)
        )
      );

      const corridorWays = CHANDNI_WAKAD_MAJOR_INDICES.map(
        (idx) => PUNE_ROADS.major[idx]
      )
        .filter(Boolean)
        .map((encoded) => decodeWay(encoded));
      setCorridorRoutes(corridorWays.map((pts) => buildPath(pts, false)));
      setCorridorRoutesIncoming(corridorWays.map((pts) => buildPath(pts, true)));

      // Every other major road gets one gentle streak — overlap with the
      // routes above is fine (those roads just end up a little busier).
      const baseMajor = PUNE_ROADS.major
        .map((encoded) => decodeWay(encoded))
        .filter((pts) => {
          let len = 0;
          for (let i = 2; i < pts.length; i += 2) {
            len += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
          }
          return len > BASE_MAJOR_MIN_LEN;
        });
      setBaseMajorRoutes(baseMajor.map((pts) => buildPath(pts, false)));

      // Lit windows scattered along the street fabric — sampled from real
      // road points so they sit on the city rather than floating over empty sky.
      const fabric = [...PUNE_ROADS.minor, ...PUNE_ROADS.mid];
      const lights: Array<{
        x: number;
        y: number;
        delay: number;
        duration: number;
        size: number;
      }> = [];
      for (let i = 0; i < TWINKLE_COUNT; i++) {
        const encoded = fabric[Math.floor(Math.random() * fabric.length)];
        const pts = decodeWay(encoded);
        const idx = Math.floor(Math.random() * (pts.length / 2)) * 2;
        lights.push({
          x: ox + pts[idx] * scale,
          y: oy + pts[idx + 1] * scale,
          delay: Math.random() * 6,
          duration: 2.6 + Math.random() * 3.4,
          size: 1 + Math.random() * 1.6,
        });
      }
      setTwinkles(lights);
    };

    render();

    let timer = 0;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(render, 200);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <main className="relative h-svh w-full overflow-hidden bg-ink">
      {/* Everything that represents the physical city lives in one scene
          layer. Deliberately untransformed — the traffic streaks ride CSS
          offset-path in this same coordinate space as the canvas paint, and
          any ancestor transform (scale/translate) desyncs the two. */}
      <div className="city-poster__scene absolute inset-0 h-full w-full">
        <canvas
          ref={canvasRef}
          className="city-poster__map absolute inset-0 h-full w-full"
        />

        {/* Lit windows scattered across the street fabric — the city's
            ambient glow, distinct from the brighter traffic streaks. */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {twinkles.map((t, i) => (
            <span
              key={`w-${i}`}
              className="city-poster__twinkle"
              style={{
                left: t.x,
                top: t.y,
                width: t.size * 2,
                height: t.size * 2,
                animationDelay: `${t.delay}s`,
                animationDuration: `${t.duration}s`,
              }}
            />
          ))}
        </div>

        {/* Traffic — light streaks running the arterials, the way a city looks
            from the air at night. CSS motion paths, so the compositor drives
            them and no animation loop is involved. */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {routes.map((d, i) => (
            <span
              key={`t-${i}`}
              className="city-poster__car"
              style={{
                offsetPath: `path("${d}")`,
                animationDuration: `${12 + (i % 5) * 3}s`,
                animationDelay: `${-(i * 1.7) % 14}s`,
              }}
            />
          ))}
          {routes.map((d, i) => (
            <span
              key={`t2-${i}`}
              className="city-poster__car city-poster__car--slow"
              style={{
                offsetPath: `path("${d}")`,
                animationDuration: `${18 + (i % 4) * 3.6}s`,
                animationDelay: `${-(i * 2.9) % 21}s`,
              }}
            />
          ))}
          {/* Oncoming carriageway — the same highways walked in the other
              direction, headlight-white against the outgoing amber. */}
          {routesIncoming.map((d, i) => (
            <span
              key={`ti-${i}`}
              className="city-poster__car city-poster__car--incoming"
              style={{
                offsetPath: `path("${d}")`,
                animationDuration: `${13 + (i % 5) * 2.8}s`,
                animationDelay: `${-(i * 2.3) % 15}s`,
              }}
            />
          ))}
          {routesIncoming.map((d, i) => (
            <span
              key={`ti2-${i}`}
              className="city-poster__car city-poster__car--incoming city-poster__car--slow"
              style={{
                offsetPath: `path("${d}")`,
                animationDuration: `${19 + (i % 4) * 3.4}s`,
                animationDelay: `${-(i * 3.4) % 22}s`,
              }}
            />
          ))}
          {/* Chandni Chowk – Wakad: the busiest stretch in the city, called
              out with its own denser, two-deep stream each way. */}
          {corridorRoutes.flatMap((d, i) =>
            [0, 1].map((lane) => (
              <span
                key={`cc-${i}-${lane}`}
                className="city-poster__car"
                style={{
                  offsetPath: `path("${d}")`,
                  animationDuration: `${8 + ((i * 2 + lane) % 6) * 1.9}s`,
                  animationDelay: `${-((i * 2 + lane) * 1.1) % 11}s`,
                }}
              />
            ))
          )}
          {corridorRoutesIncoming.flatMap((d, i) =>
            [0, 1].map((lane) => (
              <span
                key={`cci-${i}-${lane}`}
                className="city-poster__car city-poster__car--incoming"
                style={{
                  offsetPath: `path("${d}")`,
                  animationDuration: `${8.5 + ((i * 2 + lane) % 6) * 2}s`,
                  animationDelay: `${-((i * 2 + lane) * 1.4) % 12}s`,
                }}
              />
            ))
          )}
          {/* Every other major road — two evenly-phased streaks each, so a
              road's whole length has something moving on it at any given
              moment rather than one dot with dark road either side of it. */}
          {baseMajorRoutes.map((d, i) => {
            const duration = 16 + (i % 7) * 2.8;
            return [0, 1].map((phase) => (
              <span
                key={`bm-${i}-${phase}`}
                className="city-poster__car city-poster__car--mid"
                style={{
                  offsetPath: `path("${d}")`,
                  animationDuration: `${duration}s`,
                  animationDelay: `${-((i * 1.6) % duration) - phase * (duration / 2)}s`,
                }}
              />
            ));
          })}
          {/* Secondary streets — sparser, dimmer traffic so coverage reaches
              beyond just the handful of longest arterials. */}
          {midRoutes.map((d, i) => {
            const duration = 14 + (i % 5) * 3;
            return [0, 1].map((phase) => (
              <span
                key={`m-${i}-${phase}`}
                className="city-poster__car city-poster__car--mid"
                style={{
                  offsetPath: `path("${d}")`,
                  animationDuration: `${duration}s`,
                  animationDelay: `${-((i * 2.1) % duration) - phase * (duration / 2)}s`,
                }}
              />
            ));
          })}
        </div>

        {/* Pulsing markers over the places the studio has built */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {dots.map((d, i) => (
            <span
              key={i}
              className="city-poster__pin"
              style={{ left: d.x, top: d.y, animationDelay: `${i * 0.35}s` }}
            />
          ))}
        </div>
      </div>

      {/* Vignette, so the type at top and bottom always has ground to sit on */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 76% 60% at 50% 50%, transparent 28%, rgba(8,13,23,0.86) 100%)",
        }}
      />
      {/* Bands top and bottom — the title and the mark need ground of their own */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        style={{
          background:
            "linear-gradient(to bottom, rgba(8,13,23,0.92), transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-80"
        style={{
          background:
            "linear-gradient(to top, rgba(8,13,23,0.97) 38%, transparent)",
        }}
      />

      <div className="relative flex h-full flex-col items-center justify-end px-6 pb-14 sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-6"
        >
          {/* Enhanced logo container with better visibility */}
          <div className="relative rounded-3xl px-8 py-6 backdrop-blur-lg"
            style={{
              background: "radial-gradient(ellipse at center, rgba(32,42,65,0.85) 0%, rgba(8,13,23,0.7) 100%)",
              border: "1px solid rgba(217, 164, 65, 0.15)",
              boxShadow: "0 0 40px rgba(217, 164, 65, 0.1), inset 0 0 20px rgba(255, 255, 255, 0.02)"
            }}>
            {/* As an overlay on the home page this only has to dismiss itself;
                standalone at /launch it has somewhere to go. */}
            {onEnter ? (
              <button
                type="button"
                onClick={onEnter}
                className="group flex cursor-pointer flex-col items-center gap-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold transition-transform duration-300 hover:scale-105"
              >
                <Logo size="xl" />
              </button>
            ) : (
              <Link
                href="/"
                className="group flex flex-col items-center gap-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold transition-transform duration-300 hover:scale-105"
              >
                <Logo size="xl" />
              </Link>
            )}
          </div>

          {/* Location text below logo */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center font-display text-2xl font-light tracking-[0.42em] text-porcelain sm:text-4xl"
          >
            MUMBAI &amp; PUNE
          </motion.h1>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 2.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {onEnter ? (
              <button
                type="button"
                onClick={onEnter}
                className="inline-flex items-center gap-2 rounded-full glass-gold px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold transition-colors duration-300 hover:bg-white/10"
              >
                Enter Site
              </button>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full glass-gold px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold transition-colors duration-300 hover:bg-white/10"
              >
                Enter Site
              </Link>
            )}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2.6 }}
            className="text-[9px] uppercase tracking-[0.2em] text-mist/40">
            Street data © OpenStreetMap contributors
          </motion.p>
        </motion.div>
      </div>
    </main>
  );
}
