import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attachPrimaryImages } from "@/lib/store/product-queries";

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

    const productsWithImages = await attachPrimaryImages(products);

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