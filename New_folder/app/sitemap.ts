import type { MetadataRoute } from "next";
import { tournaments } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://example.com";
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/tournaments",
    "/schedule",
    "/results",
    "/about",
    "/contact",
    "/register",
  ].map((p) => ({ url: `${base}${p}`, priority: 0.7 }));

  const dynamic: MetadataRoute.Sitemap = tournaments
    .filter((t) => t.date) // Only include tournaments with dates
    .map((t) => ({
      url: `${base}/tournament/${t.id}`,
      lastModified: new Date(t.date!),
      priority: 0.8,
    }));

  return [...staticRoutes, ...dynamic];
}
