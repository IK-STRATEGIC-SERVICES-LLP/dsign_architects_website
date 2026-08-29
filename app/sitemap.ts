import type { MetadataRoute } from "next";
import { PROJECTS } from "@/lib/projects";
import { PROPERTIES } from "@/lib/properties";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/projects`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/studio`, changeFrequency: "yearly", priority: 0.8 },
    { url: `${SITE_URL}/properties`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/team`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${SITE_URL}/events`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const projectRoutes: MetadataRoute.Sitemap = PROJECTS.map((project) => ({
    url: `${SITE_URL}/projects/${project.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const propertyRoutes: MetadataRoute.Sitemap = PROPERTIES.flatMap((property) => {
    const routes: MetadataRoute.Sitemap = [
      {
        url: `${SITE_URL}/properties/${property.slug}`,
        changeFrequency: "monthly",
        priority: 0.8,
      },
    ];
    if (property.models && property.models.length > 0) {
      routes.push({
        url: `${SITE_URL}/properties/${property.slug}/3d-viewer`,
        changeFrequency: "yearly",
        priority: 0.5,
      });
    }
    if (property.panoramas && property.panoramas.length > 0) {
      routes.push({
        url: `${SITE_URL}/properties/${property.slug}/panorama`,
        changeFrequency: "yearly",
        priority: 0.5,
      });
    }
    if (property.video) {
      routes.push({
        url: `${SITE_URL}/properties/${property.slug}/video`,
        changeFrequency: "yearly",
        priority: 0.5,
      });
    }
    return routes;
  });

  return [...staticRoutes, ...projectRoutes, ...propertyRoutes];
}
