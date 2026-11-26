import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildProductImageAlt,
  buildProductImageFilename,
} from "@/lib/seo/image-seo";

describe("image and visual search SEO helpers", () => {
  it("preserves custom alt text verbatim when supplied by curator", () => {
    const result = buildProductImageAlt({
      altText: "  Crimson Banarasi saree gold zari pallu close-up  ",
      productName: "Banarasi Saree",
      fabric: "Silk",
      color: "Red",
      viewIndex: 2,
    });

    assert.equal(result, "Crimson Banarasi saree gold zari pallu close-up");
  });

  it("synthesizes attribute-rich descriptive alt fallbacks", () => {
    const primary = buildProductImageAlt({
      altText: null,
      productName: "Madhurima Kanjivaram Saree",
      color: "Royal Blue",
      fabric: "Mulberry Silk",
      pattern: "Zari Border",
      occasion: "Weddings",
      viewIndex: 0,
    });

    assert.equal(
      primary,
      "Madhurima Kanjivaram Saree in royal blue, mulberry silk, zari border for weddings",
    );

    const secondary = buildProductImageAlt({
      altText: "",
      productName: "Meenakari Bangles",
      color: "Gold",
      viewIndex: 2,
    });

    assert.equal(secondary, "Meenakari Bangles in gold — view 3");
  });

  it("builds safe keyword-rich upload filenames from product slugs", () => {
    assert.equal(
      buildProductImageFilename({
        productSlug: "crimson-banarasi-silk-saree",
        randomSuffix: "A1B2C3D4-xxxx",
        extension: ".webp",
      }),
      "crimson-banarasi-silk-saree-a1b2c3d4xxxx.webp",
    );

    assert.equal(
      buildProductImageFilename({
        productSlug: "../../Weird!!Slug??",
        randomSuffix: "12ab34cd",
        extension: "jpg",
      }),
      "weird-slug-12ab34cd.jpg",
    );

    assert.equal(
      buildProductImageFilename({
        productSlug: "---",
        randomSuffix: "abcd1234",
        extension: "png",
      }),
      "product-image-abcd1234.png",
    );
  });
});
