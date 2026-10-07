import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        currency?: string;
        status?: string;
        error_code?: string;
        error_description?: string;
      };
    };
  };
};

const CANCELLABLE_ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
] as const;

function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
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
    /*
     * -------------------------------------------------
     * 1. Load webhook secret
     * -------------------------------------------------
     */

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not configured.");

      return NextResponse.json(
        {
          success: false,
          error: "Webhook is not configured.",
        },
        { status: 500 },
      );
    }

    /*
     * -------------------------------------------------
     * 2. Read raw request body
     *
     * Razorpay signature verification must use the
     * original raw request body.
     * -------------------------------------------------
     */

    const rawBody = await request.text();

    const signature = request.headers.get("x-razorpay-signature")?.trim();

    if (!signature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing webhook signature.",
        },
        { status: 400 },
      );
    }

    /*
     * -------------------------------------------------
     * 3. Verify Razorpay webhook signature
     * -------------------------------------------------
     */

    const signatureValid = verifyWebhookSignature(
      rawBody,
      signature,
      webhookSecret,
    );

    if (!signatureValid) {
      console.warn("Rejected Razorpay webhook: invalid signature.");

      return NextResponse.json(
        {
          success: false,
          error: "Invalid webhook signature.",
        },
        { status: 400 },
      );
    }

    /*
     * -------------------------------------------------
     * 4. Parse JSON payload
     * -------------------------------------------------
     */

    let payload: RazorpayWebhookPayload;

    try {
      payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid webhook payload.",
        },
        { status: 400 },
      );
    }

    const eventType = payload.event?.trim();

    if (!eventType) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing webhook event type.",
        },
        { status: 400 },
      );
    }

    /*
     * -------------------------------------------------
     * 5. Get Razorpay event ID
     *
     * This is used for webhook idempotency.
     * -------------------------------------------------
     */

    const eventId = request.headers.get("x-razorpay-event-id")?.trim();

    if (!eventId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing webhook event ID.",
        },
        { status: 400 },
      );
    }

    /*
     * -------------------------------------------------
     * 6. Extract payment entity
     * -------------------------------------------------
     */

    const paymentEntity = payload.payload?.payment?.entity;

    if (!paymentEntity) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment entity missing from webhook payload.",
        },
        { status: 400 },
      );
    }

    const razorpayPaymentId = paymentEntity?.id?.trim();
    const razorpayOrderId = paymentEntity?.order_id?.trim();

    /*
     * Some Razorpay events do not contain a payment
     * entity. They are still valid signed webhooks.
     */

    if (!razorpayPaymentId || !razorpayOrderId) {
      console.info(
        `Ignoring Razorpay event "${eventType}" because no payment entity was found.`,
      );

      return NextResponse.json({
        success: true,
        ignored: true,
      });
    }

    /*
     * -------------------------------------------------
     * 7. Find local payment
     * -------------------------------------------------
     */

    const payments = await db.orm.public.Payment.where({
      providerOrderId: razorpayOrderId,
    })
      .select(
        "id",
        "orderId",
        "provider",
        "providerOrderId",
        "providerPaymentId",
        "amountPaise",
        "currency",
        "status",
      )
      .all();

    if (payments.length === 0) {
      console.warn(
        `Razorpay webhook references unknown order: ${razorpayOrderId}`,
      );

      /*
       * Signature is valid, but this Razorpay order does
       * not belong to our database.
       *
       * Acknowledge it so Razorpay does not retry forever.
       */

      return NextResponse.json({
        success: true,
        ignored: true,
      });
    }

    const payment = payments[0];

    /*
     * -------------------------------------------------
     * 8. Make sure provider is Razorpay
     * -------------------------------------------------
     */

    if (payment.provider !== "razorpay") {
      return NextResponse.json({
        success: true,
        ignored: true,
      });
    }

    /*
     * -------------------------------------------------
     * 9. Find local order
     * -------------------------------------------------
     */

    const orders = await db.orm.public.Order.where({
      id: payment.orderId,
    })
      .select(
        "id",
        "orderNumber",
        "status",
        "paymentStatus",
        "currency",
        "totalPaise",
      )
      .all();

    if (orders.length === 0) {
      console.warn(`Payment ${razorpayPaymentId} has no local order.`);

      return NextResponse.json({
        success: true,
        ignored: true,
      });
    }

    const order = orders[0];

    /*
     * -------------------------------------------------
     * 10. Verify amount
     * -------------------------------------------------
     */

    const webhookAmount = paymentEntity.amount;

    if (
      typeof webhookAmount === "number" &&
      webhookAmount !== payment.amountPaise
    ) {
      console.error(
        `Razorpay amount mismatch for order ${order.orderNumber}. ` +
          `Expected ${payment.amountPaise}, received ${webhookAmount}.`,
      );

      return NextResponse.json(
        {
          success: false,
          error: "Payment amount mismatch.",
        },
        { status: 400 },
      );
    }

    /*
     * -------------------------------------------------
     * 11. Verify currency
     * -------------------------------------------------
     */

    const webhookCurrency = paymentEntity.currency;

    if (webhookCurrency && webhookCurrency !== payment.currency) {
      console.error(
        `Razorpay currency mismatch for order ${order.orderNumber}.`,
      );

      return NextResponse.json(
        {
          success: false,
          error: "Payment currency mismatch.",
        },
        { status: 400 },
      );
    }

    /*
     * -------------------------------------------------
     * 12. Check webhook idempotency
     * -------------------------------------------------
     */

    const existingEvents = await db.orm.public.PaymentEvent.where({
      provider: "razorpay",
      eventId,
    })
      .select("id")
      .all();

    if (existingEvents.length > 0) {
      return NextResponse.json({
        success: true,
        duplicate: true,
      });
    }

    /*
     * -------------------------------------------------
     * 13. Process webhook atomically
     * -------------------------------------------------
     */

    await db.transaction(async (tx) => {
      /*
       * -------------------------------------------------
       * Store webhook event
       * -------------------------------------------------
       */

      await tx.orm.public.PaymentEvent.create({
        provider: "razorpay",
        eventId,
        eventType,
        paymentId: payment.id,
        payload: rawBody,
      });

      /*
       * =================================================
       * PAYMENT CAPTURED
       * =================================================
       */

      if (eventType === "payment.captured") {
        const wasCancelled = order.status === "CANCELLED";

        const updatePaymentPlan = db.raw.sql`
    UPDATE "payment"
    SET
      "providerPaymentId" = ${razorpayPaymentId},
      "status" = 'PAID',
      "paidAt" = COALESCE("paidAt", now()),
      "updatedAt" = now()
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
      "updatedAt" = now()
    WHERE
      "id" = ${order.id}
      AND "paymentStatus" <> 'PAID'
  `
          .affectedCount()
          .build();

        await tx.execute(updatePaymentPlan);
        await tx.execute(updateOrderPlan);

        if (wasCancelled) {
          console.error(
            "MANUAL REVIEW REQUIRED: Razorpay captured payment for a cancelled order.",
            {
              orderId: order.id,
              orderNumber: order.orderNumber,
              razorpayPaymentId,
            },
          );
        }

        return;
      }

      /*
       * =================================================
       * PAYMENT FAILED
       * =================================================
       */

      if (eventType === "payment.failed") {
        const failureCode = paymentEntity.error_code;
        const failureNote = paymentEntity.error_description;

        /*
         * Update payment status.
         *
         * We use separate SQL statements because this
         * Prisma 8 RC raw SQL runtime does not accept
         * null interpolation.
         */

        let updatePaymentPlan;

        if (failureCode && failureNote) {
          updatePaymentPlan = db.raw.sql`
            UPDATE "payment"
            SET
              "providerPaymentId" = ${razorpayPaymentId},
              "status" = 'FAILED',
              "failureCode" = ${failureCode},
              "failureNote" = ${failureNote},
              "updatedAt" = now()
            WHERE
              "id" = ${payment.id}
              AND "providerOrderId" = ${razorpayOrderId}
              AND "status" <> 'PAID'
          `
            .affectedCount()
            .build();
        } else if (failureCode) {
          updatePaymentPlan = db.raw.sql`
            UPDATE "payment"
            SET
              "providerPaymentId" = ${razorpayPaymentId},
              "status" = 'FAILED',
              "failureCode" = ${failureCode},
              "updatedAt" = now()
            WHERE
              "id" = ${payment.id}
              AND "providerOrderId" = ${razorpayOrderId}
              AND "status" <> 'PAID'
          `
            .affectedCount()
            .build();
        } else if (failureNote) {
          updatePaymentPlan = db.raw.sql`
            UPDATE "payment"
            SET
              "providerPaymentId" = ${razorpayPaymentId},
              "status" = 'FAILED',
              "failureNote" = ${failureNote},
              "updatedAt" = now()
            WHERE
              "id" = ${payment.id}
              AND "providerOrderId" = ${razorpayOrderId}
              AND "status" <> 'PAID'
          `
            .affectedCount()
            .build();
        } else {
          updatePaymentPlan = db.raw.sql`
            UPDATE "payment"
            SET
              "providerPaymentId" = ${razorpayPaymentId},
              "status" = 'FAILED',
              "updatedAt" = now()
            WHERE
              "id" = ${payment.id}
              AND "providerOrderId" = ${razorpayOrderId}
              AND "status" <> 'PAID'
          `
            .affectedCount()
            .build();
        }

        const paymentResult = await tx.execute(updatePaymentPlan);

        /*
         * If the payment was already PAID, do not cancel
         * the order or release inventory.
         */

        if (paymentResult.affectedRows !== 1) {
          return;
        }

        /*
         * -------------------------------------------------
         * Cancel unpaid order
         * -------------------------------------------------
         */

        if (
          CANCELLABLE_ORDER_STATUSES.includes(
            order.status as (typeof CANCELLABLE_ORDER_STATUSES)[number],
          )
        ) {
          const cancelOrderPlan = db.sql.public.order
            .update({
              status: "CANCELLED",
            })
            .where((fields, fns) => fns.eq(fields.id, order.id))
            .returning("id", "orderNumber", "status")
            .build();

          const cancelledOrders = await tx.query(cancelOrderPlan);

          if (cancelledOrders.length !== 1) {
            throw new Error(
              `Failed to cancel unpaid order ${order.orderNumber}.`,
            );
          }

          /*
           * -------------------------------------------------
           * Load order items
           * -------------------------------------------------
           */

          const orderItems = await tx.orm.public.OrderItem.where({
            orderId: order.id,
          })
            .select("productId", "quantity")
            .all();

          /*
           * -------------------------------------------------
           * Release reserved inventory
           * -------------------------------------------------
           */

          for (const item of orderItems) {
            const releasePlan = db.raw.sql`
              UPDATE "inventory"
              SET
                "reserved" = "reserved" - ${item.quantity}
              WHERE
                "productId" = ${item.productId}
                AND "reserved" >= ${item.quantity}
            `
              .affectedCount()
              .build();

            const releaseResult = await tx.execute(releasePlan);

            if (releaseResult.affectedRows !== 1) {
              throw new Error(
                `Unable to release inventory for product ${item.productId}.`,
              );
            }
          }
        }
      }

      /*
       * -------------------------------------------------
       * Other webhook events
       *
       * The event is recorded above, but no payment/order
       * state transition is performed here.
       * -------------------------------------------------
       */
    });

    /*
     * -------------------------------------------------
     * 14. Successful processing response
     * -------------------------------------------------
     */

    return NextResponse.json({
      success: true,
      event: eventType,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("Razorpay webhook processing error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to process webhook.",
      },
      { status: 500 },
    );
  }
}
