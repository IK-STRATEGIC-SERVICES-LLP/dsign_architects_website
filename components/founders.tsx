"use client";

import Image from "next/image";
import {
  SectionHeading,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion-primitives";

const FOUNDERS = [
  {
    name: "Ar. Umar Kazi",
    title: "Co-Founder & Principal Architect",
    photo: "/images/team/umar-kazi.jpg",
  },
  {
    name: "Ar. Shaheer Tungekar",
    title: "Co-Founder & Principal Architect",
    photo: "/images/team/shaheer-tungekar.jpg",
  },
];

export function Founders() {
  return (
    <section id="founders" className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32 lg:px-8">
      <SectionHeading
        eyebrow="Leadership"
        title="The Architects Behind the Practice"
        description="D'sign Architects was founded in 2015 by two architects who stay hands-on from first sketch to final handover."
      />
      <StaggerGroup className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-2">
        {FOUNDERS.map((founder) => (
          <StaggerItem key={founder.name}>
            <figure className="group relative overflow-hidden rounded-3xl border border-white/10 transition-colors duration-500 hover:border-gold/50">
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <Image
                  src={founder.photo}
                  alt={`Portrait of ${founder.name}`}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover object-top grayscale transition-all duration-700 ease-out group-hover:scale-[1.03] group-hover:grayscale-0"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent"
                />
              </div>
              <figcaption className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="font-display text-2xl text-porcelain">{founder.name}</h3>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                  {founder.title}
                </p>
              </figcaption>
            </figure>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
