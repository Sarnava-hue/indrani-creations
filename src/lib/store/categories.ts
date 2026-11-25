import { cache } from "react";

import { db } from "@/lib/db";

export const getActiveCategories = cache(async () => {
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
});