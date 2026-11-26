import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildShopMetadata,
  normalizeShopSearchParams,
} from "@/lib/seo/shop-metadata";

describe("shop search param normalization", () => {
  it("normalizes whitespace, sort fallback, and positive integer bounds", () => {
    const normalized = normalizeShopSearchParams({
      q: "  banarasi  ",
      category: " silk-sarees ",
      sort: "unknown-sort",
      page: "0",
      minPrice: "1500",
      maxPrice: "-10",
      inStock: "1",
    });

    assert.equal(normalized.query, "banarasi");
    assert.equal(normalized.categorySlug, "silk-sarees");
    assert.equal(normalized.sort, "newest");
    assert.equal(normalized.currentPage, 1);
    assert.equal(normalized.minPaise, 150000);
    assert.equal(normalized.maxPaise, 0);
    assert.equal(normalized.inStock, true);
    assert.equal(normalized.hasActiveFilters, true);
  });

  it("treats clean /shop or /shop?page=2 with default sort as unfiltered", () => {
    assert.equal(normalizeShopSearchParams({}).hasActiveFilters, false);
    assert.equal(
      normalizeShopSearchParams({ page: "2", sort: "newest" }).hasActiveFilters,
      false,
    );
  });
});

describe("shop Technical SEO metadata", () => {
  it("sets canonical /shop and indexable robots on unfiltered page 1", () => {
    const metadata = buildShopMetadata({});

    assert.equal(metadata.title, "Shop Sarees & Jewellery Online");
    assert.equal(metadata.alternates?.canonical, "/shop");
    assert.deepEqual(metadata.robots, { index: true, follow: true });
  });

  it("sets self-referencing canonical and page number on unfiltered page > 1", () => {
    const metadata = buildShopMetadata({ page: "3" });

    assert.equal(metadata.title, "Shop Sarees & Jewellery Online — Page 3");
    assert.equal(metadata.alternates?.canonical, "/shop?page=3");
    assert.deepEqual(metadata.robots, { index: true, follow: true });
  });

  it("marks search, category, sort, and price-filtered views noindex, follow", () => {
    const searchMeta = buildShopMetadata({ q: "kanjivaram" });
    assert.equal(searchMeta.title, 'Search: "kanjivaram" | Shop Sarees & Jewellery');
    assert.equal(searchMeta.alternates, undefined);
    assert.deepEqual(searchMeta.robots, { index: false, follow: true });

    const sortMeta = buildShopMetadata({ sort: "price-low" });
    assert.equal(sortMeta.alternates, undefined);
    assert.deepEqual(sortMeta.robots, { index: false, follow: true });

    const stockMeta = buildShopMetadata({ inStock: "1" });
    assert.deepEqual(stockMeta.robots, { index: false, follow: true });
  });
});
