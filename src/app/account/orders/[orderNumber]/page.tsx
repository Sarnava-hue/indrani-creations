import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/utils/currency";

type OrderItem = {
  id: number;
  productName: string;
  sku: string;
  unitPricePaise: number;
  quantity: number;
  totalPaise: number;
};

type Order = {
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

type OrderPageProps = {
  params: Promise<{
    orderNumber: string;
  }>;
};

function statusLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) => letter.toUpperCase(),
    );
}

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

async function getOrder(
  orderNumber: string,
): Promise<Order | null> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const orders =
    await db.orm.public.Order
      .where({
        userId: session.userId,
        orderNumber: orderNumber.trim(),
      })
      .select(
        "id",
        "orderNumber",
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
        "createdAt",
      )
      .all();

  if (orders.length === 0) {
    return null;
  }

  const order = orders[0];

  const items =
    await db.orm.public.OrderItem
      .where({
        orderId: order.id,
      })
      .select(
        "id",
        "productName",
        "sku",
        "unitPricePaise",
        "quantity",
        "totalPaise",
      )
      .all();

  return {
    orderNumber:
      order.orderNumber,

    status:
      order.status,

    paymentStatus:
      order.paymentStatus,

    shippingStatus:
      order.shippingStatus,

    currency:
      order.currency,

    subtotalPaise:
      order.subtotalPaise,

    discountPaise:
      order.discountPaise,

    shippingPaise:
      order.shippingPaise,

    taxPaise:
      order.taxPaise,

    totalPaise:
      order.totalPaise,

    createdAt:
      order.createdAt,

    shipping: {
      name:
        order.shippingRecipientName,

      phone:
        order.shippingPhone,

      line1:
        order.shippingLine1,

      line2:
        order.shippingLine2,

      city:
        order.shippingCity,

      state:
        order.shippingState,

      postalCode:
        order.shippingPostalCode,

      countryCode:
        order.shippingCountryCode,
    },

    items,
  };
}

export default async function OrderDetailsPage({
  params,
}: OrderPageProps) {
  const { orderNumber } =
    await params;

  const order = await getOrder(
    orderNumber,
  );

  if (!order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f8f5ef] px-5 py-12 text-[#241f1b] sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/account/orders"
          className="text-xs uppercase tracking-[0.2em] text-[#8b7562]"
        >
          ← My orders
        </Link>

        <div className="mt-8 border border-[#ded7ce] bg-white p-6 sm:p-9">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#8b7562]">
                Order details
              </p>

              <h1 className="mt-3 font-serif text-3xl sm:text-4xl">
                #{order.orderNumber}
              </h1>

              <p className="mt-3 text-sm text-[#756b63]">
                Placed on{" "}
                {formatDate(
                  order.createdAt,
                )}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-xs uppercase tracking-[0.15em] text-[#9a8d81]">
                Total
              </p>

              <p className="mt-2 text-2xl font-medium">
                {formatINR(
                  order.totalPaise,
                )}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 border-t border-[#ebe5de] pt-7 sm:grid-cols-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.15em] text-[#9a8d81]">
                Order status
              </p>

              <p className="mt-2 text-sm font-medium">
                {statusLabel(
                  order.status,
                )}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.15em] text-[#9a8d81]">
                Payment
              </p>

              <p className="mt-2 text-sm font-medium">
                {statusLabel(
                  order.paymentStatus,
                )}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.15em] text-[#9a8d81]">
                Shipping
              </p>

              <p className="mt-2 text-sm font-medium">
                {statusLabel(
                  order.shippingStatus,
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="border border-[#ded7ce] bg-white p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-[#8b7562]">
              Items
            </p>

            <div className="mt-6 divide-y divide-[#ebe5de]">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 py-5 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h2 className="font-serif text-xl">
                      {item.productName}
                    </h2>

                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#9a8d81]">
                      SKU: {item.sku}
                    </p>

                    <p className="mt-2 text-sm text-[#756b63]">
                      {formatINR(
                        item.unitPricePaise,
                      )}{" "}
                      × {item.quantity}
                    </p>
                  </div>

                  <p className="text-sm font-medium">
                    {formatINR(
                      item.totalPaise,
                    )}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-5">
            <section className="border border-[#ded7ce] bg-white p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-[#8b7562]">
                Order summary
              </p>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#756b63]">
                    Subtotal
                  </span>

                  <span>
                    {formatINR(
                      order.subtotalPaise,
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#756b63]">
                    Shipping
                  </span>

                  <span>
                    {order.shippingPaise ===
                    0
                      ? "Free"
                      : formatINR(
                          order.shippingPaise,
                        )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#756b63]">
                    Discount
                  </span>

                  <span>
                    {formatINR(
                      order.discountPaise,
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#756b63]">
                    Tax
                  </span>

                  <span>
                    {formatINR(
                      order.taxPaise,
                    )}
                  </span>
                </div>

                <div className="border-t border-[#ebe5de] pt-4">
                  <div className="flex justify-between font-medium">
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

            <section className="border border-[#ded7ce] bg-white p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-[#8b7562]">
                Delivery address
              </p>

              <div className="mt-5 text-sm leading-6 text-[#4f4740]">
                <p className="font-medium text-[#241f1b]">
                  {order.shipping.name}
                </p>

                <p>
                  {order.shipping.phone}
                </p>

                <p className="mt-2">
                  {order.shipping.line1}
                </p>

                {order.shipping.line2 && (
                  <p>
                    {order.shipping.line2}
                  </p>
                )}

                <p>
                  {order.shipping.city},{" "}
                  {order.shipping.state}
                </p>

                <p>
                  {order.shipping.postalCode}
                </p>

                <p>
                  {order.shipping.countryCode}
                </p>
              </div>
            </section>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-4">
          <Link
            href="/shop"
            className="bg-[#241f1b] px-6 py-3.5 text-xs font-medium uppercase tracking-[0.18em] text-white transition hover:bg-[#3a322b]"
          >
            Continue shopping
          </Link>

          <Link
            href="/account"
            className="border border-[#cfc6bc] px-6 py-3.5 text-xs font-medium uppercase tracking-[0.18em] transition hover:bg-white"
          >
            My account
          </Link>
        </div>
      </div>
    </main>
  );
}