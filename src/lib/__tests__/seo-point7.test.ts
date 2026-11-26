import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  EDITORIAL_GUIDES,
  getGuideBySlug,
  resolveGuideCollectionCtas,
} from "@/lib/seo/guides";
import { buildArticleJsonLd } from "@/lib/seo/structured-data";

describe("editorial guides and Article schema", () => {
  const siteUrl = "https://indranicreations.store";

  it("provides unique slugs, complete sections, and valid lookup", () => {
    const slugs = EDITORIAL_GUIDES.map((guide) => guide.slug);
    assert.equal(new Set(slugs).size, slugs.length);
    assert.ok(EDITORIAL_GUIDES.length >= 3);

    for (const guide of EDITORIAL_GUIDES) {
      assert.ok(guide.sections.length > 0);
      assert.ok(guide.metaDescription.length <= 160);
      assert.equal(getGuideBySlug(guide.slug)?.title, guide.title);
    }

    assert.equal(getGuideBySlug("missing-guide"), undefined);
  });

  it("resolves guide collection CTAs to active /collections/[slug] URLs with /shop fallback", () => {
    const careGuide = EDITORIAL_GUIDES[0]!;
    const resolvedWithSarees = resolveGuideCollectionCtas(careGuide, [
      { slug: "silk-sarees" },
    ]);
    assert.deepEqual(resolvedWithSarees, [
      { label: "Explore Sarees", href: "/collections/silk-sarees" },
    ]);

    const resolvedEmpty = resolveGuideCollectionCtas(careGuide, []);
    assert.deepEqual(resolvedEmpty, [
      { label: "Explore Sarees", href: "/shop" },
    ]);
  });

  it("builds Article JSON-LD linked to root #organization", () => {
    const guide = EDITORIAL_GUIDES[1]!;
    const article = buildArticleJsonLd({
      siteUrl,
      slug: guide.slug,
      title: guide.title,
      description: guide.metaDescription,
      imageUrl: guide.image,
      publishedAt: guide.publishedAt,
      updatedAt: guide.updatedAt,
    });

    assert.equal(article["@type"], "Article");
    assert.equal(article.headline, guide.title);
    assert.equal(
      article.mainEntityOfPage["@id"],
      `${siteUrl}/guides/${guide.slug}`,
    );
    assert.deepEqual(article.publisher, { "@id": `${siteUrl}#organization` });
    assert.equal(article.inLanguage, "en-IN");
  });
});
