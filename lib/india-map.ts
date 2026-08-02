/**
 * Geometry for the launch sequence.
 *
 * Everything is stored as real [longitude, latitude] and projected at render
 * time, so the national outline, the city markers and the Mumbai close-up all
 * share one coordinate space and stay registered to each other at any zoom.
 *
 * IMPORTANT — the boundary below is a STYLISED outline drawn for motion design.
 * It is not survey-accurate and must not be treated as an authoritative
 * depiction of India's borders. Before this page goes to production, replace
 * INDIA_BOUNDARY with an outline that follows the Survey of India's official
 * depiction; the projection helpers here will work unchanged.
 */

export type LonLat = [number, number];

/**
 * Global equirectangular window. World, India and Mumbai all live in this one
 * coordinate space, so the launch sequence is a single continuous zoom rather
 * than three maps crossfading into each other.
 */
export const MAP_BOUNDS = {
  minLon: -180,
  maxLon: 180,
  minLat: -58,
  maxLat: 84,
};

/** 10 SVG units per degree, equal on both axes. */
export const UNITS_PER_DEG = 10;
export const MAP_W = (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon) * UNITS_PER_DEG;
export const MAP_H = (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat) * UNITS_PER_DEG;

export function project([lon, lat]: LonLat): [number, number] {
  const { minLon, maxLon, minLat, maxLat } = MAP_BOUNDS;
  const x = ((lon - minLon) / (maxLon - minLon)) * MAP_W;
  const y = ((maxLat - lat) / (maxLat - minLat)) * MAP_H;
  return [x, y];
}

export function toPath(points: LonLat[], close = false): string {
  const d = points
    .map((p, i) => {
      const [x, y] = project(p);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return close ? `${d} Z` : d;
}

/** Stylised national outline — see the caveat at the top of this file. */
export const INDIA_BOUNDARY: LonLat[] = [
  [74.0, 34.5],
  [73.9, 33.2],
  [74.6, 32.5],
  [74.0, 31.5],
  [73.9, 30.5],
  [73.4, 29.9],
  [72.9, 28.5],
  [71.0, 27.8],
  [70.2, 27.7],
  [69.5, 26.5],
  [70.0, 25.7],
  [70.6, 24.3],
  [71.0, 24.0],
  [68.8, 23.9],
  [68.2, 23.6],
  [69.0, 22.8],
  [70.0, 22.5],
  [69.8, 21.5],
  [72.0, 21.0],
  [72.8, 20.0],
  [72.8, 19.1],
  [73.3, 17.5],
  [74.0, 15.5],
  [74.8, 13.5],
  [75.5, 11.8],
  [76.5, 9.0],
  [77.5, 8.1],
  [79.0, 9.5],
  [79.9, 10.3],
  [80.3, 13.1],
  [80.2, 15.9],
  [82.3, 16.9],
  [84.8, 19.1],
  [87.0, 21.0],
  [88.1, 21.7],
  [88.9, 24.0],
  [88.2, 25.2],
  [89.7, 26.0],
  [89.8, 26.8],
  [92.0, 26.9],
  [92.6, 25.0],
  [92.3, 24.1],
  [93.4, 24.0],
  [93.4, 22.3],
  [94.5, 24.0],
  [95.2, 26.6],
  [96.5, 27.3],
  [97.4, 28.2],
  [96.0, 29.0],
  [94.0, 29.3],
  [92.0, 28.2],
  [89.9, 28.3],
  [88.9, 27.3],
  [88.2, 27.9],
  [85.0, 28.2],
  [82.0, 30.3],
  [80.0, 30.5],
  [79.0, 31.4],
  [78.8, 32.6],
  [79.5, 34.3],
  [78.0, 35.5],
  [76.5, 35.8],
  [75.0, 35.0],
];

/** Where the studio has delivered — the dots that light up at country scale. */
export const CITY_MARKERS: Array<{ name: string; at: LonLat }> = [
  { name: "Pune", at: [73.8567, 18.5204] },
  { name: "Mumbai", at: [72.8777, 19.076] },
  { name: "Nashik", at: [73.7898, 19.9975] },
  { name: "Satara", at: [74.0183, 17.6805] },
  { name: "Solapur", at: [75.9064, 17.6599] },
  { name: "Ahmednagar", at: [74.7496, 19.0948] },
  { name: "Baramati", at: [74.5815, 18.1514] },
  { name: "Delhi", at: [77.209, 28.6139] },
  { name: "Lucknow", at: [80.9462, 26.8467] },
  { name: "Hyderabad", at: [78.4867, 17.385] },
  { name: "Bangalore", at: [77.5946, 12.9716] },
  { name: "Ahmedabad", at: [72.5714, 23.0225] },
];

export const MUMBAI: LonLat = [72.8777, 19.076];

/**
 * Simplified Mumbai shoreline — the western seaboard from Colaba up past
 * Gorai, then back down the harbour side. Stylised, for the close-up only.
 */
export const MUMBAI_COAST: LonLat[] = [
  // Colaba point, then north up the Arabian Sea shore
  [72.8145, 18.8975],
  [72.8085, 18.9105],
  [72.8125, 18.9215],
  [72.8055, 18.9295],
  [72.7985, 18.9425], // Girgaum / Marine Drive sweep
  [72.8145, 18.9535],
  [72.8195, 18.9665],
  [72.8115, 18.9775], // Worli
  [72.8175, 18.9905],
  [72.8245, 19.0035],
  [72.8195, 19.0185], // Bandra reclamation
  [72.8255, 19.0345],
  [72.8215, 19.0525],
  [72.8155, 19.0705], // Juhu
  [72.8225, 19.0885],
  [72.8175, 19.1085],
  [72.8095, 19.1285], // Versova
  [72.8025, 19.1485],
  [72.7935, 19.1705], // Madh / Marve
  [72.8005, 19.1905],
  [72.7955, 19.2105],
  [72.7885, 19.2345], // Gorai
  [72.7995, 19.2545],
  [72.8145, 19.2695],
  [72.8395, 19.2795], // Dahisar, turning inland
  [72.8695, 19.2865],
  [72.9005, 19.2795],
  [72.9295, 19.2605], // Thane creek head
  [72.9495, 19.2345],
  [72.9645, 19.2085],
  [72.9705, 19.1805], // Vikhroli
  [72.9645, 19.1525],
  [72.9525, 19.1265], // Chembur
  [72.9445, 19.1005],
  [72.9345, 19.0745], // Mankhurd
  [72.9235, 19.0505],
  [72.9105, 19.0265], // Sewri, harbour side
  [72.8985, 19.0025],
  [72.8875, 18.9805],
  [72.8785, 18.9585], // docks
  [72.8645, 18.9385],
  [72.8465, 18.9195],
  [72.8305, 18.9045],
];

/** Mahim Bay — the notch the coastline wraps around, drawn as a hole. */
export const MAHIM_BAY: LonLat[] = [
  [72.8225, 19.0225],
  [72.8345, 19.0325],
  [72.8455, 19.0365],
  [72.8535, 19.0295],
  [72.8465, 19.0195],
  [72.8355, 19.0155],
];

/**
 * Major road corridors, traced city to city. These are transport routes
 * between real places, not administrative boundaries — they carry none of the
 * boundary sensitivity that INDIA_BOUNDARY does.
 */
export const NATIONAL_CORRIDORS: LonLat[][] = [
  // Golden Quadrilateral — Delhi / Kolkata / Chennai / Mumbai / Delhi
  [
    [77.21, 28.61],
    [78.01, 27.18],
    [80.35, 26.45],
    [81.85, 25.44],
    [82.97, 25.32],
    [86.43, 23.8],
    [88.36, 22.57],
  ],
  [
    [88.36, 22.57],
    [85.82, 20.3],
    [83.3, 17.69],
    [80.65, 16.51],
    [80.27, 13.08],
  ],
  [
    [80.27, 13.08],
    [77.59, 12.97],
    [75.12, 15.36],
    [73.86, 18.52],
    [72.88, 19.08],
  ],
  [
    [72.88, 19.08],
    [72.83, 21.17],
    [72.57, 23.02],
    [73.71, 24.58],
    [75.79, 26.91],
    [77.21, 28.61],
  ],
  // North–South corridor
  [
    [74.8, 34.08],
    [75.58, 31.33],
    [77.21, 28.61],
    [78.18, 26.22],
    [78.58, 25.45],
    [79.09, 21.15],
    [78.49, 17.38],
    [77.59, 12.97],
    [78.15, 11.66],
    [78.12, 9.93],
    [77.54, 8.08],
  ],
  // East–West corridor
  [
    [69.61, 21.64],
    [70.8, 22.3],
    [72.57, 23.02],
    [75.86, 22.72],
    [77.41, 23.26],
    [78.58, 25.45],
    [80.35, 26.45],
    [80.95, 26.85],
    [83.37, 26.76],
    [88.43, 26.72],
  ],
  // North-east arm
  [
    [88.43, 26.72],
    [90.4, 26.15],
    [91.75, 26.14],
    [94.11, 27.09],
    [95.33, 27.48],
  ],
];

/** Major river courses — the organic counterpoint to the road geometry. */
export const RIVERS: LonLat[][] = [
  // Ganga
  [
    [78.16, 29.95],
    [80.35, 26.45],
    [81.85, 25.44],
    [82.97, 25.32],
    [85.14, 25.59],
    [87.92, 24.8],
    [88.36, 22.57],
    [88.1, 21.7],
  ],
  // Brahmaputra
  [
    [95.5, 27.8],
    [94.0, 26.9],
    [92.0, 26.4],
    [90.5, 25.2],
    [89.7, 24.2],
    [89.0, 23.0],
  ],
  // Narmada
  [
    [81.5, 22.8],
    [79.0, 22.7],
    [76.5, 22.2],
    [74.5, 21.9],
    [72.9, 21.6],
  ],
  // Godavari
  [
    [73.5, 19.9],
    [76.0, 19.4],
    [78.5, 18.9],
    [80.5, 17.8],
    [82.0, 16.9],
  ],
  // Krishna
  [
    [73.8, 17.9],
    [76.5, 16.8],
    [78.5, 16.5],
    [80.6, 16.0],
  ],
];

/** Deterministic PRNG — the webs must be identical on server and client. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * A small radial street web around a city, so the country reads as populated
 * linework rather than bare outlines at mid-zoom.
 */
function cityWeb(at: LonLat, seed: number, spokes: number, reach: number) {
  const rand = rng(seed);
  const [lon, lat] = at;
  const runs: LonLat[][] = [];
  for (let i = 0; i < spokes; i++) {
    const angle = (i / spokes) * Math.PI * 2 + rand() * 0.4;
    const len = reach * (0.4 + rand() * 0.6);
    const bend = (rand() - 0.5) * 0.45;
    runs.push([
      [lon, lat],
      [
        lon + Math.cos(angle) * len * 0.5,
        lat + Math.sin(angle) * len * 0.45,
      ],
      [
        lon + Math.cos(angle + bend) * len,
        lat + Math.sin(angle + bend) * len * 0.9,
      ],
    ]);
  }
  return runs;
}

/**
 * Real cities, used only as nodes for the secondary road mesh below. Placing
 * the mesh on actual settlements is what makes it read as a road network
 * rather than as noise.
 */
export const MESH_NODES: LonLat[] = [
  [77.21, 28.61], [72.88, 19.08], [88.36, 22.57], [80.27, 13.08],
  [77.59, 12.97], [78.49, 17.38], [73.86, 18.52], [72.57, 23.03],
  [72.83, 21.17], [75.79, 26.91], [80.95, 26.85], [80.35, 26.45],
  [79.09, 21.15], [75.86, 22.72], [77.41, 23.26], [85.14, 25.59],
  [73.19, 22.31], [75.86, 30.9], [78.01, 27.18], [73.79, 20.0],
  [82.97, 25.32], [74.87, 31.63], [70.8, 22.3], [73.02, 26.24],
  [81.63, 21.25], [85.31, 23.34], [91.75, 26.14], [76.78, 30.73],
  [76.96, 11.02], [76.27, 9.93], [76.94, 8.52], [78.12, 9.93],
  [83.3, 17.69], [80.65, 16.51], [85.82, 20.3], [79.93, 23.18],
  [78.18, 26.22], [81.85, 25.44], [78.03, 30.32], [74.8, 34.08],
  [74.86, 32.73], [88.43, 26.72], [93.94, 24.82], [91.88, 25.58],
  [73.83, 15.5], [74.86, 12.91], [76.64, 12.3], [75.12, 15.36],
  [75.91, 17.66], [75.34, 19.88], [74.24, 16.7], [73.71, 24.58],
  [74.64, 26.45], [73.31, 28.02], [77.71, 28.98], [79.43, 28.37],
  [83.37, 26.76], [86.43, 23.8], [86.2, 22.8], [85.88, 20.46],
  [79.6, 17.97], [79.42, 13.63], [78.15, 11.66], [78.7, 10.79],
  [75.78, 11.26], [70.9, 25.8], [77.0, 20.9], [84.0, 24.0],
  // Fill-in nodes so no region is left bare
  [69.7, 21.6], [71.2, 23.6], [74.6, 23.0], [76.2, 25.4],
  [79.0, 24.5], [81.0, 23.4], [82.6, 21.9], [84.2, 21.0],
  [87.3, 23.5], [89.0, 25.4], [90.6, 26.8], [92.8, 26.6],
  [94.6, 26.9], [93.6, 22.9], [92.2, 24.5], [88.3, 24.6],
  [83.0, 19.0], [81.2, 18.4], [78.9, 19.4], [77.4, 18.0],
  [79.8, 15.6], [78.3, 14.5], [76.3, 14.0], [74.4, 14.2],
  [76.8, 10.2], [77.7, 12.0], [80.0, 11.4], [79.1, 12.4],
  [75.2, 32.1], [76.5, 31.2], [77.6, 30.0], [79.1, 29.4],
  [80.3, 28.6], [82.0, 27.2], [84.5, 26.4], [86.0, 26.6],
  [71.9, 27.0], [72.6, 24.6], [70.3, 24.2], [73.5, 29.2],
  [75.0, 28.9], [78.5, 28.0], [80.2, 24.6], [77.9, 22.0],
];

/**
 * Secondary roads — every node linked to its nearest neighbours. Duplicate
 * links are dropped so each road is drawn once. Anything that strays outside
 * the coastline is cut by the clip path at render time.
 */
export const ROAD_MESH: LonLat[][] = (() => {
  const links = new Set<string>();
  const runs: LonLat[][] = [];

  MESH_NODES.forEach((from, i) => {
    const nearest = MESH_NODES.map((to, j) => ({
      j,
      to,
      d: Math.hypot(to[0] - from[0], to[1] - from[1]),
    }))
      .filter((n) => n.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 5);

    for (const n of nearest) {
      const key = i < n.j ? `${i}-${n.j}` : `${n.j}-${i}`;
      if (links.has(key)) continue;
      links.add(key);
      runs.push([from, n.to]);
    }
  });

  return runs;
})();

/**
 * City lights, in the manner of a night-time satellite composite. Density is
 * modelled rather than uniform: metros burn brightest, the Gangetic plain and
 * the Kerala coast glow as continuous bands, and the Thar and the Himalaya
 * stay dark. Points are pre-projected so render does no geometry work.
 */
/**
 * `glow` points are drawn with a radial-gradient fill; everything else gets a
 * flat fill. Gradients are what cost time when the viewBox animates, so only
 * the ~120 regional blooms use one and the rest stay cheap.
 */
export type CityLight = { x: number; y: number; r: number; glow?: boolean };

/** Populated corridors — [from, to, spread in degrees, point count]. */
const LIGHT_BANDS: Array<[LonLat, LonLat, number, number]> = [
  [[75.2, 29.4], [83.0, 26.2], 0.95, 260], // upper Gangetic plain
  [[83.0, 26.2], [88.2, 23.4], 0.85, 220], // lower Ganga to the delta
  [[74.2, 31.4], [77.4, 28.7], 0.7, 150], // Punjab and Haryana
  [[74.9, 12.1], [77.2, 8.4], 0.5, 170], // Kerala coast
  [[77.6, 11.6], [80.2, 9.2], 0.55, 140], // Tamil Nadu interior
  [[80.1, 15.8], [83.4, 17.8], 0.5, 110], // coastal Andhra
  [[70.2, 22.1], [73.2, 23.2], 0.6, 120], // Saurashtra and Gujarat
  [[73.1, 18.3], [75.6, 20.4], 0.55, 120], // western Maharashtra
  [[77.4, 12.9], [78.6, 17.4], 0.55, 110], // Bangalore to Hyderabad
  [[75.5, 26.9], [78.2, 26.2], 0.6, 90], // Jaipur to Agra
  [[78.5, 25.4], [81.6, 21.3], 0.65, 110], // Bundelkhand to Chhattisgarh
  [[73.9, 15.5], [77.6, 13.0], 0.55, 100], // Goa to Bangalore
  [[85.8, 20.3], [88.2, 22.6], 0.5, 90], // Odisha coast to Bengal
  [[72.6, 23.0], [75.9, 22.7], 0.55, 90], // Gujarat to Malwa
];

export const CITY_LIGHTS: CityLight[] = (() => {
  const rand = rng(987654321);
  const out: CityLight[] = [];

  // Rounded on the way in. These coordinates come off Math.cos/sin/pow, which
  // are implementation-defined and can differ in the last bits between the
  // server's V8 and the browser's — enough to trip a hydration mismatch when
  // the raw float is written straight into a cx/cy attribute.
  // Radii are given in degrees so they stay correct if the projection window
  // changes. Rounded on the way in: these coordinates come off Math.cos/sin/
  // pow, which are implementation-defined and can differ in the last bits
  // between the server's V8 and the browser's — enough to trip a hydration
  // mismatch when the raw float is written straight into a cx/cy attribute.
  const add = (lon: number, lat: number, rDeg: number, glow = false) => {
    const [x, y] = project([lon, lat]);
    out.push({
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      r: Math.round(rDeg * UNITS_PER_DEG * 100) / 100,
      ...(glow ? { glow: true } : {}),
    });
  };

  // Metros — the brightest cores
  const tier1: LonLat[] = [
    [77.21, 28.61], [72.88, 19.08], [88.36, 22.57], [80.27, 13.08],
    [77.59, 12.97], [78.49, 17.38], [72.57, 23.03], [73.86, 18.52],
  ];
  for (const [lon, lat] of tier1) {
    add(lon, lat, 0.95, true);
    for (let i = 0; i < 34; i++) {
      const a = rand() * Math.PI * 2;
      const d = Math.pow(rand(), 0.55) * 1.15;
      add(lon + Math.cos(a) * d, lat + Math.sin(a) * d * 0.9, 0.035 + rand() * 0.07);
    }
  }

  // Every other mapped city, with a smaller halo of its own
  MESH_NODES.forEach(([lon, lat], i) => {
    const big = i < 40;
    add(lon, lat, big ? 0.47 : 0.28, true);
    const halo = big ? 12 : 6;
    for (let j = 0; j < halo; j++) {
      const a = rand() * Math.PI * 2;
      const d = Math.pow(rand(), 0.6) * (big ? 0.7 : 0.45);
      add(lon + Math.cos(a) * d, lat + Math.sin(a) * d * 0.9, 0.03 + rand() * 0.055);
    }
  });

  // Populated corridors between them
  for (const [from, to, spread, count] of LIGHT_BANDS) {
    // One broad bloom carries the corridor's glow, so the individual points
    // along it can stay small and cheap.
    add(
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2,
      Math.hypot(to[0] - from[0], to[1] - from[1]) * 0.35,
      true
    );
    for (let i = 0; i < Math.round(count * 0.55); i++) {
      const t = rand();
      const lon = from[0] + (to[0] - from[0]) * t;
      const lat = from[1] + (to[1] - from[1]) * t;
      // Two samples averaged — clusters toward the corridor centreline.
      const off = (rand() + rand() - 1) * spread;
      const off2 = (rand() + rand() - 1) * spread;
      add(lon + off, lat + off2 * 0.7, 0.03 + rand() * 0.07);
    }
  }

  // Sparse rural scatter, thinned hard over the desert and the mountains
  // Bounded to the subcontinent, not to MAP_BOUNDS — that window is global now.
  for (let i = 0; i < 700; i++) {
    const lon = 68 + rand() * (97.5 - 68);
    const lat = 7 + rand() * (35.5 - 7);
    const desert = lon < 72.5 && lat > 25 && lat < 29.5;
    const mountain = lat > 31.5;
    if ((desert || mountain) && rand() > 0.18) continue;
    add(lon, lat, 0.025 + rand() * 0.05);
  }

  return out;
})();

/** Street webs for every marked city, largest around the two biggest. */
export const CITY_WEBS: LonLat[][] = CITY_MARKERS.flatMap((city, i) => {
  const major = ["Mumbai", "Delhi", "Pune", "Bangalore", "Hyderabad"].includes(
    city.name
  );
  return cityWeb(city.at, i * 9973 + 17, major ? 11 : 7, major ? 0.95 : 0.55);
});

export type Box = { x: number; y: number; w: number; h: number };

export const FULL_VIEW: Box = { x: 0, y: 0, w: MAP_W, h: MAP_H };

/** Projected bounding box of one or more lon/lat runs. */
export function bboxOf(runs: LonLat[][]): Box {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const run of runs) {
    for (const point of run) {
      const [x, y] = project(point);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Grows a box about its centre — head-room so the close-up isn't cropped tight. */
export function padBox({ x, y, w, h }: Box, factor: number): Box {
  const dw = w * factor;
  const dh = h * factor;
  return { x: x - dw / 2, y: y - dh / 2, w: w + dw, h: h + dh };
}

/** Trunk roads — the bright spine of the close-up, loosely on real alignments. */
export const MUMBAI_ARTERIALS: LonLat[][] = [
  // Western Express Highway — Bandra north to Dahisar
  [
    [72.8395, 19.0555], [72.8455, 19.0755], [72.8515, 19.0985],
    [72.8555, 19.1235], [72.8585, 19.1485], [72.8605, 19.1745],
    [72.8615, 19.2005], [72.8595, 19.2285], [72.8555, 19.2565],
  ],
  // Eastern Express Highway — Sion to Thane
  [
    [72.8635, 19.0395], [72.8815, 19.0555], [72.8975, 19.0765],
    [72.9095, 19.1005], [72.9195, 19.1285], [72.9275, 19.1575],
    [72.9355, 19.1875], [72.9455, 19.2155],
  ],
  // The island-city spine — Colaba to Sion
  [
    [72.8265, 18.9075], [72.8285, 18.9265], [72.8305, 18.9455],
    [72.8345, 18.9655], [72.8395, 18.9855], [72.8445, 19.0055],
    [72.8515, 19.0255], [72.8595, 19.0405],
  ],
  // Marine Drive and the western shore road
  [
    [72.8195, 18.9165], [72.8115, 18.9295], [72.8095, 18.9465],
    [72.8165, 18.9625], [72.8215, 18.9795], [72.8265, 18.9965],
  ],
  // Link Road — Bandra to Malad along the west
  [
    [72.8305, 19.0555], [72.8305, 19.0765], [72.8285, 19.0985],
    [72.8265, 19.1215], [72.8255, 19.1455], [72.8285, 19.1685],
  ],
  // Sea Link and the Mahim causeway
  [[72.8175, 19.0295], [72.8255, 19.0425], [72.8385, 19.0475]],
  // East–west connectors
  [[72.8265, 19.0755], [72.8555, 19.0805], [72.8815, 19.0885]],
  [[72.8285, 19.1245], [72.8595, 19.1285], [72.8985, 19.1215]],
  [[72.8265, 19.1685], [72.8605, 19.1725], [72.9315, 19.1665]],
  [[72.8325, 19.2145], [72.8605, 19.2135], [72.9105, 19.2015]],
  [[72.8395, 19.0155], [72.8695, 19.0125], [72.8965, 19.0195]],
];

/**
 * Local street grid for the close-up. Generated deterministically and clipped
 * to the shoreline at render time, so it reads as a real network without
 * anyone having to hand-place a few hundred segments.
 */
export const MUMBAI_STREETS: LonLat[][] = (() => {
  const rand = rng(20240719);
  const runs: LonLat[][] = [];

  /**
   * How wide the built-up strip is at a given latitude. Mumbai is a narrow
   * peninsula that widens north of Bandra, so streets are laid inside this
   * envelope rather than across a plain rectangle — that shape is most of
   * what makes the result read as Mumbai and not as generic grid noise.
   */
  const strip = (lat: number): [number, number] => {
    if (lat < 18.94) return [72.812, 72.838];
    if (lat < 19.0) return [72.804, 72.858];
    if (lat < 19.06) return [72.815, 72.878];
    if (lat < 19.13) return [72.818, 72.925];
    if (lat < 19.2) return [72.803, 72.958];
    if (lat < 19.26) return [72.795, 72.952];
    return [72.805, 72.935];
  };

  // Collectors — long runs following the grain of the peninsula.
  for (let i = 0; i < 90; i++) {
    const lat = 18.9 + rand() * 0.38;
    const [w, e] = strip(lat);
    const lon = w + (e - w) * rand();
    const len = 0.012 + rand() * 0.055;
    const drift = (rand() - 0.5) * 0.014;
    const mid = lat + len / 2;
    runs.push([
      [lon, lat],
      [lon + drift * 0.5, mid],
      [lon + drift, lat + len],
    ]);
  }

  // Cross streets, cut to the width of the strip they sit in.
  for (let i = 0; i < 150; i++) {
    const lat = 18.9 + rand() * 0.38;
    const [w, e] = strip(lat);
    const start = w + (e - w) * rand() * 0.8;
    const len = Math.min(0.008 + rand() * 0.032, e - start);
    if (len <= 0.004) continue;
    runs.push([
      [start, lat],
      [start + len, lat + (rand() - 0.5) * 0.006],
    ]);
  }

  // Fine local grid, densest in the island city where the fabric is tightest.
  for (let i = 0; i < 190; i++) {
    const lat = 18.9 + Math.pow(rand(), 1.35) * 0.38;
    const [w, e] = strip(lat);
    const lon = w + (e - w) * rand();
    const vertical = rand() > 0.45;
    const len = 0.004 + rand() * 0.014;
    runs.push(
      vertical
        ? [[lon, lat], [lon + (rand() - 0.5) * 0.003, lat + len]]
        : [[lon, lat], [lon + len, lat + (rand() - 0.5) * 0.003]]
    );
  }

  return runs;
})();

/**
 * Where the zoom lands. Derived from the close-up geometry rather than a
 * magic zoom factor, so the shoreline always fills the frame — if the Mumbai
 * linework is ever redrawn, the destination follows it automatically.
 */
export const MUMBAI_VIEW: Box = padBox(
  bboxOf([MUMBAI_COAST, ...MUMBAI_ARTERIALS]),
  0.16
);

/** The middle stop of the zoom. */
export const INDIA_VIEW: Box = padBox(bboxOf([INDIA_BOUNDARY]), 0.22);

