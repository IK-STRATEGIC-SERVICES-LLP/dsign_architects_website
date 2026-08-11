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
import { OFFICE_PHOTOS, TEAM_PORTRAITS } from "@/lib/portfolio";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/studio",
  title: "Studio — D'sign Architects",
  description:
    "Founded in 2015 by Ar. Umar Kazi and Ar. Shaheer Tungekar, D'sign Architects is a multidisciplinary practice spanning architecture, structural and MEP design, interiors, landscape, master planning and EPC delivery.",
});

export default function StudioPage() {
  const office = OFFICE_PHOTOS.slice(0, 6);

  return (
    <MotionProvider>
      <ScrollProgressBar />
      <Navbar />
      <main className="flex-1 pt-28">
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="The Studio"
            title="Design and Execution, Under One Roof"
          />
          <Reveal>
            <div className="mt-10 space-y-6 text-lg leading-relaxed text-mist">
              <p>
                Founded in 2015 by Ar. Umar Kazi and Ar. Shaheer Tungekar,
                D&rsquo;sign Architects is a multidisciplinary design firm offering
                integrated services in architecture, structural design, interior
                design, landscape design, master planning, MEP and project
                management — including full-scale EPC (Engineering, Procurement
                and Construction) delivery.
              </p>
              <p>
                Over the years, hands-on experience across residential,
                commercial, institutional, hospitality and government sectors has
                shaped a practice built on technical depth and execution
                understanding, allowing us to take on projects of every scale
                with confidence. From master plans spanning dozens of acres to
                landscape restorations, hospitality developments and
                institutional campuses, our portfolio spans pan-India and
                international clients alike.
              </p>
              <p className="font-display text-2xl leading-snug text-porcelain">
                We believe good design is inseparable from good execution — and
                it&rsquo;s this belief that drives everything we build.
              </p>
            </div>
          </Reveal>
        </section>

        {/* People live on /team and the service lines on the home page, so
            this page points at both rather than restating them. */}
        <section className="mx-auto mt-16 max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {[
                {
                  href: "/team",
                  eyebrow: "Our Team",
                  title: "Meet the architects and engineers",
                  body: `Founded by Ar. Umar Kazi and Ar. Shaheer Tungekar, with a studio of ${
                    TEAM_PORTRAITS.length + 2
                  } across design and execution.`,
                },
                {
                  href: "/#services",
                  eyebrow: "What We Do",
                  title: "Every discipline under one roof",
                  body: "Master planning, architecture, structure, MEP, landscape, interiors, project management and EPC delivery.",
                },
              ].map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group flex flex-col justify-between gap-6 rounded-3xl glass-gold p-8 transition-colors duration-300 hover:bg-white/10 hover:border-gold/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                >
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                      {card.eyebrow}
                    </span>
                    <h2 className="mt-2 font-display text-2xl text-porcelain sm:text-3xl">
                      {card.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-mist">
                      {card.body}
                    </p>
                  </div>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 transition-all duration-300 group-hover:bg-gold group-hover:text-ink">
                    <ArrowUpRight className="h-5 w-5" aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
          </Reveal>
        </section>

        {office.length > 0 ? (
          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Our Office"
              title="Where the Work Happens"
              description="Our studio in Pune — where every project starts on paper before it starts on site."
            />
            <StaggerGroup className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {office.map((src, i) => (
                <StaggerItem key={src}>
                  <div
                    className={`relative overflow-hidden rounded-2xl border border-white/10 ${
                      i === 0 ? "aspect-[4/3] sm:col-span-2 sm:aspect-[16/9]" : "aspect-[4/3]"
                    }`}
                  >
                    <Image
                      src={src}
                      alt="D'sign Architects studio office"
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-out hover:scale-105"
                    />
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </section>
        ) : null}

        <CTA />
      </main>
      <Footer />
    </MotionProvider>
  );
}
