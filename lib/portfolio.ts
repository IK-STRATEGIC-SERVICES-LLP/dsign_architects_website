import generated from "./portfolio.generated.json";

// Typed view over the assets extracted from the studio's practice profile
// PDF (see scripts/extract-pdf-assets.py). Regenerate by re-running that
// script — do not hand-edit portfolio.generated.json.

export type PortfolioWork = {
  slug: string;
  title: string;
  location: string;
  category: PortfolioCategory;
  image: string;
  page: number;
};

export const PORTFOLIO_CATEGORIES = [
  "Master Planning",
  "Landscape",
  "Government",
  "Commercial",
  "Institutional",
  "Residential",
  "Interior",
] as const;

export type PortfolioCategory = (typeof PORTFOLIO_CATEGORIES)[number];

export const PORTFOLIO: PortfolioWork[] = generated.projects as PortfolioWork[];

/**
 * A project as the studio talks about it, rather than as the PDF paginates
 * it. The profile gives larger schemes several consecutive pages — Beacon
 * Hotel runs to four — and `PORTFOLIO` has one entry per page, so showing
 * that list directly puts the same project on the wall up to four times.
 * Grouping on a normalised title + location collapses those runs into one
 * project carrying every image the profile devotes to it, in page order.
 */

/**
 * Fold variant titles for the same project onto one grouping key. The PDF
 * paginates a single scheme across labelled fragments — "The Bishop's School"
 * for the architecture shots, "The Bishops School Lobby" for the interiors —
 * and even misspells the name between pages ("Collectors Office" vs "Collector
 * Office - Conference"). This unifies those fragments so each project tiles
 * once, keyed only on the project's name and location rather than the
 * category or sub-shot the profile assigns each page.
 */
function portfolioKey(title: string, location: string): string {
  const base = title
    .toLowerCase()
    .replace(/['’]/g, "") // unify apostrophe forms: Bishop's → Bishops
    .replace(/^\s*the\s+/, "") // drop leading "the"
    .replace(/\s+-\s*cambridge\s*$/, "")
    .replace(/\s+-\s*(?:conference|auditorium)\s*$/, "")
    .replace(/\s+(?:lobby|reception|conference|auditorium|multi-?purpose\s+hall)\s*$/, "")
    .trim();
  // Collapse plural/possessive drift so "Collectors" and "Collector" align.
  const singularised = base.replace(/\b\w{2,}s\b/g, (word) => word.slice(0, -1));
  return `${singularised}|${location.toLowerCase().trim()}`;
}

export type PortfolioProject = {
  slug: string;
  title: string;
  location: string;
  category: PortfolioCategory;
  images: string[];
  /** First page the project appears on, used to keep the profile's order. */
  page: number;
};

export const PORTFOLIO_PROJECTS: PortfolioProject[] = (() => {
  const byProject = new Map<string, PortfolioProject>();

  for (const work of PORTFOLIO) {
    const key = portfolioKey(work.title, work.location);
    const existing = byProject.get(key);
    if (existing) {
      existing.images.push(work.image);
      continue;
    }
    byProject.set(key, {
      // The first page's slug carries no `-2` suffix, so it stays the
      // stable identifier for the project as a whole.
      slug: work.slug,
      title: work.title,
      location: work.location,
      category: work.category,
      images: [work.image],
      page: work.page,
    });
  }

  return [...byProject.values()].sort((a, b) => a.page - b.page);
})();

/**
 * Client logos with the size they are drawn at on the profile's clients
 * page (in PDF points). Rendering from these keeps the relative scale of
 * the original layout instead of squashing every mark into one box.
 */
export type ClientLogo = {
  /**
   * Filename carries a content hash (`client-16.a1b2c3d4.png`), so corrected
   * artwork always arrives at a URL nothing has cached. Rewriting a logo in
   * place used to leave its URL unchanged, and Chrome's image memory cache
   * holds a decoded copy across an ordinary reload — so the old version kept
   * showing long after the file was fixed.
   */
  src: string;
  w: number;
  h: number;
  /** Actual pixel size of the extracted PNG, `[width, height]`. */
  px: [number, number];
  /**
   * The solid colour the mark is drawn on, when it carries one of its own
   * (Super Select and both police crests are artwork baked onto black).
   * `null` means the artwork is transparent or already white, so the tile
   * keeps its default white surface.
   */
  tint: string | null;
  /** Which band of the profile's clients page the logo appears under. */
  group: "Pan India" | "International";
};
export const CLIENT_LOGOS: ClientLogo[] = generated.clients as ClientLogo[];

export const PAN_INDIA_CLIENTS = CLIENT_LOGOS.filter((c) => c.group === "Pan India");
export const INTERNATIONAL_CLIENTS = CLIENT_LOGOS.filter(
  (c) => c.group === "International"
);

/** Photographs of the studio's own office. */
export const OFFICE_PHOTOS: string[] = generated.office;

/**
 * Portraits pulled from the profile that the studio has asked not to show.
 * Filtered here rather than removed from portfolio.generated.json, because
 * that file is rebuilt from the source PDF by scripts/extract-pdf-assets.py
 * and an edit made there would silently come back on the next run.
 */
const WITHHELD_PORTRAITS = ["/team/member-04.jpg"];

/**
 * Studio staff portraits from the profile's team page. The profile does not
 * caption them, so they are shown as an unnamed ensemble until the studio
 * supplies names and roles.
 */
export const TEAM_PORTRAITS: string[] = generated.team.filter(
  (src) => !WITHHELD_PORTRAITS.includes(src)
);

/**
 * The founders as they appear on the profile's own team page. Kept separate
 * from the award portraits used in the leadership section so the team
 * line-up shows them in the same setting as their staff.
 */
export const FOUNDER_TEAM_PORTRAITS: { name: string; role: string; photo: string }[] = [
  {
    name: "Ar. Umar Kazi",
    role: "Co-Founder",
    photo: generated.founderPortraits["umar-kazi"],
  },
  {
    name: "Ar. Shaheer Tungekar",
    role: "Co-Founder",
    photo: generated.founderPortraits["shaheer-tungekar"],
  },
];

export function countByCategory() {
  return PORTFOLIO_CATEGORIES.map((category) => ({
    category,
    // Counts projects, not profile pages, so the totals match the tiles.
    count: PORTFOLIO_PROJECTS.filter((p) => p.category === category).length,
  })).filter((entry) => entry.count > 0);
}
