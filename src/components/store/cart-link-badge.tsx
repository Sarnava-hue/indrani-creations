"use client";

import Link from "next/link";

import { useCart } from "@/components/store/cart-provider";

export function CartLinkBadge() {
  const { itemCount } = useCart();

  const ariaLabel =
    itemCount > 0
      ? `Shopping bag (${itemCount} ${itemCount === 1 ? "item" : "items"})`
      : "Shopping bag";

  return (
    <Link
      href="/cart"
      aria-label={ariaLabel}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-xl text-stone-700 transition hover:bg-stone-100 hover:text-black"
    >
      <span aria-hidden="true">♧</span>

      {itemCount > 0 ? (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-stone-900 px-1 text-[10px] font-medium leading-none text-white"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      ) : null}
    </Link>
  );
}
