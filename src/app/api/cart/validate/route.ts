import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getAvailableQuantity } from "@/lib/inventory/status";

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

    const [products, inventories, images] = await Promise.all([
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
      db.orm.public.Inventory.where((inventory) =>
        inventory.productId.in(productIds),
      )
        .select("productId", "quantity", "reserved")
        .all(),
      db.orm.public.ProductImage.where((image) =>
        image.productId.in(productIds),
      )
        .select("productId", "url", "sortOrder", "isPrimary")
        .orderBy((image) => image.sortOrder.asc())
        .all(),
    ]);

    const inventoryMap = new Map(
      inventories.map((record) => [
        record.productId,
        getAvailableQuantity(record.quantity, record.reserved),
      ]),
    );

    const imageMap = new Map<
      number,
      { url: string; isPrimary: boolean }
    >();

    for (const image of images) {
      const existing = imageMap.get(image.productId);

      if (!existing || (image.isPrimary && !existing.isPrimary)) {
        imageMap.set(image.productId, {
          url: image.url,
          isPrimary: image.isPrimary,
        });
      }
    }

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
