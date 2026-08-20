import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { BlueprintSheet } from "@/components/blueprint-sheet";
import {
  INSTAGRAM_URL,
  LINKEDIN_URL,
  MAPS_URL,
  STUDIO_EMAIL,
  STUDIO_PHONES,
} from "@/lib/contact";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Titles: a high-contrast old-style serif, standing in for the Tan Aegean
// look. Loaded from 300 so headings can run light at display sizes without
// the synthetic thinning a browser would otherwise apply.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

// Subtitles and body: a neutral grotesque, so long descriptions and the
// tracked-out uppercase labels stay legible instead of competing with the
// display face.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const SITE_TITLE = "D'sign Architects — Architecture, Interiors & EPC Delivery";
const SITE_DESCRIPTION =
  "Founded in 2015, D'sign Architects is a Pune-based multidisciplinary practice offering architecture, structural and MEP design, interiors, landscape, master planning, project management and full EPC delivery across India and overseas.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: [
    "D'Sign Architects",
    "architecture firm Pune",
    "architects in Pune",
    "interior design Pune",
    "structural design",
    "project management",
    "residential architecture",
    "commercial architecture",
  ],
  authors: [{ name: "D'Sign Architects" }],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "D'Sign Architects",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Architect",
  name: "D'Sign Architects",
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  email: STUDIO_EMAIL,
  telephone: STUDIO_PHONES.map((phone) => phone.label),
  address: {
    "@type": "PostalAddress",
    streetAddress:
      "Flat no 201, Leena Manik Apartment, near Shantai Hotel, Rasta Peth",
    addressLocality: "Pune",
    addressRegion: "Maharashtra",
    postalCode: "411011",
    addressCountry: "IN",
  },
  areaServed: "IN",
  priceRange: "$$",
  hasMap: MAPS_URL,
  sameAs: [INSTAGRAM_URL, LINKEDIN_URL],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-porcelain">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
        {/* Runs before first paint so a visitor who has already entered this
            session never sees the launch poster flash. Injects a style rule
            rather than setting an attribute on <html> — React hydrates and
            diffs that element, and an attribute we added behind its back
            reads to it as a server/client mismatch. */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem('dsign-launch-seen')){var s=document.createElement('style');s.setAttribute('data-launch-skip','');s.textContent='.launch-gate{display:none!important}';document.head.appendChild(s);}}catch(e){}`,
          }}
        />
        <BlueprintSheet />
        {children}
      </body>
    </html>
  );
}
