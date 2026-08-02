/**
 * Bakes real Pune street geometry into a static file for the launch page.
 *
 * Source: OpenStreetMap via the Overpass API. OSM data is ODbL-licensed, so
 * the page carries an attribution line — see components/city-poster.tsx.
 *
 * Run with: node scripts/build-pune.mjs
 * Output:   lib/pune-roads.generated.ts  (committed; no runtime fetch)
 */

import { writeFileSync, existsSync, readFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = `${HERE}/.cache`;

// Pune, framed a little wider than the municipal limits.
const BOUNDS = { minLat: 18.44, maxLat: 18.60, minLon: 73.75, maxLon: 73.97 };

const TIERS = {
  major: "motorway|trunk|primary|motorway_link|trunk_link|primary_link",
  mid: "secondary|tertiary|secondary_link|tertiary_link",
  minor: "residential|unclassified|living_street",
};

const UA =
  "dsign-architects-site/1.0 (build script; contact dsignarchitects@outlook.com)";

async function fetchTier(name, pattern) {
  const cached = `${CACHE}/pune-${name}.json`;
  if (existsSync(cached)) {
    console.log(`  ${name}: cache hit`);
    return JSON.parse(readFileSync(cached, "utf8"));
  }
  const { minLat, minLon, maxLat, maxLon } = BOUNDS;
  const query = `[out:json][timeout:240];way["highway"~"^(${pattern})$"](${minLat},${minLon},${maxLat},${maxLon});out geom;`;

  // Overpass rate-limits per slot; back off rather than giving up.
  let text = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt) {
      const wait = 25_000 * attempt;
      console.log(`  ${name}: rate-limited, retrying in ${wait / 1000}s`);
      await new Promise((r) => setTimeout(r, wait));
    }
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: "data=" + encodeURIComponent(query),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": UA,
      },
    });
    text = await res.text();
    if (text.trim().startsWith("{")) break;
    if (res.status !== 429 && res.status !== 504) {
      throw new Error(`${name}: HTTP ${res.status} — ${text.slice(0, 160)}`);
    }
    text = "";
  }
  if (!text) throw new Error(`${name}: gave up after repeated rate limits`);
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(cached, text);
  return JSON.parse(text);
}

// Equirectangular with a cosine correction, so the city isn't stretched.
const MID_LAT = (BOUNDS.minLat + BOUNDS.maxLat) / 2;
const COS = Math.cos((MID_LAT * Math.PI) / 180);
export const VIEW_W = 1400;
const SPAN_LON = (BOUNDS.maxLon - BOUNDS.minLon) * COS;
const SCALE = VIEW_W / SPAN_LON;
const VIEW_H = Math.round((BOUNDS.maxLat - BOUNDS.minLat) * SCALE);

const project = (lon, lat) => [
  Math.round((lon - BOUNDS.minLon) * COS * SCALE),
  Math.round((BOUNDS.maxLat - lat) * SCALE),
];

/** Thin points and drop ways too short to register at this size. */
function simplify(geometry, minSeg, minLen) {
  const out = [];
  let prev = null;
  for (const { lat, lon } of geometry) {
    const [x, y] = project(lon, lat);
    if (prev && Math.abs(x - prev[0]) + Math.abs(y - prev[1]) < minSeg) continue;
    out.push(x, y);
    prev = [x, y];
  }

  // Always keep the final vertex. Without this a short street thins down to a
  // single point and gets dropped entirely — which is what emptied out the
  // residential layer and cost the map its texture.
  const last = geometry[geometry.length - 1];
  const [lx, ly] = project(last.lon, last.lat);
  if (!prev || prev[0] !== lx || prev[1] !== ly) out.push(lx, ly);

  if (out.length < 4) return null;
  let len = 0;
  for (let i = 2; i < out.length; i += 2) {
    len += Math.hypot(out[i] - out[i - 2], out[i + 1] - out[i - 1]);
  }
  return len < minLen ? null : out;
}

const result = {};
for (const [name, pattern] of Object.entries(TIERS)) {
  const data = await fetchTier(name, pattern);
  // Density comes from the number of streets, not the number of vertices per
  // street, so points are thinned hard while ways are largely kept. Minor
  // roads get the most thinning — they read as texture, not as routes.
  const minSeg = name === "minor" ? 9 : name === "mid" ? 5 : 4;
  const minLen = name === "minor" ? 7 : 5;
  const ways = [];
  for (const el of data.elements) {
    if (!el.geometry) continue;
    const line = simplify(el.geometry, minSeg, minLen);
    if (line) ways.push(line);
  }
  result[name] = ways;
  const pts = ways.reduce((s, w) => s + w.length / 2, 0);
  console.log(`  ${name}: ${ways.length} ways, ${pts} points`);
}

/**
 * Delta + zigzag + base36. Consecutive vertices on a road are a few units
 * apart, so deltas are almost always one or two characters where absolute
 * coordinates were four or five. Roughly a third of the raw size.
 */
const zigzag = (n) => (n < 0 ? -n * 2 - 1 : n * 2);

function encodeWay(flat) {
  const parts = [];
  let px = 0;
  let py = 0;
  for (let i = 0; i < flat.length; i += 2) {
    parts.push(zigzag(flat[i] - px).toString(36));
    parts.push(zigzag(flat[i + 1] - py).toString(36));
    px = flat[i];
    py = flat[i + 1];
  }
  return parts.join(" ");
}

const body = Object.entries(result)
  .map(([k, v]) => `  ${k}: ${JSON.stringify(v.map(encodeWay))},`)
  .join("\n");

const out = `// GENERATED by scripts/build-pune.mjs — do not edit by hand.
// Pune street geometry from OpenStreetMap (ODbL), pre-projected into a
// ${VIEW_W}x${VIEW_H} box and delta-encoded. Use decodeWay() to read one.

export const PUNE_VIEW = { w: ${VIEW_W}, h: ${VIEW_H} } as const;

/** Places a real coordinate in the same box the roads were baked into. */
export function projectPune(lon: number, lat: number): [number, number] {
  return [
    (lon - ${BOUNDS.minLon}) * ${COS} * ${SCALE},
    (${BOUNDS.maxLat} - lat) * ${SCALE},
  ];
}

/** Reverses the build script's zigzag/base36 delta encoding. */
export function decodeWay(encoded: string): number[] {
  const parts = encoded.split(" ");
  const out = new Array<number>(parts.length);
  let x = 0;
  let y = 0;
  for (let i = 0; i < parts.length; i += 2) {
    const dx = parseInt(parts[i], 36);
    const dy = parseInt(parts[i + 1], 36);
    x += dx % 2 ? -((dx + 1) / 2) : dx / 2;
    y += dy % 2 ? -((dy + 1) / 2) : dy / 2;
    out[i] = x;
    out[i + 1] = y;
  }
  return out;
}

export const PUNE_ROADS: Record<"major" | "mid" | "minor", string[]> = {
${body}
};
`;

writeFileSync(`${HERE}/../lib/pune-roads.generated.ts`, out);
console.log(`wrote ${(out.length / 1024).toFixed(0)} KB, view ${VIEW_W}x${VIEW_H}`);
