import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveSocialLinks } from "@/lib/config/site";
import {
  buildGoogleShoppingFeedXml,
  escapeXml,
  inferGoogleProductCategory,
} from "@/lib/seo/google-shopping-feed";
import { buildSiteGraphJsonLd } from "@/lib/seo/structured-data";

describe("social links and site graph signals", () => {
  it("extracts valid HTTPS social links and ignores invalid or empty values", () => {
    const links = resolveSocialLinks({
      NEXT_PUBLIC_INSTAGRAM_URL: "https://instagram.com/indranicreations",
      NEXT_PUBLIC_FACEBOOK_URL: "javascript:alert(1)",
      NEXT_PUBLIC_YOUTUBE_URL: "   ",
      NEXT_PUBLIC_PINTEREST_URL: "https://in.pinterest.com/indranicreations/",
    });

    assert.deepEqual(links, [
      { label: "Instagram", href: "https://instagram.com/indranicreations" },
      {
        label: "Pinterest",
        href: "https://in.pinterest.com/indranicreations/",
      },
    ]);
  });

  it("wires validated social URLs into OnlineStore.sameAs when present", () => {
    const graphWithSocial = buildSiteGraphJsonLd({
      siteUrl: "https://indranicreations.store",
      sameAs: ["https://instagram.com/indranicreations"],
    });

    const storeNode = graphWithSocial["@graph"][0] as { sameAs?: string[] };
    assert.deepEqual(storeNode.sameAs, [
      "https://instagram.com/indranicreations",
    ]);
  });
});

describe("Google Merchant Center product XML feed", () => {
  it("escapes XML control characters cleanly", () => {
    assert.equal(escapeXml(`Saree & "Blouse" <Silk>'`), "Saree &amp; &quot;Blouse&quot; &lt;Silk&gt;&apos;");
  });

  it("maps ethnic wear and jewellery categories to Google taxonomy paths", () => {
    assert.match(
      inferGoogleProductCategory("silk-sarees", "Silk Sarees"),
      /Traditional & Ceremonial Clothing/,
    );
    assert.match(inferGoogleProductCategory("bangles", "Bangles"), /Bracelets/);
    assert.match(inferGoogleProductCategory("earrings", "Earrings"), /Earrings/);
    assert.match(inferGoogleProductCategory("necklaces", "Necklaces"), /Necklaces/);
  });

  it("builds valid RSS 2.0 XML with regular/sale prices, gallery images, and free India shipping", () => {
    const xml = buildGoogleShoppingFeedXml({
      siteUrl: "https://indranicreations.store",
      items: [
        {
          id: 1,
          sku: "IND-SAR-001",
          name: "Crimson & Gold Banarasi Saree",
          slug: "crimson-gold-banarasi-saree",
          pricePaise: 450000,
          compareAtPricePaise: 550000,
          fabric: "Mulberry Silk",
          color: "Crimson",
          pattern: "Zari Floral",
          categoryName: "Silk Sarees",
          categorySlug: "silk-sarees",
          availableQuantity: 1,
          imageUrls: [
            "https://blob.example/p1-main.webp",
            "https://blob.example/p1-pallu.webp",
          ],
        },
        {
          id: 2,
          sku: "IND-JWL-002",
          name: "Antique Oxidized Jhumkas",
          slug: "antique-oxidized-jhumkas",
          pricePaise: 85000,
          compareAtPricePaise: null,
          categoryName: "Earrings",
          categorySlug: "earrings",
          availableQuantity: 0,
          imageUrls: [],
        },
      ],
    });

    assert.match(xml, /<g:id>IND-SAR-001<\/g:id>/);
    assert.match(xml, /<g:title>Crimson &amp; Gold Banarasi Saree<\/g:title>/);
    assert.match(xml, /<g:price>5500\.00 INR<\/g:price>/);
    assert.match(xml, /<g:sale_price>4500\.00 INR<\/g:sale_price>/);
    assert.match(xml, /<g:additional_image_link>https:\/\/blob\.example\/p1-pallu\.webp<\/g:additional_image_link>/);
    assert.match(xml, /<g:availability>in_stock<\/g:availability>/);
    assert.match(xml, /<g:availability>out_of_stock<\/g:availability>/);
    assert.match(xml, /<g:identifier_exists>false<\/g:identifier_exists>/);
    assert.match(xml, /<g:country>IN<\/g:country>/);
  });
});
