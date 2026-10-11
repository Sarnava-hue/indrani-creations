
import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ orderNumber: string }>;
};

function isValidReference(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length >= 6 &&
    value.trim().length <= 100 &&
    /^[a-zA-Z0-9-]+$/.test(value.trim())
  );
}

function matchesGuestToken(
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

export async function POST(request: Request, context: RouteContext) {
  try {
    const { orderNumber } = await context.params;

    if (
      typeof orderNumber !== "string" ||
      !orderNumber.trim() ||
      orderNumber.length > 100
    ) {
      return NextResponse.json(
        { error: "Invalid order number." },
        { status: 400 },
      );
    }

    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("transactionReference" in body) ||
      !isValidReference(body.transactionReference)
    ) {
      return NextResponse.json(
        { error: "Enter a valid UPI transaction reference." },
        { status: 400 },
      );
    }

    const transactionReference = body.transactionReference.trim();
    const session = await getSession();

    const order = await db.orm.public.Order.where({
      orderNumber: orderNumber.trim(),
    })
      .select("id", "userId", "guestAccessTokenHash", "paymentStatus")
      .first();

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 },
      );
    }

    if (order.userId !== null) {
      if (!session || session.userId !== order.userId) {
        return NextResponse.json(
          { error: "You are not authorized to access this order." },
          { status: 403 },
        );
      }
    } else {
      const suppliedToken =
        "guestAccessToken" in body ? body.guestAccessToken : null;

      if (!matchesGuestToken(suppliedToken, order.guestAccessTokenHash)) {
        return NextResponse.json(
          { error: "Order verification failed." },
          { status: 403 },
        );
      }
    }

    if (order.paymentStatus !== "PENDING") {
      return NextResponse.json(
        { error: "This order is not awaiting payment." },
        { status: 409 },
      );
    }

    const payments = await db.orm.public.Payment.where({
      orderId: order.id,
    })
      .select("id", "provider", "status", "upiTransactionReference")
      .all();

    const payment = payments.find(
      (candidate) =>
        candidate.provider === "upi_manual" &&
        candidate.status === "PENDING",
    );

    if (!payment) {
      return NextResponse.json(
        { error: "No pending manual UPI payment was found." },
        { status: 409 },
      );
    }

    if (payment.upiTransactionReference) {
      return NextResponse.json(
        { error: "A UPI reference has already been submitted." },
        { status: 409 },
      );
    }

    // Conditional update prevents overwriting an existing reference,
    // including when two requests arrive at nearly the same time.
    const updatePlan = db.raw.sql`
      UPDATE "payment"
      SET
        "upiTransactionReference" = ${transactionReference},
        "upiReferenceSubmittedAt" = NOW()
      WHERE "id" = ${payment.id}
        AND "provider" = 'upi_manual'
        AND "status" = 'PENDING'
        AND "upiTransactionReference" IS NULL
    `
      .affectedCount()
      .build();

    const result = await db.transaction(async (tx) => {
      return tx.execute(updatePlan);
    });

    if (result.affectedRows !== 1) {
      return NextResponse.json(
        { error: "A reference was already submitted or the payment is no longer pending." },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "UPI reference submitted. Payment remains pending until the store verifies receipt.",
    });
  } catch (error) {
    console.error("Failed to save UPI reference:", error);

    return NextResponse.json(
      { error: "Unable to submit the UPI reference right now." },
      { status: 500 },
    );
  }
}