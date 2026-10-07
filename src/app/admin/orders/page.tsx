"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | "REFUNDED";

type PaymentStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

type ShippingStatus =
  | "PENDING"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "RETURNED";

type Order = {
  id: number;
  orderNumber: string;
  customerEmail: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  currency: string;
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
  shippingRecipientName: string;
  shippingPhone: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
};

function formatINR(
  paise: number,
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    },
  ).format(paise / 100);
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

function statusLabel(
  value: string,
) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function orderStatusClass(
  status: OrderStatus,
) {
  switch (status) {
    case "DELIVERED":
      return "bg-neutral-100 text-neutral-700";

    case "CANCELLED":
    case "REFUNDED":
    case "RETURNED":
      return "bg-red-50 text-red-600";

    case "SHIPPED":
    case "PACKED":
      return "bg-blue-50 text-blue-700";

    case "PROCESSING":
    case "CONFIRMED":
      return "bg-amber-50 text-amber-700";

    default:
      return "bg-neutral-50 text-neutral-500";
  }
}

function paymentStatusClass(
  status: PaymentStatus,
) {
  switch (status) {
    case "PAID":
      return "bg-neutral-100 text-neutral-700";

    case "FAILED":
    case "REFUNDED":
      return "bg-red-50 text-red-600";

    default:
      return "bg-amber-50 text-amber-700";
  }
}

function shippingStatusClass(
  status: ShippingStatus,
) {
  switch (status) {
    case "DELIVERED":
      return "bg-neutral-100 text-neutral-700";

    case "RETURNED":
      return "bg-red-50 text-red-600";

    case "SHIPPED":
    case "IN_TRANSIT":
      return "bg-blue-50 text-blue-700";

    default:
      return "bg-neutral-50 text-neutral-500";
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        const response =
          await fetch(
            "/api/admin/orders",
            {
              cache: "no-store",
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ??
              "Failed to load orders",
          );
        }

        if (!cancelled) {
          setOrders(data.orders);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to load orders",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-neutral-400">
          Store management
        </p>

        <h1 className="mt-2 text-3xl font-medium text-neutral-900">
          Orders
        </h1>

        <p className="mt-2 text-sm text-neutral-500">
          View and manage customer orders.
        </p>
      </div>

      {error ? (
        <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden border border-neutral-200 bg-white">
        {loading ? (
          <div className="p-8 text-sm text-neutral-500">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-sm text-neutral-500">
            No orders yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="border-b border-neutral-200 bg-neutral-50">
                <tr>
                  <th className="px-5 py-4 text-left text-[10px] uppercase tracking-widest text-neutral-500">
                    Order
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] uppercase tracking-widest text-neutral-500">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] uppercase tracking-widest text-neutral-500">
                    Items
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] uppercase tracking-widest text-neutral-500">
                    Total
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] uppercase tracking-widest text-neutral-500">
                    Order status
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] uppercase tracking-widest text-neutral-500">
                    Payment
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] uppercase tracking-widest text-neutral-500">
                    Shipping
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] uppercase tracking-widest text-neutral-500">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-200">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition hover:bg-neutral-50"
                  >
                    <td className="px-5 py-5">
                      <Link
                        href={`/admin/orders/${order.orderNumber}`}
                        className="font-medium text-neutral-900 hover:underline"
                      >
                        #{order.orderNumber}
                      </Link>
                    </td>

                    <td className="px-5 py-5">
                      <p className="text-sm text-neutral-900">
                        {
                          order.shippingRecipientName
                        }
                      </p>

                      <p className="mt-1 text-xs text-neutral-400">
                        {order.customerEmail}
                      </p>
                    </td>

                    <td className="px-5 py-5 text-sm text-neutral-600">
                      {order.itemCount}
                    </td>

                    <td className="px-5 py-5 text-sm font-medium text-neutral-900">
                      {formatINR(
                        order.totalPaise,
                      )}
                    </td>

                    <td className="px-5 py-5">
                      <span
                        className={`inline-flex px-2.5 py-1 text-[10px] uppercase tracking-widest ${orderStatusClass(
                          order.status,
                        )}`}
                      >
                        {statusLabel(
                          order.status,
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-5">
                      <span
                        className={`inline-flex px-2.5 py-1 text-[10px] uppercase tracking-widest ${paymentStatusClass(
                          order.paymentStatus,
                        )}`}
                      >
                        {statusLabel(
                          order.paymentStatus,
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-5">
                      <span
                        className={`inline-flex px-2.5 py-1 text-[10px] uppercase tracking-widest ${shippingStatusClass(
                          order.shippingStatus,
                        )}`}
                      >
                        {statusLabel(
                          order.shippingStatus,
                        )}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-5 text-xs text-neutral-500">
                      {formatDate(
                        order.createdAt,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}