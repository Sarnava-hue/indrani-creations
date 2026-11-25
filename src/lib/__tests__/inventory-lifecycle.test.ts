import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  commitInventoryForOrder,
  releaseInventoryForOrder,
  reserveInventoryForOrder,
  type InventoryExecutor,
} from "@/lib/inventory/lifecycle";

describe("transactional inventory lifecycle helpers", () => {
  it("executes one mutation per item when all rows succeed", async () => {
    const executedPlans: unknown[] = [];
    const executor: InventoryExecutor = {
      async execute(plan) {
        executedPlans.push(plan);
        return { affectedRows: 1 };
      },
    };

    const items = [
      { productId: 10, quantity: 2 },
      { productId: 20, quantity: 1 },
    ];

    await reserveInventoryForOrder(executor, items);
    await releaseInventoryForOrder(executor, items);
    await commitInventoryForOrder(executor, items);

    assert.equal(executedPlans.length, 6);
  });

  it("throws when reserving more than available inventory", async () => {
    let callCount = 0;
    const executor: InventoryExecutor = {
      async execute() {
        callCount += 1;
        return { affectedRows: callCount === 1 ? 1 : 0 };
      },
    };

    await assert.rejects(
      reserveInventoryForOrder(executor, [
        { productId: 10, quantity: 1 },
        { productId: 99, quantity: 5 },
      ]),
      /Insufficient inventory for product 99\./,
    );
  });

  it("throws descriptive errors when release or commit affects zero rows", async () => {
    const emptyExecutor: InventoryExecutor = {
      async execute() {
        return { affectedRows: 0 };
      },
    };

    await assert.rejects(
      releaseInventoryForOrder(emptyExecutor, [{ productId: 7, quantity: 1 }]),
      /Unable to release inventory for product 7\./,
    );

    await assert.rejects(
      commitInventoryForOrder(emptyExecutor, [{ productId: 8, quantity: 2 }]),
      /Unable to commit inventory for product 8\./,
    );
  });

  it("rejects non-positive or fractional quantities before touching executor", async () => {
    let executed = false;
    const executor: InventoryExecutor = {
      async execute() {
        executed = true;
        return { affectedRows: 1 };
      },
    };

    await assert.rejects(
      reserveInventoryForOrder(executor, [{ productId: 5, quantity: 0 }]),
      /Invalid inventory quantity for product 5\./,
    );
    await assert.rejects(
      releaseInventoryForOrder(executor, [{ productId: 5, quantity: -2 }]),
      /Invalid inventory quantity for product 5\./,
    );
    await assert.rejects(
      commitInventoryForOrder(executor, [{ productId: 5, quantity: 1.5 }]),
      /Invalid inventory quantity for product 5\./,
    );

    assert.equal(executed, false);
  });
});
