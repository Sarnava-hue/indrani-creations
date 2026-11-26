import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildCollectionHref,
  findCategoryBySlugCandidates,
  getCategoryAncestorChain,
  getChildCategories,
  getCrossCollectionLinks,
  getDescendantCategoryIds,
  type CategoryLinkNode,
} from "@/lib/seo/category-links";

const sampleCategories: CategoryLinkNode[] = [
  { id: 1, name: "All Sarees", slug: "all-sarees", parentId: null },
  { id: 2, name: "Silk Sarees", slug: "silk-sarees", parentId: 1 },
  { id: 3, name: "Kanjivaram Silk", slug: "kanjivaram-silk", parentId: 2 },
  { id: 4, name: "Bangles", slug: "bangles", parentId: null },
  { id: 5, name: "Earrings", slug: "earrings", parentId: null },
  { id: 6, name: "Necklaces", slug: "necklaces", parentId: null },
];

describe("category link and hierarchy helpers", () => {
  it("builds canonical collection URLs and picks the highest-priority candidate slug", () => {
    assert.equal(buildCollectionHref("silk-sarees"), "/collections/silk-sarees");
    assert.equal(
      findCategoryBySlugCandidates(sampleCategories, [
        "missing-slug",
        "all-sarees",
        "silk-sarees",
      ])?.slug,
      "all-sarees",
    );
    assert.equal(
      findCategoryBySlugCandidates(sampleCategories, ["non-existent"]),
      undefined,
    );
  });

  it("collects all descendant category IDs including cycles safely", () => {
    assert.deepEqual(getDescendantCategoryIds(sampleCategories, 1), [1, 2, 3]);
    assert.deepEqual(getDescendantCategoryIds(sampleCategories, 4), [4]);

    const cyclic: CategoryLinkNode[] = [
      { id: 10, name: "A", slug: "a", parentId: 11 },
      { id: 11, name: "B", slug: "b", parentId: 10 },
    ];
    assert.deepEqual(getDescendantCategoryIds(cyclic, 10), [10, 11]);
  });

  it("returns ordered ancestor chains and direct child categories", () => {
    const chain = getCategoryAncestorChain(sampleCategories, 3);
    assert.deepEqual(
      chain.map((category) => category.slug),
      ["all-sarees", "silk-sarees", "kanjivaram-silk"],
    );

    const children = getChildCategories(sampleCategories, 1);
    assert.deepEqual(
      children.map((category) => category.slug),
      ["silk-sarees"],
    );
  });

  it("returns cross-collection links excluding the active subtree and ancestors", () => {
    const crossLinks = getCrossCollectionLinks(sampleCategories, 2);
    assert.deepEqual(
      crossLinks.map((category) => category.slug),
      ["bangles", "earrings", "necklaces"],
    );
  });
});
