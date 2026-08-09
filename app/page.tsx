import { CTA } from "@/components/cta";
import { Clients } from "@/components/clients";
import { Footer } from "@/components/footer";
import { Founders } from "@/components/founders";
import { Hero } from "@/components/hero";
import { LaunchGate } from "@/components/launch-gate";
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
      <LaunchGate />
      <ScrollProgressBar />
      <Navbar />
      <main className="flex-1">
        {/* A client-specified 4-shot cut of the studio's Nashik villa:
            arrival, the two living-room angles, then the pool deck reached
            from that room. Deliberately wordless — the only thing laid over
            the film is the studio's own logo on the opening frame, which
            clears as soon as the walkthrough starts. frameCount must match
            public/media/nashik-villa/meta.json — rerun build-media.mjs and
            update both if the cut changes. */}
        <ScrollScrubClient
          slug="nashik-villa"
          frameCount={120}
          poster="/media/nashik-villa/poster.webp"
          scrollLength={4}
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
