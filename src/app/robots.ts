import type { MetadataRoute } from "next";

// A school's private marketplace has no business in search results.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
