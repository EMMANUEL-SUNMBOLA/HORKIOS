import type { MetadataRoute } from "next";

const baseUrl = "https://horkios.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/how-it-works"], disallow: ["/invite/", "/campaign/", "/dashboard", "/create", "/api/"] }],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
