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
  const category =
    await db.orm.public.Category
      .where({
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

  const products =
    await db.orm.public.Product
      .where({
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
      .orderBy((product) =>
        product.createdAt.desc(),
      )
      .all();

  const productsWithImages =
    await Promise.all(
      products.map(async (product) => {
        const images =
          await db.orm.public.ProductImage
            .where({
              productId: product.id,
            })
            .select(
              "id",
              "url",
              "altText",
              "sortOrder",
              "isPrimary",
            )
            .orderBy((image) =>
              image.sortOrder.asc(),
            )
            .all();

        const primaryImage =
          images.find(
            (image) => image.isPrimary,
          ) ??
          images[0] ??
          null;

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
      title: "Collection not found | Indrani Creations",
    };
  }

  const { category } = result;

  return {
    title: `${category.name} | Indrani Creations`,
    description:
      category.description ??
      `Explore our ${category.name.toLowerCase()} collection at Indrani Creations.`,
    alternates: {
      canonical: `/collections/${category.slug}`,
    },
  };
}

export default async function CollectionPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const result = await getCategory(slug);

  if (!result) {
    notFound();
  }

  const { category, products } = result;

  return (
    <main className="min-h-screen bg-white">
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
              {products.length}{" "}
              {products.length === 1
                ? "piece"
                : "pieces"}
            </p>
          </div>

          {products.length === 0 ? (
            <div className="border border-neutral-200 p-12 text-center">
              <p className="text-sm text-neutral-500">
                No pieces are currently available
                in this collection.
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
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}