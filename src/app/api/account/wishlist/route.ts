import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  getAvailableQuantitiesByProductIds,
  getPrimaryImagesByProductIds,
} from "@/lib/store/product-queries";

type WishlistProductInput = {
  productId: number;
};

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const wishlistItems =
      await db.orm.public.WishlistItem
        .where({
          userId: session.userId,
        })
        .select(
          "id",
          "productId",
          "createdAt",
        )
        .orderBy((item) =>
          item.createdAt.desc(),
        )
        .all();

    if (wishlistItems.length === 0) {
      return NextResponse.json({
        wishlist: [],
      });
    }

    const productIds = [
      ...new Set(wishlistItems.map((item) => item.productId)),
    ];

    const [products, primaryImageMap, inventoryMap] = await Promise.all([
      db.orm.public.Product.where((product) => product.id.in(productIds))
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
        .all(),
      getPrimaryImagesByProductIds(productIds),
      getAvailableQuantitiesByProductIds(productIds),
    ]);

    const productMap = new Map(
      products.map((product) => [product.id, product]),
    );

    const populatedWishlist = wishlistItems.flatMap((item) => {
      const product = productMap.get(item.productId);

      if (!product) {
        return [];
      }

      return [
        {
          wishlistId: item.id,
          createdAt: item.createdAt,
          product: {
            ...product,
            availableQuantity: inventoryMap.get(product.id) ?? 0,
            primaryImage: primaryImageMap.get(product.id) ?? null,
          },
        },
      ];
    });

    return NextResponse.json({
      wishlist: populatedWishlist,
    });
  } catch (error) {
    console.error(
      "Failed to fetch wishlist:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to retrieve your wishlist right now.",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const body: unknown =
      await request.json();

    if (
      typeof body !== "object" ||
      body === null
    ) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const payload =
      body as Partial<WishlistProductInput>;

    if (
      typeof payload.productId !== "number" ||
      !Number.isInteger(payload.productId) ||
      payload.productId <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid product ID." },
        { status: 400 },
      );
    }

    const products =
      await db.orm.public.Product
        .where({
          id: payload.productId,
          isActive: true,
        })
        .select("id")
        .all();

    if (products.length === 0) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    const existing =
      await db.orm.public.WishlistItem
        .where({
          userId: session.userId,
          productId: payload.productId,
        })
        .select("id")
        .all();

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: true,
          alreadyExists: true,
          wishlistItemId: existing[0].id,
        },
      );
    }

    const wishlistItem =
      await db.orm.public.WishlistItem.create({
        userId: session.userId,
        productId: payload.productId,
      });

    return NextResponse.json(
      {
        success: true,
        alreadyExists: false,
        wishlistItemId: wishlistItem.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Failed to add wishlist item:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to add this product to your wishlist right now.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const body: unknown =
      await request.json();

    if (
      typeof body !== "object" ||
      body === null
    ) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const payload =
      body as Partial<WishlistProductInput>;

    if (
      typeof payload.productId !== "number" ||
      !Number.isInteger(payload.productId) ||
      payload.productId <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid product ID." },
        { status: 400 },
      );
    }

    const plan = db.raw.sql`
      DELETE FROM "wishlistItem"
      WHERE
        "userId" = ${session.userId}
        AND
        "productId" = ${payload.productId}
    `.affectedCount().build();

    const result =
      await db.runtime().execute(plan);

    if (result.affectedRows !== 1) {
      return NextResponse.json(
        { error: "Wishlist item not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Failed to remove wishlist item:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to remove this product from your wishlist right now.",
      },
      { status: 500 },
    );
  }
}