// One source of truth for the studio's contact details. These appear in the
// footer, the closing CTA and the page's structured data, and a phone number
// that disagrees with itself across three places is worse than no number.

/**
 * The studio's phone lines. Each entry is a labelled tel: URI so the same
 * data can render as a link in the footer/CTA and as a JSON-LD telephone.
 */
export const STUDIO_PHONES = [
  { label: "+91 76200 73690", href: "tel:+917620073690" },
  { label: "+91 7822-928756", href: "tel:+917822928756" },
] as const;
export const STUDIO_EMAIL = "info@dsignarchitects.com";
export const STUDIO_EMAIL_HREF = `mailto:${STUDIO_EMAIL}`;
export const STUDIO_ADDRESS =
  "Flat no 201, Leena Manik Apartment, near Shantai Hotel, Rasta Peth, Pune - 411011";

/**
 * The studio's own Google Maps listing rather than a text search for the
 * address, so the pin lands on the office instead of the street.
 */
export const MAPS_URL =
  "https://www.google.com/maps/place/D'sign+Architects/@18.5200328,73.8686957,16.84z/data=!4m6!3m5!1s0x3bc2c17e0c94411f:0x9830d65d481c7eeb!8m2!3d18.5199424!4d73.8713814!16s%2Fg%2F11f73ybtbx";

export const INSTAGRAM_URL = "https://www.instagram.com/dsignarchitects/";
export const INSTAGRAM_HANDLE = "@dsignarchitects";

export const LINKEDIN_URL = "https://www.linkedin.com/company/dsign-architects/";
