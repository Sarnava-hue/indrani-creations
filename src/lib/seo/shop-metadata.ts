import type { Metadata } from "next";

import { buildStorePageMetadata } from "@/lib/seo/page-metadata";

export const ALLOWED_SHOP_SORTS = [
  "newest",
  "price-low",
  "price-high",
  "name",
] as const;

export type ShopSort = (typeof ALLOWED_SHOP_SORTS)[number];

export type ShopSearchParamsInput = {
  q?: string;
  category?: string;
  sort?: string;
  page?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
};

export type NormalizedShopParams = {
  query: string;
  categorySlug: string;
  sort: ShopSort;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  minPaise: number | null;
  maxPaise: number | null;
  currentPage: number;
  hasActiveFilters: boolean;
};

/**
 * Parses and normalizes /shop query parameters into consistent filter,
 * pagination, and metadata signals.
 */
export function normalizeShopSearchParams(
  params: ShopSearchParamsInput,
): NormalizedShopParams {
  const query = params.q?.trim() ?? "";
  const categorySlug = params.category?.trim() ?? "";
  const sort = ALLOWED_SHOP_SORTS.includes(params.sort as ShopSort)
    ? (params.sort as ShopSort)
    : "newest";
  const minPrice = params.minPrice?.trim() ?? "";
  const maxPrice = params.maxPrice?.trim() ?? "";
  const inStock = params.inStock === "1";

  const hasActiveFilters = Boolean(
    query ||
    categorySlug ||
    minPrice ||
    maxPrice ||
    inStock ||
    sort !== "newest",
  );

  const parsedMin = Number(minPrice);
  const minPaise =
    minPrice !== "" && Number.isFinite(parsedMin)
      ? Math.max(0, Math.round(parsedMin * 100))
      : null;

  const parsedMax = Number(maxPrice);
  const maxPaise =
    maxPrice !== "" && Number.isFinite(parsedMax)
      ? Math.max(0, Math.round(parsedMax * 100))
      : null;

  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  return {
    query,
    categorySlug,
    sort,
    minPrice,
    maxPrice,
    inStock,
    minPaise,
    maxPaise,
    currentPage,
    hasActiveFilters,
  };
}

/**
 * Generates Technical SEO metadata for /shop:
 * - Filtered/sorted/search views are marked noindex, follow to avoid duplicate indexing.
 * - Clean pagination pages keep a self-referencing canonical URL.
 */
export function buildShopMetadata(params: ShopSearchParamsInput): Metadata {
  const { query, currentPage, hasActiveFilters } =
    normalizeShopSearchParams(params);

  const defaultDescription =
    "Explore sarees, bangles, earrings, and necklaces at Indrani Creations. Discover elegant styles for weddings, festivals, celebrations, and everyday wear.";

  if (hasActiveFilters) {
    const title = query
      ? `Search: "${query}" | Shop Sarees & Jewellery`
      : "Shop Sarees & Jewellery Online";

    return {
      ...buildStorePageMetadata({
        title,
        description: defaultDescription,
        canonical: "/shop",
      }),
      alternates: undefined,
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const canonical =
    currentPage > 1 ? `/shop?page=${currentPage}` : "/shop";

  const title =
    currentPage > 1
      ? `Shop Sarees & Jewellery Online — Page ${currentPage}`
      : "Shop Sarees & Jewellery Online";

  return {
    ...buildStorePageMetadata({
      title,
      description: defaultDescription,
      canonical,
    }),
    robots: {
      index: true,
      follow: true,
    },
  };
}
