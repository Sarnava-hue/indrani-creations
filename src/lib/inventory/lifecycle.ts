import { db } from "@/lib/db";

export type InventoryOrderItem = {
  productId: number;
  quantity: number;
};

type TransactionFn = Parameters<typeof db.transaction>[0];
export type InventoryExecutor = Pick<Parameters<TransactionFn>[0], "execute">;

function buildReservePlan(item: InventoryOrderItem) {
  return db.raw.sql`
    UPDATE "inventory"
    SET "reserved" = "reserved" + ${item.quantity}
    WHERE "productId" = ${item.productId}
      AND "quantity" - "reserved" >= ${item.quantity}
  `
    .affectedCount()
    .build();
}

function buildReleasePlan(item: InventoryOrderItem) {
  return db.raw.sql`
    UPDATE "inventory"
    SET "reserved" = "reserved" - ${item.quantity}
    WHERE "productId" = ${item.productId}
      AND "reserved" >= ${item.quantity}
  `
    .affectedCount()
    .build();
}

function buildCommitPlan(item: InventoryOrderItem) {
  return db.raw.sql`
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
}

type InventoryMutationPlan = ReturnType<typeof buildReservePlan>;

async function runInventoryMutation(
  executor: InventoryExecutor,
  items: readonly InventoryOrderItem[],
  buildPlan: (item: InventoryOrderItem) => InventoryMutationPlan,
  formatError: (productId: number) => string,
): Promise<void> {
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error(
        `Invalid inventory quantity for product ${item.productId}.`,
      );
    }

    const result = await executor.execute(buildPlan(item));

    if (result.affectedRows !== 1) {
      throw new Error(formatError(item.productId));
    }
  }
}

/**
 * Reserves ordered stock inside an active database transaction.
 */
export async function reserveInventoryForOrder(
  executor: InventoryExecutor,
  items: readonly InventoryOrderItem[],
): Promise<void> {
  await runInventoryMutation(
    executor,
    items,
    buildReservePlan,
    (productId) => `Insufficient inventory for product ${productId}.`,
  );
}

/**
 * Releases previously reserved stock when an order expires or is cancelled.
 */
export async function releaseInventoryForOrder(
  executor: InventoryExecutor,
  items: readonly InventoryOrderItem[],
): Promise<void> {
  await runInventoryMutation(
    executor,
    items,
    buildReleasePlan,
    (productId) => `Unable to release inventory for product ${productId}.`,
  );
}

/**
 * Commits reserved stock on shipment by deducting both on-hand and reserved counts.
 */
export async function commitInventoryForOrder(
  executor: InventoryExecutor,
  items: readonly InventoryOrderItem[],
): Promise<void> {
  await runInventoryMutation(
    executor,
    items,
    buildCommitPlan,
    (productId) => `Unable to commit inventory for product ${productId}.`,
  );
}
