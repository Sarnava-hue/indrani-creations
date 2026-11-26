import {
  buildProductMetaDescription,
  DEFAULT_OG_IMAGE_PATH,
  resolveMetadataImageUrl,
} from "@/lib/seo/page-metadata";

export type GoogleShoppingFeedItem = {
  id: number;
  sku: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  pricePaise: number;
  compareAtPricePaise?: number | null;
  fabric?: string | null;
  color?: string | null;
  occasion?: string | null;
  pattern?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  availableQuantity: number;
  imageUrls: readonly string[];
};

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatInrAmount(paise: number): string {
  return `${(paise / 100).toFixed(2)} INR`;
}

export function inferGoogleProductCategory(
  categorySlug?: string | null,
  categoryName?: string | null,
): string {
  const hint = `${categorySlug ?? ""} ${categoryName ?? ""}`.toLowerCase();

  if (hint.includes("bangle") || hint.includes("bracelet")) {
    return "Apparel & Accessories > Jewelry > Bracelets";
  }

  if (hint.includes("earring") || hint.includes("jhumka")) {
    return "Apparel & Accessories > Jewelry > Earrings";
  }

  if (hint.includes("necklace") || hint.includes("choker")) {
    return "Apparel & Accessories > Jewelry > Necklaces";
  }

  if (hint.includes("saree") || hint.includes("sari")) {
    return "Apparel & Accessories > Clothing > Traditional & Ceremonial Clothing";
  }

  return "Apparel & Accessories";
}

/**
 * Generates an RSS 2.0 + Google Merchant Center product XML feed for free
 * Shopping tab and Google Images listings across India.
 */
export function buildGoogleShoppingFeedXml({
  siteUrl,
  items,
}: {
  siteUrl: string;
  items: readonly GoogleShoppingFeedItem[];
}): string {
  const entries = items
    .map((item) => {
      const productUrl = `${siteUrl}/products/${item.slug}`;
      const description =
        item.description?.trim() ||
        item.shortDescription?.trim() ||
        buildProductMetaDescription(item, item.categoryName);

      const resolvedImages =
        item.imageUrls.length > 0
          ? item.imageUrls.map((url) => resolveMetadataImageUrl(url))
          : [resolveMetadataImageUrl(DEFAULT_OG_IMAGE_PATH)];

      const [primaryImage, ...additionalImages] = resolvedImages;
      const availability =
        item.availableQuantity > 0 ? "in_stock" : "out_of_stock";

      const hasCompareDiscount =
        typeof item.compareAtPricePaise === "number" &&
        item.compareAtPricePaise > item.pricePaise;

      const regularPrice = hasCompareDiscount
        ? formatInrAmount(item.compareAtPricePaise!)
        : formatInrAmount(item.pricePaise);

      const salePrice = hasCompareDiscount
        ? formatInrAmount(item.pricePaise)
        : null;

      const googleCategory = inferGoogleProductCategory(
        item.categorySlug,
        item.categoryName,
      );

      const lines = [
        "    <item>",
        `      <g:id>${escapeXml(item.sku)}</g:id>`,
        `      <g:title>${escapeXml(item.name.slice(0, 150))}</g:title>`,
        `      <g:description>${escapeXml(description)}</g:description>`,
        `      <g:link>${escapeXml(productUrl)}</g:link>`,
        `      <g:image_link>${escapeXml(primaryImage)}</g:image_link>`,
        ...additionalImages
          .slice(0, 10)
          .map(
            (url) =>
              `      <g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`,
          ),
        `      <g:availability>${availability}</g:availability>`,
        `      <g:price>${regularPrice}</g:price>`,
        ...(salePrice ? [`      <g:sale_price>${salePrice}</g:sale_price>`] : []),
        "      <g:condition>new</g:condition>",
        "      <g:brand>Indrani Creations</g:brand>",
        "      <g:identifier_exists>false</g:identifier_exists>",
        `      <g:google_product_category>${escapeXml(googleCategory)}</g:google_product_category>`,
        ...(item.categoryName?.trim()
          ? [
              `      <g:product_type>${escapeXml(item.categoryName.trim())}</g:product_type>`,
            ]
          : []),
        ...(item.fabric?.trim()
          ? [`      <g:material>${escapeXml(item.fabric.trim())}</g:material>`]
          : []),
        ...(item.color?.trim()
          ? [`      <g:color>${escapeXml(item.color.trim())}</g:color>`]
          : []),
        ...(item.pattern?.trim()
          ? [`      <g:pattern>${escapeXml(item.pattern.trim())}</g:pattern>`]
          : []),
        "      <g:gender>female</g:gender>",
        "      <g:age_group>adult</g:age_group>",
        "      <g:shipping>",
        "        <g:country>IN</g:country>",
        "        <g:price>0.00 INR</g:price>",
        "      </g:shipping>",
        "    </item>",
      ];

      return lines.join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    "  <channel>",
    "    <title>Indrani Creations Catalog</title>",
    `    <link>${escapeXml(siteUrl)}</link>`,
    "    <description>Handcrafted sarees, artisanal bangles, earrings, and necklaces from Indrani Creations.</description>",
    entries,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
