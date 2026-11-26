import Link from "next/link";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/store/product-card";
import { ShopSort } from "@/components/store/shop-sort";
import { getActiveCategories } from "@/lib/store/categories";
import { attachPrimaryImages } from "@/lib/store/product-queries";
import {
  buildShopMetadata,
  normalizeShopSearchParams,
} from "@/lib/seo/shop-metadata";
import type { Metadata } from "next";

const PAGE_SIZE = 8;

type ShopPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    page?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
  }>;
};

export async function generateMetadata({
  searchParams,
}: ShopPageProps): Promise<Metadata> {
  return buildShopMetadata(await searchParams);
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;

  const {
    query,
    categorySlug,
    sort,
    minPrice,
    maxPrice,
    inStock,
    minPaise,
    maxPaise,
    currentPage,
    hasActiveFilters,
  } = normalizeShopSearchParams(params);

  // ------------------------------------------------------------
  // Categories (reuses request-cached getActiveCategories)
  // ------------------------------------------------------------

  const categories = await getActiveCategories();

  // ------------------------------------------------------------
  // Category filter (includes all descendant categories)
  // ------------------------------------------------------------

  let categoryIds: number[] | undefined;

  if (categorySlug) {
    const selectedCategory = categories.find(
      (category) => category.slug === categorySlug,
    );

    if (!selectedCategory) {
      categoryIds = [];
    } else {
      const descendants = new Set<number>([selectedCategory.id]);

      let foundNew = true;

      while (foundNew) {
        foundNew = false;

        for (const category of categories) {
          if (
            category.parentId !== null &&
            descendants.has(category.parentId) &&
            !descendants.has(category.id)
          ) {
            descendants.add(category.id);
            foundNew = true;
          }
        }
      }

      categoryIds = [...descendants];
    }
  }

  // If an invalid category was requested, show no products.
  if (categorySlug && (!categoryIds || categoryIds.length === 0)) {
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
  // Products (filtered, sorted, and paginated in SQL)
  // ------------------------------------------------------------

  const escapedQuery = query.replace(/[%_\\]/g, (char) => `\\${char}`);
  const searchPattern = query ? `%${escapedQuery}%` : null;

  const baseCountQuery = db.sql.public.product.select("totalCount", (_f, fns) =>
    fns.count(),
  );
  const baseListQuery = db.sql.public.product.select(
    "id",
    "name",
    "slug",
    "sku",
    "categoryId",
    "shortDescription",
    "pricePaise",
    "compareAtPricePaise",
    "fabric",
    "color",
    "occasion",
    "pattern",
    "isOneOfOne",
    "isFeatured",
  );

  type ShopPredicateArgs = Parameters<
    Parameters<typeof baseListQuery.where>[0]
  >;

  function buildShopWhere(
    f: ShopPredicateArgs[0],
    fns: ShopPredicateArgs[1],
  ) {
    const conditions = [fns.eq(f.isActive, true)];

    if (categoryIds && categoryIds.length > 0) {
      conditions.push(fns.in(f.categoryId, categoryIds));
    }

    if (minPaise !== null) {
      conditions.push(fns.gte(f.pricePaise, minPaise));
    }

    if (maxPaise !== null) {
      conditions.push(fns.lte(f.pricePaise, maxPaise));
    }

    if (searchPattern) {
      conditions.push(
        fns.or(
          fns.raw`${f.name} ILIKE ${searchPattern}`.returns({
            codecId: "pg/bool@1",
          }),
          fns.raw`${f.sku} ILIKE ${searchPattern}`.returns({
            codecId: "pg/bool@1",
          }),
          fns.raw`${f.shortDescription} ILIKE ${searchPattern}`.returns({
            codecId: "pg/bool@1",
          }),
          fns.raw`${f.description} ILIKE ${searchPattern}`.returns({
            codecId: "pg/bool@1",
          }),
          fns.raw`${f.fabric} ILIKE ${searchPattern}`.returns({
            codecId: "pg/bool@1",
          }),
          fns.raw`${f.color} ILIKE ${searchPattern}`.returns({
            codecId: "pg/bool@1",
          }),
          fns.raw`${f.occasion} ILIKE ${searchPattern}`.returns({
            codecId: "pg/bool@1",
          }),
          fns.raw`${f.pattern} ILIKE ${searchPattern}`.returns({
            codecId: "pg/bool@1",
          }),
        ),
      );
    }

    if (inStock) {
      conditions.push(
        fns.exists(
          db.sql.public.inventory
            .select("id")
            .where((inv, invFns) =>
              invFns.and(
                invFns.eq(inv.productId, f.id),
                invFns.gt(inv.quantity, inv.reserved),
              ),
            ),
        ),
      );
    }

    return fns.and(...conditions);
  }

  const countRows = await db
    .runtime()
    .query(baseCountQuery.where(buildShopWhere).build());

  const totalProducts = Number(countRows[0]?.totalCount ?? 0);

  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));

  const safePage = Math.min(currentPage, totalPages);

  const startIndex = (safePage - 1) * PAGE_SIZE;

  const filteredListQuery = baseListQuery.where(buildShopWhere);

  const orderedListQuery =
    sort === "price-low"
      ? filteredListQuery
          .orderBy("pricePaise", { direction: "asc" })
          .orderBy((f) => f.createdAt, { direction: "desc" })
          .orderBy("id", { direction: "desc" })
      : sort === "price-high"
        ? filteredListQuery
            .orderBy("pricePaise", { direction: "desc" })
            .orderBy((f) => f.createdAt, { direction: "desc" })
            .orderBy("id", { direction: "desc" })
        : sort === "name"
          ? filteredListQuery
              .orderBy("name", { direction: "asc" })
              .orderBy("id", { direction: "desc" })
          : filteredListQuery
              .orderBy((f) => f.createdAt, { direction: "desc" })
              .orderBy("id", { direction: "desc" });

  const pageRows =
    totalProducts > 0
      ? await db
          .runtime()
          .query(orderedListQuery.limit(PAGE_SIZE).offset(startIndex).build())
      : [];

  const paginatedProducts = await attachPrimaryImages(pageRows);

  // ------------------------------------------------------------
  // Query string helper
  // ------------------------------------------------------------

  function buildCategoryUrl(slug: string) {
    const search = new URLSearchParams();

    if (query) {
      search.set("q", query);
    }

    if (slug) {
      search.set("category", slug);
    }

    if (sort !== "newest") {
      search.set("sort", sort);
    }

    if (minPrice) {
      search.set("minPrice", minPrice);
    }

    if (maxPrice) {
      search.set("maxPrice", maxPrice);
    }

    if (inStock) {
      search.set("inStock", "1");
    }

    const queryString = search.toString();

    return queryString ? `/shop?${queryString}` : "/shop";
  }

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

    if (minPrice) {
      search.set("minPrice", minPrice);
    }

    if (maxPrice) {
      search.set("maxPrice", maxPrice);
    }

    if (inStock) {
      search.set("inStock", "1");
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
            Discover sarees, artisanal bangles, earrings, and necklaces,
            thoughtfully selected for everyday elegance and special moments.
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
                href={buildCategoryUrl("")}
                aria-current={!categorySlug ? "page" : undefined}
                className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.15em] transition ${
                  !categorySlug
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-black/15 text-neutral-700 hover:border-neutral-900"
                }`}
              >
                All pieces
              </Link>

              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={buildCategoryUrl(category.slug)}
                  aria-current={
                    categorySlug === category.slug ? "page" : undefined
                  }
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
              placeholder="Search sarees, jewellery, and more..."
              className="min-w-0 flex-1 border border-black/15 bg-white px-5 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-neutral-900"
            />

            {minPrice && (
              <input type="hidden" name="minPrice" value={minPrice} />
            )}

            {maxPrice && (
              <input type="hidden" name="maxPrice" value={maxPrice} />
            )}

            {inStock && <input type="hidden" name="inStock" value="1" />}

            <button
              type="submit"
              className="border border-neutral-900 bg-neutral-900 px-6 py-3 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-neutral-800"
            >
              Search
            </button>
          </form>
          {/* Price Filters */}
          <form
            action="/shop"
            method="get"
            className="mt-6 flex flex-col gap-4 border-t border-black/10 pt-6 sm:flex-row sm:items-end"
          >
            {query && <input type="hidden" name="q" value={query} />}

            {categorySlug && (
              <input type="hidden" name="category" value={categorySlug} />
            )}

            {sort !== "newest" && (
              <input type="hidden" name="sort" value={sort} />
            )}

            <div>
              <label
                htmlFor="minPrice"
                className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-neutral-500"
              >
                Minimum price (₹)
              </label>
              <input
                id="minPrice"
                type="number"
                name="minPrice"
                min="0"
                step="1"
                defaultValue={minPrice}
                placeholder="0"
                className="w-full border border-black/15 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label
                htmlFor="maxPrice"
                className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-neutral-500"
              >
                Maximum price (₹)
              </label>
              <input
                id="maxPrice"
                type="number"
                name="maxPrice"
                min="0"
                step="1"
                defaultValue={maxPrice}
                placeholder="No limit"
                className="w-full border border-black/15 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900"
              />
            </div>

            <label className="flex items-center gap-3 text-sm text-neutral-700">
              <input
                type="checkbox"
                name="inStock"
                value="1"
                defaultChecked={inStock}
                className="h-4 w-4 accent-neutral-900"
              />
              In stock only
            </label>

            <button
              type="submit"
              className="border border-neutral-900 bg-neutral-900 px-6 py-3 text-xs uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800"
            >
              Apply filters
            </button>

            {hasActiveFilters && (
              <Link
                href="/shop"
                className="px-2 py-3 text-xs uppercase tracking-[0.15em] text-neutral-600 underline underline-offset-4 transition hover:text-neutral-900"
              >
                Clear all
              </Link>
            )}
          </form>
        </div>
      </section>

      {/* ------------------------------------------------------ */}
      {/* Product Grid */}
      {/* ------------------------------------------------------ */}

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        {hasActiveFilters && (
          <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-black/10 pb-6">
            <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              Active filters
            </span>

            {query && (
              <span className="rounded-full border border-black/15 px-4 py-2 text-xs text-neutral-800">
                Search: {query}
              </span>
            )}

            {categorySlug && (
              <span className="rounded-full border border-black/15 px-4 py-2 text-xs text-neutral-800">
                Category:{" "}
                {categories.find((category) => category.slug === categorySlug)
                  ?.name ?? categorySlug}
              </span>
            )}

            {minPrice && (
              <span className="rounded-full border border-black/15 px-4 py-2 text-xs text-neutral-800">
                Min: ₹{minPrice}
              </span>
            )}

            {maxPrice && (
              <span className="rounded-full border border-black/15 px-4 py-2 text-xs text-neutral-800">
                Max: ₹{maxPrice}
              </span>
            )}

            {inStock && (
              <span className="rounded-full border border-black/15 px-4 py-2 text-xs text-neutral-800">
                In stock only
              </span>
            )}

            {sort !== "newest" && (
              <span className="rounded-full border border-black/15 px-4 py-2 text-xs text-neutral-800">
                Sort:{" "}
                {sort === "price-low"
                  ? "Price: low to high"
                  : sort === "price-high"
                    ? "Price: high to low"
                    : sort === "name"
                      ? "Name"
                      : sort}
              </span>
            )}

            <Link
              href="/shop"
              className="ml-auto text-xs uppercase tracking-[0.15em] text-neutral-900 underline underline-offset-4 hover:text-neutral-500"
            >
              Clear all
            </Link>
          </div>
        )}
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
            {paginatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="border border-black/10 bg-white px-6 py-20 text-center">
            <p className="text-2xl font-light text-neutral-900">
              No pieces found.
            </p>

            <p className="mt-3 text-sm text-neutral-500">
              Try another search, choose a different collection, or browse all
              pieces.
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
                rel="prev"
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
                    aria-current={page === safePage ? "page" : undefined}
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
                rel="next"
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
