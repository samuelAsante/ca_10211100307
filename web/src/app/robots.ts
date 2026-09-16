import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.ashantiskitchenware.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/products",
          "/products/*",
          "/search",
          "/privacy-policy",
          "/cookie-policy",
          "/refund-policy",
          "/terms",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/checkout",
          "/checkout/*",
          "/cart",
          "/api/*",
          "/auth-redirect",
          "/_next/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
