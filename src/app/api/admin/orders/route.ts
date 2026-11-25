import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/auth/admin";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const { response } = await requireAdminApi();

    if (response) {
      return response;
    }

    const orders = await db.orm.public.Order
      .select(
        "id",
        "orderNumber",
        "customerEmail",
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
        "shippingCity",
        "shippingState",
        "shippingPostalCode",
        "createdAt",
        "updatedAt",
      )
      .orderBy((order) =>
        order.createdAt.desc(),
      )
      .limit(100)
      .all();

    const orderIds = orders.map((order) => order.id);

    const payments =
      orderIds.length > 0
        ? await db.orm.public.Payment.where((payment) =>
            payment.orderId.in(orderIds),
          )
            .select(
              "orderId",
              "provider",
              "upiTransactionReference",
              "upiReferenceSubmittedAt",
            )
            .all()
        : [];

    const paymentMap = new Map(
      payments.map((payment) => [payment.orderId, payment]),
    );

    const ordersWithItems =
      await Promise.all(
        orders.map(async (order) => {
          const items =
            await db.orm.public.OrderItem
              .where({
                orderId: order.id,
              })
              .select(
                "id",
                "productId",
                "productName",
                "sku",
                "unitPricePaise",
                "quantity",
                "totalPaise",
              )
              .all();

          const payment = paymentMap.get(order.id) ?? null;

          return {
            ...order,
            items,
            itemCount: items.reduce(
              (total, item) =>
                total + item.quantity,
              0,
            ),
            upiReferenceSubmitted: Boolean(
              payment?.upiTransactionReference,
            ),
          };
        }),
      );

    return NextResponse.json({
      orders: ordersWithItems,
    });
  } catch (error) {
    console.error(
      "Failed to fetch admin orders:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to fetch orders",
      },
      {
        status: 500,
      },
    );
  }
}