import type { Metadata } from "next";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";
import { MotionProvider } from "@/components/motion-provider";
import { ScrollProgressBar } from "@/components/motion-primitives";
import { Navbar } from "@/components/navbar";
import { Team } from "@/components/team";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/team",
  title: "Our Team — D'sign Architects",
  description:
    "Meet the architects, engineers, interior designers and site staff behind D'sign Architects — hands-on from first sketch to final handover on every project.",
});

export default function TeamPage() {
  return (
    <MotionProvider>
      <ScrollProgressBar />
      <Navbar />
      {/* Leadership portraits live on the home page only, so /team stays the
          studio line-up rather than repeating the founders. */}
      <main className="flex-1 pt-16">
        <Team />
        <CTA />
      </main>
      <Footer />
    </MotionProvider>
  );
}
