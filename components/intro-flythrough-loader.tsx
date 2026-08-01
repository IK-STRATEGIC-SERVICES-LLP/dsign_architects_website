"use client";

import dynamic from "next/dynamic";

// `ssr: false` is only permitted from within a Client Component, so this
// tiny wrapper exists purely to host the dynamic() call for the server
// component tree in app/page.tsx.
export const IntroFlythroughClient = dynamic(
  () => import("@/components/intro-flythrough").then((mod) => mod.IntroFlythrough),
  { ssr: false }
);
