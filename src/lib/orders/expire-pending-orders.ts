
import { db } from "@/prisma/db";
import { releaseInventoryForOrder } from "@/lib/inventory/lifecycle";

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
    .where((order) => order.createdAt.lte(cutoff.toISOString()))
    .select("id", "orderNumber", "createdAt")
    .orderBy((order) => order.createdAt.asc())
    .all();

  const pendingOrderIds = pendingOrders.map((order) => order.id);

  const submittedPayments =
    pendingOrderIds.length > 0
      ? await db.orm.public.Payment.where((payment) =>
          payment.orderId.in(pendingOrderIds),
        )
          .where((payment) => payment.upiTransactionReference.isNotNull())
          .select("orderId")
          .all()
      : [];

  const ordersWithUpiReference = new Set(
    submittedPayments.map((payment) => payment.orderId),
  );

  const eligibleOrders = pendingOrders
    .filter((order) => !ordersWithUpiReference.has(order.id))
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
        // Cancel only if still pending, past cutoff, and no UPI reference was submitted.
        const cancelPlan = db.raw.sql`
          UPDATE "order"
          SET
            "status" = 'CANCELLED',
            "updatedAt" = NOW()
          WHERE "id" = ${order.id}
            AND "status" = 'PENDING'
            AND "paymentStatus" = 'PENDING'
            AND "createdAt" <= NOW() - make_interval(mins => ${EXPIRATION_MINUTES})
            AND NOT EXISTS (
              SELECT 1
              FROM "payment"
              WHERE "orderId" = ${order.id}
                AND "upiTransactionReference" IS NOT NULL
            )
        `
          .affectedCount()
          .build();

        const cancelResult = await tx.execute(cancelPlan);

        if (cancelResult.affectedRows !== 1) {
          return false;
        }

        const items = await tx.orm.public.OrderItem
          .where({ orderId: order.id })
          .select("productId", "quantity")
          .all();

        await releaseInventoryForOrder(tx, items);

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