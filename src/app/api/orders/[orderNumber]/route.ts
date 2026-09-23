import { NextResponse } from "next/server";

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
    const { orderNumber } = await context.params;

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

    const order =
      await db.orm.public.Order
        .where({
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

    if (order.length === 0) {
      return NextResponse.json(
        {
          error: "Order not found.",
        },
        { status: 404 },
      );
    }

    const currentOrder = order[0];

    const items =
      await db.orm.public.OrderItem
        .where({
          orderId: currentOrder.id,
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
        orderNumber: currentOrder.orderNumber,
        status: currentOrder.status,
        paymentStatus:
          currentOrder.paymentStatus,
        shippingStatus:
          currentOrder.shippingStatus,
        currency: currentOrder.currency,

        subtotalPaise:
          currentOrder.subtotalPaise,

        discountPaise:
          currentOrder.discountPaise,

        shippingPaise:
          currentOrder.shippingPaise,

        taxPaise:
          currentOrder.taxPaise,

        totalPaise:
          currentOrder.totalPaise,

        createdAt:
          currentOrder.createdAt,

        shipping: {
          name:
            currentOrder.shippingRecipientName,

          phone:
            currentOrder.shippingPhone,

          line1:
            currentOrder.shippingLine1,

          line2:
            currentOrder.shippingLine2,

          city:
            currentOrder.shippingCity,

          state:
            currentOrder.shippingState,

          postalCode:
            currentOrder.shippingPostalCode,

          countryCode:
            currentOrder.shippingCountryCode,
        },

        items,
      },
    });
  } catch (error) {
    console.error(
      "Failed to fetch order:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to retrieve the order right now.",
      },
      { status: 500 },
    );
  }
}