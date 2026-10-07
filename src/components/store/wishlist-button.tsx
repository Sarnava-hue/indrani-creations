"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type WishlistButtonProps = {
  productId: number;
  productName: string;
};

export function WishlistButton({
  productId,
  productName,
}: WishlistButtonProps) {
  const router = useRouter();

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadWishlistState() {
      try {
        const response = await fetch("/api/account/wishlist", {
          credentials: "include",
          cache: "no-store",
        });

        if (response.status === 401) {
          if (!cancelled) {
            setAuthenticated(false);
          }

          return;
        }

        if (!response.ok) {
          return;
        }

        const data: unknown = await response.json();

        if (
          typeof data !== "object" ||
          data === null ||
          !("wishlist" in data) ||
          !Array.isArray(data.wishlist)
        ) {
          return;
        }

        const exists = data.wishlist.some(
          (item) =>
            typeof item === "object" &&
            item !== null &&
            "product" in item &&
            typeof item.product === "object" &&
            item.product !== null &&
            "id" in item.product &&
            item.product.id === productId,
        );

        if (!cancelled) {
          setAuthenticated(true);
          setSaved(exists);
        }
      } catch (error) {
        console.error("Failed to load wishlist state:", error);
      }
    }

    void loadWishlistState();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function handleToggleWishlist() {
    if (loading) {
      return;
    }

    try {
      setLoading(true);

      const method = saved ? "DELETE" : "POST";

      const response = await fetch("/api/account/wishlist", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          productId,
        }),
      });

      if (response.status === 401) {
        router.push(
          `/login?redirect=${encodeURIComponent(window.location.pathname)}`,
        );

        return;
      }

      const data: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Unable to update your wishlist.";

        throw new Error(message);
      }

      setAuthenticated(true);
      setSaved(!saved);
    } catch (error) {
      console.error("Failed to update wishlist:", error);
    } finally {
      setLoading(false);
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
