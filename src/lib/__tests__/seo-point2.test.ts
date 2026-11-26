import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SITE_URL } from "@/lib/config/site";
import {
  DEFAULT_OG_IMAGE_PATH,
  buildCollectionDescription,
  buildProductMetaDescription,
  buildStorePageMetadata,
  resolveMetadataImageUrl,
  truncateMetaDescription,
} from "@/lib/seo/page-metadata";

describe("on-page metadata helpers", () => {
  it("falls back to the default OpenGraph hero image when none is provided", () => {
    assert.equal(
      resolveMetadataImageUrl(null),
      new URL(DEFAULT_OG_IMAGE_PATH, SITE_URL).href,
    );
    assert.equal(
      resolveMetadataImageUrl("/images/collections/sarees.jpeg"),
      new URL("/images/collections/sarees.jpeg", SITE_URL).href,
    );
  });

  it("truncates long descriptions cleanly on a word boundary", () => {
    const text =
      "Handwoven Banarasi pure silk saree featuring intricate antique gold zari floral motifs.";
    const trimmed = truncateMetaDescription(text, 70);

    assert.equal(
      trimmed,
      "Handwoven Banarasi pure silk saree featuring intricate antique gold…",
    );
    assert.ok(trimmed.length <= 70);
  });

  it("builds consistent canonical, OpenGraph, and Twitter metadata", () => {
    const meta = buildStorePageMetadata({
      title: "Shipping Policy",
      description: "Dispatch timelines and delivery info.",
      canonical: "/shipping",
    });

    assert.equal(meta.title, "Shipping Policy");
    assert.equal(meta.alternates?.canonical, "/shipping");
    assert.equal(meta.openGraph?.title, "Shipping Policy | Indrani Creations");
    assert.equal(meta.openGraph?.url, `${SITE_URL}/shipping`);
    assert.ok(Array.isArray(meta.openGraph?.images));
    assert.ok(Array.isArray(meta.twitter?.images));
  });

  it("supports absolute titles without duplicating the store suffix", () => {
    const meta = buildStorePageMetadata({
      title: "Indrani Creations | Shop Handcrafted Sarees & Jewellery Online",
      description: "Shop sarees and jewellery.",
      canonical: "/",
      absoluteTitle: true,
    });

    assert.deepEqual(meta.title, {
      absolute: "Indrani Creations | Shop Handcrafted Sarees & Jewellery Online",
    });
  });

  it("generates descriptive product metadata from catalog attributes when shortDescription is missing", () => {
    const fromAttributes = buildProductMetaDescription(
      {
        name: "Crimson Kanjivaram Saree",
        fabric: "Pure Mulberry Silk",
        color: "Crimson",
        occasion: "Weddings",
        pattern: "Zari Border",
      },
      "Silk Sarees",
    );

    assert.match(fromAttributes, /Crimson Kanjivaram Saree/);
    assert.match(fromAttributes, /pure mulberry silk/i);
    assert.match(fromAttributes, /Silk Sarees/);
    assert.match(fromAttributes, /weddings/i);

    const fromShort = buildProductMetaDescription({
      name: "Item",
      shortDescription: "Custom short summary for search.",
      description: "Longer description should not override shortDescription.",
    });

    assert.equal(fromShort, "Custom short summary for search.");
  });

  it("falls back cleanly for collection descriptions when custom description is blank", () => {
    assert.equal(
      buildCollectionDescription("Bangles", "  Artisanal glass and lac bangles.  "),
      "Artisanal glass and lac bangles.",
    );
    assert.match(
      buildCollectionDescription("Bangles", null),
      /Explore our curated Bangles collection at Indrani Creations/,
    );
  });
});
