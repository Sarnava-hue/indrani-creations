import { db } from "@/lib/db";
import { releaseInventoryForOrder } from "@/lib/inventory/lifecycle";

type CancelResult =
  | {
      cancelled: true;
      orderId: number;
    }
  | {
      cancelled: false;
      reason: "ORDER_NOT_CANCELLABLE";
    };

const CANCELLABLE_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
] as const;

export async function cancelOrderAndReleaseInventory(
  orderNumber: string,
): Promise<CancelResult> {
  /*
   * Build the inventory/order operations using the same
   * Prisma 8 RC patterns already used elsewhere in the project.
   *
   * The order status update is intentionally performed
   * through the generated SQL builder rather than raw SQL
   * with RETURNING.
   */
  return db.transaction(async (tx) => {
    const order = await tx.orm.public.Order.where({
      orderNumber,
    })
      .select(
        "id",
        "status",
      )
      .first();

    if (!order) {
      return {
        cancelled: false,
        reason: "ORDER_NOT_CANCELLABLE",
      };
    }

    if (
      !CANCELLABLE_STATUSES.includes(
        order.status as (typeof CANCELLABLE_STATUSES)[number],
      )
    ) {
      return {
        cancelled: false,
        reason: "ORDER_NOT_CANCELLABLE",
      };
    }

    /*
     * Update the order to CANCELLED, guarding on the observed status
     * so concurrent cancel/ship operations cannot both succeed.
     */
    const updatePlan = db.sql.public.order
      .update({
        status: "CANCELLED",
      })
      .where((fields, fns) =>
        fns.and(
          fns.eq(fields.id, order.id),
          fns.eq(fields.status, order.status),
        ),
      )
      .returning(
        "id",
        "orderNumber",
        "status",
      )
      .build();

    const updatedRows = await tx.query(updatePlan);

    if (updatedRows.length !== 1) {
      return {
        cancelled: false,
        reason: "ORDER_NOT_CANCELLABLE",
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
     * Release every reservation belonging to this order.
     */
    await releaseInventoryForOrder(tx, orderItems);

    return {
      cancelled: true,
      orderId: order.id,
    };
  });
}