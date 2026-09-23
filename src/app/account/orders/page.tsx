"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/utils/currency";

type Order = {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  shippingStatus: string;
  currency: string;
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
  createdAt: string;
};

type OrdersResponse = {
  orders: Order[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).format(new Date(value));
}

function statusLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) => letter.toUpperCase(),
    );
}

export default function OrdersPage() {
    const router = useRouter();
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        const response = await fetch(
          "/api/account/orders",
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");

            return;
          }

          throw new Error(
            "Unable to load orders.",
          );
        }

        const data =
          (await response.json()) as OrdersResponse;

        if (!cancelled) {
          setOrders(data.orders);
        }
      } catch {
        if (!cancelled) {
          setError(
            "Unable to load your orders right now.",
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
  }, );

  return (
    <main className="min-h-screen bg-[#f8f5ef] px-5 py-12 text-[#241f1b] sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <Link
            href="/account"
            className="text-xs uppercase tracking-[0.2em] text-[#8b7562]"
          >
            ← My account
          </Link>

          <p className="mt-8 text-xs uppercase tracking-[0.3em] text-[#8b7562]">
            Your purchases
          </p>

          <h1 className="mt-3 font-serif text-4xl sm:text-5xl">
            My orders
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-[#756b63]">
            A record of every order placed
            through your Indrani Creations
            account.
          </p>
        </div>

        {loading && (
          <div className="border border-[#ded7ce] bg-white p-8 text-sm text-[#756b63]">
            Loading your orders...
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="border border-red-200 bg-red-50 p-5 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          orders.length === 0 && (
            <div className="border border-[#ded7ce] bg-white p-10 text-center">
              <p className="text-xs uppercase tracking-[0.25em] text-[#8b7562]">
                No orders yet
              </p>

              <h2 className="mt-4 font-serif text-3xl">
                Your collection starts here.
              </h2>

              <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#756b63]">
                Discover handpicked sarees
                and timeless pieces from
                Indrani Creations.
              </p>

              <Link
                href="/shop"
                className="mt-7 inline-block bg-[#241f1b] px-6 py-3.5 text-xs font-medium uppercase tracking-[0.18em] text-white transition hover:bg-[#3a322b]"
              >
                Explore collection
              </Link>
            </div>
          )}

        {!loading &&
          !error &&
          orders.length > 0 && (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}
                  className="block border border-[#ded7ce] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md sm:p-7"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#8b7562]">
                        Order
                      </p>

                      <h2 className="mt-2 font-serif text-2xl">
                        #{order.orderNumber}
                      </h2>

                      <p className="mt-2 text-sm text-[#756b63]">
                        {formatDate(
                          order.createdAt,
                        )}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs uppercase tracking-[0.15em] text-[#9a8d81]">
                        Total
                      </p>

                      <p className="mt-2 text-lg font-medium">
                        {formatINR(
                          order.totalPaise,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 border-t border-[#ebe5de] pt-5 sm:grid-cols-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.15em] text-[#9a8d81]">
                        Order status
                      </p>

                      <p className="mt-1 text-sm">
                        {statusLabel(
                          order.status,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] uppercase tracking-[0.15em] text-[#9a8d81]">
                        Payment
                      </p>

                      <p className="mt-1 text-sm">
                        {statusLabel(
                          order.paymentStatus,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] uppercase tracking-[0.15em] text-[#9a8d81]">
                        Shipping
                      </p>

                      <p className="mt-1 text-sm">
                        {statusLabel(
                          order.shippingStatus,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 text-xs uppercase tracking-[0.18em] text-[#8b7562]">
                    View order →
                  </div>
                </Link>
              ))}
            </div>
          )}
      </div>
    </main>
  );
}