export type ProductImageAltInput = {
  altText?: string | null;
  productName: string;
  fabric?: string | null;
  color?: string | null;
  pattern?: string | null;
  occasion?: string | null;
  viewIndex?: number;
};

type ProductImageFilenameInput = {
  productSlug: string;
  randomSuffix: string;
  extension: string;
};

/**
 * Resolves a product image's alt text: returns curator-authored alt text when
 * present, or builds a descriptive fallback from fabric, color, pattern, and
 * view order for visual search and screen-reader accessibility.
 */
export function buildProductImageAlt({
  altText,
  productName,
  fabric,
  color,
  pattern,
  occasion,
  viewIndex,
}: ProductImageAltInput): string {
  const customAlt = altText?.trim();

  if (customAlt) {
    return customAlt;
  }

  const attributes = [color, fabric, pattern]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .map((part) => part.toLowerCase());

  const uniqueAttributes = [...new Set(attributes)];
  const attributeSuffix =
    uniqueAttributes.length > 0 ? ` in ${uniqueAttributes.join(", ")}` : "";

  const occasionText = occasion?.trim()
    ? ` for ${occasion.trim().toLowerCase()}`
    : "";

  const viewSuffix =
    typeof viewIndex === "number" && viewIndex > 0
      ? ` — view ${viewIndex + 1}`
      : "";

  const composed = `${productName.trim()}${attributeSuffix}${occasionText}${viewSuffix}`;

  if (composed.length <= 200) {
    return composed;
  }

  const sliced = composed.slice(0, 199);
  const boundary = sliced.lastIndexOf(" ");

  return `${(boundary >= 120 ? sliced.slice(0, boundary) : sliced).trimEnd()}…`;
}

/**
 * Generates an SEO-friendly, path-safe filename combining the product slug and
 * a short random suffix so uploaded asset URLs contain descriptive keywords.
 */
export function buildProductImageFilename({
  productSlug,
  randomSuffix,
  extension,
}: ProductImageFilenameInput): string {
  const normalizedSlug = productSlug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
    .replace(/-$/g, "");

  const safeSlug = normalizedSlug || "product-image";

  const safeSuffix =
    randomSuffix
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 12) || "asset";

  const safeExtension = extension
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (!safeExtension) {
    throw new Error("Image extension is required.");
  }

  return `${safeSlug}-${safeSuffix}.${safeExtension}`;
}
