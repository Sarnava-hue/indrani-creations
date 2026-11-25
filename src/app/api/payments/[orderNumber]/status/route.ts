import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/auth/admin";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ orderNumber: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { response } = await requireAdminApi();

    if (response) {
      return response;
    }

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
      .select("id", "orderNumber", "status", "paymentStatus")
      .first();

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cancelled orders cannot be marked as paid." },
        { status: 409 },
      );
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

    const paidAt = new Date().toISOString();
    const nextOrderStatus =
      order.status === "PENDING" ? "CONFIRMED" : order.status;

    // Update both records atomically in one database transaction.
    const result = await db.transaction(async (tx) => {
      const paymentPlan = db.sql.public.payment
        .update({
          status: "PAID",
          paidAt,
        })
        .where((fields, fns) =>
          fns.and(
            fns.eq(fields.id, payment.id),
            fns.eq(fields.status, "PENDING"),
          ),
        )
        .returning("id", "status", "paidAt")
        .build();

      const updatedPayments = await tx.query(paymentPlan);

      if (updatedPayments.length !== 1) {
        throw new Error("Payment status update failed.");
      }

      const orderPlan = db.sql.public.order
        .update({
          paymentStatus: "PAID",
          status: nextOrderStatus,
        })
        .where((fields, fns) =>
          fns.and(
            fns.eq(fields.id, order.id),
            fns.eq(fields.status, order.status),
            fns.eq(fields.paymentStatus, "PENDING"),
            fns.ne(fields.status, "CANCELLED"),
          ),
        )
        .returning("id", "orderNumber", "status", "paymentStatus", "updatedAt")
        .build();

      const updatedOrders = await tx.query(orderPlan);

      if (updatedOrders.length !== 1) {
        throw new Error("Order payment status update failed.");
      }

      return {
        order: updatedOrders[0],
        payment: updatedPayments[0],
      };
    });

    return NextResponse.json({
      success: true,
      order: result.order,
      payment: result.payment,
    });
  } catch (error) {
    console.error("Failed to update payment status:", error);

    return NextResponse.json(
      { error: "Failed to update payment status." },
      { status: 500 },
    );
  }
}
