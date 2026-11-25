import { db } from "@/lib/db";

type ShipResult =
  | {
      shipped: true;
      orderId: number;
    }
  | {
      shipped: false;
      reason: "ORDER_NOT_SHIPPABLE";
    };

type ShippableShippingStatus = "SHIPPED" | "IN_TRANSIT" | "DELIVERED";

const SHIPPABLE_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
] as const;

export async function shipOrderAndCommitInventory(
  orderNumber: string,
  shippingStatus: ShippableShippingStatus = "SHIPPED",
): Promise<ShipResult> {
  return db.transaction(async (tx) => {
    const order = await tx.orm.public.Order.where({
      orderNumber,
    })
      .select(
        "id",
        "status",
        "paymentStatus",
        "shippingStatus",
      )
      .first();

    if (!order) {
      return {
        shipped: false,
        reason: "ORDER_NOT_SHIPPABLE",
      };
    }

    if (
      !SHIPPABLE_STATUSES.includes(
        order.status as (typeof SHIPPABLE_STATUSES)[number],
      )
    ) {
      return {
        shipped: false,
        reason: "ORDER_NOT_SHIPPABLE",
      };
    }

    if (order.paymentStatus !== "PAID") {
      return {
        shipped: false,
        reason: "ORDER_NOT_SHIPPABLE",
      };
    }

    /*
     * Mark the order as shipped, guarding on observed status & PAID paymentStatus
     * before committing reserved inventory.
     */
    const updatePlan = db.sql.public.order
      .update({
        status: "SHIPPED",
        shippingStatus,
      })
      .where((fields, fns) =>
        fns.and(
          fns.eq(fields.id, order.id),
          fns.eq(fields.status, order.status),
          fns.eq(fields.paymentStatus, "PAID"),
        ),
      )
      .returning(
        "id",
        "orderNumber",
        "status",
        "shippingStatus",
      )
      .build();

    const updatedRows = await tx.query(updatePlan);

    if (updatedRows.length !== 1) {
      return {
        shipped: false,
        reason: "ORDER_NOT_SHIPPABLE",
      };
    }

    const orderItems = await tx.orm.public.OrderItem.where({
      orderId: order.id,
    })
      .select(
        "productId",
        "quantity",
      )
      .all();

    /*
     * Commit every reserved item:
     *
     * quantity -= ordered quantity
     * reserved -= ordered quantity
     *
     * The WHERE clause ensures we never consume
     * inventory that wasn't reserved for the order.
     */
    for (const item of orderItems) {
      const commitPlan = db.raw
        .sql`
          UPDATE "inventory"
          SET
            "quantity" = "quantity" - ${item.quantity},
            "reserved" = "reserved" - ${item.quantity}
          WHERE "productId" = ${item.productId}
            AND "quantity" >= ${item.quantity}
            AND "reserved" >= ${item.quantity}
        `
        .affectedCount()
        .build();

      const result = await tx.execute(commitPlan);

      if (result.affectedRows !== 1) {
        throw new Error(
          `Unable to commit inventory for product ${item.productId}.`,
        );
      }
    }

    const nowIso = new Date().toISOString();
    const existingShipment = await tx.orm.public.Shipment.where({
      orderId: order.id,
    })
      .select("id", "shippedAt", "deliveredAt")
      .first();

    if (existingShipment) {
      const shipmentPlan = tx.sql.public.shipment
        .update({
          status: shippingStatus,
          shippedAt: existingShipment.shippedAt ?? nowIso,
          deliveredAt:
            shippingStatus === "DELIVERED"
              ? (existingShipment.deliveredAt ?? nowIso)
              : existingShipment.deliveredAt,
        })
        .where((fields, fns) => fns.eq(fields.id, existingShipment.id))
        .build();

      await tx.execute(shipmentPlan);
    } else {
      await tx.orm.public.Shipment.create({
        orderId: order.id,
        status: shippingStatus,
        shippedAt: nowIso,
        deliveredAt: shippingStatus === "DELIVERED" ? nowIso : null,
      });
    }

    return {
      shipped: true,
      orderId: order.id,
    };
  });
}