"use client";

import { useState } from "react";
import type { PanoramaScene } from "@/lib/properties";
import { PanoViewer } from "@/components/pano-viewer";

export function PanoramaTour({ scenes }: { scenes: PanoramaScene[] }) {
  const [activeId, setActiveId] = useState(scenes[0]?.id);
  const activeScene = scenes.find((scene) => scene.id === activeId) ?? scenes[0];

  if (!activeScene) return null;

  return (
    <div className="relative h-full w-full">
      {/* Re-mounting on scene change forces a clean texture load instead of a stale frame. */}
      <PanoViewer key={activeScene.id} src={encodeURI(activeScene.src)} fullscreen />

      {scenes.length > 1 ? (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full glass px-2 py-2">
            {scenes.map((scene) => (
              <button
                key={scene.id}
                type="button"
                onClick={() => setActiveId(scene.id)}
                aria-pressed={scene.id === activeScene.id}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                  scene.id === activeScene.id
                    ? "bg-gold text-ink"
                    : "text-porcelain/70 hover:text-porcelain"
                }`}
              >
                {scene.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
