import assert from "node:assert/strict";
import { describe, it } from "node:test";

import nextConfig from "../../../next.config";

describe("Next.js Core Web Vitals configuration", () => {
  it("enables AVIF and WebP image delivery with a 31-day optimization TTL", () => {
    assert.deepEqual(nextConfig.images?.formats, ["image/avif", "image/webp"]);
    assert.equal(nextConfig.images?.minimumCacheTTL, 2678400);
  });

  it("applies long-lived Cache-Control headers to static storefront images", async () => {
    assert.equal(typeof nextConfig.headers, "function");

    const rules = await nextConfig.headers!();
    const imagesRule = rules.find((rule) => rule.source === "/images/:path*");
    const productsRule = rules.find(
      (rule) => rule.source === "/products/:path*",
    );

    assert.ok(imagesRule);
    assert.ok(productsRule);
    assert.match(
      imagesRule.headers[0]?.value ?? "",
      /max-age=86400.*stale-while-revalidate=604800/,
    );
    assert.match(
      productsRule.headers[0]?.value ?? "",
      /max-age=86400.*stale-while-revalidate=604800/,
    );
  });
});
