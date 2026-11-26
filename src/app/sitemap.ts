import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/config/site";
import { db } from "@/lib/db";
import { EDITORIAL_GUIDES } from "@/lib/seo/guides";
import { getGalleryImagesByProductIds } from "@/lib/store/product-queries";

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

  const galleryImagesMap = await getGalleryImagesByProductIds(
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
      url: `${SITE_URL}/guides`,
      ...(getLatestDate(
        EDITORIAL_GUIDES.map((guide) => toValidDate(guide.updatedAt)),
      )
        ? {
            lastModified: getLatestDate(
              EDITORIAL_GUIDES.map((guide) => toValidDate(guide.updatedAt)),
            ),
          }
        : {}),
      changeFrequency: "monthly",
      priority: 0.7,
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

    ...EDITORIAL_GUIDES.map((guide) => {
      const lastModified = toValidDate(guide.updatedAt);
      const imageUrl = toAbsoluteUrl(guide.image);

      return {
        url: `${SITE_URL}/guides/${guide.slug}`,
        ...(lastModified ? { lastModified } : {}),
        ...(imageUrl ? { images: [imageUrl] } : {}),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      };
    }),

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
      const galleryUrls = [
        ...new Set(
          (galleryImagesMap.get(product.id) ?? [])
            .map((image) => toAbsoluteUrl(image.url))
            .filter((url): url is string => Boolean(url)),
        ),
      ];

      return {
        url: `${SITE_URL}/products/${product.slug}`,
        ...(lastModified ? { lastModified } : {}),
        ...(galleryUrls.length > 0 ? { images: galleryUrls } : {}),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      };
    }),
  ];
}
