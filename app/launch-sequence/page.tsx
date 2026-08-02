import type { Metadata } from "next";
import { LaunchMap } from "@/components/launch-map";
import { MotionProvider } from "@/components/motion-provider";

export const metadata: Metadata = {
  title: "D'sign Architects",
  description:
    "From the subcontinent to a single address — enter the D'sign Architects studio.",
  // An intro sequence has nothing to index, and it would compete with the
  // home page for the studio's own brand terms.
  robots: { index: false, follow: true },
};

export default function LaunchPage() {
  return (
    <MotionProvider>
      <LaunchMap />
    </MotionProvider>
  );
}
