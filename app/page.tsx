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
        {/* Scrolling walks the studio's Nashik villa from the street to the
            bedrooms — arrival, grounds, then inside. Deliberately wordless:
            the only thing laid over the film is the studio's own logo on the
            opening frame, which clears as soon as the walkthrough starts. */}
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
