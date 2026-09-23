import Link from "next/link";

import { requireAdmin } from "@/lib/auth/admin";
import LogoutButton from "@/components/account/logout-button";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[#f7f4ef] text-neutral-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-black/10 bg-white lg:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="border-b border-black/10 px-6 py-6">
              <Link
                href="/admin"
                className="text-lg font-semibold tracking-[0.2em]"
              >
                INDRANI
              </Link>

              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-neutral-500">
                Admin
              </p>
            </div>

            <nav className="flex-1 px-4 py-6">
              <div className="space-y-1">
                <Link
                  href="/admin"
                  className="block px-3 py-3 text-sm transition hover:bg-neutral-100"
                >
                  Dashboard
                </Link>

                <Link
                  href="/admin/products"
                  className="block px-3 py-3 text-sm transition hover:bg-neutral-100"
                >
                  Products
                </Link>

                <Link
                  href="/admin/categories"
                  className="block px-3 py-3 text-sm transition hover:bg-neutral-100"
                >
                  Categories
                </Link>

                <Link
                  href="/admin/inventory"
                  className="block px-3 py-3 text-sm transition hover:bg-neutral-100"
                >
                  Inventory
                </Link>

                <Link
                  href="/admin/orders"
                  className="block px-3 py-3 text-sm transition hover:bg-neutral-100"
                >
                  Orders
                </Link>

                <Link
                  href="/admin/coupons"
                  className="block px-3 py-3 text-sm transition hover:bg-neutral-100"
                >
                  Coupons
                </Link>

                <Link
                  href="/admin/reviews"
                  className="block px-3 py-3 text-sm transition hover:bg-neutral-100"
                >
                  Reviews
                </Link>
              </div>
            </nav>

            <div className="border-t border-black/10 p-4">
              <Link
                href="/"
                className="mb-2 block px-3 py-3 text-sm text-neutral-600 transition hover:bg-neutral-100"
              >
                View storefront
              </Link>

              <LogoutButton />
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="border-b border-black/10 bg-white px-6 py-5 lg:px-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Indrani Creations
                </p>

                <h1 className="mt-1 text-xl font-medium">
                  Administration
                </h1>
              </div>

              <Link
                href="/"
                className="text-sm text-neutral-600 transition hover:text-neutral-900"
              >
                Storefront →
              </Link>
            </div>
          </div>

          <div className="px-6 py-8 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}