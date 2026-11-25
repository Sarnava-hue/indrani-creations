"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useWishlist } from "@/components/store/wishlist-provider";

type WishlistButtonProps = {
  productId: number;
  productName: string;
};

export function WishlistButton({
  productId,
  productName,
}: WishlistButtonProps) {
  const router = useRouter();
  const {
    authenticated,
    isSaved,
    isPending,
    ensureLoaded,
    toggleWishlist,
  } = useWishlist();

  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  const saved = isSaved(productId);
  const loading = isPending(productId);

  async function handleToggleWishlist() {
    if (loading) {
      return;
    }

    if (authenticated === false) {
      router.push(
        `/login?redirect=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }

    const result = await toggleWishlist(productId);

    if (!result.ok && result.unauthenticated) {
      router.push(
        `/login?redirect=${encodeURIComponent(window.location.pathname)}`,
      );
    }
  }

  const label = saved
    ? `Remove ${productName} from wishlist`
    : `Add ${productName} to wishlist`;

  return (
    <button
      type="button"
      onClick={() => void handleToggleWishlist()}
      disabled={loading}
      aria-label={label}
      aria-pressed={saved}
      className={`!appearance-none !border-0 !bg-transparent !p-0 !shadow-none !outline-none transition ${
        saved ? "text-[#8b5e3c]" : "text-[#756d65] hover:text-[#8b5e3c]"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <span aria-hidden="true" className="block text-xl leading-none">
        {saved ? "♥" : "♡"}
      </span>

      {authenticated === false && (
        <span className="sr-only">Sign in to save this product.</span>
      )}
    </button>
  );
}
