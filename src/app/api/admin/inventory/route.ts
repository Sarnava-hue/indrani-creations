import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import {
  getAvailableQuantity,
  getInventoryStatus,
} from "@/lib/inventory/status";

export async function GET() {
  try {
    const { response } = await requireAdminApi();

    if (response) {
      return response;
    }

    const products = await db.orm.public.Product.select(
      "id",
      "name",
      "slug",
      "sku",
      "isActive",
    )
      .orderBy((product) => product.name.asc())
      .all();

    const productIds = products.map((product) => product.id);

    const inventoryRecords =
      productIds.length > 0
        ? await db.orm.public.Inventory.where((inventory) =>
            inventory.productId.in(productIds),
          )
            .select("id", "productId", "quantity", "reserved")
            .all()
        : [];

    const inventoryMap = new Map(
      inventoryRecords.map((record) => [record.productId, record]),
    );

    const inventory = products.map((product) => {
      const record = inventoryMap.get(product.id);
      const quantity = record?.quantity ?? 0;
      const reserved = record?.reserved ?? 0;
      const available = getAvailableQuantity(quantity, reserved);
      const status = getInventoryStatus(quantity, reserved);

      return {
        ...product,
        inventoryId: record?.id ?? null,
        quantity,
        reserved,
        available,
        status,
      };
    });

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