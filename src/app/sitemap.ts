import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/config/site";
import { db } from "@/lib/db";
import { getPrimaryImagesByProductIds } from "@/lib/store/product-queries";

export const revalidate = 3600;

function toValidDate(value: string | null | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : new Date(parsed);
}

function getLatestDate(dates: Array<Date | undefined>): Date | undefined {
  let latest: Date | undefined;

  for (const date of dates) {
    if (date && (!latest || date.getTime() > latest.getTime())) {
      latest = date;
    }
  }

  return latest;
}

function toAbsoluteUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url, SITE_URL);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }

    return parsed.href;
  } catch {
    return undefined;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    db.orm.public.Product.where({
      isActive: true,
    })
      .select("id", "slug", "updatedAt")
      .orderBy((product) => product.updatedAt.desc())
      .all(),

    db.orm.public.Category.where({
      isActive: true,
    })
      .select("id", "slug", "updatedAt")
      .orderBy((category) => category.sortOrder.asc())
      .all(),
  ]);

  const primaryImagesMap = await getPrimaryImagesByProductIds(
    products.map((product) => product.id),
  );

  const productDates = products.map((product) => toValidDate(product.updatedAt));
  const categoryDates = categories.map((category) =>
    toValidDate(category.updatedAt),
  );
  const catalogLastModified = getLatestDate([...productDates, ...categoryDates]);

  return [
    {
      url: SITE_URL,
      ...(catalogLastModified ? { lastModified: catalogLastModified } : {}),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/shop`,
      ...(catalogLastModified ? { lastModified: catalogLastModified } : {}),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/contact`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/shipping`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/returns`,
      changeFrequency: "monthly",
      priority: 0.4,
    },

    ...categories.map((category, index) => {
      const lastModified = categoryDates[index];

      return {
        url: `${SITE_URL}/collections/${category.slug}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    }),

    ...products.map((product, index) => {
      const lastModified = productDates[index];
      const primaryImage = primaryImagesMap.get(product.id);
      const primaryImageUrl = primaryImage
        ? toAbsoluteUrl(primaryImage.url)
        : undefined;

      return {
        url: `${SITE_URL}/products/${product.slug}`,
        ...(lastModified ? { lastModified } : {}),
        ...(primaryImageUrl ? { images: [primaryImageUrl] } : {}),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      };
    }),
  ];
}
