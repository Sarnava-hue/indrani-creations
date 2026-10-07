import Link from "next/link";

import { CategoryForm } from "@/components/admin/category-form";

export default function NewCategoryPage() {
  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/categories"
          className="text-xs uppercase tracking-widest text-neutral-400 transition hover:text-black"
        >
          ← Back to categories
        </Link>

        <p className="mt-6 text-xs uppercase tracking-widest text-neutral-400">
          Store management
        </p>

        <h1 className="mt-2 text-3xl font-medium text-neutral-900">
          Add category
        </h1>

        <p className="mt-2 text-sm text-neutral-500">
          Create a new collection for your
          storefront.
        </p>
      </div>

      <CategoryForm mode="create" />
    </div>
  );
}