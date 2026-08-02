import Image from "next/image";

// The studio's actual logo artwork (public/logo.png): gold signature script
// "D'sign" with letter-spaced "ARCHITECTS", background removed. Source is 1029x242.
const ASPECT = 1029 / 242;

const HEIGHTS = { md: 40, lg: 56, xl: 104 } as const;

export function Logo({ size = "md" }: { size?: keyof typeof HEIGHTS }) {
  const height = HEIGHTS[size];
  const width = Math.round(height * ASPECT);

  return (
    <Image
      src="/logo.png"
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
