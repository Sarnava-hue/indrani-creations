"use client";

import { useState } from "react";

import { useCart } from "@/components/store/cart-provider";

type AddToBagButtonProps = {
  productId: number;
  name: string;
  slug: string;
  sku: string;
  pricePaise: number;
  imageUrl?: string;
  maxQuantity: number;
  isOneOfOne: boolean;
};

export function AddToBagButton({
  productId,
  name,
  slug,
  sku,
  pricePaise,
  imageUrl,
  maxQuantity,
  isOneOfOne,
}: AddToBagButtonProps) {
  const { addItem } = useCart();

  const [added, setAdded] = useState(false);

  const unavailable = maxQuantity <= 0;

  function handleAdd() {
    if (unavailable) {
      return;
    }

    addItem({
      productId,
      name,
      slug,
      sku,
      pricePaise,
      imageUrl,
      quantity: 1,
      maxQuantity,
      isOneOfOne,
    });

    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1800);
  }

  return (
    <button
      type="button"
      disabled={unavailable}
      onClick={handleAdd}
      className="w-full bg-neutral-900 px-8 py-5 text-xs uppercase tracking-[0.25em] text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
    >
      {unavailable
        ? "Sold Out"
        : added
          ? "Added to Bag"
          : "Add to Bag"}
    </button>
  );
}