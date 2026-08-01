"use client";

import dynamic from "next/dynamic";

// `ssr: false` is only permitted inside a Client Component, so this wrapper
// hosts the dynamic() call for the server-rendered pages that use it.
export const ScrollScrubClient = dynamic(
  () => import("@/components/scroll-scrub").then((mod) => mod.ScrollScrub),
  { ssr: false }
);
