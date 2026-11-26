import { buildCollectionHref } from "@/lib/seo/category-links";
import {
  buildProductMetaDescription,
  DEFAULT_OG_IMAGE_PATH,
  resolveMetadataImageUrl,
} from "@/lib/seo/page-metadata";

export type BreadcrumbSchemaItem = {
  name: string;
  url: string;
};

type SiteGraphInput = {
  siteUrl: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  sameAs?: readonly string[];
};

type ProductSchemaInput = {
  siteUrl: string;
  product: {
    name: string;
    slug: string;
    sku: string;
    shortDescription?: string | null;
    description?: string | null;
    pricePaise: number;
    fabric?: string | null;
    color?: string | null;
    occasion?: string | null;
    pattern?: string | null;
  };
  images: readonly { url: string }[];
  categoryName?: string | null;
  availableQuantity: number;
};

type CollectionPageSchemaInput = {
  siteUrl: string;
  category: {
    name: string;
    slug: string;
  };
  description: string;
  products: readonly {
    name: string;
    slug: string;
    primaryImage?: { url: string } | null;
  }[];
};

type ArticleSchemaInput = {
  siteUrl: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  publishedAt: string;
  updatedAt: string;
};

/**
 * Serializes JSON-LD safely for embedding inside HTML <script> tags.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Builds the root Schema.org @graph with OnlineStore, WebSite (SearchAction),
 * and MerchantReturnPolicy so product offers can reference the store entity cleanly.
 */
export function buildSiteGraphJsonLd({
  siteUrl,
  contactEmail,
  contactPhone,
  sameAs,
}: SiteGraphInput) {
  const organizationId = `${siteUrl}#organization`;
  const websiteId = `${siteUrl}#website`;
  const returnPolicyId = `${siteUrl}#return-policy`;

  const email = contactEmail?.trim();
  const phone = contactPhone?.trim();
  const sameAsLinks = (sameAs ?? [])
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "OnlineStore",
        "@id": organizationId,
        name: "Indrani Creations",
        url: siteUrl,
        logo: resolveMetadataImageUrl(DEFAULT_OG_IMAGE_PATH),
        ...(sameAsLinks.length > 0 ? { sameAs: sameAsLinks } : {}),
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          url: `${siteUrl}/contact`,
          availableLanguage: ["en-IN", "en"],
          ...(email ? { email } : {}),
          ...(phone ? { telephone: phone } : {}),
        },
        hasMerchantReturnPolicy: {
          "@id": returnPolicyId,
        },
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: "Indrani Creations",
        url: siteUrl,
        inLanguage: "en-IN",
        publisher: {
          "@id": organizationId,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/shop?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "MerchantReturnPolicy",
        "@id": returnPolicyId,
        applicableCountry: "IN",
        returnPolicyCountry: "IN",
        returnPolicyCategory:
          "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 15,
        refundType: "https://schema.org/ExchangeRefund",
        returnMethod: "https://schema.org/ReturnByMail",
        merchantReturnLink: `${siteUrl}/returns`,
      },
    ] as const,
  };
}

/**
 * Builds a Schema.org BreadcrumbList from ordered visible trail items.
 */
export function buildBreadcrumbJsonLd(items: readonly BreadcrumbSchemaItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Builds enriched Schema.org Product + Offer structured data aligned with India
 * shipping (free prepaid dispatch in 2–4 business days) and 15-day exchange policy.
 */
export function buildProductJsonLd({
  siteUrl,
  product,
  images,
  categoryName,
  availableQuantity,
}: ProductSchemaInput) {
  const productUrl = `${siteUrl}/products/${product.slug}`;
  const resolvedImages =
    images.length > 0
      ? images.map((image) => resolveMetadataImageUrl(image.url))
      : [resolveMetadataImageUrl(DEFAULT_OG_IMAGE_PATH)];

  const description =
    product.description?.trim() ||
    product.shortDescription?.trim() ||
    buildProductMetaDescription(product, categoryName);

  const fabric = product.fabric?.trim();
  const color = product.color?.trim();
  const pattern = product.pattern?.trim();

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    sku: product.sku,
    url: productUrl,
    image: resolvedImages,
    brand: {
      "@type": "Brand",
      name: "Indrani Creations",
    },
    ...(categoryName?.trim() ? { category: categoryName.trim() } : {}),
    ...(fabric ? { material: fabric } : {}),
    ...(color ? { color } : {}),
    ...(pattern ? { pattern } : {}),
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "INR",
      price: (product.pricePaise / 100).toFixed(2),
      availability:
        availableQuantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@id": `${siteUrl}#organization`,
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: 0,
          currency: "INR",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 2,
            maxValue: 4,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@id": `${siteUrl}#return-policy`,
      },
    },
  };
}

/**
 * Builds Schema.org CollectionPage + ItemList structured data for category pages.
 */
export function buildCollectionPageJsonLd({
  siteUrl,
  category,
  description,
  products,
}: CollectionPageSchemaInput) {
  const collectionUrl = `${siteUrl}${buildCollectionHref(category.slug)}`;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description,
    url: collectionUrl,
    isPartOf: {
      "@id": `${siteUrl}#website`,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.slice(0, 24).map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}/products/${product.slug}`,
        name: product.name,
        ...(product.primaryImage?.url
          ? { image: resolveMetadataImageUrl(product.primaryImage.url) }
          : {}),
      })),
    },
  };
}

/**
 * Builds Schema.org Article structured data for editorial guides linked back to
 * the root OnlineStore organization node.
 */
export function buildArticleJsonLd({
  siteUrl,
  slug,
  title,
  description,
  imageUrl,
  publishedAt,
  updatedAt,
}: ArticleSchemaInput) {
  const articleUrl = `${siteUrl}/guides/${slug}`;
  const organizationId = `${siteUrl}#organization`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: articleUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    image: [resolveMetadataImageUrl(imageUrl)],
    datePublished: publishedAt,
    dateModified: updatedAt,
    inLanguage: "en-IN",
    author: {
      "@id": organizationId,
    },
    publisher: {
      "@id": organizationId,
    },
  };
}
