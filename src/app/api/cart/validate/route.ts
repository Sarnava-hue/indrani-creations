import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  getAvailableQuantitiesByProductIds,
  getPrimaryImagesByProductIds,
} from "@/lib/store/product-queries";

type ValidateCartRequest = {
  productIds?: unknown;
};

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const { productIds: rawIds } = body as ValidateCartRequest;

    if (!Array.isArray(rawIds)) {
      return NextResponse.json(
        { error: "productIds must be an array." },
        { status: 400 },
      );
    }

    if (rawIds.length === 0) {
      return NextResponse.json({ products: [] });
    }

    if (rawIds.length > 50) {
      return NextResponse.json(
        { error: "Too many products in cart." },
        { status: 400 },
      );
    }

    const validIds = rawIds.filter(
      (id): id is number =>
        typeof id === "number" && Number.isInteger(id) && id > 0,
    );

    if (validIds.length !== rawIds.length) {
      return NextResponse.json(
        { error: "All productIds must be positive integers." },
        { status: 400 },
      );
    }

    const productIds = [...new Set(validIds)];

    const [products, inventoryMap, imageMap] = await Promise.all([
      db.orm.public.Product.where((product) => product.id.in(productIds))
        .select(
          "id",
          "name",
          "slug",
          "sku",
          "pricePaise",
          "isActive",
          "isOneOfOne",
        )
        .all(),
      getAvailableQuantitiesByProductIds(productIds),
      getPrimaryImagesByProductIds(productIds),
    ]);

    return NextResponse.json({
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        pricePaise: product.pricePaise,
        isActive: product.isActive,
        isOneOfOne: product.isOneOfOne,
        availableQuantity: product.isActive
          ? (inventoryMap.get(product.id) ?? 0)
          : 0,
        imageUrl: imageMap.get(product.id)?.url ?? null,
      })),
    });
  } catch (error) {
    console.error("Failed to validate cart products:", error);

    return NextResponse.json(
      { error: "Unable to validate cart items right now." },
      { status: 500 },
    );
  }
}
