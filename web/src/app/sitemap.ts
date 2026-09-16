import type { MetadataRoute } from "next";
import { fetchBackend } from "@/lib/fetch-backend";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.ashantiskitchenware.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/cookie-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetchBackend("/api/products", {
      next: { revalidate: 3600 },
    });
    if (res?.ok) {
      const products = await res.json();
      if (Array.isArray(products)) {
        productRoutes = products
          .filter((p: any) => p && p.slug)
          .map((p: any) => ({
            url: `${baseUrl}/products/${encodeURIComponent(p.slug)}`,
            lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.8,
          }));
      }
    }
  } catch (error) {
    console.error("[Sitemap] Failed to fetch product routes:", error);
  }

  return [...staticRoutes, ...productRoutes];
}
