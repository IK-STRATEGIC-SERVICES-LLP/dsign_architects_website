import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";
import { PanoViewerClient } from "@/components/pano-viewer-loader";
import { ScrollScrubClient } from "@/components/scroll-scrub-loader";
import { MotionProvider } from "@/components/motion-provider";
import { Reveal, ScrollProgressBar } from "@/components/motion-primitives";
import { Navbar } from "@/components/navbar";
import { getProjectBySlug, PROJECTS } from "@/lib/projects";

export function generateStaticParams() {
  return PROJECTS.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: `${project.title} — D'Sign Architects`,
    description: project.description,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <MotionProvider>
      <ScrollProgressBar />
      <Navbar />
      <main className="flex-1">
        {/* Scrolling scrubs through this project's own presentation film,
            mirroring the homepage hero. */}
        {project.media ? (
          <ScrollScrubClient
            slug={project.media.slug}
            frameCount={project.media.frameCount}
            startFrame={project.media.startFrame}
            poster={project.image}
            scrollLength={project.media.scrollLength ?? 3.5}
            chapters={[{ kicker: project.category, title: project.title }]}
          />
        ) : null}

        <section className="relative w-full overflow-hidden">
          {!project.media ? (
            <>
              <Image
                src={project.image}
                alt={`${project.title} — ${project.category.toLowerCase()} project in ${project.location}`}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/10" />
            </>
          ) : null}
          <div
            className={`relative px-4 sm:px-6 lg:px-8 ${
              project.media ? "pt-16 pb-4" : "flex h-[70svh] min-h-[480px] flex-col justify-end pb-16"
            }`}
          >
            <div className="mx-auto w-full max-w-5xl">
              <Link
                href="/#projects"
                className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-porcelain/80 transition-colors hover:text-porcelain focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back to Selected Work
              </Link>
              <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                {project.category}
                {project.year ? ` · ${project.year}` : ""}
              </span>
              <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight text-porcelain sm:text-5xl lg:text-6xl">
                {project.title}
              </h1>
              <p className="mt-3 flex items-center gap-2 text-mist">
                <MapPin className="h-4 w-4 text-gold" aria-hidden />
                {project.location}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <Reveal className="lg:col-span-2">
              <h2 className="font-display text-2xl text-porcelain sm:text-3xl">
                Project Overview
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-mist">{project.description}</p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="rounded-3xl glass-gold p-8">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
                  At a Glance
                </h3>
                <ul className="mt-6 space-y-4">
                  {project.highlights.map((point) => (
                    <li key={point} className="flex gap-3 text-sm leading-relaxed text-porcelain/90">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {project.panorama ? (
          <section
            aria-label="360 degree walkthrough"
            className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 md:pb-28 lg:px-8"
          >
            <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
              Step Inside
            </span>
            <h2 className="mt-4 font-display text-2xl text-porcelain sm:text-3xl">
              360° Walkthrough
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-mist">
              Explore the space the way it feels to stand in it — drag in any
              direction to look around.
            </p>
            <div className="mt-8">
              <PanoViewerClient src={project.panorama} />
            </div>
          </section>
        ) : null}

        <CTA />
      </main>
      <Footer />
    </MotionProvider>
  );
}
