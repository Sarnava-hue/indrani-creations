"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { formatINR } from "@/lib/utils/currency";
import { useCart } from "@/components/store/cart-provider";

type WishlistProduct = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  pricePaise: number;
  compareAtPricePaise: number | null;
  fabric: string | null;
  color: string | null;
  occasion: string | null;
  pattern: string | null;
  isOneOfOne: boolean;
  isFeatured: boolean;
};

type WishlistItem = {
  wishlistId: number;
  createdAt: string;
  product: WishlistProduct;
};

export default function WishlistPage() {
  const router = useRouter();
  const { addItem } = useCart();

  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [removingId, setRemovingId] = useState<number | null>(null);

  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadWishlist() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/account/wishlist", {
          credentials: "include",
          cache: "no-store",
        });

        const data: unknown = await response.json();

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load your wishlist.");
        }

        if (
          typeof data !== "object" ||
          data === null ||
          !("wishlist" in data) ||
          !Array.isArray(data.wishlist)
        ) {
          throw new Error("Invalid wishlist response.");
        }

        if (!cancelled) {
          setWishlist(data.wishlist as WishlistItem[]);
        }
      } catch (err) {
        console.error("Failed to load wishlist:", err);

        if (!cancelled) {
          setError("Unable to load your wishlist right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadWishlist();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function removeFromWishlist(productId: number) {
    if (removingId !== null) {
      return;
    }

    try {
      setRemovingId(productId);
      setError("");

      const response = await fetch("/api/account/wishlist", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          productId,
        }),
      });

      const data: unknown = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Unable to remove this item.";

        throw new Error(message);
      }

      setWishlist((current) =>
        current.filter((item) => item.product.id !== productId),
      );
    } catch (err) {
      console.error("Failed to remove wishlist item:", err);

      setError(
        err instanceof Error ? err.message : "Unable to remove this item.",
      );
    } finally {
      setRemovingId(null);
    }
  }

  function addToBag(item: WishlistItem) {
    if (addingId !== null) {
      return;
    }

    try {
      setAddingId(item.product.id);

      addItem({
        productId: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        sku: item.product.sku,
        pricePaise: item.product.pricePaise,
        quantity: 1,
        maxQuantity: item.product.isOneOfOne ? 1 : 99,
        isOneOfOne: item.product.isOneOfOne,
      });
    } finally {
      setTimeout(() => {
        setAddingId(null);
      }, 500);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f3ed] px-5 py-10 text-[#1d1a17] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <Link
            href="/account"
            className="text-sm text-[#756d65] transition hover:text-[#1d1a17]"
          >
            ← Back to account
          </Link>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.25em] text-[#8b5e3c]">
              Account
            </p>

            <h1 className="mt-2 font-serif text-4xl sm:text-5xl">
              Your wishlist
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#756d65]">
              Pieces you have saved for later.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-[#ded7ce] bg-white p-10 text-center text-sm text-[#756d65]">
            Loading your wishlist...
          </div>
        ) : wishlist.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-[#cfc6bc] bg-white px-6 py-20 text-center">
            <p className="font-serif text-3xl">Your wishlist is empty.</p>

            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#756d65]">
              Save pieces you love and come back to them whenever you are ready.
            </p>

            <Link
              href="/shop"
              className="mt-7 inline-flex rounded-full bg-[#1d1a17] px-7 py-3.5 text-sm font-medium text-white transition hover:bg-[#332d28]"
            >
              Explore the collection
            </Link>
          </section>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {wishlist.map((item) => {
              const product = item.product;

              const hasDiscount =
                product.compareAtPricePaise !== null &&
                product.compareAtPricePaise > product.pricePaise;

              const adding = addingId === product.id;

              const removing = removingId === product.id;

              return (
                <article
                  key={item.wishlistId}
                  className="overflow-hidden rounded-3xl border border-[#ded7ce] bg-white shadow-sm"
                >
                  <Link href={`/products/${product.slug}`} className="block">
                    <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-[#e8dfd4] via-[#d8cabc] to-[#b9a898]">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-serif text-lg text-[#756d65]/50">
                          Indrani Creations
                        </span>
                      </div>

                      {product.isOneOfOne && (
                        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-[#5d5148]">
                          One of one
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link
                          href={`/products/${product.slug}`}
                          className="font-serif text-xl transition hover:text-[#8b5e3c]"
                        >
                          {product.name}
                        </Link>

                        {product.shortDescription && (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#756d65]">
                            {product.shortDescription}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => void removeFromWishlist(product.id)}
                        disabled={removing}
                        aria-label={`Remove ${product.name} from wishlist`}
                        className="shrink-0 text-lg text-[#8b5e3c] transition hover:text-[#1d1a17] disabled:opacity-50"
                      >
                        {removing ? "…" : "♥"}
                      </button>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-base font-medium">
                        {formatINR(product.pricePaise)}
                      </span>

                      {hasDiscount && (
                        <span className="text-sm text-[#9a9289] line-through">
                          {formatINR(product.compareAtPricePaise!)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => addToBag(item)}
                      disabled={adding}
                      className="mt-5 w-full rounded-full bg-[#1d1a17] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#332d28] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {adding ? "Added to bag" : "Add to bag"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
