import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    orderNumber: string;
  }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireAdmin();

    const { orderNumber } = await context.params;

    const body = await request.json();

    if (body.status !== "PAID") {
      return NextResponse.json(
        {
          error: "Only PAID is supported by this endpoint.",
        },
        {
          status: 400,
        },
      );
    }

    const order = await db.orm.public.Order.where({
      orderNumber,
    })
      .select(
        "id",
        "paymentStatus",
      )
      .first();

    if (!order) {
      return NextResponse.json(
        {
          error: "Order not found.",
        },
        {
          status: 404,
        },
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
        {
          error: "This payment cannot transition to PAID.",
        },
        {
          status: 409,
        },
      );
    }

    const plan = db.sql.public.order
      .update({
        paymentStatus: "PAID",
      })
      .where((fields, fns) => fns.eq(fields.id, order.id))
      .returning(
        "id",
        "orderNumber",
        "paymentStatus",
      )
      .build();

    const [updatedOrder] = await db.runtime().query(plan);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Failed to update payment status:", error);

    return NextResponse.json(
      {
        error: "Failed to update payment status.",
      },
      {
        status: 500,
      },
    );
  }
}