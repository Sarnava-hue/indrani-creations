"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type ToggleResult =
  | { ok: true; saved: boolean }
  | { ok: false; unauthenticated?: boolean; error?: string };

type WishlistContextValue = {
  authenticated: boolean | null;
  isSaved: (productId: number) => boolean;
  isPending: (productId: number) => boolean;
  ensureLoaded: () => Promise<void>;
  toggleWishlist: (productId: number) => Promise<ToggleResult>;
  syncSavedIds: (productIds: number[]) => void;
  removeSavedId: (productId: number) => void;
  resetWishlist: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

type WishlistProviderProps = {
  children: React.ReactNode;
  initialProductIds?: number[];
  initialAuthenticated?: boolean;
};

export function WishlistProvider({
  children,
  initialProductIds,
  initialAuthenticated,
}: WishlistProviderProps) {
  const [savedIds, setSavedIds] = useState<Set<number>>(
    () => new Set(initialProductIds ?? []),
  );
  const [authenticated, setAuthenticated] = useState<boolean | null>(
    initialAuthenticated ?? null,
  );
  const [pendingIds, setPendingIds] = useState<Set<number>>(() => new Set());

  const hasLoadedRef = useRef(initialProductIds !== undefined);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const pendingToggleIdsRef = useRef<Set<number>>(new Set());

  const ensureLoaded = useCallback(async () => {
    if (hasLoadedRef.current) {
      return;
    }

    if (inFlightRef.current) {
      return inFlightRef.current;
    }

    const request = (async () => {
      try {
        const response = await fetch("/api/wishlist/ids", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data: unknown = await response.json();

        if (
          typeof data !== "object" ||
          data === null ||
          !("authenticated" in data) ||
          typeof data.authenticated !== "boolean" ||
          !("productIds" in data) ||
          !Array.isArray(data.productIds)
        ) {
          return;
        }

        const validIds = data.productIds.filter(
          (id): id is number =>
            typeof id === "number" && Number.isInteger(id) && id > 0,
        );

        hasLoadedRef.current = true;
        setAuthenticated(data.authenticated);
        setSavedIds(new Set(validIds));
      } catch (error) {
        console.error("Failed to load shared wishlist state:", error);
      } finally {
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = request;
    return request;
  }, []);

  const syncSavedIds = useCallback((productIds: number[]) => {
    hasLoadedRef.current = true;
    setAuthenticated(true);
    setSavedIds(new Set(productIds));
  }, []);

  const removeSavedId = useCallback((productId: number) => {
    setSavedIds((current) => {
      if (!current.has(productId)) {
        return current;
      }

      const next = new Set(current);
      next.delete(productId);
      return next;
    });
  }, []);

  const resetWishlist = useCallback(() => {
    hasLoadedRef.current = false;
    inFlightRef.current = null;
    setAuthenticated(false);
    setSavedIds(new Set());
  }, []);

  const toggleWishlist = useCallback(
    async (productId: number): Promise<ToggleResult> => {
      if (pendingToggleIdsRef.current.has(productId)) {
        return { ok: true, saved: savedIds.has(productId) };
      }

      const wasSaved = savedIds.has(productId);
      const method = wasSaved ? "DELETE" : "POST";

      pendingToggleIdsRef.current.add(productId);
      setPendingIds((current) => {
        const next = new Set(current);
        next.add(productId);
        return next;
      });

      try {
        const response = await fetch("/api/account/wishlist", {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ productId }),
        });

        if (response.status === 401) {
          setAuthenticated(false);
          return { ok: false, unauthenticated: true };
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

          return { ok: false, error: message };
        }

        const nextSaved = !wasSaved;

        hasLoadedRef.current = true;
        setAuthenticated(true);
        setSavedIds((current) => {
          const next = new Set(current);
          if (nextSaved) {
            next.add(productId);
          } else {
            next.delete(productId);
          }
          return next;
        });

        return { ok: true, saved: nextSaved };
      } catch (error) {
        console.error("Failed to update wishlist:", error);
        return {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to update your wishlist.",
        };
      } finally {
        pendingToggleIdsRef.current.delete(productId);
        setPendingIds((current) => {
          const next = new Set(current);
          next.delete(productId);
          return next;
        });
      }
    },
    [savedIds],
  );

  const isSaved = useCallback(
    (productId: number) => savedIds.has(productId),
    [savedIds],
  );

  const isPending = useCallback(
    (productId: number) => pendingIds.has(productId),
    [pendingIds],
  );

  const value = useMemo(
    () => ({
      authenticated,
      isSaved,
      isPending,
      ensureLoaded,
      toggleWishlist,
      syncSavedIds,
      removeSavedId,
      resetWishlist,
    }),
    [
      authenticated,
      isSaved,
      isPending,
      ensureLoaded,
      toggleWishlist,
      syncSavedIds,
      removeSavedId,
      resetWishlist,
    ],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }

  return context;
}

export function useOptionalWishlist() {
  return useContext(WishlistContext);
}
