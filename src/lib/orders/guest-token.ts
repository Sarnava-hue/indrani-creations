import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const GUEST_ORDER_COOKIE_PREFIX = "indrani_guest_order_";

export function getGuestOrderCookieName(orderNumber: string): string {
  return `${GUEST_ORDER_COOKIE_PREFIX}${orderNumber}`;
}

export function createGuestAccessToken(): {
  token: string;
  tokenHash: string;
} {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  return {
    token,
    tokenHash,
  };
}

export function verifyGuestAccessToken(
  suppliedToken: unknown,
  storedHash: string | null,
): boolean {
  if (
    typeof suppliedToken !== "string" ||
    !/^[a-f0-9]{64}$/i.test(suppliedToken) ||
    !storedHash ||
    !/^[a-f0-9]{64}$/i.test(storedHash)
  ) {
    return false;
  }

  const suppliedHash = createHash("sha256")
    .update(suppliedToken)
    .digest();

  const expectedHash = Buffer.from(storedHash, "hex");

  return (
    suppliedHash.length === expectedHash.length &&
    timingSafeEqual(suppliedHash, expectedHash)
  );
}
