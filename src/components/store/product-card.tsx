import Image from "next/image";
import Link from "next/link";

import { formatINR } from "@/lib/utils/currency";
import { WishlistButton } from "@/components/store/wishlist-button";

type ProductCardProps = {
  product: {
    id: number;
    name: string;
    slug: string;
    pricePaise: number;
    compareAtPricePaise: number | null;
    isOneOfOne: boolean;
    primaryImage?: {
      url: string;
      altText: string | null;
    } | null;
  };
};

export function ProductCard({
  product,
}: ProductCardProps) {
  const discountPercentage =
    product.compareAtPricePaise &&
    product.compareAtPricePaise >
      product.pricePaise
      ? Math.round(
          ((product.compareAtPricePaise -
            product.pricePaise) /
            product.compareAtPricePaise) *
            100,
        )
      : null;

  return (
    <article className="group">
      <div className="relative overflow-hidden bg-neutral-100">
        <Link
          href={`/products/${product.slug}`}
          className="block"
        >
          <div className="relative aspect-3/4">
            {product.primaryImage ? (
              <Image
                src={product.primaryImage.url}
                alt={
                  product.primaryImage.altText ??
                  product.name
                }
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-linear-to-br from-neutral-200 via-neutral-100 to-neutral-300">
                <span className="px-6 text-center text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Image coming soon
                </span>
              </div>
            )}
          </div>
        </Link>

        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {product.isOneOfOne ? (
            <span className="bg-white/95 px-2.5 py-1 text-[10px] uppercase tracking-widest text-neutral-800">
              One of one
            </span>
          ) : null}

          {discountPercentage ? (
            <span className="bg-black px-2.5 py-1 text-[10px] uppercase tracking-widest text-white">
              {discountPercentage}% off
            </span>
          ) : null}
        </div>

        <div className="absolute right-3 top-3">
          <div className="bg-white/90 p-2 backdrop-blur-sm">
            <WishlistButton
              productId={product.id}
              productName={product.name}
            />
          </div>
        </div>
      </div>

      <div className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href={`/products/${product.slug}`}
              className="text-sm text-neutral-900 transition hover:text-[#8b5e3c]"
            >
              {product.name}
            </Link>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-sm font-medium text-neutral-900">
              {formatINR(
                product.pricePaise,
              )}
            </p>

            {product.compareAtPricePaise &&
            product.compareAtPricePaise >
              product.pricePaise ? (
              <p className="text-xs text-neutral-400 line-through">
                {formatINR(
                  product.compareAtPricePaise,
                )}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}