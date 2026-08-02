"use client";

import { Building2, Landmark, Map, Trees } from "lucide-react";
import { PlanLinework } from "@/components/plan-linework";
import {
  SectionHeading,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion-primitives";

// This section previously carried invented client quotes attributed to
// people who do not exist. It now shows only work and clients the studio can
// evidence from its own practice profile. Real testimonials can replace this
// as soon as the studio supplies attributable quotes.
const CREDENTIALS = [
  {
    icon: Landmark,
    sector: "Government & Defence",
    items: [
      "Military Intelligence Training School & Depot",
      "Collector's Office, Ahmednagar",
      "Police Headquarters & Police Station, Pune",
    ],
  },
  {
    icon: Building2,
    sector: "Institutional & Healthcare",
    items: [
      "Sassoon General Hospital & BJ Medical College",
      "Cyber Security Centre of Excellence Campus, Navi Mumbai",
      "School & sports facilities, Mumbai–Pune Expressway",
    ],
  },
  {
    icon: Map,
    sector: "Master Planning",
    items: [
      "45-acre master plan, Pune",
      "Youth Centre, 23 acres, Delhi",
      "Youth Centre, 3 acres, Ahmedabad",
    ],
  },
  {
    icon: Trees,
    sector: "Landscape & Hospitality",
    items: [
      "Lake beautification, Satara & Kiwal",
      "Hotels by The Fern — Chhattisgarh & Pune",
      "River front garden and heroes' parks, Pune",
    ],
  },
];

export function Testimonials() {
  return (
    <section className="relative isolate overflow-hidden mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32 lg:px-8">
      <PlanLinework flip className="-z-10 inset-0 h-full w-full opacity-[0.06]" />
      <SectionHeading
        eyebrow="Track Record"
        title="Trusted Across Sectors, at Every Scale"
        description="From defence and healthcare campuses to multi-acre master plans and lakefront public realm — delivered for clients across India and abroad."
      />
      <StaggerGroup className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {CREDENTIALS.map((group) => (
          <StaggerItem key={group.sector} className="h-full">
            <div className="flex h-full flex-col gap-5 rounded-3xl glass-gold p-7 transition-colors duration-300 hover:bg-white/10 hover:border-gold/50">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                <group.icon className="h-6 w-6 text-gold" aria-hidden />
              </span>
              <h3 className="font-display text-lg text-porcelain">{group.sector}</h3>
              <ul className="flex flex-1 flex-col gap-3">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-mist">
                    <span
                      aria-hidden
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
