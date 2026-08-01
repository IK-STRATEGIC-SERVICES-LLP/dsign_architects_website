"use client";

import Image from "next/image";
import {
  SectionHeading,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion-primitives";
import { TEAM_PORTRAITS } from "@/lib/portfolio";

// The studio line-up as the practice profile presents it. The founders are
// deliberately left out here — their portraits carry the leadership section
// on the home page, and repeating them at the head of this grid made the
// same two faces appear twice on one screen. The profile doesn't caption the
// staff, so they run as an unnamed ensemble — names and roles can be added
// to lib/portfolio.ts later.
export function Team() {
  if (TEAM_PORTRAITS.length === 0) return null;

  // The two founders are part of the studio's headcount even though their
  // portraits sit elsewhere.
  const total = TEAM_PORTRAITS.length + 2;

  return (
    <section
      id="team"
      className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-28 lg:px-8"
    >
      <SectionHeading
        eyebrow="Our Team"
        title="The People Behind the Drawings"
        description={`Architects, engineers, interior designers and site staff — ${total} of us across design and execution, working under one roof in Pune.`}
      />

      <StaggerGroup className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
        {TEAM_PORTRAITS.map((src) => (
          <StaggerItem key={src}>
            <div className="group relative aspect-[3/4] overflow-hidden rounded-2xl border-2 border-white/10 transition-colors duration-500 hover:border-gold">
              <Image
                src={src}
                alt="D'sign Architects team member"
                fill
                sizes="(min-width: 1280px) 12vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover grayscale transition-all duration-700 ease-out group-hover:scale-105 group-hover:grayscale-0"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-30"
              />
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
