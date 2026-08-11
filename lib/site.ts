/**
 * The site's own origin — the single source for canonical URLs, Open Graph
 * URLs, the sitemap and robots.txt.
 *
 * The studio is deployed at dsignarchitects.co.in. This used to be hard-coded
 * as .com in three separate files, which meant every canonical link, every
 * og:url and every entry in the sitemap pointed at a domain the site is not
 * served from — telling search engines the real pages were copies of
 * somewhere else, which is close to the worst thing a canonical tag can say.
 * Kept in one place now so the three can never disagree again.
 *
 * The env override lets a preview deployment canonicalise to itself instead
 * of to production, which otherwise makes previews compete with the live site
 * in the index. NEXT_PUBLIC_ so it resolves in both server and client bundles.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.dsignarchitects.co.in"
).replace(/\/+$/, "");

/** Absolute URL for a site-relative path, e.g. absoluteUrl("/projects"). */
export const absoluteUrl = (path: string) =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/**
 * Per-page metadata.
 *
 * Next merges metadata down the route tree, and `alternates` and `openGraph`
 * are inherited wholesale by any page that does not set them. The root layout
 * declares `canonical: "/"`, so every page that only set a title and
 * description was emitting a canonical pointing at the home page and an
 * og:title/og:url describing the home page. Routing every page through this
 * helper is what stops that: it always sets both.
 */
export function pageMetadata({
  path,
  title,
  description,
  images,
}: {
  /** Site-relative, e.g. "/projects" or `/projects/${slug}`. */
  path: string;
  title: string;
  description: string;
  /** Overrides the site-wide opengraph-image, e.g. a project's own poster. */
  images?: string[];
}) {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      ...(images ? { images } : {}),
    },
    twitter: {
      title,
      description,
      ...(images ? { images } : {}),
    },
  };
}
