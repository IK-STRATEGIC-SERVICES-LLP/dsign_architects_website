import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Eye, Box, PlayCircle } from "lucide-react";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { MotionProvider } from "@/components/motion-provider";
import { Reveal, ScrollProgressBar } from "@/components/motion-primitives";
import { PROPERTIES } from "@/lib/properties";

export const metadata = {
  title: "Properties Gallery — D'Sign Architects",
  description: "Explore our collection of residential, commercial, and cultural properties with interactive 3D models and 360° panoramic views.",
};

export default function PropertiesPage() {
  return (
    <MotionProvider>
      <ScrollProgressBar />
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-32 lg:px-8">
          <Reveal>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                Properties Gallery
              </span>
              <h1 className="mt-6 font-display text-4xl leading-tight tracking-tight text-porcelain sm:text-5xl lg:text-6xl">
                Explore Our Properties
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-mist">
                Step inside our most significant works. View interactive 3D models and immersive 360° panoramas to experience each property as if you were there.
              </p>
            </div>
          </Reveal>
        </section>

        {/* Properties Grid */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 md:pb-32 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            {PROPERTIES.map((property, index) => (
              <Reveal key={property.id} delay={index * 0.1}>
                <Link
                  href={`/properties/${property.slug}`}
                  className="group overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-2xl"
                >
                  {/* Property Card */}
                  <div className="relative h-80 overflow-hidden bg-ink-raised">
                    <Image
                      src={property.image}
                      alt={property.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />

                    {/* Card Content */}
                    <div className="absolute inset-0 flex flex-col justify-between p-6">
                      {/* Category Badge */}
                      <div className="flex justify-between items-start">
                        <span className="inline-flex items-center gap-2 rounded-full bg-gold/20 backdrop-blur-sm px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-gold">
                          {property.category}
                        </span>
                        <span className="text-sm font-medium text-porcelain/80">{property.year}</span>
                      </div>

                      {/* Title & Location */}
                      <div>
                        <h3 className="font-display text-2xl leading-tight tracking-tight text-porcelain sm:text-3xl">
                          {property.title}
                        </h3>
                        <p className="mt-2 text-sm text-porcelain/80">{property.location}</p>

                        {/* Viewer Options */}
                        <div className="mt-6 flex gap-3">
                          {property.models && property.models.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-raised/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-porcelain">
                              <Box className="h-3.5 w-3.5 text-gold" aria-hidden />
                              3D Model
                            </span>
                          )}
                          {property.panoramas && property.panoramas.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-raised/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-porcelain">
                              <Eye className="h-3.5 w-3.5 text-gold" aria-hidden />
                              360° View
                            </span>
                          )}
                          {property.video && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-raised/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-porcelain">
                              <PlayCircle className="h-3.5 w-3.5 text-gold" aria-hidden />
                              Video
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <Reveal>
            <div className="rounded-3xl glass-gold p-8 text-center sm:p-12 lg:p-16">
              <h2 className="font-display text-3xl leading-tight tracking-tight text-porcelain sm:text-4xl">
                Have a project in mind?
              </h2>
              <p className="mt-4 mx-auto max-w-2xl text-lg text-mist">
                Let's discuss how we can bring your vision to life with innovative design and meticulous execution.
              </p>
              <Link
                href="/#contact"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 font-medium text-ink transition-all duration-300 hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                Get in Touch
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </MotionProvider>
  );
}
