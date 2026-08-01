"use client";

import { motion } from "framer-motion";
import { Compass, KeyRound, Layers, Lightbulb, type LucideIcon } from "lucide-react";
import { SectionHeading } from "@/components/motion-primitives";

// Glowing feature card adapted from the motionsites.ai section template,
// re-themed to the studio's golden palette: the same gradient drives the
// blurred halo behind the card and its border via the padding-box /
// border-box background-clip technique.
const CARD_FILL = "#111a2c";

const STEPS: Array<{
  number: string;
  title: string;
  body: string;
  icon: LucideIcon;
  gradient: string;
  delay: number;
}> = [
  {
    number: "01",
    title: "Discover",
    body: "We walk your site, interrogate the brief, and map budget, planning, and lifestyle constraints before a single line is drawn.",
    icon: Compass,
    gradient: "linear-gradient(137deg, #d9a441 0%, #f0d48a 45%, #b87333 100%)",
    delay: 0.1,
  },
  {
    number: "02",
    title: "Concept",
    body: "Two to three distinct design directions, presented as models and immersive visuals — you choose the one that feels right.",
    icon: Lightbulb,
    gradient: "linear-gradient(137deg, #f0d48a 0%, #d9a441 45%, #8c6a2f 100%)",
    delay: 0.2,
  },
  {
    number: "03",
    title: "Develop",
    body: "The chosen concept is engineered in detail: structure, services, materials, and cost, coordinated in a single BIM model.",
    icon: Layers,
    gradient: "linear-gradient(137deg, #b87333 0%, #f0d48a 45%, #d9a441 100%)",
    delay: 0.3,
  },
  {
    number: "04",
    title: "Deliver",
    body: "We stay on site through construction, protecting design intent and your budget until the keys are in your hand.",
    icon: KeyRound,
    gradient: "linear-gradient(137deg, #d9a441 0%, #e8c06a 45%, #b87333 100%)",
    delay: 0.4,
  },
];

function FeatureCard({
  number,
  title,
  description,
  icon: Icon,
  gradient,
  delay,
}: {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: "easeOut", delay }}
      className="group relative mx-auto flex w-full max-w-[260px] flex-col items-start justify-start md:max-w-[300px]"
    >
      {/* Glow halo behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute h-[280px] w-full rounded-[40px] opacity-40 transition-opacity duration-500 group-hover:opacity-60 md:h-[300px]"
        style={{ background: gradient, filter: "blur(45px)" }}
      />

      {/* Foreground card — golden gradient border via background-clip */}
      <div
        className="z-10 h-[280px] self-stretch overflow-hidden rounded-[40px] md:h-[300px]"
        style={{
          border: "8px solid transparent",
          background: `linear-gradient(${CARD_FILL}, ${CARD_FILL}) padding-box, ${gradient} border-box`,
        }}
      >
        <div className="flex h-full w-full flex-col justify-between p-7">
          <div className="flex w-full items-start justify-between">
            <div className="text-porcelain/90">
              <Icon size={32} strokeWidth={2.5} aria-hidden />
            </div>
            <span className="font-display text-3xl text-gold/50">{number}</span>
          </div>
          <div>
            <h3 className="mb-3 text-xl font-medium tracking-tight text-porcelain">
              {title}
            </h3>
            <p className="text-[14px] font-normal leading-[1.6] text-mist selection:bg-white/20">
              {description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Process() {
  return (
    <section id="process" className="relative overflow-hidden py-24 md:py-32">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How We Work"
          title="Four Steps From Idea to Address"
          description="A transparent, fixed-milestone process. You always know what happens next, what it costs, and what you'll see at each stage."
        />
        <div className="mx-auto mt-16 grid w-full max-w-[1280px] grid-cols-1 gap-10 md:grid-cols-2 md:gap-6 xl:grid-cols-4">
          {STEPS.map((step) => (
            <FeatureCard
              key={step.number}
              number={step.number}
              title={step.title}
              description={step.body}
              icon={step.icon}
              gradient={step.gradient}
              delay={step.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
