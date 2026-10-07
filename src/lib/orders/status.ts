export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | "REFUNDED";

const allowedTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: [
    "CONFIRMED",
    "CANCELLED",
  ],

  CONFIRMED: [
    "PROCESSING",
    "CANCELLED",
  ],

  PROCESSING: [
    "PACKED",
    "CANCELLED",
  ],

  PACKED: [
    "SHIPPED",
    "CANCELLED",
  ],

  SHIPPED: [
    "DELIVERED",
  ],

  DELIVERED: [
    "RETURNED",
  ],

  CANCELLED: [],

  RETURNED: [
    "REFUNDED",
  ],

  REFUNDED: [],
};

export function canTransitionOrderStatus(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
): boolean {
  if (currentStatus === nextStatus) {
    return true;
  }

  return allowedTransitions[currentStatus].includes(nextStatus);
}