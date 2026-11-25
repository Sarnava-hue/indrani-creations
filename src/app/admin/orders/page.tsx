"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

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
  upiReferenceSubmitted?: boolean;
  trackingNumber?: string | null;
  shipmentProvider?: string | null;
};

type Pagination = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  "PENDING",
  "AUTHORIZED",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
];

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

  const [pagination, setPagination] =
    useState<Pagination>({
      page: 1,
      pageSize: 25,
      totalCount: 0,
      totalPages: 1,
    });

  const [searchInput, setSearchInput] =
    useState("");

  const [appliedQuery, setAppliedQuery] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"" | OrderStatus>("");

  const [paymentFilter, setPaymentFilter] =
    useState<"" | PaymentStatus>("");

  const [page, setPage] = useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("pageSize", "25");

        if (appliedQuery) {
          params.set("q", appliedQuery);
        }

        if (statusFilter) {
          params.set("status", statusFilter);
        }

        if (paymentFilter) {
          params.set("paymentStatus", paymentFilter);
        }

        const response =
          await fetch(
            `/api/admin/orders?${params.toString()}`,
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

          if (data.pagination) {
            setPagination(data.pagination as Pagination);
          }
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
  }, [page, appliedQuery, statusFilter, paymentFilter]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setAppliedQuery(searchInput.trim());
  }

  function resetFilters() {
    setSearchInput("");
    setAppliedQuery("");
    setStatusFilter("");
    setPaymentFilter("");
    setPage(1);
  }

  const hasActiveFilters = Boolean(
    appliedQuery || statusFilter || paymentFilter,
  );

  const startItem =
    pagination.totalCount === 0
      ? 0
      : (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(
    pagination.page * pagination.pageSize,
    pagination.totalCount,
  );

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
          View, search, and manage customer orders.
        </p>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleSearchSubmit}
        className="grid gap-3 border border-neutral-200 bg-white p-4 md:grid-cols-[1fr_180px_180px_auto_auto]"
      >
        <input
          type="search"
          aria-label="Search orders"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search order #, customer, email, or phone..."
          className="admin-input"
        />

        <select
          aria-label="Filter by order status"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as "" | OrderStatus);
            setPage(1);
          }}
          className="admin-input"
        >
          <option value="">All order statuses</option>
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {statusLabel(value)}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by payment status"
          value={paymentFilter}
          onChange={(event) => {
            setPaymentFilter(event.target.value as "" | PaymentStatus);
            setPage(1);
          }}
          className="admin-input"
        >
          <option value="">All payment statuses</option>
          {PAYMENT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {statusLabel(value)}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="bg-black px-5 py-2.5 text-xs uppercase tracking-widest text-white transition hover:bg-neutral-800"
        >
          Search
        </button>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={resetFilters}
            className="border border-neutral-300 px-4 py-2.5 text-xs uppercase tracking-widest text-neutral-600 transition hover:border-black hover:text-black"
          >
            Reset
          </button>
        ) : null}
      </form>

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
            {hasActiveFilters
              ? "No orders match your current filters."
              : "No orders yet."}
          </div>
        ) : (
          <>
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

                        {order.paymentStatus === "PENDING" &&
                        order.upiReferenceSubmitted ? (
                          <p className="mt-1 text-[10px] uppercase tracking-wider text-blue-700">
                            UPI ref submitted
                          </p>
                        ) : null}
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

                        {order.trackingNumber ? (
                          <p className="mt-1 font-mono text-[11px] text-neutral-500">
                            {order.shipmentProvider
                              ? `${order.shipmentProvider}: `
                              : ""}
                            {order.trackingNumber}
                          </p>
                        ) : null}
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

            <div className="flex flex-col items-center justify-between gap-4 border-t border-neutral-200 px-5 py-4 sm:flex-row">
              <p className="text-xs text-neutral-500">
                Showing {startItem}–{endItem} of {pagination.totalCount}{" "}
                {pagination.totalCount === 1 ? "order" : "orders"}
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="border border-neutral-300 px-3.5 py-1.5 text-xs uppercase tracking-widest text-neutral-700 transition hover:border-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="text-xs text-neutral-500">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(pagination.totalPages, current + 1),
                    )
                  }
                  className="border border-neutral-300 px-3.5 py-1.5 text-xs uppercase tracking-widest text-neutral-700 transition hover:border-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}