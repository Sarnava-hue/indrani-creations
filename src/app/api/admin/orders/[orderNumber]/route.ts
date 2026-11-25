import { NextResponse } from "next/server";
import { cancelOrderAndReleaseInventory } from "@/lib/orders/cancel-order";
import { requireAdminApi } from "@/lib/auth/admin";
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

type ShipmentInput = {
  provider?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
};

function parseNullableText(
  value: unknown,
  fieldLabel: string,
  maxLength: number,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === undefined || value === null) {
    return { ok: true, value: null };
  }

  if (typeof value !== "string") {
    return { ok: false, error: `${fieldLabel} must be text.` };
  }

  const trimmed = value.trim();

  if (trimmed.length > maxLength) {
    return {
      ok: false,
      error: `${fieldLabel} must be ${maxLength} characters or fewer.`,
    };
  }

  return { ok: true, value: trimmed || null };
}

function parseNullableHttpUrl(
  value: unknown,
): { ok: true; value: string | null } | { ok: false; error: string } {
  const parsed = parseNullableText(value, "Tracking URL", 500);

  if (!parsed.ok || parsed.value === null) {
    return parsed;
  }

  try {
    const url = new URL(parsed.value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return {
        ok: false,
        error: "Tracking URL must start with http:// or https://.",
      };
    }

    return { ok: true, value: parsed.value };
  } catch {
    return {
      ok: false,
      error: "Please enter a valid tracking URL.",
    };
  }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { response } = await requireAdminApi();

    if (response) {
      return response;
    }

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
        "upiTransactionReference",
        "upiReferenceSubmittedAt",
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
    const { response } = await requireAdminApi();

    if (response) {
      return response;
    }

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

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    let shipmentUpdate:
      | {
          provider: string | null;
          trackingNumber: string | null;
          trackingUrl: string | null;
        }
      | null = null;

    if (body.shipment !== undefined) {
      if (typeof body.shipment !== "object" || body.shipment === null) {
        return NextResponse.json(
          { error: "Invalid shipment payload" },
          { status: 400 },
        );
      }

      const rawShipment = body.shipment as ShipmentInput;
      const provider = parseNullableText(rawShipment.provider, "Courier / provider", 100);

      if (!provider.ok) {
        return NextResponse.json({ error: provider.error }, { status: 400 });
      }

      const trackingNumber = parseNullableText(
        rawShipment.trackingNumber,
        "Tracking number",
        100,
      );

      if (!trackingNumber.ok) {
        return NextResponse.json({ error: trackingNumber.error }, { status: 400 });
      }

      const trackingUrl = parseNullableHttpUrl(rawShipment.trackingUrl);

      if (!trackingUrl.ok) {
        return NextResponse.json({ error: trackingUrl.error }, { status: 400 });
      }

      shipmentUpdate = {
        provider: provider.value,
        trackingNumber: trackingNumber.value,
        trackingUrl: trackingUrl.value,
      };
    }

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
    const canShipLegacyPaidPending =
      currentStatus === "PENDING" &&
      requestedStatus === "SHIPPED" &&
      order.paymentStatus === "PAID";

    if (
      !canShipLegacyPaidPending &&
      !canTransitionOrderStatus(currentStatus, requestedStatus)
    ) {
      return NextResponse.json(
        {
          error: `Order cannot move from ${currentStatus} to ${requestedStatus}.`,
        },
        { status: 409 },
      );
    }

    if (!allowedPaymentStatuses.includes(requestedPaymentStatus)) {
      return NextResponse.json(
        {
          error: "Invalid payment status",
        },
        { status: 400 },
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
        { status: 409 },
      );
    }

    if (!allowedShippingStatuses.includes(nextShippingStatus)) {
      return NextResponse.json(
        {
          error: "Invalid shipping status",
        },
        { status: 400 },
      );
    }

    /*
     * Validate consistency rules before mutating order or inventory state.
     */
    if (requestedStatus === "DELIVERED" && nextShippingStatus !== "DELIVERED") {
      return NextResponse.json(
        {
          error: "A delivered order must have delivered shipping status",
        },
        { status: 409 },
      );
    }

    if (
      requestedStatus === "SHIPPED" &&
      currentStatus !== "SHIPPED" &&
      !["SHIPPED", "IN_TRANSIT", "DELIVERED"].includes(nextShippingStatus)
    ) {
      return NextResponse.json(
        {
          error: "A shipped order must have an appropriate shipping status",
        },
        { status: 409 },
      );
    }

    if (requestedStatus === "CANCELLED" && currentStatus !== "CANCELLED") {
      if (shipmentUpdate) {
        return NextResponse.json(
          {
            error: "Cannot update shipment tracking when cancelling an order.",
          },
          { status: 409 },
        );
      }

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

    if (shipmentUpdate && requestedStatus === "CANCELLED") {
      return NextResponse.json(
        {
          error: "Cannot update shipment details for a cancelled order.",
        },
        { status: 409 },
      );
    }

    if (requestedStatus === "SHIPPED" && currentStatus !== "SHIPPED") {
      const shipStatus = nextShippingStatus as
        | "SHIPPED"
        | "IN_TRANSIT"
        | "DELIVERED";

      const result = await shipOrderAndCommitInventory(
        orderNumber,
        shipStatus,
      );

      if (!result.shipped) {
        return NextResponse.json(
          {
            error:
              "This order cannot be shipped. Make sure the order is paid and ready for shipment.",
          },
          { status: 409 },
        );
      }

      if (shipmentUpdate) {
        const plan = db.sql.public.shipment
          .update(shipmentUpdate)
          .where((fields, fns) => fns.eq(fields.orderId, order.id))
          .build();

        await db.runtime().execute(plan);
      }

      return NextResponse.json({
        success: true,
        message: "Order shipped and inventory committed.",
      });
    }

    const result = await db.transaction(async (tx) => {
      const orderPlan = tx.sql.public.order
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

      const [updatedOrder] = await tx.query(orderPlan);

      let updatedShipment = null;
      const existingShipment = await tx.orm.public.Shipment.where({
        orderId: order.id,
      })
        .select("id", "shippedAt", "deliveredAt")
        .first();

      const nowIso = new Date().toISOString();
      const isShippedState = ["SHIPPED", "IN_TRANSIT", "DELIVERED"].includes(
        nextShippingStatus,
      );
      const isDeliveredState = nextShippingStatus === "DELIVERED";

      if (shipmentUpdate) {
        if (existingShipment) {
          const shipmentPlan = tx.sql.public.shipment
            .update({
              ...shipmentUpdate,
              status: nextShippingStatus,
              shippedAt: isShippedState
                ? (existingShipment.shippedAt ?? nowIso)
                : existingShipment.shippedAt,
              deliveredAt: isDeliveredState
                ? (existingShipment.deliveredAt ?? nowIso)
                : existingShipment.deliveredAt,
            })
            .where((fields, fns) => fns.eq(fields.id, existingShipment.id))
            .returning(
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
            .build();

          const [saved] = await tx.query(shipmentPlan);
          updatedShipment = saved ?? null;
        } else {
          updatedShipment = await tx.orm.public.Shipment.create({
            orderId: order.id,
            ...shipmentUpdate,
            status: nextShippingStatus,
            shippedAt: isShippedState ? nowIso : null,
            deliveredAt: isDeliveredState ? nowIso : null,
          });
        }
      } else if (existingShipment) {
        const shipmentPlan = tx.sql.public.shipment
          .update({
            status: nextShippingStatus,
            shippedAt: isShippedState
              ? (existingShipment.shippedAt ?? nowIso)
              : existingShipment.shippedAt,
            deliveredAt: isDeliveredState
              ? (existingShipment.deliveredAt ?? nowIso)
              : existingShipment.deliveredAt,
          })
          .where((fields, fns) => fns.eq(fields.id, existingShipment.id))
          .returning(
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
          .build();

        const [saved] = await tx.query(shipmentPlan);
        updatedShipment = saved ?? null;
      }

      return {
        order: updatedOrder,
        shipment: updatedShipment,
      };
    });

    return NextResponse.json(result);
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
