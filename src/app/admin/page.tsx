import Link from "next/link";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const products = await db.orm.public.Product
    .where({ isActive: true })
    .select("id")
    .all();

  const categories = await db.orm.public.Category
    .where({ isActive: true })
    .select("id")
    .all();

  const orders = await db.orm.public.Order
    .select("id", "status", "totalPaise")
    .all();

  const pendingOrders = orders.filter(
    (order) => order.status === "PENDING",
  ).length;

  const totalRevenuePaise = orders
    .filter((order) => order.status !== "CANCELLED")
    .reduce(
      (total, order) => total + order.totalPaise,
      0,
    );

  const stats = [
    {
      label: "Active products",
      value: products.length,
      href: "/admin/products",
    },
    {
      label: "Categories",
      value: categories.length,
      href: "/admin/categories",
    },
    {
      label: "Pending orders",
      value: pendingOrders,
      href: "/admin/orders",
    },
    {
      label: "Order value",
      value: new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(totalRevenuePaise / 100),
      href: "/admin/orders",
    },
  ];

  return (
    <div>
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
          Overview
        </p>

        <h2 className="mt-2 text-3xl font-light tracking-tight">
          Dashboard
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
          Manage the Indrani Creations storefront, products,
          inventory and customer orders.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="border border-black/10 bg-white p-6 transition hover:border-black/30"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
              {stat.label}
            </p>

            <p className="mt-4 text-3xl font-light">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="border border-black/10 bg-white p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Quick actions
          </p>

          <div className="mt-5 space-y-2">
            <Link
              href="/admin/products/new"
              className="block border border-black bg-black px-5 py-4 text-center text-sm text-white transition hover:bg-neutral-800"
            >
              Add product
            </Link>

            <Link
              href="/admin/orders"
              className="block border border-black/15 px-5 py-4 text-center text-sm transition hover:bg-neutral-50"
            >
              Manage orders
            </Link>

            <Link
              href="/admin/inventory"
              className="block border border-black/15 px-5 py-4 text-center text-sm transition hover:bg-neutral-50"
            >
              Check inventory
            </Link>
          </div>
        </section>

        <section className="border border-black/10 bg-white p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Storefront
          </p>

          <h3 className="mt-3 text-xl font-light">
            View the customer experience
          </h3>

          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Open the live local storefront to review products,
            shopping and customer account flows.
          </p>

          <Link
            href="/"
            className="mt-6 inline-block border border-black px-5 py-3 text-sm transition hover:bg-black hover:text-white"
          >
            Open storefront →
          </Link>
        </section>
      </div>
    </div>
  );
}