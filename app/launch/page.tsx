import type { Metadata } from "next";
import { CityPoster } from "@/components/city-poster";
import { MotionProvider } from "@/components/motion-provider";

export const metadata: Metadata = {
  title: "D'sign Architects — Mumbai & Pune",
  description:
    "Architecture, interiors and EPC delivery across Mumbai and Pune.",
  // A splash screen has nothing to index, and it would compete with the home
  // page for the studio's own brand terms.
  robots: { index: false, follow: true },
};

export default function LaunchPage() {
  return (
    <MotionProvider>
      <CityPoster />
    </MotionProvider>
  );
}
