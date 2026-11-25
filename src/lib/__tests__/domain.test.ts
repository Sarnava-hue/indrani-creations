import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getAvailableQuantity,
  getInventoryStatus,
} from "@/lib/inventory/status";
import {
  createGuestAccessToken,
  getGuestOrderCookieName,
  verifyGuestAccessToken,
} from "@/lib/orders/guest-token";
import { canTransitionOrderStatus } from "@/lib/orders/status";
import { canTransitionPaymentStatus } from "@/lib/payments/status";
import { detectImageFormat } from "@/lib/security/image-validation";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/security/rate-limit";
import { formatINR } from "@/lib/utils/currency";

describe("order status transitions", () => {
  it("allows identity and forward fulfillment transitions", () => {
    assert.equal(canTransitionOrderStatus("PENDING", "PENDING"), true);
    assert.equal(canTransitionOrderStatus("PENDING", "CONFIRMED"), true);
    assert.equal(canTransitionOrderStatus("PENDING", "CANCELLED"), true);
    assert.equal(canTransitionOrderStatus("CONFIRMED", "SHIPPED"), true);
    assert.equal(canTransitionOrderStatus("SHIPPED", "DELIVERED"), true);
    assert.equal(canTransitionOrderStatus("DELIVERED", "RETURNED"), true);
    assert.equal(canTransitionOrderStatus("RETURNED", "REFUNDED"), true);
  });

  it("blocks invalid backward or post-terminal transitions", () => {
    assert.equal(canTransitionOrderStatus("PENDING", "DELIVERED"), false);
    assert.equal(canTransitionOrderStatus("SHIPPED", "CANCELLED"), false);
    assert.equal(canTransitionOrderStatus("CANCELLED", "CONFIRMED"), false);
    assert.equal(canTransitionOrderStatus("REFUNDED", "PENDING"), false);
  });
});

describe("payment status transitions", () => {
  it("allows valid manual payment confirmation and refund flows", () => {
    assert.equal(canTransitionPaymentStatus("PENDING", "PAID"), true);
    assert.equal(canTransitionPaymentStatus("PENDING", "FAILED"), true);
    assert.equal(canTransitionPaymentStatus("FAILED", "PAID"), true);
    assert.equal(
      canTransitionPaymentStatus("PAID", "PARTIALLY_REFUNDED"),
      true,
    );
    assert.equal(
      canTransitionPaymentStatus("PARTIALLY_REFUNDED", "REFUNDED"),
      true,
    );
  });

  it("blocks invalid transitions after refund", () => {
    assert.equal(canTransitionPaymentStatus("REFUNDED", "PAID"), false);
    assert.equal(canTransitionPaymentStatus("PAID", "PENDING"), false);
  });
});

describe("inventory status calculations", () => {
  it("computes non-negative available quantity", () => {
    assert.equal(getAvailableQuantity(10, 3), 7);
    assert.equal(getAvailableQuantity(2, 2), 0);
    assert.equal(getAvailableQuantity(2, 5), 0);
  });

  it("maps available quantity thresholds to stock labels", () => {
    assert.equal(getInventoryStatus(5, 5), "OUT_OF_STOCK");
    assert.equal(getInventoryStatus(3, 4), "OUT_OF_STOCK");
    assert.equal(getInventoryStatus(5, 3), "LOW_STOCK");
    assert.equal(getInventoryStatus(4, 3), "LOW_STOCK");
    assert.equal(getInventoryStatus(5, 2), "IN_STOCK");
  });
});

describe("image magic-byte validation", () => {
  it("detects JPEG, PNG, WebP, and AVIF signatures", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const webp = Buffer.from("RIFF\x24\x00\x00\x00WEBPVP8 ", "latin1");
    const avifMajor = Buffer.from(
      "\x00\x00\x00\x18ftypavif\x00\x00\x00\x00",
      "latin1",
    );
    const avifCompat = Buffer.from(
      "\x00\x00\x00\x1cftypmif1\x00\x00\x00\x00miafavis",
      "latin1",
    );

    assert.deepEqual(detectImageFormat(jpeg), {
      mimeType: "image/jpeg",
      extension: "jpg",
    });
    assert.deepEqual(detectImageFormat(png), {
      mimeType: "image/png",
      extension: "png",
    });
    assert.deepEqual(detectImageFormat(webp), {
      mimeType: "image/webp",
      extension: "webp",
    });
    assert.deepEqual(detectImageFormat(avifMajor), {
      mimeType: "image/avif",
      extension: "avif",
    });
    assert.deepEqual(detectImageFormat(avifCompat), {
      mimeType: "image/avif",
      extension: "avif",
    });
  });

  it("rejects spoofed text payloads and short buffers", () => {
    assert.equal(detectImageFormat(Buffer.from("<svg></svg>")), null);
    assert.equal(detectImageFormat(Buffer.from([0xff, 0xd8])), null);
    assert.equal(detectImageFormat(Buffer.alloc(0)), null);
  });
});

describe("guest order access tokens", () => {
  it("creates 64-char hex tokens that verify against their SHA-256 hash", () => {
    const { token, tokenHash } = createGuestAccessToken();

    assert.match(token, /^[a-f0-9]{64}$/);
    assert.match(tokenHash, /^[a-f0-9]{64}$/);
    assert.notEqual(token, tokenHash);
    assert.equal(verifyGuestAccessToken(token, tokenHash), true);
  });

  it("rejects malformed or mismatched tokens", () => {
    const { token, tokenHash } = createGuestAccessToken();
    const tampered = `${token.slice(0, -1)}${token.endsWith("0") ? "1" : "0"}`;

    assert.equal(verifyGuestAccessToken(tampered, tokenHash), false);
    assert.equal(verifyGuestAccessToken("short-token", tokenHash), false);
    assert.equal(verifyGuestAccessToken(token, null), false);
    assert.equal(verifyGuestAccessToken(12345, tokenHash), false);
    assert.equal(
      getGuestOrderCookieName("IND-1001"),
      "indrani_guest_order_IND-1001",
    );
  });
});

describe("rate limiter and client IP parsing", () => {
  it("extracts client IP from x-forwarded-for before x-real-ip", () => {
    const forwardedRequest = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "203.0.113.10, 10.0.0.1",
        "x-real-ip": "198.51.100.2",
      },
    });
    assert.equal(getClientIp(forwardedRequest), "203.0.113.10");

    const realIpRequest = new Request("https://example.com", {
      headers: { "x-real-ip": "198.51.100.2" },
    });
    assert.equal(getClientIp(realIpRequest), "198.51.100.2");

    const emptyRequest = new Request("https://example.com");
    assert.equal(getClientIp(emptyRequest), "unknown");
  });

  it("enforces request quotas within a window and sets 429 headers", async () => {
    const key = `test-rate-limit-${Date.now()}-${Math.random()}`;
    const first = checkRateLimit(key, { limit: 2, windowMs: 60_000 });
    const second = checkRateLimit(key, { limit: 2, windowMs: 60_000 });
    const blocked = checkRateLimit(key, { limit: 2, windowMs: 60_000 });

    assert.equal(first.allowed, true);
    assert.equal(first.remaining, 1);
    assert.equal(second.allowed, true);
    assert.equal(second.remaining, 0);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.retryAfterSeconds >= 1);

    const response = rateLimitResponse(blocked.retryAfterSeconds, "Slow down");
    assert.equal(response.status, 429);
    assert.equal(
      response.headers.get("Retry-After"),
      String(blocked.retryAfterSeconds),
    );
    assert.deepEqual(await response.json(), { error: "Slow down" });
  });
});

describe("INR currency formatting", () => {
  it("formats paise as rounded Indian Rupee display text", () => {
    assert.equal(formatINR(0), "₹0");
    assert.equal(formatINR(125000), "₹1,250");
    assert.equal(formatINR(10000000), "₹1,00,000");
  });
});
