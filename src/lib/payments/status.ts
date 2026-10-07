export type PaymentStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

const allowedPaymentTransitions: Record<
  PaymentStatus,
  readonly PaymentStatus[]
> = {
  PENDING: [
    "AUTHORIZED",
    "PAID",
    "FAILED",
  ],

  AUTHORIZED: [
    "PAID",
    "FAILED",
  ],

  PAID: [
    "REFUNDED",
    "PARTIALLY_REFUNDED",
  ],

  FAILED: [
    "PENDING",
    "PAID",
  ],

  PARTIALLY_REFUNDED: [
    "REFUNDED",
  ],

  REFUNDED: [],
};

export function canTransitionPaymentStatus(
  currentStatus: PaymentStatus,
  nextStatus: PaymentStatus,
) {
  if (currentStatus === nextStatus) {
    return true;
  }

  return allowedPaymentTransitions[currentStatus].includes(
    nextStatus,
  );
}