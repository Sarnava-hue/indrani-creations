import Link from "next/link";

import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { EditProductForm } from "@/components/admin/edit-product-form";
import { ProductImageManager } from "@/components/admin/product-image-manager";

type EditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  await requireAdmin();

  const { id: rawId } = await params;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <div>
        <p className="text-sm text-red-600">Invalid product ID.</p>
      </div>
    );
  }

  const products = await db.orm.public.Product.where({ id })
    .select(
      "id",
      "categoryId",
      "name",
      "sku",
      "description",
      "pricePaise",
      "compareAtPricePaise",
      "fabric",
      "color",
      "occasion",
      "pattern",
      "sareeLength",
      "blouseIncluded",
      "blouseDetails",
      "careInstructions",
      "isOneOfOne",
      "isActive",
      "isFeatured",
    )
    .all();

  const product = products[0];

  if (!product) {
    return (
      <div>
        <Link
          href="/admin/products"
          className="text-sm text-neutral-500 underline"
        >
          ← Back to products
        </Link>

        <h2 className="mt-6 text-2xl font-light">Product not found</h2>
      </div>
    );
  }

  const inventories = await db.orm.public.Inventory.where({ productId: id })
    .select("quantity", "reserved")
    .all();

  const inventory = inventories[0] ?? {
    quantity: 0,
    reserved: 0,
  };

  const categories = await db.orm.public.Category.where({ isActive: true })
    .select("id", "name")
    .orderBy((category) => category.sortOrder.asc())
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
          Edit product
        </h2>

        <p className="mt-3 text-sm text-neutral-600">
          Update product information and inventory.
        </p>
      </div>

      <ProductImageManager productId={product.id} />

      <EditProductForm
        product={product}
        inventory={inventory}
        categories={categories}
      />
    </div>
  );
}
