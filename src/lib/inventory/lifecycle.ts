import { db } from "@/lib/db";

export type InventoryOrderItem = {
  productId: number;
  quantity: number;
};

export async function reserveInventoryForOrder(
  items: InventoryOrderItem[],
) {
  const runtime = db.runtime();

  for (const item of items) {
    const plan = db.raw.sql`
      UPDATE "inventory"
      SET "reserved" = "reserved" + ${item.quantity}
      WHERE "productId" = ${item.productId}
        AND "quantity" - "reserved" >= ${item.quantity}
    `.affectedCount().build();

    const result = await runtime.execute(plan);

    if (result.affectedRows !== 1) {
      throw new Error(
        `Insufficient inventory for product ${item.productId}.`,
      );
    }
  }
}

export async function releaseInventoryForOrder(
  items: InventoryOrderItem[],
) {
  const runtime = db.runtime();

  for (const item of items) {
    const plan = db.raw.sql`
      UPDATE "inventory"
      SET "reserved" = "reserved" - ${item.quantity}
      WHERE "productId" = ${item.productId}
        AND "reserved" >= ${item.quantity}
    `.affectedCount().build();

    const result = await runtime.execute(plan);

    if (result.affectedRows !== 1) {
      throw new Error(
        `Unable to release inventory for product ${item.productId}.`,
      );
    }
  }
}

export async function commitInventoryForOrder(
  items: InventoryOrderItem[],
) {
  const runtime = db.runtime();

  for (const item of items) {
    const plan = db.raw.sql`
      UPDATE "inventory"
      SET
        "quantity" = "quantity" - ${item.quantity},
        "reserved" = "reserved" - ${item.quantity}
      WHERE "productId" = ${item.productId}
        AND "quantity" >= ${item.quantity}
        AND "reserved" >= ${item.quantity}
    `.affectedCount().build();

    const result = await runtime.execute(plan);

    if (result.affectedRows !== 1) {
      throw new Error(
        `Unable to commit inventory for product ${item.productId}.`,
      );
    }
  }
}