"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import type { CartItem } from "@/lib/cart/types";
import { formatINR } from "@/lib/utils/currency";

type LiveCartProduct = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  pricePaise: number;
  isActive: boolean;
  isOneOfOne: boolean;
  availableQuantity: number;
  imageUrl: string | null;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotalPaise: number;
  hasUnavailableItems: boolean;
  syncing: boolean;
  notices: string[];

  addItem: (item: CartItem) => void;
  updateQuantity: (
    productId: number,
    quantity: number,
  ) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  dismissNotices: () => void;
};

const CartContext =
  createContext<CartContextValue | null>(null);

const STORAGE_KEY = "indrani-creations-cart";

const EMPTY_CART: CartItem[] = [];

let cachedItems: CartItem[] = EMPTY_CART;

const listeners = new Set<() => void>();

function readCart(): CartItem[] {
  if (typeof window === "undefined") {
    return EMPTY_CART;
  }

  try {
    const stored =
      window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return EMPTY_CART;
    }

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return EMPTY_CART;
    }

    return parsed as CartItem[];
  } catch (error) {
    console.error(
      "Failed to read cart:",
      error,
    );

    return EMPTY_CART;
  }
}

function getSnapshot(): CartItem[] {
  if (typeof window === "undefined") {
    return EMPTY_CART;
  }

  if (cachedItems === EMPTY_CART) {
    cachedItems = readCart();
  }

  return cachedItems;
}

function getServerSnapshot(): CartItem[] {
  return EMPTY_CART;
}

function subscribe(
  listener: () => void,
): () => void {
  listeners.add(listener);

  function handleStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY) {
      cachedItems = readCart();
      listener();
    }
  }

  window.addEventListener(
    "storage",
    handleStorage,
  );

  return () => {
    listeners.delete(listener);

    window.removeEventListener(
      "storage",
      handleStorage,
    );
  };
}

function saveCart(items: CartItem[]) {
  cachedItems = items;

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items),
    );
  } catch (error) {
    console.error(
      "Failed to save cart:",
      error,
    );
  }

  listeners.forEach((listener) => {
    listener();
  });
}

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const items = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const [syncing, setSyncing] = useState(false);
  const [notices, setNotices] = useState<string[]>([]);

  const addItem = useCallback((item: CartItem) => {
    const currentItems = getSnapshot();

    const existing = currentItems.find(
      (cartItem) =>
        cartItem.productId === item.productId,
    );

    if (!existing) {
      saveCart([
        ...currentItems,
        item,
      ]);

      return;
    }

    const maximum = Math.min(
      existing.maxQuantity,
      item.maxQuantity,
    );

    const newQuantity = Math.min(
      existing.quantity + item.quantity,
      maximum,
    );

    saveCart(
      currentItems.map((cartItem) =>
        cartItem.productId === item.productId
          ? {
              ...cartItem,
              quantity: Math.max(1, newQuantity),
              maxQuantity: item.maxQuantity,
              pricePaise: item.pricePaise,
              name: item.name,
              slug: item.slug,
              sku: item.sku,
              imageUrl: item.imageUrl ?? cartItem.imageUrl,
            }
          : cartItem,
      ),
    );
  }, []);

  const updateQuantity = useCallback((
    productId: number,
    quantity: number,
  ) => {
    const currentItems = getSnapshot();

    saveCart(
      currentItems.map((item) => {
        if (item.productId !== productId || item.maxQuantity <= 0) {
          return item;
        }

        const safeQuantity = Math.max(
          1,
          Math.min(
            quantity,
            item.maxQuantity,
          ),
        );

        return {
          ...item,
          quantity: safeQuantity,
        };
      }),
    );
  }, []);

  const removeItem = useCallback((productId: number) => {
    const currentItems = getSnapshot();

    saveCart(
      currentItems.filter(
        (item) =>
          item.productId !== productId,
      ),
    );
  }, []);

  const clearCart = useCallback(() => {
    saveCart([]);
    setNotices([]);
  }, []);

  const dismissNotices = useCallback(() => {
    setNotices([]);
  }, []);

  const syncCart = useCallback(async () => {
    const currentItems = getSnapshot();

    if (currentItems.length === 0) {
      setNotices([]);
      return;
    }

    try {
      setSyncing(true);

      const response = await fetch("/api/cart/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          productIds: currentItems.map((item) => item.productId),
        }),
      });

      if (!response.ok) {
        return;
      }

      const data: unknown = await response.json();

      if (
        typeof data !== "object" ||
        data === null ||
        !("products" in data) ||
        !Array.isArray(data.products)
      ) {
        return;
      }

      const liveProducts = data.products as LiveCartProduct[];
      const liveMap = new Map(
        liveProducts.map((product) => [product.id, product]),
      );

      let changed = false;
      const nextNotices: string[] = [];

      const nextItems = currentItems.map((item) => {
        const live = liveMap.get(item.productId);

        if (!live || !live.isActive) {
          nextNotices.push(
            `"${item.name}" is no longer available and cannot be purchased.`,
          );

          if (item.maxQuantity !== 0) {
            changed = true;
            return {
              ...item,
              maxQuantity: 0,
            };
          }

          return item;
        }

        const liveMax = live.isOneOfOne
          ? Math.min(1, live.availableQuantity)
          : live.availableQuantity;

        const nextImageUrl = live.imageUrl ?? item.imageUrl;

        if (liveMax <= 0) {
          nextNotices.push(
            `"${live.name}" is currently out of stock.`,
          );

          if (
            item.maxQuantity !== 0 ||
            item.pricePaise !== live.pricePaise ||
            item.name !== live.name ||
            item.slug !== live.slug ||
            item.sku !== live.sku ||
            item.isOneOfOne !== live.isOneOfOne ||
            item.imageUrl !== nextImageUrl
          ) {
            changed = true;
          }

          return {
            ...item,
            name: live.name,
            slug: live.slug,
            sku: live.sku,
            pricePaise: live.pricePaise,
            imageUrl: nextImageUrl,
            isOneOfOne: live.isOneOfOne,
            maxQuantity: 0,
          };
        }

        const nextQuantity = Math.min(item.quantity, liveMax);

        if (live.pricePaise !== item.pricePaise) {
          nextNotices.push(
            `Price for "${live.name}" updated to ${formatINR(live.pricePaise)}.`,
          );
        }

        if (item.quantity > liveMax) {
          nextNotices.push(
            `Quantity for "${live.name}" adjusted to ${liveMax} based on current availability.`,
          );
        }

        if (
          item.name !== live.name ||
          item.slug !== live.slug ||
          item.sku !== live.sku ||
          item.pricePaise !== live.pricePaise ||
          item.imageUrl !== nextImageUrl ||
          item.isOneOfOne !== live.isOneOfOne ||
          item.maxQuantity !== liveMax ||
          item.quantity !== nextQuantity
        ) {
          changed = true;
        }

        return {
          ...item,
          name: live.name,
          slug: live.slug,
          sku: live.sku,
          pricePaise: live.pricePaise,
          imageUrl: nextImageUrl,
          isOneOfOne: live.isOneOfOne,
          maxQuantity: liveMax,
          quantity: nextQuantity,
        };
      });

      if (changed) {
        saveCart(nextItems);
      }

      setNotices(nextNotices);
    } catch (error) {
      console.error("Failed to sync cart:", error);
    } finally {
      setSyncing(false);
    }
  }, []);

  const itemCount = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + item.quantity,
        0,
      ),
    [items],
  );

  const subtotalPaise = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total +
          (item.maxQuantity > 0 ? item.pricePaise * item.quantity : 0),
        0,
      ),
    [items],
  );

  const hasUnavailableItems = useMemo(
    () => items.some((item) => item.maxQuantity <= 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotalPaise,
      hasUnavailableItems,
      syncing,
      notices,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      syncCart,
      dismissNotices,
    }),
    [
      items,
      itemCount,
      subtotalPaise,
      hasUnavailableItems,
      syncing,
      notices,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      syncCart,
      dismissNotices,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider",
    );
  }

  return context;
}