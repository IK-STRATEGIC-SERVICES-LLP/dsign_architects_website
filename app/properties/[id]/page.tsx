import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Box, Eye, PlayCircle } from "lucide-react";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";
import { MotionProvider } from "@/components/motion-provider";
import { Reveal, ScrollProgressBar } from "@/components/motion-primitives";
import { Navbar } from "@/components/navbar";
import { getPropertyBySlug, PROPERTIES } from "@/lib/properties";

export function generateStaticParams() {
  return PROPERTIES.map((property) => ({ id: property.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const property = getPropertyBySlug(id);
  if (!property) return {};
  return {
    title: `${property.title} — D'Sign Architects`,
    description: property.description,
  };
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = getPropertyBySlug(id);
  if (!property) notFound();

  const viewerCount =
    (property.models && property.models.length > 0 ? 1 : 0) +
    (property.panoramas && property.panoramas.length > 0 ? 1 : 0) +
    (property.video ? 1 : 0);

  return (
    <MotionProvider>
      <ScrollProgressBar />
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[70svh] min-h-[480px] w-full overflow-hidden">
          <Image
            src={property.image}
            alt={`${property.title} — ${property.category.toLowerCase()} project in ${property.location}`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/10" />
          <div className="absolute inset-0 flex flex-col justify-end px-4 pb-16 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-5xl">
              <Link
                href="/properties"
                className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-porcelain/80 transition-colors hover:text-porcelain focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back to Properties
              </Link>
              <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                {property.category} · {property.year}
              </span>
              <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight text-porcelain sm:text-5xl lg:text-6xl">
                {property.title}
              </h1>
              <p className="mt-3 flex items-center gap-2 text-mist">
                <MapPin className="h-4 w-4 text-gold" aria-hidden />
                {property.location}
              </p>
            </div>
          </div>
        </section>

        {/* Video + Gallery Section */}
        {(property.video || (property.gallery && property.gallery.length > 0)) && (
          <section className="mx-auto max-w-5xl px-4 pt-16 sm:px-6 lg:px-8">
            {property.video && (
              <Reveal>
                <div className="overflow-hidden rounded-3xl border border-gold/25">
                  <video
                    src={property.video.src}
                    poster={property.video.poster}
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls
                    className="aspect-video w-full bg-black object-cover"
                  />
                </div>
              </Reveal>
            )}

            {property.gallery && property.gallery.length > 0 && (
              <Reveal delay={property.video ? 0.1 : 0}>
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {property.gallery.map((src, i) => (
                    <div
                      key={src}
                      className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-gold/20"
                    >
                      <Image
                        src={src}
                        alt={`${property.title} — additional view ${i + 1}`}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </Reveal>
            )}
          </section>
        )}

        {/* Overview Section */}
        <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <Reveal className="lg:col-span-2">
              <h2 className="font-display text-2xl text-porcelain sm:text-3xl">
                Project Overview
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-mist">{property.description}</p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="rounded-3xl glass-gold p-8">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
                  At a Glance
                </h3>
                <ul className="mt-6 space-y-4">
                  {property.highlights.map((point) => (
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

        {/* Viewers Section */}
        <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 md:pb-28 lg:px-8">
          <div className={`grid gap-6 sm:grid-cols-2 ${viewerCount >= 3 ? "lg:grid-cols-3" : ""}`}>
            {/* 3D Viewer Button */}
            {property.models && property.models.length > 0 && (
              <Reveal>
                <Link
                  href={`/properties/${property.slug}/3d-viewer`}
                  className="group relative overflow-hidden rounded-2xl transition-all duration-300"
                >
                  <div className="relative h-64 rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/20 to-gold/5 overflow-hidden transition-colors duration-300 group-hover:border-gold/50">
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                      <div className="rounded-full bg-gold/20 p-4 group-hover:scale-110 transition-transform duration-300">
                        <Box className="h-8 w-8 text-gold" aria-hidden />
                      </div>
                      <h3 className="font-display text-xl text-porcelain">3D Model</h3>
                      <p className="text-sm text-mist">Interactive 360° view</p>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </Link>
              </Reveal>
            )}

            {/* Panorama Viewer Button */}
            {property.panoramas && property.panoramas.length > 0 && (
              <Reveal delay={property.models ? 0.1 : 0}>
                <Link
                  href={`/properties/${property.slug}/panorama`}
                  className="group relative overflow-hidden rounded-2xl transition-all duration-300"
                >
                  <div className="relative h-64 rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/20 to-gold/5 overflow-hidden transition-colors duration-300 group-hover:border-gold/50">
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                      <div className="rounded-full bg-gold/20 p-4 group-hover:scale-110 transition-transform duration-300">
                        <Eye className="h-8 w-8 text-gold" aria-hidden />
                      </div>
                      <h3 className="font-display text-xl text-porcelain">360° Panorama</h3>
                      <p className="text-sm text-mist">
                        {property.panoramas.length > 1
                          ? `${property.panoramas.length} immersive views`
                          : "Immersive walkthrough"}
                      </p>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </Link>
              </Reveal>
            )}

            {/* Video Walkthrough Button */}
            {property.video && (
              <Reveal delay={0.2}>
                <Link
                  href={`/properties/${property.slug}/video`}
                  className="group relative overflow-hidden rounded-2xl transition-all duration-300"
                >
                  <div className="relative h-64 rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/20 to-gold/5 overflow-hidden transition-colors duration-300 group-hover:border-gold/50">
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                      <div className="rounded-full bg-gold/20 p-4 group-hover:scale-110 transition-transform duration-300">
                        <PlayCircle className="h-8 w-8 text-gold" aria-hidden />
                      </div>
                      <h3 className="font-display text-xl text-porcelain">Video Walkthrough</h3>
                      <p className="text-sm text-mist">Watch the full tour</p>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </Link>
              </Reveal>
            )}
          </div>
        </section>

        <CTA />
      </main>
      <Footer />
    </MotionProvider>
  );
}
