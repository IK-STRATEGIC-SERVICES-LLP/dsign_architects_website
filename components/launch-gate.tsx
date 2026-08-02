"use client";

import { useEffect, useState } from "react";
import { CityPoster } from "@/components/city-poster";

const SEEN_KEY = "dsign-launch-seen";

/**
 * The city poster shown over the home page on arrival.
 *
 * Deliberately an overlay rather than a redirect: `/` keeps serving the real
 * home page, so search engines and anyone linking to the site still get the
 * actual content. A redirect to a noindex splash would have cost the studio
 * its home page in search results.
 *
 * Shown once per browser session — a splash every single navigation gets old
 * fast, and the back button would fight it.
 */
export function LaunchGate() {
  const [dismissed, setDismissed] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SEEN_KEY)) setDismissed(true);
    } catch {
      // Private mode with storage disabled — showing the poster is harmless.
    }
  }, []);

  // Hold the page still underneath while the poster is up.
  useEffect(() => {
    if (dismissed) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [dismissed]);

  const enter = () => {
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    setLeaving(true);
    window.setTimeout(() => setDismissed(true), 700);
  };

  if (dismissed) return null;

  return (
    <div
      className={`launch-gate fixed inset-0 z-[200] ${
        leaving ? "launch-gate--leaving" : ""
      }`}
    >
      <CityPoster onEnter={enter} />
    </div>
  );
}
