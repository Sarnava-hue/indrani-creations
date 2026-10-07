
import { db } from "@/prisma/db";

const EXPIRATION_MINUTES = 15;
const MAX_ORDERS_PER_RUN = 100;

type ExpirationError = {
  orderId: number;
  message: string;
};

export type ExpirationResult = {
  scanned: number;
  eligible: number;
  cancelled: number;
  skipped: number;
  failed: number;
  errors: ExpirationError[];
};

export async function expirePendingOrders(): Promise<ExpirationResult> {
  const cutoff = new Date(
    Date.now() - EXPIRATION_MINUTES * 60 * 1000
  );

  const pendingOrders = await db.orm.public.Order
    .where({
      status: "PENDING",
      paymentStatus: "PENDING",
    })
    .select("id", "orderNumber", "createdAt")
    .all();

  const eligibleOrders = pendingOrders
    .filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt <= cutoff;
    })
    .slice(0, MAX_ORDERS_PER_RUN);

  const result: ExpirationResult = {
    scanned: pendingOrders.length,
    eligible: eligibleOrders.length,
    cancelled: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (const order of eligibleOrders) {
    try {
      const cancelled = await db.transaction(async (tx) => {
        // Cancel only if the order is still pending and expired.
        const updatePlan = db.sql.public.order
          .update({ status: "CANCELLED" })
          .where((fields, fns) =>
            fns.and(
              fns.eq(fields.id, order.id),
              fns.eq(fields.status, "PENDING"),
              fns.eq(fields.paymentStatus, "PENDING"),
              fns.lte(fields.createdAt, cutoff.toISOString())
            )
          )
          .returning("id")
          .build();

        const updatedOrders = await tx.query(updatePlan);

        if (updatedOrders.length !== 1) {
          return false;
        }

        const items = await tx.orm.public.OrderItem
          .where({ orderId: order.id })
          .select("productId", "quantity")
          .all();

        for (const item of items) {
          const releasePlan = db.raw.sql`
            UPDATE public."inventory"
            SET "reserved" = "reserved" - ${item.quantity}
            WHERE "productId" = ${item.productId}
              AND "reserved" >= ${item.quantity}
          `
            .affectedCount()
            .build();

          const releaseResult = await tx.execute(releasePlan);

          if (releaseResult.affectedRows !== 1) {
            throw new Error(
              `Unable to release inventory for product ${item.productId}.`
            );
          }
        }

        return true;
      });

      if (cancelled) {
        result.cancelled += 1;
      } else {
        result.skipped += 1;
      }
    } catch (error) {
      result.failed += 1;

      const message =
        error instanceof Error
          ? error.message
          : "Unknown expiration error";

      result.errors.push({
        orderId: Number(order.id),
        message,
      });

      console.error(
        `Failed to expire order ${order.id}:`,
        error
      );
    }
  }

  return result;
}