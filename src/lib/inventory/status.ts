export type InventoryStatus =
  | "OUT_OF_STOCK"
  | "LOW_STOCK"
  | "IN_STOCK";

export function getAvailableQuantity(
  quantity: number,
  reserved: number,
) {
  return Math.max(
    0,
    quantity - reserved,
  );
}

export function getInventoryStatus(
  quantity: number,
  reserved: number,
): InventoryStatus {
  const available =
    getAvailableQuantity(
      quantity,
      reserved,
    );

  if (available <= 0) {
    return "OUT_OF_STOCK";
  }

  if (available <= 2) {
    return "LOW_STOCK";
  }

  return "IN_STOCK";
}