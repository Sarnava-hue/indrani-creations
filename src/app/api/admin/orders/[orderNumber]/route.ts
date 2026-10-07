import { NextResponse } from "next/server";
import { cancelOrderAndReleaseInventory } from "@/lib/orders/cancel-order";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { shipOrderAndCommitInventory } from "@/lib/orders/ship-order";
import {
  canTransitionOrderStatus,
  type OrderStatus,
} from "@/lib/orders/status";

type RouteContext = {
  params: Promise<{
    orderNumber: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { orderNumber } = await context.params;

    const order = await db.orm.public.Order.where({ orderNumber })
      .select(
        "id",
        "orderNumber",
        "userId",
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
        "shippingLine1",
        "shippingLine2",
        "shippingCity",
        "shippingState",
        "shippingPostalCode",
        "shippingCountryCode",
        "customerNote",
        "createdAt",
        "updatedAt",
      )
      .first();

    if (!order) {
      return NextResponse.json(
        {
          error: "Order not found",
        },
        {
          status: 404,
        },
      );
    }

    const items = await db.orm.public.OrderItem.where({
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

    const payment = await db.orm.public.Payment.where({
      orderId: order.id,
    })
      .select(
        "id",
        "provider",
        "providerPaymentId",
        "amountPaise",
        "currency",
        "status",
        "paidAt",
        "failureCode",
        "failureNote",
        "createdAt",
        "updatedAt",
      )
      .first();

    const shipment = await db.orm.public.Shipment.where({
      orderId: order.id,
    })
      .select(
        "id",
        "provider",
        "providerShipmentId",
        "trackingNumber",
        "trackingUrl",
        "status",
        "shippedAt",
        "deliveredAt",
        "createdAt",
        "updatedAt",
      )
      .first();

    return NextResponse.json({
      order,
      items,
      payment,
      shipment,
    });
  } catch (error) {
    console.error("Failed to fetch admin order:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch order",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { orderNumber } = await context.params;

    const order = await db.orm.public.Order.where({ orderNumber })
      .select("id", "status", "paymentStatus", "shippingStatus")
      .first();

    if (!order) {
      return NextResponse.json(
        {
          error: "Order not found",
        },
        {
          status: 404,
        },
      );
    }

    const body = await request.json();

    const allowedOrderStatuses = [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "PACKED",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "RETURNED",
      "REFUNDED",
    ] as const;

    const allowedPaymentStatuses = [
      "PENDING",
      "AUTHORIZED",
      "PAID",
      "FAILED",
      "REFUNDED",
      "PARTIALLY_REFUNDED",
    ] as const;

    const allowedShippingStatuses = [
      "PENDING",
      "READY_TO_SHIP",
      "SHIPPED",
      "IN_TRANSIT",
      "DELIVERED",
      "RETURNED",
    ] as const;

    const nextStatus = body.status === undefined ? order.status : body.status;

    const requestedPaymentStatus =
      body.paymentStatus === undefined
        ? order.paymentStatus
        : body.paymentStatus;

    const nextShippingStatus =
      body.shippingStatus === undefined
        ? order.shippingStatus
        : body.shippingStatus;

    if (!allowedOrderStatuses.includes(nextStatus)) {
      return NextResponse.json(
        {
          error: "Invalid order status",
        },
        {
          status: 400,
        },
      );
    }

    const currentStatus = order.status as OrderStatus;
    const requestedStatus = nextStatus as OrderStatus;

    if (!canTransitionOrderStatus(currentStatus, requestedStatus)) {
      return NextResponse.json(
        {
          error: `Order cannot move from ${currentStatus} to ${requestedStatus}.`,
        },
        {
          status: 409,
        },
      );
    }

    if (!allowedPaymentStatuses.includes(requestedPaymentStatus)) {
      return NextResponse.json(
        {
          error: "Invalid payment status",
        },
        {
          status: 400,
        },
      );
    }

    if (
      body.paymentStatus !== undefined &&
      body.paymentStatus !== order.paymentStatus
    ) {
      return NextResponse.json(
        {
          error:
            "Payment status can only be changed through the payment verification system.",
        },
        {
          status: 409,
        },
      );
    }

    if (!allowedShippingStatuses.includes(nextShippingStatus)) {
      return NextResponse.json(
        {
          error: "Invalid shipping status",
        },
        {
          status: 400,
        },
      );
    }

    if (nextStatus === "CANCELLED") {
      const result = await cancelOrderAndReleaseInventory(orderNumber);

      if (!result.cancelled) {
        return NextResponse.json(
          {
            error: "This order can no longer be cancelled.",
          },
          { status: 409 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Order cancelled and inventory released.",
      });
    }

    if (nextStatus === "SHIPPED") {
      const result = await shipOrderAndCommitInventory(orderNumber);

      if (!result.shipped) {
        return NextResponse.json(
          {
            error:
              "This order cannot be shipped. Make sure the order is paid and ready for shipment.",
          },
          { status: 409 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Order shipped and inventory committed.",
      });
    }

    /*
     * Basic consistency rules.
     *
     * These prevent obviously contradictory
     * combinations while keeping the workflow
     * flexible enough for manual admin handling.
     */

    if (nextStatus === "DELIVERED" && nextShippingStatus !== "DELIVERED") {
      return NextResponse.json(
        {
          error: "A delivered order must have delivered shipping status",
        },
        {
          status: 409,
        },
      );
    }

    if (
      nextStatus === "SHIPPED" &&
      !["SHIPPED", "IN_TRANSIT", "DELIVERED"].includes(nextShippingStatus)
    ) {
      return NextResponse.json(
        {
          error: "A shipped order must have an appropriate shipping status",
        },
        {
          status: 409,
        },
      );
    }

    if (requestedPaymentStatus === "PAID" && nextStatus === "CANCELLED") {
      return NextResponse.json(
        {
          error: "A cancelled order cannot be marked as paid",
        },
        {
          status: 409,
        },
      );
    }

    const plan = db.sql.public.order
      .update({
        status: nextStatus,
        shippingStatus: nextShippingStatus,
      })
      .where((fields, fns) => fns.eq(fields.id, order.id))
      .returning(
        "id",
        "orderNumber",
        "status",
        "paymentStatus",
        "shippingStatus",
        "updatedAt",
      )
      .build();

    const [updatedOrder] = await db.runtime().query(plan);

    return NextResponse.json({
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Failed to update admin order:", error);

    return NextResponse.json(
      {
        error: "Failed to update order",
      },
      {
        status: 500,
      },
    );
  }
}
