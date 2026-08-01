"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { ChevronDown } from "lucide-react";
import * as THREE from "three";
import { easeLuxe } from "@/components/motion-primitives";

// Procedural placeholder massing — stands in for a real architectural model
// (exterior shell, glass volume, roof accent, landscaping / interior shell,
// furniture blocks) until the studio supplies actual walkthrough geometry.
// The camera rig, staging, and scroll choreography below are all real and
// will work unchanged once a proper .glb replaces these primitives.

type Keyframe = {
  p: number;
  pos: THREE.Vector3;
  look: THREE.Vector3;
  fov: number;
  bg: THREE.Color;
};

const KEYFRAMES: Keyframe[] = [
  {
    p: 0,
    pos: new THREE.Vector3(9, 5.5, 15),
    look: new THREE.Vector3(0, 3, 0),
    fov: 42,
    bg: new THREE.Color("#5b6b7d"),
  },
  {
    p: 0.25,
    pos: new THREE.Vector3(5, 4, 8),
    look: new THREE.Vector3(0, 3, 0.5),
    fov: 38,
    bg: new THREE.Color("#4a5666"),
  },
  {
    p: 0.5,
    pos: new THREE.Vector3(0, 2.4, 3.4),
    look: new THREE.Vector3(0, 2.2, 0),
    fov: 34,
    bg: new THREE.Color("#232b36"),
  },
  {
    p: 0.75,
    pos: new THREE.Vector3(0, 1.6, 1.2),
    look: new THREE.Vector3(1.8, 1.3, -2.5),
    fov: 50,
    bg: new THREE.Color("#141a24"),
  },
  {
    p: 1,
    pos: new THREE.Vector3(-1.6, 1.5, 0.4),
    look: new THREE.Vector3(1.2, 1.1, -3),
    fov: 45,
    bg: new THREE.Color("#0d1420"),
  },
];

function sampleKeyframes(
  p: number,
  outPos: THREE.Vector3,
  outLook: THREE.Vector3,
  outColor: THREE.Color
) {
  const clamped = THREE.MathUtils.clamp(p, 0, 1);
  let i = 0;
  while (i < KEYFRAMES.length - 2 && clamped > KEYFRAMES[i + 1].p) i++;
  const a = KEYFRAMES[i];
  const b = KEYFRAMES[i + 1];
  const t = (clamped - a.p) / (b.p - a.p || 1);
  outPos.lerpVectors(a.pos, b.pos, t);
  outLook.lerpVectors(a.look, b.look, t);
  outColor.copy(a.bg).lerp(b.bg, t);
  return THREE.MathUtils.lerp(a.fov, b.fov, t);
}

function Rig({
  progressRef,
  exteriorRef,
  interiorRef,
}: {
  progressRef: React.RefObject<{ value: number }>;
  exteriorRef: React.RefObject<THREE.Group | null>;
  interiorRef: React.RefObject<THREE.Group | null>;
}) {
  const { camera, scene } = useThree();
  const posRef = useRef(new THREE.Vector3());
  const lookRef = useRef(new THREE.Vector3());
  const colorRef = useRef(new THREE.Color());

  useFrame(() => {
    const p = progressRef.current.value;
    const fov = sampleKeyframes(p, posRef.current, lookRef.current, colorRef.current);
    camera.position.copy(posRef.current);
    camera.lookAt(lookRef.current);
    const persp = camera as THREE.PerspectiveCamera;
    if (persp.isPerspectiveCamera) {
      persp.fov = fov;
      persp.updateProjectionMatrix();
    }
    scene.background = colorRef.current;

    const showInterior = p > 0.55;
    if (exteriorRef.current) exteriorRef.current.visible = !showInterior;
    if (interiorRef.current) interiorRef.current.visible = showInterior;
  });

  return null;
}

const TREE_POSITIONS: Array<[number, number]> = [
  [-5, -4],
  [5, -3],
  [-6, 3],
  [6, 4],
];

function ExteriorScene({ groupRef }: { groupRef: React.RefObject<THREE.Group | null> }) {
  return (
    <group ref={groupRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#2b3341" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3, 0]}>
        <boxGeometry args={[6, 6, 5]} />
        <meshStandardMaterial color="#8a94a3" roughness={0.6} metalness={0.1} />
      </mesh>
      <mesh position={[0, 3, 2.6]}>
        <boxGeometry args={[5.6, 5.6, 0.15]} />
        <meshStandardMaterial
          color="#9fc4dd"
          roughness={0.1}
          metalness={0.3}
          transparent
          opacity={0.45}
        />
      </mesh>
      <mesh position={[0, 6.4, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[4.2, 0.3, 4.2]} />
        <meshStandardMaterial color="#d9a441" roughness={0.4} metalness={0.5} />
      </mesh>
      {TREE_POSITIONS.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.9, z]}>
          <coneGeometry args={[0.8, 1.8, 8]} />
          <meshStandardMaterial color="#2f4a3a" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function InteriorScene({ groupRef }: { groupRef: React.RefObject<THREE.Group | null> }) {
  return (
    <group ref={groupRef} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#6b5133" roughness={0.7} />
      </mesh>
      <mesh position={[0, 2, -4]}>
        <boxGeometry args={[10, 4, 0.2]} />
        <meshStandardMaterial color="#dcd5c9" roughness={0.9} />
      </mesh>
      <mesh position={[-5, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[8, 4, 0.2]} />
        <meshStandardMaterial color="#c9c0b0" roughness={0.9} />
      </mesh>
      <mesh position={[1.6, 0.5, -2]}>
        <boxGeometry args={[2.6, 1, 1]} />
        <meshStandardMaterial color="#3a3f4a" roughness={0.6} />
      </mesh>
      <mesh position={[1.6, 0.25, -0.6]}>
        <cylinderGeometry args={[0.5, 0.5, 0.5, 24]} />
        <meshStandardMaterial color="#d9a441" metalness={0.6} roughness={0.3} />
      </mesh>
      <pointLight position={[0, 3.5, -1]} intensity={12} color="#f0d48a" distance={10} decay={2} />
    </group>
  );
}

// One caption at a time — rendered via AnimatePresence keyed by chapter
// index, so two chapters can never paint in the same frame (stacked
// absolute captions with independent scroll-driven opacities could).
const CHAPTERS = [
  { kicker: "Chapter One", title: "Every Building Begins With a Site" },
  { kicker: "Chapter Two", title: "Form, Considered From Every Angle" },
  { kicker: "Chapter Three", title: "Step Inside" },
  { kicker: "Chapter Four", title: "Where Design Meets Daily Life" },
];

// Past this progress the caption layer clears so the handoff into the Hero
// below never overlaps its text.
const CAPTION_EXIT_AT = 0.94;

const FALLBACK_IMAGE_SRC =
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=75";

function FallbackIntro() {
  return (
    <section className="relative flex min-h-[70svh] w-full flex-col items-center justify-center overflow-hidden bg-ink px-6 py-24 text-center">
      <Image
        src={FALLBACK_IMAGE_SRC}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-50"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/70 to-ink" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: easeLuxe }}
        className="relative z-10 flex flex-col items-center gap-4"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gold">
          A Walk Through Our Work
        </span>
        <h2 className="max-w-2xl font-display text-3xl text-porcelain sm:text-4xl">
          From First Sketch to Finished Room
        </h2>
        <p className="max-w-md text-sm text-mist">
          Every project begins with a site, and ends in a space you can feel.
        </p>
      </motion.div>
    </section>
  );
}

export function IntroFlythrough() {
  const reduceMotion = useReducedMotion();
  const [isCompact, setIsCompact] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 900px)").matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const update = () => setIsCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const sectionRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef({ value: 0 });
  const exteriorRef = useRef<THREE.Group>(null);
  const interiorRef = useRef<THREE.Group>(null);

  // Progress is measured live from the section's bounding rect rather than
  // framer's useScroll: this component mounts late (client-only dynamic
  // import), which shifts layout and leaves useScroll's cached offsets stale
  // after scroll restoration or mid-page reloads.
  const progress = useMotionValue(0);
  const [chapter, setChapter] = useState(0);

  useEffect(() => {
    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const range = rect.height - window.innerHeight;
      const v = range > 0 ? Math.min(1, Math.max(0, -rect.top / range)) : 0;
      progress.set(v);
      progressRef.current.value = v;
      setChapter(
        v >= CAPTION_EXIT_AT
          ? -1
          : Math.min(CHAPTERS.length - 1, Math.floor(v * CHAPTERS.length))
      );
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [progress]);

  const flashOpacity = useTransform(progress, [0.48, 0.55, 0.62], [0, 1, 0]);
  const scrollCueOpacity = useTransform(progress, [0, 0.06], [1, 0]);

  const cameraProps = useMemo(
    () => ({ position: KEYFRAMES[0].pos.toArray() as [number, number, number], fov: KEYFRAMES[0].fov }),
    []
  );

  if (reduceMotion || isCompact) {
    return <FallbackIntro />;
  }

  return (
    <section ref={sectionRef} className="relative h-[420vh] w-full bg-ink">
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        <Canvas camera={cameraProps} gl={{ antialias: true }} dpr={[1, 1.5]}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[8, 10, 6]} intensity={1.1} color="#fff3da" />
          <ExteriorScene groupRef={exteriorRef} />
          <InteriorScene groupRef={interiorRef} />
          <Rig progressRef={progressRef} exteriorRef={exteriorRef} interiorRef={interiorRef} />
        </Canvas>

        <motion.div
          aria-hidden
          style={{ opacity: flashOpacity }}
          className="pointer-events-none absolute inset-0 z-10 bg-ink"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[5] bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(8,13,23,0.75)_100%)]"
        />
        <div className="grain-overlay z-[6]" />

        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-end px-6 pb-24 text-center sm:pb-28">
          <AnimatePresence mode="wait">
            {chapter >= 0 ? (
              <motion.div
                key={chapter}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: easeLuxe }}
                className="flex flex-col items-center"
              >
                <span className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-gold">
                  {CHAPTERS[chapter].kicker}
                </span>
                <h2 className="font-display text-3xl text-porcelain sm:text-4xl lg:text-5xl">
                  {CHAPTERS[chapter].title}
                </h2>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <motion.div
          style={{ opacity: scrollCueOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-8 z-20 flex flex-col items-center gap-2 text-mist/70"
        >
          <span className="text-[10px] uppercase tracking-[0.3em]">Scroll to walk through</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="h-4 w-4" aria-hidden />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
