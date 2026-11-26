import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_OG_IMAGE_PATH } from "@/lib/seo/page-metadata";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildProductJsonLd,
  buildSiteGraphJsonLd,
  serializeJsonLd,
} from "@/lib/seo/structured-data";

describe("structured data helpers", () => {
  const siteUrl = "https://indranicreations.store";

  it("escapes < characters safely when serializing JSON-LD", () => {
    const serialized = serializeJsonLd({ name: "</script><script>alert(1)" });
    assert.equal(serialized.includes("<"), false);
    assert.match(serialized, /\\u003c\/script>/);
  });

  it("builds root OnlineStore, WebSite SearchAction, and MerchantReturnPolicy graph", () => {
    const graphDoc = buildSiteGraphJsonLd({
      siteUrl,
      contactEmail: "care@indranicreations.store",
      contactPhone: null,
    });

    assert.equal(graphDoc["@context"], "https://schema.org");
    assert.equal(graphDoc["@graph"].length, 3);

    const storeNode = graphDoc["@graph"][0];
    assert.equal(storeNode["@type"], "OnlineStore");
    assert.equal(
      storeNode.contactPoint?.email,
      "care@indranicreations.store",
    );
    assert.equal(storeNode.contactPoint?.telephone, undefined);

    const websiteNode = graphDoc["@graph"][1];
    assert.equal(websiteNode["@type"], "WebSite");
    assert.equal(
      websiteNode.potentialAction?.target.urlTemplate,
      `${siteUrl}/shop?q={search_term_string}`,
    );

    const policyNode = graphDoc["@graph"][2];
    assert.equal(policyNode["@type"], "MerchantReturnPolicy");
    assert.equal(policyNode.merchantReturnDays, 15);
    assert.equal(policyNode.refundType, "https://schema.org/ExchangeRefund");
  });

  it("builds BreadcrumbList positions cleanly", () => {
    const breadcrumb = buildBreadcrumbJsonLd([
      { name: "Home", url: siteUrl },
      { name: "Silk Sarees", url: `${siteUrl}/collections/silk-sarees` },
    ]);

    assert.equal(breadcrumb["@type"], "BreadcrumbList");
    assert.equal(breadcrumb.itemListElement.length, 2);
    assert.equal(breadcrumb.itemListElement[0].position, 1);
    assert.equal(breadcrumb.itemListElement[1].position, 2);
  });

  it("builds Product JSON-LD with Brand, attributes, OfferShippingDetails, and image fallback", () => {
    const schema = buildProductJsonLd({
      siteUrl,
      product: {
        name: "Kanjivaram Gold Zari Saree",
        slug: "kanjivaram-gold-zari-saree",
        sku: "IND-SAR-01",
        pricePaise: 1250000,
        fabric: "Mulberry Silk",
        color: "Royal Blue",
        pattern: "Temple Border",
      },
      images: [],
      categoryName: "Silk Sarees",
      availableQuantity: 2,
    });

    assert.equal(schema["@type"], "Product");
    assert.deepEqual(schema.brand, {
      "@type": "Brand",
      name: "Indrani Creations",
    });
    assert.equal(schema.material, "Mulberry Silk");
    assert.equal(schema.color, "Royal Blue");
    assert.equal(schema.pattern, "Temple Border");
    assert.deepEqual(schema.image, [
      new URL(DEFAULT_OG_IMAGE_PATH, siteUrl).href,
    ]);
    assert.equal(schema.offers.priceCurrency, "INR");
    assert.equal(schema.offers.price, "12500.00");
    assert.equal(schema.offers.availability, "https://schema.org/InStock");
    assert.equal(
      schema.offers.shippingDetails.deliveryTime.handlingTime.minValue,
      2,
    );
    assert.equal(
      schema.offers.shippingDetails.deliveryTime.handlingTime.maxValue,
      4,
    );
  });

  it("builds CollectionPage ItemList schema capped at 24 items", () => {
    const products = Array.from({ length: 30 }, (_, index) => ({
      name: `Saree ${index + 1}`,
      slug: `saree-${index + 1}`,
      primaryImage: { url: `/products/saree-${index + 1}.webp` },
    }));

    const collectionSchema = buildCollectionPageJsonLd({
      siteUrl,
      category: { name: "Silk Sarees", slug: "silk-sarees" },
      description: "Curated silk sarees.",
      products,
    });

    assert.equal(collectionSchema["@type"], "CollectionPage");
    assert.equal(collectionSchema.mainEntity.numberOfItems, 30);
    assert.equal(collectionSchema.mainEntity.itemListElement.length, 24);
    assert.equal(
      collectionSchema.mainEntity.itemListElement[0].url,
      `${siteUrl}/products/saree-1`,
    );
  });
});
