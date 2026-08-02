"use client";

import { useEffect, useRef, useState } from "react";

/* Drafting-sheet backdrop. Fine cell + a heavy gold rule every fifth line,
   carrying the grid reference callouts a real construction drawing uses.
   Sits behind everything, so the cinematic sections paint straight over it. */

const MAJOR = 440; // heavy rule interval — 5 × the 88px fine cell
const PARALLAX = 0.15; // sheet travels slower than the page
const SPAN = 10; // callouts rendered per axis; the container clips the rest

/* Drafting grids skip I and O so they can't be misread as 1 and 0. */
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

export function BlueprintSheet() {
  const ref = useRef<HTMLDivElement>(null);
  const rowBaseRef = useRef(0);
  const [rowBase, setRowBase] = useState(0);

  /* Parallax drift. Offset is kept modulo MAJOR so the pattern never leaves
     alignment, and the row numbers count up each time it wraps — the sheet
     reads as one continuous drawing rather than a repeating tile. */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        const travelled = window.scrollY * PARALLAX;
        el.style.setProperty("--sheet-y", `${travelled % MAJOR}px`);

        const base = Math.floor(travelled / MAJOR);
        if (base !== rowBaseRef.current) {
          rowBaseRef.current = base;
          setRowBase(base);
        }
        queued = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Cursor spotlight — the sheet only resolves where you're actually looking.
     Pointer-driven, so there is nothing to reveal on touch devices. */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let queued = false;
    let x = 0;
    let y = 0;

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        el.style.setProperty("--mx", `${x}px`);
        el.style.setProperty("--my", `${y}px`);
        queued = false;
      });
    };

    const onLeave = () => {
      el.style.setProperty("--mx", "-1000px");
      el.style.setProperty("--my", "-1000px");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="blueprint-sheet">
      <div className="blueprint-sheet__grid" />
      <div className="blueprint-sheet__glow" />

      {/* Column callouts — held clear of the fixed navbar */}
      <div className="blueprint-sheet__cols">
        {Array.from({ length: SPAN }, (_, i) => (
          <span key={i} style={{ left: `${i * MAJOR + 10}px` }}>
            {LETTERS[i % LETTERS.length]}
          </span>
        ))}
      </div>

      {/* Row callouts — these ride along with the parallax offset */}
      <div className="blueprint-sheet__rows">
        {Array.from({ length: SPAN }, (_, i) => (
          <span key={i} style={{ top: `${i * MAJOR + 10}px` }}>
            {rowBase + i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}
