import Link from "next/link";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/store/product-card";
import { ShopSort } from "@/components/store/shop-sort";

const PAGE_SIZE = 8;

type ShopPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    page?: string;
  }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;

  const query = params.q?.trim() ?? "";
  const categorySlug = params.category?.trim() ?? "";
  const sort = params.sort ?? "newest";

  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  // ------------------------------------------------------------
  // Categories
  // ------------------------------------------------------------

  const categories = await db.orm.public.Category.where({ isActive: true })
    .select("id", "name", "slug")
    .orderBy((category) => category.sortOrder.asc())
    .all();

  // ------------------------------------------------------------
  // Category filter
  // ------------------------------------------------------------

  let categoryId: number | undefined;

  if (categorySlug) {
    const category = await db.orm.public.Category.where({
      slug: categorySlug,
      isActive: true,
    })
      .select("id")
      .first();

    categoryId = category?.id;
  }

  // If an invalid category was requested, show no products.
  if (categorySlug && categoryId === undefined) {
    return (
      <main className="min-h-screen bg-[#f7f4ef]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            Shop
          </p>

          <h1 className="mt-4 text-4xl font-light tracking-tight text-neutral-900 md:text-6xl">
            Collection not found
          </h1>

          <p className="mt-6 max-w-xl text-neutral-600">
            The collection you are looking for does not exist or is no longer
            available.
          </p>

          <Link
            href="/shop"
            className="mt-8 inline-flex border-b border-neutral-900 pb-1 text-sm uppercase tracking-[0.2em]"
          >
            View all collections
          </Link>
        </div>
      </main>
    );
  }

  // ------------------------------------------------------------
  // Products
  // ------------------------------------------------------------

  /*
   * Prisma 8 RC currently installed in this project does not expose
   * `.skip()` correctly on this inferred collection type.
   *
   * We therefore fetch the matching products with a bounded query
   * and perform the small page slice in application memory.
   *
   * We will upgrade this to cursor pagination once the catalog becomes
   * large enough to require it.
   */

  let products;

  if (query) {
    const searchPattern = `%${query}%`;

    if (categoryId !== undefined) {
      products = await db.orm.public.Product.where((product) =>
        product.name.ilike(searchPattern),
      )
        .where({
          isActive: true,
          categoryId,
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
        .limit(200)
        .all();
    } else {
      products = await db.orm.public.Product.where((product) =>
        product.name.ilike(searchPattern),
      )
        .where({
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
        .limit(200)
        .all();
    }
  } else if (categoryId !== undefined) {
    products = await db.orm.public.Product.where({
      isActive: true,
      categoryId,
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
      .limit(200)
      .all();
  } else {
    products = await db.orm.public.Product.where({
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
      .limit(200)
      .all();
  }

  const productsWithImages = await Promise.all(
    products.map(async (product) => {
      const images = await db.orm.public.ProductImage.where({
        productId: product.id,
      })
        .select("url", "altText", "sortOrder", "isPrimary")
        .orderBy((image) => image.sortOrder.asc())
        .all();

      return {
        ...product,
        primaryImage:
          images.find((image) => image.isPrimary) ?? images[0] ?? null,
      };
    }),
  );

  // ------------------------------------------------------------
  // Sorting
  // ------------------------------------------------------------

  const sortedProducts = [...products];

  if (sort === "price-low") {
    sortedProducts.sort((a, b) => a.pricePaise - b.pricePaise);
  }

  if (sort === "price-high") {
    sortedProducts.sort((a, b) => b.pricePaise - a.pricePaise);
  }

  if (sort === "name") {
    sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
  }

  // ------------------------------------------------------------
  // Pagination
  // ------------------------------------------------------------

  const totalProducts = sortedProducts.length;

  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));

  const safePage = Math.min(currentPage, totalPages);

  const startIndex = (safePage - 1) * PAGE_SIZE;

  const paginatedProducts = sortedProducts.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  // ------------------------------------------------------------
  // Query string helper
  // ------------------------------------------------------------

  function buildUrl(page: number) {
    const search = new URLSearchParams();

    if (query) {
      search.set("q", query);
    }

    if (categorySlug) {
      search.set("category", categorySlug);
    }

    if (sort !== "newest") {
      search.set("sort", sort);
    }

    if (page > 1) {
      search.set("page", String(page));
    }

    const queryString = search.toString();

    return queryString ? `/shop?${queryString}` : "/shop";
  }

  return (
    <main className="min-h-screen bg-[#f7f4ef]">
      {/* ------------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------------ */}

      <section className="border-b border-black/10">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            Indrani Creations
          </p>

          <h1 className="mt-5 max-w-4xl text-5xl font-light tracking-tight text-neutral-900 md:text-7xl">
            The collection.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-neutral-600">
            Discover thoughtfully selected sarees, from timeless handlooms to
            statement pieces created for celebrations.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------ */}
      {/* Controls */}
      {/* ------------------------------------------------------ */}

      <section className="border-b border-black/10 bg-[#f7f4ef]">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Categories */}

            <div className="flex flex-wrap gap-3">
              <Link
                href="/shop"
                className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.15em] transition ${
                  !categorySlug
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-black/15 text-neutral-700 hover:border-neutral-900"
                }`}
              >
                All
              </Link>

              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/shop?category=${category.slug}`}
                  className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.15em] transition ${
                    categorySlug === category.slug
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-black/15 text-neutral-700 hover:border-neutral-900"
                  }`}
                >
                  {category.name}
                </Link>
              ))}
            </div>

            {/* Sort */}

            <ShopSort currentSort={sort} />
          </div>

          {/* Search */}

          <form action="/shop" method="get" className="mt-6 flex max-w-xl">
            {categorySlug && (
              <input type="hidden" name="category" value={categorySlug} />
            )}

            {sort !== "newest" && (
              <input type="hidden" name="sort" value={sort} />
            )}

            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search sarees..."
              className="min-w-0 flex-1 border border-black/15 bg-white px-5 py-3 text-sm outline-none transition focus:border-neutral-900"
            />

            <button
              type="submit"
              className="border border-neutral-900 bg-neutral-900 px-6 py-3 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-neutral-800"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* ------------------------------------------------------ */}
      {/* Product Grid */}
      {/* ------------------------------------------------------ */}

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
              {query
                ? `Search results for "${query}"`
                : categorySlug
                  ? categories.find(
                      (category) => category.slug === categorySlug,
                    )?.name
                  : "All pieces"}
            </p>

            <h2 className="mt-3 text-3xl font-light tracking-tight text-neutral-900">
              {totalProducts} {totalProducts === 1 ? "piece" : "pieces"}
            </h2>
          </div>

          {totalProducts > 0 && (
            <p className="hidden text-sm text-neutral-500 sm:block">
              Page {safePage} of {totalPages}
            </p>
          )}
        </div>

        {paginatedProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {productsWithImages.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="border border-black/10 bg-white px-6 py-20 text-center">
            <p className="text-2xl font-light text-neutral-900">
              No sarees found.
            </p>

            <p className="mt-3 text-sm text-neutral-500">
              Try a different search or browse all collections.
            </p>

            <Link
              href="/shop"
              className="mt-8 inline-flex border-b border-neutral-900 pb-1 text-xs uppercase tracking-[0.2em]"
            >
              Browse everything
            </Link>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* Pagination */}
        {/* ---------------------------------------------------- */}

        {totalPages > 1 && (
          <div className="mt-16 flex items-center justify-center gap-3">
            {safePage > 1 && (
              <Link
                href={buildUrl(safePage - 1)}
                className="border border-black/15 px-5 py-3 text-xs uppercase tracking-[0.15em] transition hover:border-neutral-900"
              >
                Previous
              </Link>
            )}

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <Link
                    key={page}
                    href={buildUrl(page)}
                    className={`flex h-10 w-10 items-center justify-center border text-xs ${
                      page === safePage
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-black/15 hover:border-neutral-900"
                    }`}
                  >
                    {page}
                  </Link>
                ),
              )}
            </div>

            {safePage < totalPages && (
              <Link
                href={buildUrl(safePage + 1)}
                className="border border-black/15 px-5 py-3 text-xs uppercase tracking-[0.15em] transition hover:border-neutral-900"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
