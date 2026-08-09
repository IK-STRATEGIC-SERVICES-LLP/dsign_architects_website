import Image from "next/image";

// The studio's signature lockup, traced from the delivered artwork to vector
// (public/brand/, see brand/README.md). Source master was 1029x242 with the
// ink inset; the lockup is cropped to its ink bounds, so the aspect ratio is
// slightly wider than the old PNG's.
const ASPECT = 1026 / 207;

const HEIGHTS = { md: 40, lg: 56, xl: 104 } as const;

/**
 * `surface` picks which wordmark colour is baked in. The script is gold on
 * both; only ARCHITECTS changes.
 *
 * This has to be a prop rather than a CSS inherit: the primary file paints
 * the wordmark with currentColor, but an <img> renders in its own document
 * and cannot see this one's colour, so the choice is made by swapping files.
 * Inlining the SVG instead would let currentColor work, at the cost of
 * carrying ~55KB of path data in the JS bundle on every route.
 */
const SRC = {
  dark: "/brand/dsign-logo-on-dark.svg",   // light wordmark, for dark surfaces
  light: "/brand/dsign-logo-on-light.svg", // ink wordmark, for light surfaces
} as const;

export function Logo({
  size = "md",
  surface = "dark",
}: {
  size?: keyof typeof HEIGHTS;
  surface?: keyof typeof SRC;
}) {
  const height = HEIGHTS[size];
  const width = Math.round(height * ASPECT);

  return (
    <Image
      src={SRC[surface]}
      alt="D'sign Architects"
      width={width}
      height={height}
      priority
      unoptimized
      className="w-auto"
      style={{ height }}
    />
  );
}
