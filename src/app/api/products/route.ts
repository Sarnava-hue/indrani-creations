import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const products =
      await db.orm.public.Product
        .where({ isActive: true })
        .select(
          "id",
          "name",
          "slug",
          "sku",
          "shortDescription",
          "pricePaise",
          "compareAtPricePaise",
          "fabric",
          "color",
          "occasion",
          "pattern",
          "isOneOfOne",
          "isFeatured",
        )
        .orderBy((product) =>
          product.createdAt.desc(),
        )
        .limit(50)
        .all();

    const productsWithImages =
      await Promise.all(
        products.map(async (product) => {
          const images =
            await db.orm.public.ProductImage
              .where({
                productId: product.id,
              })
              .select(
                "id",
                "url",
                "altText",
                "sortOrder",
                "isPrimary",
              )
              .orderBy((image) =>
                image.sortOrder.asc(),
              )
              .all();

          const primaryImage =
            images.find(
              (image) => image.isPrimary,
            ) ?? images[0] ?? null;

          return {
            ...product,
            primaryImage,
          };
        }),
      );

    return NextResponse.json({
      products: productsWithImages,
    });
  } catch (error) {
    console.error(
      "Failed to fetch products:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch products",
      },
      { status: 500 },
    );
  }
}