import { CTA } from "@/components/cta";
import { Clients } from "@/components/clients";
import { Footer } from "@/components/footer";
import { Founders } from "@/components/founders";
import { Hero } from "@/components/hero";
import { ScrollScrubClient } from "@/components/scroll-scrub-loader";
import { mobileMediaFor } from "@/lib/projects";
import { MotionProvider } from "@/components/motion-provider";
import { ScrollProgressBar } from "@/components/motion-primitives";
import { Navbar } from "@/components/navbar";
import { Process } from "@/components/process";
import { Projects } from "@/components/projects";
import { Services } from "@/components/services";
import { Studio } from "@/components/studio";
import { Testimonials } from "@/components/testimonials";

// The hero film. Same set as the Nashik villa project page — frameCount must
// match public/media/nashik-villa/meta.json.
const HERO_MEDIA = { slug: "nashik-villa", frameCount: 180 };

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
            wordless: nothing is laid over the film at all. The opening-frame
            watermark was dropped — the navbar already carries the studio's
            mark, so it was a second copy of the same lockup over the work.
            The `logo` prop is still there if it is ever wanted back.
            frameCount must match public/media/nashik-villa/meta.json
            — rerun build-media.mjs and update both if the cut changes.

            scrollLength 5 keeps the scrub at ~36 frames per viewport, the
            speed this hero has always run at.

            `mobile` is the same six shots rebuilt for phones — 90 frames
            cropped to 4:5, 2.8MB against the desktop set's 20MB — shown as a
            plate rather than full-bleed so the wide shots survive a portrait
            screen. Without it phones fall back to the poster, which is what
            they had before. It comes from the same helper the Nashik project
            page uses, so the hero and that page cannot drift apart. */}
        <ScrollScrubClient
          slug={HERO_MEDIA.slug}
          frameCount={HERO_MEDIA.frameCount}
          poster="/media/nashik-villa/poster.webp"
          scrollLength={5}
          mobile={mobileMediaFor(HERO_MEDIA)}
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
