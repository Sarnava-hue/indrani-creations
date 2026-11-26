import type { Metadata } from "next";

import { SITE_URL } from "@/lib/config/site";

export const DEFAULT_OG_IMAGE_PATH = "/images/home/hero-1.jpeg";
export const DEFAULT_OG_IMAGE_ALT =
  "Indrani Creations sarees, artisanal bangles, and handcrafted jewellery";

type StorePageMetadataInput = {
  title: string;
  description: string;
  canonical: string;
  absoluteTitle?: boolean;
  imageUrl?: string | null;
  imageAlt?: string;
};

type ProductDescriptionInput = {
  name: string;
  shortDescription?: string | null;
  description?: string | null;
  fabric?: string | null;
  color?: string | null;
  occasion?: string | null;
  pattern?: string | null;
};

/**
 * Resolves a relative or absolute asset URL against SITE_URL, falling back to
 * the store's default OpenGraph image so shared links always carry an image.
 */
export function resolveMetadataImageUrl(
  imageUrl?: string | null,
): string {
  const candidate = imageUrl?.trim() || DEFAULT_OG_IMAGE_PATH;

  try {
    return new URL(candidate, SITE_URL).href;
  } catch {
    return new URL(DEFAULT_OG_IMAGE_PATH, SITE_URL).href;
  }
}

/**
 * Truncates meta descriptions on a word boundary so search snippets avoid
 * awkward mid-word cutoffs.
 */
export function truncateMetaDescription(
  text: string,
  maxLength = 158,
): string {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const sliced = normalized.slice(0, maxLength - 1);
  const lastSpace = sliced.lastIndexOf(" ");
  const boundary = lastSpace >= Math.floor(maxLength * 0.6) ? lastSpace : sliced.length;

  return `${sliced.slice(0, boundary).trimEnd()}…`;
}

/**
 * Builds consistent canonical, OpenGraph, and Twitter metadata for storefront pages.
 */
export function buildStorePageMetadata({
  title,
  description,
  canonical,
  absoluteTitle = false,
  imageUrl,
  imageAlt,
}: StorePageMetadataInput): Metadata {
  const fullTitle =
    title.includes("Indrani Creations") ? title : `${title} | Indrani Creations`;
  const resolvedImageUrl = resolveMetadataImageUrl(imageUrl);
  const resolvedImageAlt = imageAlt?.trim() || DEFAULT_OG_IMAGE_ALT;
  const pageUrl = new URL(canonical, SITE_URL).href;

  return {
    title: absoluteTitle ? { absolute: fullTitle } : title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      url: pageUrl,
      siteName: "Indrani Creations",
      title: fullTitle,
      description,
      locale: "en_IN",
      images: [
        {
          url: resolvedImageUrl,
          alt: resolvedImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [
        {
          url: resolvedImageUrl,
          alt: resolvedImageAlt,
        },
      ],
    },
  };
}

/**
 * Builds a keyword-rich product meta description from shortDescription, full
 * description, or structured catalog attributes (fabric, color, occasion).
 */
export function buildProductMetaDescription(
  product: ProductDescriptionInput,
  categoryName?: string | null,
): string {
  const explicitShort = product.shortDescription?.trim();

  if (explicitShort) {
    return truncateMetaDescription(explicitShort);
  }

  const fullDescription = product.description?.trim();

  if (fullDescription) {
    return truncateMetaDescription(fullDescription);
  }

  const details: string[] = [];

  if (product.color?.trim()) {
    details.push(product.color.trim().toLowerCase());
  }

  if (product.fabric?.trim()) {
    details.push(product.fabric.trim().toLowerCase());
  }

  if (product.pattern?.trim()) {
    details.push(`${product.pattern.trim().toLowerCase()} weave`);
  }

  const detailText = details.length > 0 ? ` in ${details.join(", ")}` : "";
  const categoryText = categoryName?.trim()
    ? ` from our ${categoryName.trim()} collection`
    : "";
  const occasionText = product.occasion?.trim()
    ? ` Ideal for ${product.occasion.trim().toLowerCase()}.`
    : "";

  return truncateMetaDescription(
    `Shop ${product.name}${detailText}${categoryText} at Indrani Creations.${occasionText} Handcrafted Indian elegance delivered across India.`,
  );
}

/**
 * Builds collection copy for both meta descriptions and on-page intros when a
 * category does not yet have a custom editorial description in the database.
 */
export function buildCollectionDescription(
  categoryName: string,
  customDescription?: string | null,
): string {
  const trimmed = customDescription?.trim();

  if (trimmed) {
    return trimmed;
  }

  return `Explore our curated ${categoryName} collection at Indrani Creations. Thoughtfully crafted for weddings, festive celebrations, and everyday elegance across India.`;
}
