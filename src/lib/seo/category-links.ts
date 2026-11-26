export type CategoryLinkNode = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
};

/**
 * Returns the canonical collection path for a category slug.
 */
export function buildCollectionHref(slug: string): string {
  return `/collections/${slug}`;
}

/**
 * Resolves the highest-priority active category matching an ordered list of
 * candidate slugs, preserving curated fallback order.
 */
export function findCategoryBySlugCandidates<
  T extends Pick<CategoryLinkNode, "slug">,
>(categories: readonly T[], slugCandidates: readonly string[]): T | undefined {
  const bySlug = new Map(categories.map((category) => [category.slug, category]));

  for (const slug of slugCandidates) {
    const matched = bySlug.get(slug);

    if (matched) {
      return matched;
    }
  }

  return undefined;
}

/**
 * Collects a category ID along with all active descendant category IDs using a
 * cycle-safe breadth-first traversal.
 */
export function getDescendantCategoryIds(
  categories: readonly Pick<CategoryLinkNode, "id" | "parentId">[],
  rootCategoryId: number,
): number[] {
  const childrenByParent = new Map<number, number[]>();

  for (const category of categories) {
    if (category.parentId === null) {
      continue;
    }

    const siblings = childrenByParent.get(category.parentId);

    if (siblings) {
      siblings.push(category.id);
    } else {
      childrenByParent.set(category.parentId, [category.id]);
    }
  }

  const visited = new Set<number>([rootCategoryId]);
  const queue: number[] = [rootCategoryId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const childIds = childrenByParent.get(currentId) ?? [];

    for (const childId of childIds) {
      if (!visited.has(childId)) {
        visited.add(childId);
        queue.push(childId);
      }
    }
  }

  return [...visited];
}

/**
 * Returns direct active child categories for a parent collection.
 */
export function getChildCategories<
  T extends Pick<CategoryLinkNode, "id" | "parentId">,
>(categories: readonly T[], parentId: number): T[] {
  return categories.filter((category) => category.parentId === parentId);
}

/**
 * Returns the ordered ancestor chain from root collection to target category,
 * guarded against parent cycles.
 */
export function getCategoryAncestorChain<T extends CategoryLinkNode>(
  categories: readonly T[],
  categoryId: number,
): T[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const chain: T[] = [];
  const seen = new Set<number>();

  let currentId: number | null = categoryId;

  while (currentId !== null && !seen.has(currentId)) {
    const category = byId.get(currentId);

    if (!category) {
      break;
    }

    seen.add(currentId);
    chain.unshift(category);
    currentId = category.parentId;
  }

  return chain;
}

/**
 * Returns top-level / sibling collections outside the current category's
 * descendant subtree for cross-collection internal linking.
 */
export function getCrossCollectionLinks<T extends CategoryLinkNode>(
  categories: readonly T[],
  currentCategoryId: number,
  limit = 6,
): T[] {
  const excludedIds = new Set(
    getDescendantCategoryIds(categories, currentCategoryId),
  );
  const ancestorChain = getCategoryAncestorChain(categories, currentCategoryId);

  for (const ancestor of ancestorChain) {
    excludedIds.add(ancestor.id);
  }

  const otherCategories = categories.filter(
    (category) => !excludedIds.has(category.id),
  );
  const topLevelFirst = otherCategories.filter(
    (category) => category.parentId === null,
  );
  const remainder = otherCategories.filter(
    (category) => category.parentId !== null,
  );

  return [...topLevelFirst, ...remainder].slice(0, Math.max(0, limit));
}
