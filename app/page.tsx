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
        {/* The studio's own six-shot cover sequence for their Nashik villa,
            built from its per-shot 4K masters: street, front elevation,
            living room, lobby, pool deck, covered walkway. The order is
            theirs — see media-manifest.mjs before changing it. Deliberately
            wordless: the only thing laid over the film is the studio's own
            logo on the opening frame, which clears as soon as the sequence
            starts. frameCount must match public/media/nashik-villa/meta.json
            — rerun build-media.mjs and update both if the cut changes.

            scrollLength 5 keeps the scrub at ~36 frames per viewport, the
            speed this hero has always run at. */}
        <ScrollScrubClient
          slug="nashik-villa"
          frameCount={180}
          poster="/media/nashik-villa/poster.webp"
          scrollLength={5}
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
