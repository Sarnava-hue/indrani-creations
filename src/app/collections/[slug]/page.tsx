import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { ProductCard } from "@/components/store/product-card";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getCategory(slug: string) {
  const category = await db.orm.public.Category.where({
    slug,
    isActive: true,
  })
    .select(
      "id",
      "name",
      "slug",
      "description",
      "imageUrl",
      "parentId",
      "sortOrder",
    )
    .first();

  if (!category) {
    return null;
  }

  const products = await db.orm.public.Product.where({
    categoryId: category.id,
    isActive: true,
  })
    .select(
      "id",
      "name",
      "slug",
      "sku",
      "shortDescription",
      "pricePaise",
      "compareAtPricePaise",
      "fabric",
      "color",
      "occasion",
      "pattern",
      "isOneOfOne",
      "isFeatured",
    )
    .orderBy((product) => product.createdAt.desc())
    .all();

  const productsWithImages = await Promise.all(
    products.map(async (product) => {
      const images = await db.orm.public.ProductImage.where({
        productId: product.id,
      })
        .select("id", "url", "altText", "sortOrder", "isPrimary")
        .orderBy((image) => image.sortOrder.asc())
        .all();

      const primaryImage =
        images.find((image) => image.isPrimary) ?? images[0] ?? null;

      return {
        ...product,
        primaryImage,
      };
    }),
  );

  return {
    category,
    products: productsWithImages,
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCategory(slug);

  if (!result) {
    return {
      title: "Collection Not Found",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const { category, products } = result;

  const collectionImage =
    category.imageUrl?.trim() || products[0]?.primaryImage?.url;

  const imageUrl = collectionImage
    ? new URL(collectionImage, "https://indranicreations.store").href
    : undefined;

  const description =
    category.description?.trim() ||
    `Explore the ${category.name} collection at Indrani Creations. Discover beautiful sarees for celebrations, special occasions, and everyday elegance. Shop online.`;

  const title = `${category.name} | Shop Online`;

  const canonical = `/collections/${category.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      url: `https://indranicreations.store${canonical}`,
      siteName: "Indrani Creations",
      title: `${title} | Indrani Creations`,
      description,
      locale: "en_IN",
      ...(imageUrl ? { images: [{ url: imageUrl, alt: category.name }] } : {}),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: `${title} | Indrani Creations`,
      description,
      ...(imageUrl ? { images: [{ url: imageUrl, alt: category.name }] } : {}),
    },
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;

  const result = await getCategory(slug);

  if (!result) {
    notFound();
  }

  const { category, products } = result;

  const siteUrl = "https://indranicreations.store";

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: category.name,
        item: `${siteUrl}/collections/${category.slug}`,
      },
    ],
  };

  const breadcrumbJsonLdString = JSON.stringify(breadcrumbJsonLd).replace(
    /</g,
    "\\u003c",
  );

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: breadcrumbJsonLdString,
        }}
      />

      {/* Collection heading */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto max-w-360 px-5 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
          <Link
            href="/shop"
            className="text-xs uppercase tracking-widest text-neutral-400 transition hover:text-black"
          >
            ← Shop all
          </Link>

          <div className="mt-8 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
              Collection
            </p>

            <h1 className="mt-3 text-4xl font-light tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              {category.name}
            </h1>

            {category.description ? (
              <p className="mt-6 max-w-2xl text-sm leading-7 text-neutral-500 sm:text-base">
                {category.description}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Products */}
      <section>
        <div className="mx-auto max-w-360 px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
          <div className="mb-8 flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-neutral-400">
              {products.length} {products.length === 1 ? "piece" : "pieces"}
            </p>
          </div>

          {products.length === 0 ? (
            <div className="border border-neutral-200 p-12 text-center">
              <p className="text-sm text-neutral-500">
                No pieces are currently available in this collection.
              </p>

              <Link
                href="/shop"
                className="mt-6 inline-block bg-black px-5 py-3 text-xs uppercase tracking-widest text-white transition hover:bg-neutral-800"
              >
                Explore all sarees
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
