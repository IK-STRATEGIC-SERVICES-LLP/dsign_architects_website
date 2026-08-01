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
      <ScrollProgressBar />
      <Navbar />
      <main className="flex-1">
        {/* Scrolling scrubs through the studio's Ulwe penthouse film. */}
        <ScrollScrubClient
          slug="ulwe-penthouse"
          frameCount={150}
          poster="/media/ulwe-penthouse/poster.webp"
          scrollLength={4}
          chapters={[
            { kicker: "D'sign Architects", title: "Spaces Designed to Be Lived In" },
            { kicker: "Architecture", title: "Light, Material, Proportion" },
            { kicker: "Interiors", title: "Detailed Down to the Millimetre" },
            { kicker: "Delivery", title: "Designed and Built by One Team" },
          ]}
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
