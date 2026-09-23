import Link from "next/link";

import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/utils/currency";

export default async function AdminProductsPage() {
  await requireAdmin();

  const products =
    await db.orm.public.Product
      .select(
        "id",
        "name",
        "slug",
        "sku",
        "pricePaise",
        "compareAtPricePaise",
        "isActive",
        "isFeatured",
        "isOneOfOne",
        "createdAt",
      )
      .orderBy((product) =>
        product.createdAt.desc(),
      )
      .all();

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Catalog
          </p>

          <h2 className="mt-2 text-3xl font-light tracking-tight">
            Products
          </h2>

          <p className="mt-3 text-sm text-neutral-600">
            Manage products available on the storefront.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center bg-black px-5 py-3 text-sm text-white transition hover:bg-neutral-800"
        >
          + Add product
        </Link>
      </div>

      <div className="overflow-hidden border border-black/10 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-black/10 text-left">
                <th className="px-5 py-4 text-xs font-medium uppercase tracking-[0.12em] text-neutral-500">
                  Product
                </th>

                <th className="px-5 py-4 text-xs font-medium uppercase tracking-[0.12em] text-neutral-500">
                  SKU
                </th>

                <th className="px-5 py-4 text-xs font-medium uppercase tracking-[0.12em] text-neutral-500">
                  Price
                </th>

                <th className="px-5 py-4 text-xs font-medium uppercase tracking-[0.12em] text-neutral-500">
                  Type
                </th>

                <th className="px-5 py-4 text-xs font-medium uppercase tracking-[0.12em] text-neutral-500">
                  Status
                </th>

                <th className="px-5 py-4 text-xs font-medium uppercase tracking-[0.12em] text-neutral-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-black/5 last:border-b-0"
                >
                  <td className="px-5 py-5">
                    <div>
                      <p className="font-medium">
                        {product.name}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        {product.slug}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-5 text-sm text-neutral-600">
                    {product.sku}
                  </td>

                  <td className="px-5 py-5 text-sm">
                    <div>
                      {formatINR(product.pricePaise)}

                      {product.compareAtPricePaise ? (
                        <span className="ml-2 text-xs text-neutral-400 line-through">
                          {formatINR(
                            product.compareAtPricePaise,
                          )}
                        </span>
                      ) : null}
                    </div>
                  </td>

                  <td className="px-5 py-5 text-sm text-neutral-600">
                    {product.isOneOfOne
                      ? "One of one"
                      : "Multiple"}
                  </td>

                  <td className="px-5 py-5">
                    <span
                      className={`inline-flex px-2.5 py-1 text-xs ${
                        product.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {product.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </td>

                  <td className="px-5 py-5">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-sm underline underline-offset-4 transition hover:text-neutral-500"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}

              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-neutral-500"
                  >
                    No products found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}