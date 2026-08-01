import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PanoramaTourClient } from "@/components/panorama-tour-loader";
import { getPropertyBySlug, PROPERTIES } from "@/lib/properties";

export function generateStaticParams() {
  return PROPERTIES.filter((p) => p.panoramas && p.panoramas.length > 0).map((property) => ({
    id: property.slug,
  }));
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
    title: `${property.title} — 360° Panorama — D'Sign Architects`,
    description: `Explore the ${property.title} in 360°. Drag to look around or use your device's motion sensors.`,
  };
}

export default async function PanoramaViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = getPropertyBySlug(id);

  if (!property || !property.panoramas || property.panoramas.length === 0) {
    notFound();
  }

  return (
    <div className="relative w-full h-screen bg-ink overflow-hidden">
      {/* Header Navigation */}
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="relative h-20 flex items-center px-4 sm:px-6 lg:px-8">
          <div className="pointer-events-auto">
            <Link
              href={`/properties/${property.slug}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-porcelain/80 transition-colors hover:text-porcelain focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              aria-label="Back to property"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Back</span>
            </Link>
          </div>

          {/* Title - Center */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-auto">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-gold">
              360° Panorama
            </p>
            <h1 className="text-lg font-display text-porcelain hidden sm:block">{property.title}</h1>
          </div>

          {/* Help Text - Right */}
          <div className="absolute right-4 sm:right-6 lg:right-8 text-right pointer-events-none">
            <p className="text-xs text-porcelain/60">Drag to explore</p>
          </div>
        </div>
      </div>

      {/* Panorama Tour */}
      <PanoramaTourClient scenes={property.panoramas} />
    </div>
  );
}
