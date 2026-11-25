"use client";

import Link from "next/link";

import { useCart } from "@/components/store/cart-provider";
import { formatINR } from "@/lib/utils/currency";

export default function CartPage() {
  const {
    items,
    subtotalPaise,
    updateQuantity,
    removeItem,
  } = useCart();

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#f7f4ef]">
        <section className="mx-auto max-w-4xl px-6 py-24 text-center lg:px-8">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            Your bag
          </p>

          <h1 className="mt-5 text-5xl font-light tracking-tight text-neutral-900">
            Your bag is empty.
          </h1>

          <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-neutral-600">
            Discover something beautiful from our
            collection and add it to your bag.
          </p>

          <Link
            href="/shop"
            className="mt-10 inline-flex bg-neutral-900 px-8 py-4 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-neutral-800"
          >
            Explore the collection
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ef]">
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            Your bag
          </p>

          <h1 className="mt-4 text-5xl font-light tracking-tight text-neutral-900">
            {items.length}{" "}
            {items.length === 1
              ? "piece"
              : "pieces"}
          </h1>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
          {/* Items */}

          <div className="divide-y divide-black/10 border-y border-black/10">
            {items.map((item) => (
              <article
                key={item.productId}
                className="flex gap-6 py-8"
              >
                {/* Image */}

                <div className="relative h-40 w-32 shrink-0 overflow-hidden bg-gradient-to-br from-[#e6ded3] via-[#d5c7b7] to-[#b9a998]">
                  {item.imageUrl && (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url("${item.imageUrl}")`,
                      }}
                    />
                  )}
                </div>

                {/* Information */}

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-4">
                    <div>
                      <Link
                        href={`/products/${item.slug}`}
                        className="text-xl font-light text-neutral-900 hover:underline"
                      >
                        {item.name}
                      </Link>

                      <p className="mt-2 text-xs uppercase tracking-[0.15em] text-neutral-500">
                        SKU: {item.sku}
                      </p>
                    </div>

                    <p className="text-sm text-neutral-900">
                      {formatINR(
                        item.pricePaise *
                          item.quantity,
                      )}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-6">
                    {/* Quantity */}

                    <div className="flex items-center border border-black/15 bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.quantity - 1,
                          )
                        }
                        disabled={item.quantity <= 1}
                        className="px-4 py-2 text-lg disabled:opacity-30"
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        −
                      </button>

                      <span className="min-w-10 text-center text-sm">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.quantity + 1,
                          )
                        }
                        disabled={
                          item.quantity >=
                          item.maxQuantity
                        }
                        className="px-4 py-2 text-lg disabled:opacity-30"
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeItem(item.productId)
                      }
                      className="text-xs uppercase tracking-[0.15em] text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Summary */}

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-black/10 bg-white p-8">
              <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                Order summary
              </p>

              <div className="mt-8 space-y-5">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">
                    Subtotal
                  </span>

                  <span>
                    {formatINR(subtotalPaise)}
                  </span>
                </div>

                <div className="flex justify-between border-t border-black/10 pt-5 text-sm">
                  <span className="text-neutral-500">
                    Shipping
                  </span>

                  <span>
                    Calculated at checkout
                  </span>
                </div>

                <div className="flex justify-between border-t border-black/10 pt-5 text-lg">
                  <span>Total</span>

                  <span>
                    {formatINR(subtotalPaise)}
                  </span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="mt-8 flex w-full justify-center bg-neutral-900 px-8 py-5 text-xs uppercase tracking-[0.25em] text-white transition hover:bg-neutral-800"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/shop"
                className="mt-5 flex justify-center text-xs uppercase tracking-[0.15em] text-neutral-500 hover:text-neutral-900"
              >
                Continue shopping
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}