
import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const siteUrl = "https://indranicreations.store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    db.orm.public.Product.where({
      isActive: true,
    })
      .select("slug")
      .all(),

    db.orm.public.Category.where({
      isActive: true,
    })
      .select("slug")
      .all(),
  ]);

  return [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/shop`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      changeFrequency: "monthly",
      priority: 0.5,
    },

    ...categories.map((category) => ({
      url: `${siteUrl}/collections/${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),

    ...products.map((product) => ({
      url: `${siteUrl}/products/${product.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
