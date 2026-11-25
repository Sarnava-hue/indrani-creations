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
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountryCode: string;
  customerNote: string | null;
  createdAt: string;
  updatedAt: string;
};

type OrderItem = {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  unitPricePaise: number;
  quantity: number;
  totalPaise: number;
};

type Payment = {
  id: number;
  provider: string;
  providerPaymentId: string | null;
  amountPaise: number;
  currency: string;
  status: PaymentStatus;
  paidAt: string | null;
  failureCode: string | null;
  failureNote: string | null;
  upiTransactionReference: string | null;
  upiReferenceSubmittedAt: string | null;
};

type Shipment = {
  id: number;
  provider: string | null;
  providerShipmentId: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  status: ShippingStatus;
  shippedAt: string | null;
  deliveredAt: string | null;
};

type OrderResponse = {
  order: Order;
  items: OrderItem[];
  payment: Payment | null;
  shipment: Shipment | null;
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

function label(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

const orderStatuses: OrderStatus[] = [
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

const shippingStatuses: ShippingStatus[] = [
  "PENDING",
  "READY_TO_SHIP",
  "SHIPPED",
  "IN_TRANSIT",
  "DELIVERED",
  "RETURNED",
];

async function fetchAdminOrder(targetOrderNumber: string): Promise<OrderResponse> {
  const response = await fetch(
    `/api/admin/orders/${encodeURIComponent(targetOrderNumber)}`,
    {
      cache: "no-store",
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error ?? "Failed to load order");
  }

  return result as OrderResponse;
}

type PageProps = {
  params: Promise<{
    orderNumber: string;
  }>;
};

export default function AdminOrderDetailPage({
  params,
}: PageProps) {
  const [orderNumber, setOrderNumber] =
    useState("");

  const [data, setData] =
    useState<OrderResponse | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [verifyingPayment, setVerifyingPayment] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [statusMessage, setStatusMessage] =
    useState<string | null>(null);

  const [status, setStatus] =
    useState<OrderStatus>("PENDING");

  const [shippingStatus, setShippingStatus] =
    useState<ShippingStatus>("PENDING");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const resolved =
          await params;

        if (cancelled) {
          return;
        }

        setOrderNumber(
          resolved.orderNumber,
        );

        const result = await fetchAdminOrder(
          resolved.orderNumber,
        );

        if (!cancelled) {
          setData(result);
          setStatus(result.order.status);
          setShippingStatus(
            result.order.shippingStatus,
          );
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to load order",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [params]);

  async function saveStatuses() {
    if (!orderNumber) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setStatusMessage(null);

      const response =
        await fetch(
          `/api/admin/orders/${encodeURIComponent(orderNumber)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              status,
              shippingStatus,
            }),
          },
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Failed to update order",
        );
      }

      const refreshed = await fetchAdminOrder(orderNumber);

      setData(refreshed);
      setStatus(refreshed.order.status);
      setShippingStatus(refreshed.order.shippingStatus);
      setStatusMessage("Order status updated.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update order",
      );
    } finally {
      setSaving(false);
    }
  }

  async function markManualUpiAsPaid() {
    if (!orderNumber || verifyingPayment || !data?.payment) {
      return;
    }

    const hasRef = Boolean(data.payment.upiTransactionReference);
    const confirmText = hasRef
      ? `Confirm that you received ${formatINR(data.payment.amountPaise)} for UPI reference ${data.payment.upiTransactionReference}?`
      : `The customer has not submitted a UPI reference yet. Mark ${formatINR(data.payment.amountPaise)} as PAID anyway?`;

    if (!window.confirm(confirmText)) {
      return;
    }

    try {
      setVerifyingPayment(true);
      setError(null);
      setStatusMessage(null);

      const response = await fetch(
        `/api/payments/${encodeURIComponent(orderNumber)}/status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "PAID",
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Failed to verify payment",
        );
      }

      const refreshed = await fetchAdminOrder(orderNumber);

      setData(refreshed);
      setStatus(refreshed.order.status);
      setShippingStatus(refreshed.order.shippingStatus);
      setStatusMessage("Payment verified and marked as PAID.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to verify payment",
      );
    } finally {
      setVerifyingPayment(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-sm text-neutral-500">
        Loading order...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/orders"
          className="text-xs uppercase tracking-widest text-neutral-400 hover:text-black"
        >
          ← Back to orders
        </Link>

        <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const {
    order,
    items,
    payment,
    shipment,
  } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/orders"
          className="text-xs uppercase tracking-widest text-neutral-400 transition hover:text-black"
        >
          ← Back to orders
        </Link>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-400">
              Order
            </p>

            <h1 className="mt-2 text-3xl font-medium text-neutral-900">
              #{order.orderNumber}
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              Placed{" "}
              {formatDate(order.createdAt)}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-widest text-neutral-400">
              Total
            </p>

            <p className="mt-1 text-2xl font-medium text-neutral-900">
              {formatINR(
                order.totalPaise,
              )}
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {statusMessage ? (
        <div
          role="status"
          className="border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          {statusMessage}
        </div>
      ) : null}

      {/* Status management */}
      <section className="border border-neutral-200 bg-white p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-neutral-900">
            Order status
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Update the operational status of
            this order.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <label
              htmlFor="order-status"
              className="admin-label"
            >
              Order
            </label>

            <select
              id="order-status"
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target
                    .value as OrderStatus,
                )
              }
              className="admin-input"
            >
              {orderStatuses.map(
                (value) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label(value)}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="payment-status"
              className="admin-label"
            >
              Payment
            </label>

            <input
              id="payment-status"
              type="text"
              readOnly
              value={label(order.paymentStatus)}
              className="admin-input cursor-not-allowed bg-neutral-50 text-neutral-600"
            />

            <p className="mt-2 text-xs text-neutral-400">
              Verified in the Payment section below.
            </p>
          </div>

          <div>
            <label
              htmlFor="shipping-status"
              className="admin-label"
            >
              Shipping
            </label>

            <select
              id="shipping-status"
              value={shippingStatus}
              onChange={(event) =>
                setShippingStatus(
                  event.target
                    .value as ShippingStatus,
                )
              }
              className="admin-input"
            >
              {shippingStatuses.map(
                (value) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label(value)}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() =>
              void saveStatuses()
            }
            disabled={saving}
            className="bg-black px-6 py-3 text-xs uppercase tracking-widest text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save status"}
          </button>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* Items */}
        <section className="border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 p-6">
            <h2 className="text-lg font-medium text-neutral-900">
              Order items
            </h2>
          </div>

          <div className="divide-y divide-neutral-200">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-6 p-6"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {item.productName}
                  </p>

                  <p className="mt-1 text-xs text-neutral-400">
                    SKU: {item.sku}
                  </p>

                  <p className="mt-2 text-xs text-neutral-500">
                    Qty: {item.quantity}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm text-neutral-900">
                    {formatINR(
                      item.totalPaise,
                    )}
                  </p>

                  <p className="mt-1 text-xs text-neutral-400">
                    {formatINR(
                      item.unitPricePaise,
                    )}{" "}
                    each
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Customer */}
        <section className="border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 p-6">
            <h2 className="text-lg font-medium text-neutral-900">
              Customer
            </h2>
          </div>

          <div className="space-y-5 p-6 text-sm">
            <div>
              <p className="text-xs uppercase tracking-widest text-neutral-400">
                Name
              </p>

              <p className="mt-1 text-neutral-900">
                {
                  order.shippingRecipientName
                }
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-neutral-400">
                Email
              </p>

              <p className="mt-1 break-all text-neutral-900">
                {order.customerEmail}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-neutral-400">
                Phone
              </p>

              <p className="mt-1 text-neutral-900">
                {order.shippingPhone}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Shipping */}
      <section className="border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-medium text-neutral-900">
          Shipping address
        </h2>

        <div className="mt-5 text-sm leading-7 text-neutral-600">
          <p className="font-medium text-neutral-900">
            {order.shippingRecipientName}
          </p>

          <p>{order.shippingLine1}</p>

          {order.shippingLine2 ? (
            <p>{order.shippingLine2}</p>
          ) : null}

          <p>
            {order.shippingCity},{" "}
            {order.shippingState}
          </p>

          <p>
            {order.shippingPostalCode},{" "}
            {order.shippingCountryCode}
          </p>

          <p className="mt-2">
            Phone: {order.shippingPhone}
          </p>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Payment */}
        <section className="border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-medium text-neutral-900">
            Payment
          </h2>

          {payment ? (
            <div className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">
                  Provider
                </span>

                <span className="text-neutral-900">
                  {payment.provider}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">
                  Status
                </span>

                <span className="text-neutral-900">
                  {label(payment.status)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">
                  Amount
                </span>

                <span className="text-neutral-900">
                  {formatINR(
                    payment.amountPaise,
                  )}
                </span>
              </div>

              {payment.providerPaymentId ? (
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-500">
                    Payment ID
                  </span>

                  <span className="break-all text-right text-xs text-neutral-900">
                    {
                      payment.providerPaymentId
                    }
                  </span>
                </div>
              ) : null}

              {payment.provider === "upi_manual" ? (
                <>
                  <div className="flex justify-between gap-4">
                    <span className="text-neutral-500">
                      UPI reference
                    </span>

                    <span className="break-all text-right font-mono text-xs text-neutral-900">
                      {payment.upiTransactionReference ??
                        "Not submitted yet"}
                    </span>
                  </div>

                  {payment.upiReferenceSubmittedAt ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-neutral-500">
                        Submitted at
                      </span>

                      <span className="text-right text-xs text-neutral-700">
                        {formatDate(
                          payment.upiReferenceSubmittedAt,
                        )}
                      </span>
                    </div>
                  ) : null}
                </>
              ) : null}

              {payment.paidAt ? (
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-500">
                    Paid at
                  </span>

                  <span className="text-right text-xs text-neutral-700">
                    {formatDate(payment.paidAt)}
                  </span>
                </div>
              ) : null}

              {payment.failureNote ? (
                <div className="border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {payment.failureNote}
                </div>
              ) : null}

              {payment.provider === "upi_manual" &&
              payment.status === "PENDING" &&
              order.status !== "CANCELLED" ? (
                <div className="border-t border-neutral-200 pt-4">
                  <p className="mb-3 text-xs leading-5 text-neutral-600">
                    {payment.upiTransactionReference
                      ? "Check your bank or UPI app for this reference and amount before confirming payment."
                      : "The customer has not submitted a UPI reference yet. Only confirm if you have verified receipt in your bank/UPI account."}
                  </p>

                  <button
                    type="button"
                    onClick={() => void markManualUpiAsPaid()}
                    disabled={verifyingPayment}
                    className="w-full bg-black px-5 py-3 text-xs uppercase tracking-widest text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {verifyingPayment
                      ? "Verifying..."
                      : "Verify & Mark as Paid"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-5 text-sm text-neutral-500">
              No payment record.
            </p>
          )}
        </section>

        {/* Shipment */}
        <section className="border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-medium text-neutral-900">
            Shipment
          </h2>

          {shipment ? (
            <div className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">
                  Provider
                </span>

                <span className="text-neutral-900">
                  {shipment.provider ??
                    "Not assigned"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">
                  Status
                </span>

                <span className="text-neutral-900">
                  {label(shipment.status)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">
                  Tracking
                </span>

                <span className="text-right text-neutral-900">
                  {shipment.trackingNumber ??
                    "Not assigned"}
                </span>
              </div>

              {shipment.trackingUrl ? (
                <a
                  href={shipment.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-xs uppercase tracking-widest text-neutral-500 underline hover:text-black"
                >
                  Open tracking
                </a>
              ) : null}
            </div>
          ) : (
            <p className="mt-5 text-sm text-neutral-500">
              No shipment created yet.
            </p>
          )}
        </section>
      </div>

      {/* Summary */}
      <section className="border border-neutral-200 bg-white p-6">
        <div className="ml-auto max-w-md space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">
              Subtotal
            </span>

            <span>
              {formatINR(
                order.subtotalPaise,
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-neutral-500">
              Discount
            </span>

            <span>
              -{" "}
              {formatINR(
                order.discountPaise,
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-neutral-500">
              Shipping
            </span>

            <span>
              {formatINR(
                order.shippingPaise,
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-neutral-500">
              Tax
            </span>

            <span>
              {formatINR(
                order.taxPaise,
              )}
            </span>
          </div>

          <div className="border-t border-neutral-200 pt-3">
            <div className="flex justify-between text-base font-medium">
              <span>Total</span>

              <span>
                {formatINR(
                  order.totalPaise,
                )}
              </span>
            </div>
          </div>
        </div>
      </section>

      {order.customerNote ? (
        <section className="border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-medium text-neutral-900">
            Customer note
          </h2>

          <p className="mt-4 text-sm leading-7 text-neutral-600">
            {order.customerNote}
          </p>
        </section>
      ) : null}
    </div>
  );
}