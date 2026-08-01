"use client";

import dynamic from "next/dynamic";

// `ssr: false` is only permitted inside a Client Component; this wrapper
// hosts the dynamic() call for the server-rendered project detail page —
// same pattern as intro-flythrough-loader.tsx.
export const PanoViewerClient = dynamic(
  () => import("@/components/pano-viewer").then((mod) => mod.PanoViewer),
  { ssr: false }
);
