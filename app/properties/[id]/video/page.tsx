import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { VideoViewer } from "@/components/video-viewer";
import { getPropertyBySlug, PROPERTIES } from "@/lib/properties";

export function generateStaticParams() {
  return PROPERTIES.filter((p) => p.video).map((property) => ({
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
    title: `${property.title} — Video Walkthrough — D'Sign Architects`,
    description: `Watch a video walkthrough of ${property.title}.`,
  };
}

export default async function VideoViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = getPropertyBySlug(id);

  if (!property || !property.video) {
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
              Video Walkthrough
            </p>
            <h1 className="text-lg font-display text-porcelain hidden sm:block">{property.title}</h1>
          </div>
        </div>
      </div>

      <VideoViewer src={property.video.src} poster={property.video.poster} />
    </div>
  );
}
