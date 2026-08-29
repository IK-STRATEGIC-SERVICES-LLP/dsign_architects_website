import type { Metadata } from "next";
import { CTA } from "@/components/cta";
import { EventsTimeline } from "@/components/events-timeline";
import { Footer } from "@/components/footer";
import { MotionProvider } from "@/components/motion-provider";
import { ScrollProgressBar, SectionHeading } from "@/components/motion-primitives";
import { Navbar } from "@/components/navbar";
import { EVENTS_BY_DATE } from "@/lib/events";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/events",
  title: "Events — D'sign Architects",
  description:
    "Launches, inaugurations and industry evenings D'sign Architects has taken part in, in the studio's own words and photos.",
});

export default function EventsPage() {
  return (
    <MotionProvider>
      <ScrollProgressBar />
      <Navbar />
      <main className="flex-1 pt-28">
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Events"
            title="Where We've Shown Up"
            description="Launches, inaugurations and industry evenings the studio has taken part in."
          />
        </section>

        <section className="mx-auto mt-16 max-w-7xl px-4 pb-8 sm:px-6 md:mt-20 lg:px-8">
          <EventsTimeline events={EVENTS_BY_DATE} />
        </section>

        <CTA />
      </main>
      <Footer />
    </MotionProvider>
  );
}
