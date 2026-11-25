import { NextResponse } from "next/server";
import { or } from "@prisma/orm-postgres/orm-client";

import { requireAdminApi } from "@/lib/auth/admin";
import { db } from "@/lib/db";

const ALLOWED_ORDER_STATUSES = [
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

const ALLOWED_PAYMENT_STATUSES = [
  "PENDING",
  "AUTHORIZED",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
] as const;

type OrderStatusFilter = (typeof ALLOWED_ORDER_STATUSES)[number];
type PaymentStatusFilter = (typeof ALLOWED_PAYMENT_STATUSES)[number];

function parsePositiveInt(
  value: string | null,
  fallback: number,
  max: number,
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, max);
}

export async function GET(request: Request) {
  try {
    const { response } = await requireAdminApi();

    if (response) {
      return response;
    }

    const { searchParams } = new URL(request.url);
    const rawQuery = (searchParams.get("q") ?? "").trim().slice(0, 100);
    const rawStatus = (searchParams.get("status") ?? "").trim().toUpperCase();
    const rawPaymentStatus = (searchParams.get("paymentStatus") ?? "")
      .trim()
      .toUpperCase();

    const statusFilter = ALLOWED_ORDER_STATUSES.includes(
      rawStatus as OrderStatusFilter,
    )
      ? (rawStatus as OrderStatusFilter)
      : null;

    const paymentFilter = ALLOWED_PAYMENT_STATUSES.includes(
      rawPaymentStatus as PaymentStatusFilter,
    )
      ? (rawPaymentStatus as PaymentStatusFilter)
      : null;

    const escapedSearch = rawQuery.replace(/[%_\\]/g, (char) => `\\${char}`);
    const searchPattern = rawQuery ? `%${escapedSearch}%` : null;

    const requestedPage = parsePositiveInt(searchParams.get("page"), 1, 10000);
    const pageSize = parsePositiveInt(searchParams.get("pageSize"), 25, 100);

    function withFilters(collection: typeof db.orm.public.Order) {
      let filtered = collection;

      if (statusFilter) {
        filtered = filtered.where((order) => order.status.eq(statusFilter));
      }

      if (paymentFilter) {
        filtered = filtered.where((order) =>
          order.paymentStatus.eq(paymentFilter),
        );
      }

      if (searchPattern) {
        filtered = filtered.where((order) =>
          or(
            order.orderNumber.ilike(searchPattern),
            order.customerEmail.ilike(searchPattern),
            order.shippingRecipientName.ilike(searchPattern),
            order.shippingPhone.ilike(searchPattern),
          ),
        );
      }

      return filtered;
    }

    const { totalCount } = await withFilters(db.orm.public.Order).aggregate(
      (aggregate) => ({
        totalCount: aggregate.count(),
      }),
    );

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const offset = (page - 1) * pageSize;

    const orders = await withFilters(db.orm.public.Order)
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
      .orderBy((order) => order.createdAt.desc())
      .limit(pageSize)
      .offset(offset)
      .all();

    const orderIds = orders.map((order) => order.id);

    const [payments, orderItems, shipments] =
      orderIds.length > 0
        ? await Promise.all([
            db.orm.public.Payment.where((payment) =>
              payment.orderId.in(orderIds),
            )
              .select(
                "orderId",
                "provider",
                "upiTransactionReference",
                "upiReferenceSubmittedAt",
              )
              .all(),
            db.orm.public.OrderItem.where((item) => item.orderId.in(orderIds))
              .select(
                "id",
                "orderId",
                "productId",
                "productName",
                "sku",
                "unitPricePaise",
                "quantity",
                "totalPaise",
              )
              .all(),
            db.orm.public.Shipment.where((shipment) =>
              shipment.orderId.in(orderIds),
            )
              .select("orderId", "provider", "trackingNumber", "status")
              .all(),
          ])
        : [[], [], []];

    const paymentMap = new Map(
      payments.map((payment) => [payment.orderId, payment]),
    );

    const shipmentMap = new Map(
      shipments.map((shipment) => [shipment.orderId, shipment]),
    );

    const itemsByOrderId = new Map<number, typeof orderItems>();

    for (const item of orderItems) {
      const existing = itemsByOrderId.get(item.orderId) ?? [];
      existing.push(item);
      itemsByOrderId.set(item.orderId, existing);
    }

    const ordersWithItems = orders.map((order) => {
      const items = itemsByOrderId.get(order.id) ?? [];
      const payment = paymentMap.get(order.id) ?? null;
      const shipment = shipmentMap.get(order.id) ?? null;

      return {
        ...order,
        items,
        itemCount: items.reduce((total, item) => total + item.quantity, 0),
        upiReferenceSubmitted: Boolean(payment?.upiTransactionReference),
        trackingNumber: shipment?.trackingNumber ?? null,
        shipmentProvider: shipment?.provider ?? null,
      };
    });

    return NextResponse.json({
      orders: ordersWithItems,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin orders:", error);

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