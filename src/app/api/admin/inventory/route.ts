import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import {
  getAvailableQuantity,
  getInventoryStatus,
} from "@/lib/inventory/status";

export async function GET() {
  try {
    await requireAdmin();

    const products =
      await db.orm.public.Product
        .where({
          isActive: true,
        })
        .select(
          "id",
          "name",
          "slug",
          "sku",
        )
        .orderBy((product) =>
          product.name.asc(),
        )
        .all();

    const inventory =
      await Promise.all(
        products.map(async (product) => {
          const record =
            await db.orm.public.Inventory
              .where({
                productId: product.id,
              })
              .select(
                "id",
                "productId",
                "quantity",
                "reserved",
              )
              .first();

          const quantity =
            record?.quantity ?? 0;

          const reserved =
            record?.reserved ?? 0;

          const available =
            getAvailableQuantity(
              quantity,
              reserved,
            );

          const status =
            getInventoryStatus(
              quantity,
              reserved,
            );

          return {
            ...product,
            inventoryId:
              record?.id ?? null,
            quantity,
            reserved,
            available,
            status,
          };
        }),
      );

    return NextResponse.json({
      inventory,
    });
  } catch (error) {
    console.error(
      "Failed to fetch inventory:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch inventory",
      },
      {
        status: 500,
      },
    );
  }
}