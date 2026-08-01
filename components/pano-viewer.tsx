"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import { Move } from "lucide-react";
import * as THREE from "three";

// Self-hosted 360° panorama viewer: an equirectangular image (2:1 JPG — the
// same source files the studio uploads to Keypano) mapped onto the inside of
// a sphere with the camera at its centre. Replaces third-party tour embeds.

function PanoSphere({ src }: { src: string }) {
  const texture = useTexture(src);
  texture.colorSpace = THREE.SRGBColorSpace;

  return (
    // Negative X scale un-mirrors the image when viewed from inside.
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[10, 64, 48]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} toneMapped={false} />
    </mesh>
  );
}

export function PanoViewer({
  src,
  fullscreen = false,
}: {
  src: string;
  /** Fill the parent element edge-to-edge instead of a boxed 16:9 embed. */
  fullscreen?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [autoRotate, setAutoRotate] = useState(true);
  const [inView, setInView] = useState(fullscreen);
  const hostRef = useRef<HTMLDivElement>(null);

  // Only mount the WebGL canvas once the section approaches the viewport.
  useEffect(() => {
    if (fullscreen) return;
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [fullscreen]);

  return (
    <div
      ref={hostRef}
      className={
        fullscreen
          ? "relative h-full w-full touch-pan-y overflow-hidden bg-ink-raised"
          : "relative aspect-[16/9] w-full touch-pan-y overflow-hidden rounded-3xl border border-gold/30 bg-ink-raised shadow-2xl shadow-black/40"
      }
    >
      {inView ? (
        <Canvas camera={{ position: [0, 0, 0.1], fov: 75 }} dpr={[1, 1.5]} gl={{ antialias: true }}>
          <Suspense fallback={null}>
            <PanoSphere src={src} />
          </Suspense>
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            rotateSpeed={-0.35}
            enableDamping
            dampingFactor={0.08}
            autoRotate={autoRotate && !reduceMotion}
            autoRotateSpeed={0.4}
            onStart={() => setAutoRotate(false)}
          />
        </Canvas>
      ) : null}

      {fullscreen ? null : (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
          <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-porcelain/80">
            <Move className="h-3.5 w-3.5 text-gold" aria-hidden />
            Drag to look around
          </span>
        </div>
      )}
    </div>
  );
}
