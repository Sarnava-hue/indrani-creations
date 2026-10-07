import { db } from "@/lib/db";

export async function getActiveCategories() {
  return db.orm.public.Category
    .where({
      isActive: true,
    })
    .select(
      "id",
      "name",
      "slug",
      "description",
      "imageUrl",
      "parentId",
      "sortOrder",
    )
    .orderBy((category) =>
      category.sortOrder.asc(),
    )
    .all();
}