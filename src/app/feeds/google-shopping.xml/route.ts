import { NextResponse } from "next/server";

import { SITE_URL } from "@/lib/config/site";
import { db } from "@/lib/db";
import { buildGoogleShoppingFeedXml } from "@/lib/seo/google-shopping-feed";
import { getActiveCategories } from "@/lib/store/categories";
import {
  getAvailableQuantitiesByProductIds,
  getGalleryImagesByProductIds,
} from "@/lib/store/product-queries";

export const revalidate = 3600;

export async function GET() {
  try {
    const [products, categories] = await Promise.all([
      db.orm.public.Product.where({
        isActive: true,
      })
        .select(
          "id",
          "categoryId",
          "name",
          "slug",
          "sku",
          "shortDescription",
          "description",
          "pricePaise",
          "compareAtPricePaise",
          "fabric",
          "color",
          "occasion",
          "pattern",
        )
        .orderBy((product) => product.updatedAt.desc())
        .all(),

      getActiveCategories(),
    ]);

    const productIds = products.map((product) => product.id);
    const [galleryMap, stockMap] = await Promise.all([
      getGalleryImagesByProductIds(productIds),
      getAvailableQuantitiesByProductIds(productIds),
    ]);

    const categoryMap = new Map(
      categories.map((category) => [category.id, category]),
    );

    const feedItems = products.map((product) => {
      const category = categoryMap.get(product.categoryId);
      const images = galleryMap.get(product.id) ?? [];

      return {
        ...product,
        categoryName: category?.name ?? null,
        categorySlug: category?.slug ?? null,
        availableQuantity: stockMap.get(product.id) ?? 0,
        imageUrls: images.map((image) => image.url),
      };
    });

    const xml = buildGoogleShoppingFeedXml({
      siteUrl: SITE_URL,
      items: feedItems,
    });

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Failed to generate Google Shopping feed:", error);

    return NextResponse.json(
      { error: "Unable to generate product feed." },
      { status: 500 },
    );
  }
}
