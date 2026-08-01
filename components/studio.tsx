"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Lightbulb, Ruler, TreePine } from "lucide-react";
import {
  Reveal,
  SectionHeading,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion-primitives";

const PILLARS = [
  {
    icon: Lightbulb,
    title: "Design With Intent",
    body: "Every line begins with how a space will be lived in. Function shapes form — never the other way around.",
  },
  {
    icon: TreePine,
    title: "Sustainable by Default",
    body: "Passive design, honest materials, and low-energy systems are built into every brief from day one.",
  },
  {
    icon: Ruler,
    title: "Obsessive Detail",
    body: "From master plan to door handle, we own every millimetre so the finished building matches the vision.",
  },
];

export function Studio() {
  const imageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: imageRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section id="studio" className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32 lg:px-8">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <div
            ref={imageRef}
            className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/10"
          >
            <motion.div style={{ y }} className="absolute -inset-y-[10%] inset-x-0">
              <Image
                src="/media/apti-villa/poster.webp"
                alt="Facade of a modern building designed with layered glass and stone"
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl glass-strong p-5">
              <p className="font-display text-lg text-porcelain">
                &ldquo;Good design is inseparable from good execution.&rdquo;
              </p>
              <p className="mt-1 text-sm text-mist">D&rsquo;sign Architects, est. 2015</p>
            </div>
          </div>
        </Reveal>

        <div className="flex flex-col gap-10">
          <SectionHeading
            align="left"
            eyebrow="The Studio"
            title="Design and Execution, Under One Roof"
            description="Founded in 2015 by Ar. Umar Kazi and Ar. Shaheer Tungekar, D'sign Architects is a multidisciplinary practice spanning architecture, structural and MEP design, interiors, landscape, master planning and project management — including full-scale EPC delivery. Years of hands-on work across residential, commercial, institutional, hospitality and government projects let us take on any scale with confidence, from multi-acre master plans to lake restorations and private villas, for clients across India and abroad."
          />
          <StaggerGroup className="flex flex-col gap-4">
            {PILLARS.map((pillar) => (
              <StaggerItem key={pillar.title}>
                <div className="group flex gap-5 rounded-2xl glass-gold p-6 transition-colors duration-300 hover:bg-white/10 hover:border-gold/50">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 transition-colors duration-300 group-hover:bg-gold/20">
                    <pillar.icon className="h-6 w-6 text-gold" aria-hidden />
                  </span>
                  <div>
                    <h3 className="mb-1 font-display text-lg text-porcelain">
                      {pillar.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-mist">{pillar.body}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </div>
    </section>
  );
}
