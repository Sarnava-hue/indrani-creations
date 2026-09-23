"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

import type { CartItem } from "@/lib/cart/types";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotalPaise: number;

  addItem: (item: CartItem) => void;
  updateQuantity: (
    productId: number,
    quantity: number,
  ) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
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

  function addItem(item: CartItem) {
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
              quantity: newQuantity,
            }
          : cartItem,
      ),
    );
  }

  function updateQuantity(
    productId: number,
    quantity: number,
  ) {
    const currentItems = getSnapshot();

    saveCart(
      currentItems.map((item) => {
        if (item.productId !== productId) {
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
  }

  function removeItem(productId: number) {
    const currentItems = getSnapshot();

    saveCart(
      currentItems.filter(
        (item) =>
          item.productId !== productId,
      ),
    );
  }

  function clearCart() {
    saveCart([]);
  }

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
          item.pricePaise * item.quantity,
        0,
      ),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotalPaise,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [
      items,
      itemCount,
      subtotalPaise,
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