"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { SectionHeading } from "@/components/motion-primitives";
import {
  INTERNATIONAL_CLIENTS,
  PAN_INDIA_CLIENTS,
  type ClientLogo,
} from "@/lib/portfolio";

// Client logos exactly as they appear in the practice profile — nothing is
// keyed out or recoloured, so marks that carry their own background
// (Maharashtra Police's emblem, Leads' blue, Mumbai Falcons' orange) stay
// intact. Ink-only marks sit on a white tile because that is the surface
// they were drawn for; on a dark one they would vanish.

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;
const ROW_DURATIONS = [46, 54];

function LogoTile({ logo }: { logo: ClientLogo }) {
  // Marks that arrive as artwork on a solid canvas get a tile painted to
  // match, so the artwork meets the tile edge instead of reading as a black
  // box framed in white. Those also drop the inner padding — their own
  // canvas already supplies the breathing room, and without it the mark
  // renders noticeably larger.
  const tinted = logo.tint !== null;

  return (
    <motion.div
      whileHover={{ scale: 1.06, y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      style={{ backgroundColor: logo.tint ?? "#ffffff" }}
      className="group relative h-28 w-52 shrink-0 overflow-hidden rounded-2xl border border-gold/40 shadow-lg shadow-black/40 transition-colors duration-300 hover:border-gold sm:h-36 sm:w-64"
    >
      {/* `fill` inside the box lets every mark scale up to the largest size
          that still fits, rather than being capped by a fixed width. */}
      <div className={tinted ? "absolute inset-0" : "absolute inset-3 sm:inset-4"}>
        <Image src={logo.src} alt="" fill sizes="256px" className="object-contain" />
      </div>
    </motion.div>
  );
}

function BandHeading({ label, count }: { label: string; count: number }) {
  return (
    <div className="mx-auto mb-8 flex max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/40" />
      <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
        {label}
        <span className="ml-2 text-mist/70">{count}</span>
      </span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/40" />
    </div>
  );
}

const EDGE_FADE = {
  maskImage:
    "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
  WebkitMaskImage:
    "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
} as const;

export function Clients() {
  const reduceMotion = useReducedMotion();
  if (PAN_INDIA_CLIENTS.length === 0 && INTERNATIONAL_CLIENTS.length === 0) {
    return null;
  }

  const half = Math.ceil(PAN_INDIA_CLIENTS.length / 2);
  const panIndiaRows = [
    PAN_INDIA_CLIENTS.slice(0, half),
    PAN_INDIA_CLIENTS.slice(half),
  ];

  return (
    <section id="clients" className="relative overflow-hidden py-24 md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[22rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/5 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Our Clients"
          title="Who We Build For"
          description="Government bodies, hospitality groups, schools and developers across India and overseas."
        />
      </div>

      {/* Pan India — enough logos to run as a continuous marquee. */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: EASE_LUXE }}
        className="relative mt-16"
      >
        <BandHeading label="Pan India Clients" count={PAN_INDIA_CLIENTS.length} />
        <div className="flex flex-col gap-6" style={EDGE_FADE}>
          {panIndiaRows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex overflow-hidden">
              <motion.div
                className="flex shrink-0 gap-6"
                // Rows drift in opposite directions; the list is duplicated
                // so travelling exactly -50% lands on an identical frame.
                animate={
                  reduceMotion
                    ? undefined
                    : { x: rowIndex === 1 ? ["-50%", "0%"] : ["0%", "-50%"] }
                }
                transition={{
                  duration: ROW_DURATIONS[rowIndex % ROW_DURATIONS.length],
                  ease: "linear",
                  repeat: Infinity,
                }}
              >
                {[...row, ...row].map((logo, i) => (
                  <LogoTile key={`${logo.src}-${i}`} logo={logo} />
                ))}
              </motion.div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* International — too few to scroll convincingly, so they sit as a
          centred row that staggers in. */}
      {INTERNATIONAL_CLIENTS.length > 0 ? (
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="relative mt-16"
        >
          <BandHeading
            label="International Clients"
            count={INTERNATIONAL_CLIENTS.length}
          />
          <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-6 px-4 sm:px-6 lg:px-8">
            {INTERNATIONAL_CLIENTS.map((logo) => (
              <motion.div
                key={logo.src}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6, ease: EASE_LUXE },
                  },
                }}
              >
                <LogoTile logo={logo} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : null}
    </section>
  );
}
