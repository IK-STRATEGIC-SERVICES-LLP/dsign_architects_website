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

export const metadata: Metadata = {
  title: "Projects — D'sign Architects",
  description:
    "Master planning, landscape, government, commercial, institutional, residential and interior projects delivered by D'sign Architects across India and overseas.",
};

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

        {/* Films — the projects with full walkthrough experiences. */}
        <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 md:mt-32 lg:px-8">
          <Reveal>
            <div className="flex flex-col gap-3">
              <span className="inline-flex w-fit items-center gap-2 rounded-full glass px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                Featured
              </span>
              <h2 className="font-display text-3xl text-porcelain sm:text-4xl">
                Walk Through Them
              </h2>
              <p className="max-w-2xl text-base leading-relaxed text-mist">
                These projects have full presentation films — scroll through each
                one and the camera moves with you.
              </p>
            </div>
          </Reveal>

          <StaggerGroup className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PROJECTS.map((project) => (
              <StaggerItem key={project.slug} className="h-full">
                <Link
                  href={`/projects/${project.slug}`}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 transition-colors duration-300 hover:border-gold/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                >
                  <Image
                    src={project.image}
                    alt={`${project.title} — ${project.location}`}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
                        {project.category}
                      </span>
                      <h3 className="mt-1 font-display text-lg text-porcelain">
                        {project.title}
                      </h3>
                      <p className="text-sm text-mist">{project.location}</p>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 transition-all duration-300 group-hover:bg-gold group-hover:text-ink">
                      <ArrowUpRight className="h-5 w-5" aria-hidden />
                    </span>
                  </div>
                </Link>
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
