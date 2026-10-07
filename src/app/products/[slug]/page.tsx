import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/utils/currency";
import { WishlistButton } from "@/components/store/wishlist-button";
import { AddToBagButton } from "@/components/store/add-to-bag-button";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductCard } from "@/components/store/product-card";
type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getProduct(slug: string) {
  const product = await db.orm.public.Product.where({
    slug,
    isActive: true,
  })
    .select(
      "id",
      "name",
      "slug",
      "sku",
      "shortDescription",
      "description",
      "pricePaise",
      "compareAtPricePaise",
      "fabric",
      "color",
      "occasion",
      "pattern",
      "sareeLength",
      "blouseIncluded",
      "blouseDetails",
      "careInstructions",
      "isOneOfOne",
      "isFeatured",
      "categoryId",
    )
    .first();

  if (!product) {
    return null;
  }

  const images = await db.orm.public.ProductImage.where({
    productId: product.id,
  })
    .select("id", "url", "altText", "sortOrder", "isPrimary")
    .orderBy((image) => image.sortOrder.asc())
    .all();

  const primaryImage =
    images.find((image) => image.isPrimary) ?? images[0] ?? null;

  const inventory = await db.orm.public.Inventory.where({
    productId: product.id,
  })
    .select("quantity", "reserved")
    .first();

  const category = await db.orm.public.Category.where({
    id: product.categoryId,
  })
    .select("name", "slug")
    .first();

  return {
    product,
    images,
    primaryImage,
    inventory,
    category,
  };
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;

  const result = await getProduct(slug);

  if (!result) {
    return {
      title: "Product Not Found | Indrani Creations",
    };
  }

  const { product } = result;

  return {
    title: `${product.name} | Indrani Creations`,
    description:
      product.shortDescription ??
      `Discover ${product.name} from Indrani Creations.`,
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} | Indrani Creations`,
      description:
        product.shortDescription ??
        `Discover ${product.name} from Indrani Creations.`,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const result = await getProduct(slug);

  if (!result) {
    notFound();
  }

  const { product, images, primaryImage, inventory, category } = result;

  const availableQuantity =
    (inventory?.quantity ?? 0) - (inventory?.reserved ?? 0);

  const isAvailable = availableQuantity > 0;

  const isSaree =
    Boolean(product.sareeLength) || Boolean(category?.slug.includes("saree"));

  const relatedCandidates = category
    ? await db.orm.public.Product.where({
        categoryId: product.categoryId,
        isActive: true,
      })
        .select(
          "id",
          "name",
          "slug",
          "pricePaise",
          "compareAtPricePaise",
          "isOneOfOne",
          "isFeatured",
        )
        .all()
    : [];

  const relatedProducts = relatedCandidates
    .filter((item) => item.id !== product.id)
    .slice(0, 4);

  const relatedProductsWithImages = await Promise.all(
    relatedProducts.map(async (item) => {
      const itemImages = await db.orm.public.ProductImage.where({
        productId: item.id,
      })
        .select("url", "altText", "sortOrder", "isPrimary")
        .orderBy((image) => image.sortOrder.asc())
        .all();

      const primaryItemImage =
        itemImages.find((image) => image.isPrimary) ?? itemImages[0] ?? null;

      return {
        ...item,
        primaryImage: primaryItemImage,
      };
    }),
  );

  return (
    <main className="min-h-screen bg-[#f7f4ef]">
      {/* ------------------------------------------------------ */}
      {/* Breadcrumb */}
      {/* ------------------------------------------------------ */}

      <div className="mx-auto max-w-7xl px-6 pt-8 lg:px-8">
        <nav className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-neutral-500">
          <Link href="/" className="transition hover:text-neutral-900">
            Home
          </Link>

          <span>/</span>

          <Link href="/shop" className="transition hover:text-neutral-900">
            Shop
          </Link>

          {category && (
            <>
              <span>/</span>

              <Link
                href={`/shop?category=${category.slug}`}
                className="transition hover:text-neutral-900"
              >
                {category.name}
              </Link>
            </>
          )}

          <span>/</span>

          <span className="max-w-[180px] truncate text-neutral-900">
            {product.name}
          </span>
        </nav>
      </div>

      {/* ------------------------------------------------------ */}
      {/* Product */}
      {/* ------------------------------------------------------ */}

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          {/* -------------------------------------------------- */}
          {/* Gallery */}
          {/* -------------------------------------------------- */}

          <ProductGallery productName={product.name} images={images} />

          {/* -------------------------------------------------- */}
          {/* Product Information */}
          {/* -------------------------------------------------- */}

          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="flex items-start justify-between gap-6">
              <div>
                {category && (
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                    {category.name}
                  </p>
                )}

                <h1 className="mt-4 text-4xl font-light tracking-tight text-neutral-900 md:text-5xl">
                  {product.name}
                </h1>
              </div>

              <WishlistButton
                productId={product.id}
                productName={product.name}
              />
            </div>

            {/* Price */}

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <span className="text-2xl text-neutral-900">
                {formatINR(product.pricePaise)}
              </span>

              {product.compareAtPricePaise &&
                product.compareAtPricePaise > product.pricePaise && (
                  <span className="text-lg text-neutral-400 line-through">
                    {formatINR(product.compareAtPricePaise)}
                  </span>
                )}
            </div>
            
            {/* Availability */}

            <div className="mt-6 flex items-center gap-3">
              <span
                className={`h-2 w-2 rounded-full ${
                  isAvailable ? "bg-neutral-900" : "bg-neutral-400"
                }`}
              />

              <span className="text-sm text-neutral-600">
                {isAvailable
                  ? product.isOneOfOne
                    ? "One-of-one piece — available"
                    : "In stock"
                  : "Currently unavailable"}
              </span>
            </div>

            {/* Short description */}

            {product.shortDescription && (
              <p className="mt-8 text-base leading-7 text-neutral-600">
                {product.shortDescription}
              </p>
            )}

            {/* Add to bag */}

            <div className="mt-10">
              <AddToBagButton
                productId={product.id}
                name={product.name}
                slug={product.slug}
                sku={product.sku}
                pricePaise={product.pricePaise}
                imageUrl={primaryImage?.url}
                maxQuantity={availableQuantity}
                isOneOfOne={product.isOneOfOne}
              />
            </div>

            {/* Product details */}

            <div className="mt-12 border-t border-black/10">
              {/* SKU */}

              <div className="grid grid-cols-2 border-b border-black/10 py-5">
                <span className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                  SKU
                </span>

                <span className="text-sm text-neutral-800">{product.sku}</span>
              </div>

              {/* Fabric / Material */}

              {product.fabric && (
                <div className="grid grid-cols-2 border-b border-black/10 py-5">
                  <span className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                    {isSaree ? "Fabric" : "Material"}
                  </span>

                  <span className="text-sm text-neutral-800">
                    {product.fabric}
                  </span>
                </div>
              )}

              {/* Colour */}

              {product.color && (
                <div className="grid grid-cols-2 border-b border-black/10 py-5">
                  <span className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                    Colour
                  </span>

                  <span className="text-sm text-neutral-800">
                    {product.color}
                  </span>
                </div>
              )}

              {/* Pattern */}

              {product.pattern && (
                <div className="grid grid-cols-2 border-b border-black/10 py-5">
                  <span className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                    Pattern
                  </span>

                  <span className="text-sm text-neutral-800">
                    {product.pattern}
                  </span>
                </div>
              )}

              {/* Occasion */}

              {product.occasion && (
                <div className="grid grid-cols-2 border-b border-black/10 py-5">
                  <span className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                    Occasion
                  </span>

                  <span className="text-sm text-neutral-800">
                    {product.occasion}
                  </span>
                </div>
              )}

              {/* Saree-specific details */}

              {isSaree && (
                <>
                  {product.sareeLength && (
                    <div className="grid grid-cols-2 border-b border-black/10 py-5">
                      <span className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                        Length
                      </span>

                      <span className="text-sm text-neutral-800">
                        {product.sareeLength}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 border-b border-black/10 py-5">
                    <span className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                      Blouse
                    </span>

                    <span className="text-sm text-neutral-800">
                      {product.blouseIncluded
                        ? (product.blouseDetails ?? "Included")
                        : "Not included"}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Description */}

            {product.description && (
              <div className="mt-12">
                <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                  About this piece
                </p>

                <p className="mt-5 text-sm leading-7 text-neutral-600">
                  {product.description}
                </p>
              </div>
            )}

            {/* Care */}

            {product.careInstructions && (
              <div className="mt-10 border-t border-black/10 pt-10">
                <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                  Care
                </p>

                <p className="mt-5 text-sm leading-7 text-neutral-600">
                  {product.careInstructions}
                </p>
              </div>
            )}
          </div>
        </div>
        {relatedProductsWithImages.length > 0 && (
          <div className="mt-24 border-t border-black/10 pt-16">
            <div className="mb-10 flex items-end justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                  You may also like
                </p>

                <h2 className="mt-3 text-3xl font-light tracking-tight text-neutral-900">
                  More from this collection
                </h2>
              </div>

              {category && (
                <Link
                  href={`/shop?category=${category.slug}`}
                  className="shrink-0 border-b border-neutral-400 pb-1 text-xs uppercase tracking-[0.15em] text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
                >
                  View all
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-6">
              {relatedProductsWithImages.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
