
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/account/",
        "/api/",
        "/checkout",
        "/cart",
        "/login",
        "/register",
        "/wishlist",
        "/order-success/",
      ],
    },
    sitemap: "https://indranicreations.store/sitemap.xml",
    host: "https://indranicreations.store",
  };
}
