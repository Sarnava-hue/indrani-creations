import { db } from "@/lib/db";

export type ReservationItem = {
  productId: number;
  quantity: number;
};

export async function reserveInventory(
  items: ReservationItem[],
) {
  const runtime = db.runtime();

  const reservations: ReservationItem[] = [];

  for (const item of items) {
    const plan = db.raw.sql`
      UPDATE "inventory"
      SET
        "reserved" = "reserved" + ${item.quantity}
      WHERE
        "productId" = ${item.productId}
        AND
        "quantity" - "reserved" >= ${item.quantity}
    `.affectedCount().build();

    const result =
      await runtime.execute(plan);

    if (result.affectedRows !== 1) {
      throw new Error(
        `Insufficient inventory for product ${item.productId}.`,
      );
    }

    reservations.push({
      productId: item.productId,
      quantity: item.quantity,
    });
  }

  return reservations;
}