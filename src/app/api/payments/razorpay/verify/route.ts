import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface VerifyPaymentInput {
  orderNumber: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
) {
  const payload = `${orderId}|${paymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function POST(request: Request) {
  try {
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeySecret) {
      console.error("RAZORPAY_KEY_SECRET is not configured.");

      return NextResponse.json(
        {
          success: false,
          error: "Payment gateway is not configured.",
        },
        { status: 500 },
      );
    }

    const body = (await request.json()) as Partial<VerifyPaymentInput>;

    const orderNumber = body.orderNumber?.trim();
    const razorpayOrderId = body.razorpay_order_id?.trim();
    const razorpayPaymentId = body.razorpay_payment_id?.trim();
    const razorpaySignature = body.razorpay_signature?.trim();

    if (
      !orderNumber ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Incomplete payment verification data.",
        },
        { status: 400 },
      );
    }

    /*
     * First verify the cryptographic signature.
     */
    const signatureValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      razorpayKeySecret,
    );

    if (!signatureValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payment signature.",
        },
        { status: 400 },
      );
    }

    /*
     * Find our local order and payment.
     */
    const orders = await db.orm.public.Order.where((order) =>
      order.orderNumber.eq(orderNumber),
    )
      .select("id", "orderNumber", "paymentStatus")
      .all();

    if (orders.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found.",
        },
        { status: 404 },
      );
    }

    const order = orders[0];

    /*
     * Make sure the Razorpay order ID belongs to
     * our local order.
     */
    const payments = await db.orm.public.Payment.where((payment) =>
      payment.orderId.eq(order.id),
    )
      .select(
        "id",
        "providerOrderId",
        "providerPaymentId",
        "status",
        "amountPaise",
        "currency",
      )
      .all();

    if (payments.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment record not found.",
        },
        { status: 404 },
      );
    }

    const payment = payments[0];

    if (payment.providerOrderId !== razorpayOrderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment does not belong to this order.",
        },
        { status: 400 },
      );
    }

    /*
     * Idempotency:
     * If Razorpay verification is repeated after the
     * payment has already been marked PAID, simply
     * return success.
     */
    if (payment.status === "PAID" && order.paymentStatus === "PAID") {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        order: {
          orderNumber: order.orderNumber,
          paymentStatus: "PAID",
        },
      });
    }

    /*
     * Atomically mark payment + order as paid.
     */
    const paidAt = new Date().toISOString();

    const updatePaymentPlan = db.raw.sql`
      UPDATE "payment"
      SET
        "providerPaymentId" = ${razorpayPaymentId},
        "status" = 'PAID',
        "paidAt" = ${paidAt},
        "updatedAt" = ${paidAt}
      WHERE
        "id" = ${payment.id}
        AND "providerOrderId" = ${razorpayOrderId}
        AND "status" <> 'PAID'
    `
      .affectedCount()
      .build();

    const updateOrderPlan = db.raw.sql`
      UPDATE "order"
      SET
        "paymentStatus" = 'PAID',
        "status" = CASE
          WHEN "status" = 'PENDING' THEN 'CONFIRMED'
          ELSE "status"
        END,
        "updatedAt" = ${paidAt}
      WHERE
        "id" = ${order.id}
        AND "paymentStatus" <> 'PAID'
    `
      .affectedCount()
      .build();

    await db.transaction(async (tx) => {
      await tx.execute(updatePaymentPlan);
      await tx.execute(updateOrderPlan);
    });

    return NextResponse.json({
      success: true,
      alreadyVerified: false,
      order: {
        orderNumber: order.orderNumber,
        paymentStatus: "PAID",
      },
    });
  } catch (error) {
    console.error("Razorpay payment verification error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to verify payment.",
      },
      { status: 500 },
    );
  }
}
