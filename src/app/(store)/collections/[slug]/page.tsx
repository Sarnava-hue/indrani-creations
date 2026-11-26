import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { CollectionLinksStrip } from "@/components/store/collection-links-strip";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
} from "@/lib/seo/structured-data";
import { ProductCard } from "@/components/store/product-card";
import { getActiveCategories } from "@/lib/store/categories";
import { attachPrimaryImages } from "@/lib/store/product-queries";
import { SITE_URL } from "@/lib/config/site";
import {
  buildCollectionHref,
  getCategoryAncestorChain,
  getChildCategories,
  getCrossCollectionLinks,
  getDescendantCategoryIds,
} from "@/lib/seo/category-links";
import {
  buildCollectionDescription,
  buildStorePageMetadata,
} from "@/lib/seo/page-metadata";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const getCategory = cache(async (slug: string) => {
  const [category, activeCategories] = await Promise.all([
    db.orm.public.Category.where({
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
      .first(),

    getActiveCategories(),
  ]);

  if (!category) {
    return null;
  }

  const categoryIds = getDescendantCategoryIds(activeCategories, category.id);

  const products = await db.orm.public.Product.where({
    isActive: true,
  })
    .where((product) => product.categoryId.in(categoryIds))
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

  const productsWithImages = await attachPrimaryImages(products);
  const ancestorChain = getCategoryAncestorChain(activeCategories, category.id);
  const childCategories = getChildCategories(activeCategories, category.id);
  const otherCollections = getCrossCollectionLinks(
    activeCategories,
    category.id,
    6,
  );

  return {
    category,
    products: productsWithImages,
    ancestorChain,
    childCategories,
    otherCollections,
  };
});

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

  const description = buildCollectionDescription(
    category.name,
    category.description,
  );

  return buildStorePageMetadata({
    title: `${category.name} | Shop Online`,
    description,
    canonical: buildCollectionHref(category.slug),
    imageUrl: collectionImage,
    imageAlt: category.name,
  });
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;

  const result = await getCategory(slug);

  if (!result) {
    notFound();
  }

  const {
    category,
    products,
    ancestorChain,
    childCategories,
    otherCollections,
  } = result;
  const introDescription = buildCollectionDescription(
    category.name,
    category.description,
  );

  const breadcrumbChain = ancestorChain.length > 0 ? ancestorChain : [category];

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", url: SITE_URL },
    ...breadcrumbChain.map((item) => ({
      name: item.name,
      url: `${SITE_URL}${buildCollectionHref(item.slug)}`,
    })),
  ]);

  const collectionPageJsonLd = buildCollectionPageJsonLd({
    siteUrl: SITE_URL,
    category,
    description: introDescription,
    products,
  });

  return (
    <main className="min-h-screen bg-white">
      <JsonLdScript data={collectionPageJsonLd} />
      <JsonLdScript data={breadcrumbJsonLd} />

      {/* Collection heading */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto max-w-360 px-5 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-neutral-400"
          >
            <Link href="/" className="transition hover:text-black">
              Home
            </Link>

            <span>/</span>

            <Link href="/shop" className="transition hover:text-black">
              Shop
            </Link>

            {breadcrumbChain.map((item, index) => {
              const isLast = index === breadcrumbChain.length - 1;

              return (
                <span key={item.id} className="inline-flex items-center gap-2">
                  <span>/</span>
                  {isLast ? (
                    <span className="text-neutral-900">{item.name}</span>
                  ) : (
                    <Link
                      href={buildCollectionHref(item.slug)}
                      className="transition hover:text-black"
                    >
                      {item.name}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>

          <div className="mt-8 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
              Collection
            </p>

            <h1 className="mt-3 text-4xl font-light tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              {category.name}
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-neutral-500 sm:text-base">
              {introDescription}
            </p>

            {childCategories.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {childCategories.map((child) => (
                  <Link
                    key={child.id}
                    href={buildCollectionHref(child.slug)}
                    className="rounded-full border border-neutral-200 px-4 py-2 text-xs uppercase tracking-[0.15em] text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            )}
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
                Explore all pieces
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 2}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <CollectionLinksStrip collections={otherCollections} />
    </main>
  );
}
