import { CTA } from "@/components/cta";
import { Clients } from "@/components/clients";
import { Footer } from "@/components/footer";
import { Founders } from "@/components/founders";
import { Hero } from "@/components/hero";
import { ScrollScrubClient } from "@/components/scroll-scrub-loader";
import { MotionProvider } from "@/components/motion-provider";
import { ScrollProgressBar } from "@/components/motion-primitives";
import { Navbar } from "@/components/navbar";
import { Process } from "@/components/process";
import { Projects } from "@/components/projects";
import { Services } from "@/components/services";
import { Studio } from "@/components/studio";
import { Testimonials } from "@/components/testimonials";

export default function Page() {
  return (
    <MotionProvider>
      {/* The city-poster splash (<LaunchGate />) is parked, not deleted: the
          site is to open straight on the home page for now. The component and
          its /launch-sequence page are still there, so putting it back is a
          one-line change. */}
      <ScrollProgressBar />
      <Navbar />
      <main className="flex-1">
        {/* A 10-shot walkthrough of the studio's Nashik villa, built from its
            per-shot 4K masters: arrive from the street, up to the door,
            through the lobby into the living rooms, then out to the pool deck
            at dusk. Deliberately wordless — the only thing laid over the film
            is the studio's own logo on the opening frame, which clears as
            soon as the walkthrough starts. frameCount must match
            public/media/nashik-villa/meta.json — rerun build-media.mjs and
            update both if the cut changes.

            scrollLength is 8 rather than the 10 that would hold the old
            5-shot cut's exact scrub speed: 1000vh is ten screens of scrolling
            before the page proper begins, which is more than an opener should
            ask for. At 8 the film runs about a quarter faster than before. */}
        <ScrollScrubClient
          slug="nashik-villa"
          frameCount={300}
          poster="/media/nashik-villa/poster.webp"
          scrollLength={8}
          logo
          showScrollCue={false}
        />
        <Hero />
        <Studio />
        <Services />
        <Projects />
        <Process />
        <Founders />
        <Clients />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </MotionProvider>
  );
}
