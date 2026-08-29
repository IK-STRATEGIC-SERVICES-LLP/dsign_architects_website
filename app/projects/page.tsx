import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";
import { MotionProvider } from "@/components/motion-provider";
import {
  Reveal,
  ScrollProgressBar,
  SectionHeading,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion-primitives";
import { Navbar } from "@/components/navbar";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { PROJECTS } from "@/lib/projects";
import { PORTFOLIO_PROJECTS, countByCategory } from "@/lib/portfolio";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/projects",
  title: "Projects — D'sign Architects",
  description:
    "Master planning, landscape, government, commercial, institutional, residential, interior and vacation home projects delivered by D'sign Architects across India and overseas.",
});

export default function ProjectsIndexPage() {
  const totals = countByCategory();

  return (
    <MotionProvider>
      <ScrollProgressBar />
      <Navbar />
      <main className="flex-1 pt-28">
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Portfolio"
            title="Our Work"
            description={`${PORTFOLIO_PROJECTS.length + PROJECTS.length} projects across master planning, landscape, architecture and interiors — for government, institutional, hospitality, commercial and private clients.`}
          />

          <StaggerGroup className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-3">
            {totals.map((entry) => (
              <StaggerItem key={entry.category}>
                <span className="inline-flex items-baseline gap-2 rounded-full glass px-4 py-2">
                  <span className="font-display text-lg text-gold">{entry.count}</span>
                  <span className="text-[11px] uppercase tracking-[0.16em] text-mist">
                    {entry.category}
                  </span>
                </span>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>

        {/* The full practice portfolio, filterable. */}
        <section className="mx-auto mt-24 max-w-7xl px-4 pb-8 sm:px-6 md:mt-32 lg:px-8">
          <Reveal>
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                Complete Portfolio
              </span>
              <h2 className="font-display text-3xl text-porcelain sm:text-4xl">
                Every Discipline, Every Scale
              </h2>
            </div>
          </Reveal>
          <div className="mt-12">
            <PortfolioGrid />
          </div>
        </section>

        <CTA />
      </main>
      <Footer />
    </MotionProvider>
  );
}
