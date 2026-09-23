import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        { status: 401 },
      );
    }

    const orders =
      await db.orm.public.Order
        .where({
          userId: session.userId,
        })
        .select(
          "id",
          "orderNumber",
          "status",
          "paymentStatus",
          "shippingStatus",
          "currency",
          "subtotalPaise",
          "discountPaise",
          "shippingPaise",
          "taxPaise",
          "totalPaise",
          "createdAt",
        )
        .orderBy((order) =>
          order.createdAt.desc(),
        )
        .all();

    return NextResponse.json({
      orders,
    });
  } catch (error) {
    console.error(
      "Failed to fetch customer orders:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to retrieve your orders right now.",
      },
      { status: 500 },
    );
  }
}