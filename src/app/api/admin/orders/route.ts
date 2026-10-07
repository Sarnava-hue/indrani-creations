import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();

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

          return {
            ...order,
            items,
            itemCount: items.reduce(
              (total, item) =>
                total + item.quantity,
              0,
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