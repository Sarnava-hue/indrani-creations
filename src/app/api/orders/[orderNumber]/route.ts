
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  getGuestOrderCookieName,
  verifyGuestAccessToken,
} from "@/lib/orders/guest-token";

type RouteContext = {
  params: Promise<{ orderNumber: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { orderNumber } = await context.params;

    if (
      !orderNumber ||
      orderNumber.trim().length === 0 ||
      orderNumber.length > 100
    ) {
      return NextResponse.json(
        { error: "Invalid order number." },
        { status: 400 },
      );
    }

    const order = await db.orm.public.Order.where({
      orderNumber: orderNumber.trim(),
    })
      .select(
        "id",
        "userId",
        "guestAccessTokenHash",
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
      .first();

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 },
      );
    }

    if (order.userId !== null) {
      const session = await getSession();

      if (!session || session.userId !== order.userId) {
        return NextResponse.json(
          { error: "You are not authorized to view this order." },
          { status: 403 },
        );
      }
    } else {
      const cookieStore = await cookies();
      const token =
        request.headers.get("x-guest-order-token") ??
        cookieStore.get(getGuestOrderCookieName(order.orderNumber))?.value ??
        null;

      if (!verifyGuestAccessToken(token, order.guestAccessTokenHash)) {
        return NextResponse.json(
          { error: "Order verification failed." },
          { status: 403 },
        );
      }
    }

    const items = await db.orm.public.OrderItem.where({
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
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        shippingStatus: order.shippingStatus,
        currency: order.currency,
        subtotalPaise: order.subtotalPaise,
        discountPaise: order.discountPaise,
        shippingPaise: order.shippingPaise,
        taxPaise: order.taxPaise,
        totalPaise: order.totalPaise,
        createdAt: order.createdAt,
        shipping: {
          name: order.shippingRecipientName,
          phone: order.shippingPhone,
          line1: order.shippingLine1,
          line2: order.shippingLine2,
          city: order.shippingCity,
          state: order.shippingState,
          postalCode: order.shippingPostalCode,
          countryCode: order.shippingCountryCode,
        },
        items,
      },
    });
  } catch (error) {
    console.error("Failed to fetch order:", error);

    return NextResponse.json(
      { error: "Unable to retrieve the order right now." },
      { status: 500 },
    );
  }
}
