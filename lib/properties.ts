export type Property = {
  id: string;
  slug: string;
  title: string;
  location: string;
  category: "Residential" | "Commercial" | "Cultural";
  year: string;
  image: string; // Hero image
  description: string;
  highlights: string[];

  // 3D Model
  models?: {
    objFile: string; // Path to OBJ file
    mtlFile?: string; // Path to MTL file (omit if not available)
    textureDir?: string; // Path to texture directory
    scale?: number; // Model-specific scale adjustment
    preview: string; // Static preview image for lazy loading
  }[];

  // Panorama tour — one or more equirectangular scenes (2:1 ratio) a visitor can switch between
  panoramas?: PanoramaScene[];

  // Video walkthrough
  video?: {
    src: string; // Path to mp4
    poster?: string; // Still frame shown before playback
  };

  // Additional stills shown in a gallery grid on the property page
  gallery?: string[];
};

export type PanoramaScene = {
  id: string;
  label: string; // Shown in the scene switcher, e.g. "Street View"
  src: string; // Path to equirectangular panorama image (2:1 ratio)
};

// Placeholder projects invented during early development (Meridian Sky
// Residence, The Prism Pavilion, Northstone Headquarters, Villa Lumière)
// have been removed — only the studio's real work is listed here.
//
// Their real 360° panoramas (/panoramas/1_1..1_3) and the OBJ model under
// /models/unassigned-villa are genuine studio assets that were attached to
// the fictional entry; they are kept on disk, unreferenced, until the studio
// confirms which project they belong to.
export const PROPERTIES: Property[] = [
  {
    id: "queens-tower",
    slug: "queens-tower",
    title: "Queens Tower",
    location: "Location TBC",
    category: "Commercial",
    year: "2026",
    image: "/videos/queens_tower/Capture1.PNG",
    description:
      "A boutique retail gateway anchoring a street-front development: a full-height timber-and-stone portal frames four glazed shop units, with separate vehicle and pedestrian entries opening onto a landscaped forecourt.",
    highlights: [
      "Four ground-level retail units with full-height glazed shopfronts",
      "Separate vehicle and pedestrian entries onto a landscaped forecourt",
      "Timber-and-stone gateway facade anchoring the street frontage",
    ],
    video: {
      src: "/videos/queens_tower/queens_tower.mp4",
      poster: "/videos/queens_tower/Capture1.PNG",
    },
    gallery: [
      "/videos/queens_tower/Capture.PNG",
      "/videos/queens_tower/Capture2.PNG",
      "/videos/queens_tower/Capture3.PNG",
      "/videos/queens_tower/Capture4.PNG",
      "/videos/queens_tower/Capture5.PNG",
      "/videos/queens_tower/Capture6.PNG",
    ],
  },
];

export function getPropertyBySlug(slug: string) {
  return PROPERTIES.find((property) => property.slug === slug);
}

export function getPropertyById(id: string) {
  return PROPERTIES.find((property) => property.id === id);
}
