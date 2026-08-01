"use client";

import dynamic from "next/dynamic";

// `ssr: false` is only permitted inside a Client Component; this wrapper
// hosts the dynamic() call for the server-rendered panorama page —
// same pattern as pano-viewer-loader.tsx.
export const PanoramaTourClient = dynamic(
  () => import("@/components/panorama-tour").then((mod) => mod.PanoramaTour),
  { ssr: false }
);
