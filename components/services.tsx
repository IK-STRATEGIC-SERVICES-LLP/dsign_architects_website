"use client";

import {
  Building2,
  ClipboardList,
  HardHat,
  Map,
  PaintBucket,
  Plug,
  Ruler,
  Trees,
} from "lucide-react";
import {
  SectionHeading,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion-primitives";

// The studio's actual service lines, as listed in its practice profile.
const SERVICES = [
  {
    icon: Map,
    title: "Master Planning",
    body: "Campus and township plans from three to forty-five acres — land use, circulation and phasing resolved before the first building is drawn.",
  },
  {
    icon: Building2,
    title: "Architectural Design",
    body: "Residential, commercial, institutional, hospitality and government projects, taken from concept through to construction drawings.",
  },
  {
    icon: Ruler,
    title: "Structural Design",
    body: "Structural systems engineered in-house alongside the architecture, so the frame and the form are decided together.",
  },
  {
    icon: Plug,
    title: "MEP Design",
    body: "Mechanical, electrical and plumbing services coordinated into the design rather than routed around it after the fact.",
  },
  {
    icon: Trees,
    title: "Landscape Design",
    body: "Public realm, lakefronts, parks and private gardens — from ceremonial plazas to promenades, courtyards and play areas.",
  },
  {
    icon: PaintBucket,
    title: "Interior Design",
    body: "Materials, joinery, lighting and furniture resolved as one continuous idea with the architecture around them.",
  },
  {
    icon: ClipboardList,
    title: "Project Management",
    body: "Tendering, cost control and site supervision, protecting design intent and budget through to handover.",
  },
  {
    icon: HardHat,
    title: "EPC Delivery",
    body: "Engineering, procurement and construction under a single contract — one team accountable for the finished building.",
  },
];

export function Services() {
  return (
    <section id="services" className="relative overflow-hidden py-24 md:py-32">
      {/* Ambient glow behind the glass grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[52rem] -translate-x-1/2 rounded-full bg-navy/40 blur-3xl"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="What We Do"
          title="Every Discipline Under One Roof"
          description="One team carries your project from first sketch to final handover — no handoffs, no diluted vision, no surprises."
        />
        <StaggerGroup className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <StaggerItem key={service.title} className="h-full">
              <article className="group flex h-full flex-col gap-4 rounded-3xl glass-gold p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/50 hover:bg-white/10 hover:shadow-2xl hover:shadow-black/30">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 transition-colors duration-300 group-hover:bg-gold/20">
                  <service.icon className="h-7 w-7 text-gold" aria-hidden />
                </span>
                <h3 className="font-display text-xl text-porcelain">
                  {service.title}
                </h3>
                <p className="text-sm leading-relaxed text-mist">{service.body}</p>
              </article>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
