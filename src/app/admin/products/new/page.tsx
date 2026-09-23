import Link from "next/link";

import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { AddProductForm } from "@/components/admin/add-product-form";

export default async function NewProductPage() {
  await requireAdmin();

  const categories =
    await db.orm.public.Category
      .where({ isActive: true })
      .select(
        "id",
        "name",
      )
      .orderBy((category) =>
        category.sortOrder.asc(),
      )
      .all();

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/products"
          className="text-sm text-neutral-500 transition hover:text-neutral-900"
        >
          ← Back to products
        </Link>

        <p className="mt-6 text-xs uppercase tracking-[0.2em] text-neutral-500">
          Catalog
        </p>

        <h2 className="mt-2 text-3xl font-light tracking-tight">
          Add product
        </h2>

        <p className="mt-3 text-sm text-neutral-600">
          Create a new product for the Indrani Creations
          catalog.
        </p>
      </div>

      <AddProductForm categories={categories} />
    </div>
  );
}