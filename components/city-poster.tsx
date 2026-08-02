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
    major: { stroke: "#e8b45c", width: 1.9, glow: "rgba(217,164,65,0.26)" },
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
const TRAFFIC_ROUTES = 26;

export function CityPoster({ onEnter }: { onEnter?: () => void } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dots, setDots] = useState<Array<{ x: number; y: number }>>([]);
  const [routes, setRoutes] = useState<string[]>([]);

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

      // The longest arterials become motion paths for the traffic streaks.
      // Screen coordinates, because CSS offset-path works in element space.
      const ranked = PUNE_ROADS.major
        .map((encoded) => {
          const pts = decodeWay(encoded);
          let len = 0;
          for (let i = 2; i < pts.length; i += 2) {
            len += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
          }
          return { pts, len };
        })
        .sort((a, b) => b.len - a.len)
        .slice(0, TRAFFIC_ROUTES);

      setRoutes(
        ranked.map(({ pts }) => {
          let d = "";
          for (let i = 0; i < pts.length; i += 2) {
            const x = (ox + pts[i] * scale).toFixed(1);
            const y = (oy + pts[i + 1] * scale).toFixed(1);
            d += `${i === 0 ? "M" : "L"}${x} ${y}`;
          }
          return d;
        })
      );
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
      <canvas
        ref={canvasRef}
        className="city-poster__map absolute inset-0 h-full w-full"
      />

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
              animationDuration: `${9 + (i % 5) * 2.4}s`,
              animationDelay: `${-(i * 1.7) % 11}s`,
            }}
          />
        ))}
        {routes.map((d, i) => (
          <span
            key={`t2-${i}`}
            className="city-poster__car city-poster__car--slow"
            style={{
              offsetPath: `path("${d}")`,
              animationDuration: `${14 + (i % 4) * 3}s`,
              animationDelay: `${-(i * 2.9) % 17}s`,
            }}
          />
        ))}
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
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64"
        style={{
          background:
            "linear-gradient(to top, rgba(8,13,23,0.96) 30%, transparent)",
        }}
      />

      <div className="relative flex h-full flex-col items-center justify-between px-6 py-10 sm:py-14">
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-center font-display text-2xl font-light tracking-[0.42em] text-porcelain sm:text-4xl"
        >
          MUMBAI &amp; PUNE
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-5"
        >
          {/* As an overlay on the home page this only has to dismiss itself;
              standalone at /launch it has somewhere to go. */}
          {onEnter ? (
            <button
              type="button"
              onClick={onEnter}
              className="group flex cursor-pointer flex-col items-center gap-5 rounded-3xl px-8 py-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              <Logo size="xl" />
              <span className="inline-flex items-center gap-2 rounded-full glass-gold px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold transition-colors duration-300 group-hover:bg-white/10">
                Enter Site
              </span>
            </button>
          ) : (
            <Link
              href="/"
              className="group flex flex-col items-center gap-5 rounded-3xl px-8 py-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              <Logo size="xl" />
              <span className="inline-flex items-center gap-2 rounded-full glass-gold px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold transition-colors duration-300 group-hover:bg-white/10">
                Enter Site
              </span>
            </Link>
          )}
          <p className="text-[9px] uppercase tracking-[0.2em] text-mist/40">
            Street data © OpenStreetMap contributors
          </p>
        </motion.div>
      </div>
    </main>
  );
}
