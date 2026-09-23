import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    orderNumber: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
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

    const { orderNumber } =
      await context.params;

    if (
      typeof orderNumber !== "string" ||
      orderNumber.trim().length === 0 ||
      orderNumber.length > 100
    ) {
      return NextResponse.json(
        {
          error: "Invalid order number.",
        },
        { status: 400 },
      );
    }

    const orders =
      await db.orm.public.Order
        .where({
          userId: session.userId,
          orderNumber: orderNumber.trim(),
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
          "shippingRecipientName",
          "shippingPhone",
          "shippingLine1",
          "shippingLine2",
          "shippingCity",
          "shippingState",
          "shippingPostalCode",
          "shippingCountryCode",
          "createdAt",
        )
        .all();

    if (orders.length === 0) {
      return NextResponse.json(
        {
          error: "Order not found.",
        },
        { status: 404 },
      );
    }

    const order = orders[0];

    const items =
      await db.orm.public.OrderItem
        .where({
          orderId: order.id,
        })
        .select(
          "id",
          "productName",
          "sku",
          "unitPricePaise",
          "quantity",
          "totalPaise",
        )
        .all();

    return NextResponse.json({
      order: {
        orderNumber:
          order.orderNumber,

        status:
          order.status,

        paymentStatus:
          order.paymentStatus,

        shippingStatus:
          order.shippingStatus,

        currency:
          order.currency,

        subtotalPaise:
          order.subtotalPaise,

        discountPaise:
          order.discountPaise,

        shippingPaise:
          order.shippingPaise,

        taxPaise:
          order.taxPaise,

        totalPaise:
          order.totalPaise,

        createdAt:
          order.createdAt,

        shipping: {
          name:
            order.shippingRecipientName,

          phone:
            order.shippingPhone,

          line1:
            order.shippingLine1,

          line2:
            order.shippingLine2,

          city:
            order.shippingCity,

          state:
            order.shippingState,

          postalCode:
            order.shippingPostalCode,

          countryCode:
            order.shippingCountryCode,
        },

        items,
      },
    });
  } catch (error) {
    console.error(
      "Failed to fetch customer order:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to retrieve your order right now.",
      },
      { status: 500 },
    );
  }
}