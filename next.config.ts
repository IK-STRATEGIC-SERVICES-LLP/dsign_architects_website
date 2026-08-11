import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        // Next serves /public at `max-age=0`, so every frame is revalidated
        // on each request. The phone scrub cannot live with that: it holds
        // only a window of the sequence in memory and refetches frames as
        // the playhead comes back over them, which at max-age=0 is a network
        // round-trip per frame — on cellular, a visible stutter every time
        // the visitor scrolls back up. Desktop gains too, where it currently
        // revalidates 180 files on every repeat visit.
        //
        // A week rather than a year with `immutable`: build-media.mjs
        // --force rebuilds a set in place under the same paths, so anything
        // longer would strand visitors on a recut film they cannot clear.
        source: "/media/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
