import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { CategoryForm } from "@/components/admin/category-form";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditCategoryPage({
  params,
}: PageProps) {
  const { id } = await params;

  const categoryId = Number(id);

  if (!Number.isInteger(categoryId)) {
    notFound();
  }

  const category =
    await db.orm.public.Category
      .where({ id: categoryId })
      .select(
        "id",
        "name",
        "slug",
        "description",
        "imageUrl",
        "parentId",
        "isActive",
        "sortOrder",
      )
      .first();

  if (!category) {
    notFound();
  }

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
          Edit category
        </h1>

        <p className="mt-2 text-sm text-neutral-500">
          Update {category.name}.
        </p>
      </div>

      <CategoryForm
        mode="edit"
        category={category}
      />
    </div>
  );
}