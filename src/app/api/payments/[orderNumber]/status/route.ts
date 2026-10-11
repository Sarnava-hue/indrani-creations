import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ orderNumber: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireAdmin();

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

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("status" in body) ||
      body.status !== "PAID"
    ) {
      return NextResponse.json(
        { error: "Only PAID is supported by this endpoint." },
        { status: 400 },
      );
    }

    const order = await db.orm.public.Order.where({
      orderNumber: orderNumber.trim(),
    })
      .select("id", "orderNumber", "paymentStatus")
      .first();

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json({
        success: true,
        alreadyPaid: true,
      });
    }

    if (order.paymentStatus !== "PENDING") {
      return NextResponse.json(
        { error: "This payment cannot transition to PAID." },
        { status: 409 },
      );
    }

    const payment = await db.orm.public.Payment.where({
      orderId: order.id,
    })
      .select("id", "provider", "status")
      .first();

    if (
      !payment ||
      payment.provider !== "upi_manual" ||
      payment.status !== "PENDING"
    ) {
      return NextResponse.json(
        { error: "No pending manual UPI payment exists for this order." },
        { status: 409 },
      );
    }

    // Update both records in one database transaction.
    const result = await db.transaction(async (tx) => {
      const paymentPlan = db.sql.public.payment
        .update({
          status: "PAID",
          paidAt: new Date().toISOString(),
        })
        .where((fields, fns) => fns.eq(fields.id, payment.id))
        .returning("id")
        .build();

      const updatedPayments = await tx.execute(paymentPlan);

      if (updatedPayments.affectedRows !== 1) {
        throw new Error("Payment status update failed.");
      }

      const orderPlan = db.sql.public.order
        .update({
          paymentStatus: "PAID",
        })
        .where((fields, fns) => fns.eq(fields.id, order.id))
        .returning("id", "orderNumber", "paymentStatus")
        .build();

      const updatedOrders = await tx.execute(orderPlan);

      if (updatedOrders.affectedRows !== 1) {
        throw new Error("Order payment status update failed.");
      }

      if (updatedOrders.affectedRows !== 1) {
        throw new Error("Order payment status update failed.");
      }

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: "PAID" as const,
      };
    });

    return NextResponse.json({
      success: true,
      order: result,
    });
  } catch (error) {
    console.error("Failed to update payment status:", error);

    return NextResponse.json(
      { error: "Failed to update payment status." },
      { status: 500 },
    );
  }
}
