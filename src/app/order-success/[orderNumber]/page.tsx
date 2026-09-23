import Link from "next/link";

import { formatINR } from "@/lib/utils/currency";

type OrderItem = {
  id: number;
  productName: string;
  sku: string;
  unitPricePaise: number;
  quantity: number;
  totalPaise: number;
};

type OrderResponse = {
  order: {
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
    shipping: {
      name: string;
      phone: string;
      line1: string;
      line2: string | null;
      city: string;
      state: string;
      postalCode: string;
      countryCode: string;
    };
    items: OrderItem[];
  };
};

type OrderSuccessPageProps = {
  params: Promise<{
    orderNumber: string;
  }>;
};

async function getOrder(
  orderNumber: string,
): Promise<OrderResponse | null> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const response = await fetch(
    `${baseUrl}/api/orders/${encodeURIComponent(orderNumber)}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

export default async function OrderSuccessPage({
  params,
}: OrderSuccessPageProps) {
  const { orderNumber } = await params;

  const data = await getOrder(orderNumber);

  if (!data) {
    return (
      <main className="min-h-screen bg-[#f8f5ef] px-6 py-16 text-[#241f1b]">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl border border-[#241f1b]/10 bg-white p-8 text-center shadow-sm md:p-12">
            <p className="text-xs uppercase tracking-[0.25em] text-[#8b6f47]">
              Order lookup
            </p>

            <h1 className="mt-3 font-serif text-4xl">
              We couldn&apos;t find this order.
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#241f1b]/60">
              Please check your order number or return to the
              shop.
            </p>

            <Link
              href="/shop"
              className="mt-8 inline-flex rounded-full bg-[#241f1b] px-6 py-3 text-sm text-white transition hover:bg-[#3a3029]"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { order } = data;

  return (
    <main className="min-h-screen bg-[#f8f5ef] px-6 py-12 text-[#241f1b] md:py-16">
      <div className="mx-auto max-w-5xl">
        {/* Confirmation header */}
        <section className="rounded-3xl border border-[#241f1b]/10 bg-white p-8 shadow-sm md:p-12">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#241f1b] text-2xl text-white">
                ✓
              </div>

              <p className="text-xs uppercase tracking-[0.25em] text-[#8b6f47]">
                Order confirmed
              </p>

              <h1 className="mt-2 font-serif text-4xl leading-tight md:text-5xl">
                Thank you for your order.
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-[#241f1b]/60">
                Your order has been received successfully.
                We&apos;ll keep you updated as it moves through
                preparation and shipping.
              </p>
            </div>

            <div className="rounded-2xl bg-[#f8f5ef] p-5 md:min-w-56">
              <p className="text-xs uppercase tracking-[0.18em] text-[#241f1b]/45">
                Order number
              </p>

              <p className="mt-2 break-all font-mono text-sm">
                {order.orderNumber}
              </p>
            </div>
          </div>
        </section>

        {/* Status */}
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#241f1b]/10 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-[#241f1b]/45">
              Order status
            </p>

            <p className="mt-3 text-sm font-medium">
              {formatStatus(order.status)}
            </p>
          </div>

          <div className="rounded-2xl border border-[#241f1b]/10 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-[#241f1b]/45">
              Payment
            </p>

            <p className="mt-3 text-sm font-medium">
              {formatStatus(order.paymentStatus)}
            </p>
          </div>

          <div className="rounded-2xl border border-[#241f1b]/10 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-[#241f1b]/45">
              Shipping
            </p>

            <p className="mt-3 text-sm font-medium">
              {formatStatus(order.shippingStatus)}
            </p>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Items */}
          <section className="rounded-3xl border border-[#241f1b]/10 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8b6f47]">
                Your selection
              </p>

              <h2 className="mt-2 font-serif text-3xl">
                Order items
              </h2>
            </div>

            <div className="divide-y divide-[#241f1b]/10">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-6 py-5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <h3 className="font-medium">
                      {item.productName}
                    </h3>

                    <p className="mt-1 text-xs text-[#241f1b]/45">
                      SKU: {item.sku}
                    </p>

                    <p className="mt-2 text-sm text-[#241f1b]/60">
                      {formatINR(item.unitPricePaise)} ×{" "}
                      {item.quantity}
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-medium">
                    {formatINR(item.totalPaise)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Summary + shipping */}
          <div className="space-y-6">
            <section className="rounded-3xl border border-[#241f1b]/10 bg-white p-6 shadow-sm md:p-8">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8b6f47]">
                Summary
              </p>

              <h2 className="mt-2 font-serif text-3xl">
                Order total
              </h2>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#241f1b]/55">
                    Subtotal
                  </span>

                  <span>
                    {formatINR(
                      order.subtotalPaise,
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#241f1b]/55">
                    Shipping
                  </span>

                  <span>
                    {order.shippingPaise === 0
                      ? "Free"
                      : formatINR(
                          order.shippingPaise,
                        )}
                  </span>
                </div>

                {order.discountPaise > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#241f1b]/55">
                      Discount
                    </span>

                    <span>
                      −
                      {formatINR(
                        order.discountPaise,
                      )}
                    </span>
                  </div>
                )}

                {order.taxPaise > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#241f1b]/55">
                      Tax
                    </span>

                    <span>
                      {formatINR(order.taxPaise)}
                    </span>
                  </div>
                )}

                <div className="border-t border-[#241f1b]/10 pt-4">
                  <div className="flex justify-between text-base font-medium">
                    <span>Total</span>

                    <span>
                      {formatINR(order.totalPaise)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[#241f1b]/10 bg-white p-6 shadow-sm md:p-8">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8b6f47]">
                Delivery
              </p>

              <h2 className="mt-2 font-serif text-3xl">
                Shipping address
              </h2>

              <div className="mt-5 text-sm leading-7 text-[#241f1b]/70">
                <p className="font-medium text-[#241f1b]">
                  {order.shipping.name}
                </p>

                <p>{order.shipping.phone}</p>

                <p className="mt-2">
                  {order.shipping.line1}
                </p>

                {order.shipping.line2 && (
                  <p>{order.shipping.line2}</p>
                )}

                <p>
                  {order.shipping.city},{" "}
                  {order.shipping.state}
                </p>

                <p>
                  {order.shipping.postalCode}
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-full bg-[#241f1b] px-7 py-3 text-sm text-white transition hover:bg-[#3a3029]"
          >
            Continue shopping
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-[#241f1b]/15 bg-white px-7 py-3 text-sm transition hover:bg-white/70"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}