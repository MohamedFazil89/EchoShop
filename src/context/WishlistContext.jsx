import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  addWishlistItem,
  clearRemoteWishlist,
  fetchWishlist,
  removeWishlistItem,
} from "../services/wishlistService";
import { useToast } from "./ToastContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const itemsRef = useRef(items);
  const activeUserId = useRef(null);
  const { user, isLoading: isAuthLoading } = useAuth();
  const userId = user?.id;
  const { showToast } = useToast();

  const setWishlistItems = (nextItems) => {
    itemsRef.current = nextItems;
    setItems(nextItems);
  };

  useEffect(() => {
    if (isAuthLoading) return undefined;
    let cancelled = false;
    if (!userId) {
      if (activeUserId.current) {
        setWishlistItems([]);
        activeUserId.current = null;
      }
      setLoadError("");
      setIsLoading(false);
      return undefined;
    }

    activeUserId.current = userId;
    setIsLoading(true);
    setLoadError("");
    const guestItems = itemsRef.current;
    fetchWishlist()
      .then(async (remoteItems) => {
        if (guestItems.length === 0) {
          if (!cancelled) setWishlistItems(remoteItems);
          return;
        }
        const existingIds = new Set(remoteItems.map((item) => item.id));
        for (const item of guestItems) {
          if (!existingIds.has(item.id)) await addWishlistItem(item.id);
        }
        const mergedItems = await fetchWishlist();
        if (!cancelled) setWishlistItems(mergedItems);
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error.message);
          showToast(error.message, { type: "error" });
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, userId, showToast]);

  const isWishlisted = (productId) =>
    itemsRef.current.some((item) => item.id === productId);

  const toggleWishlist = async (product) => {
    const wasWishlisted = isWishlisted(product.id);
    if (user) {
      try {
        if (wasWishlisted) {
          await removeWishlistItem(product.id);
        } else {
          await addWishlistItem(product.id);
        }
      } catch (error) {
        showToast(error.message, { type: "error" });
        return;
      }
    }

    setWishlistItems(
      wasWishlisted
        ? itemsRef.current.filter((item) => item.id !== product.id)
        : [...itemsRef.current, {
            ...product,
            image: product.images?.[0] ?? product.image ?? "",
          }]
    );
    showToast(
      `${product.title} ${wasWishlisted ? "removed from" : "added to"} wishlist`,
      { type: wasWishlisted ? "info" : "success" }
    );
  };

  const removeFromWishlist = async (productId, title) => {
    if (user) {
      try {
        await removeWishlistItem(productId);
      } catch (error) {
        showToast(error.message, { type: "error" });
        return;
      }
    }
    setWishlistItems(itemsRef.current.filter((item) => item.id !== productId));
    if (title) showToast(`${title} removed from wishlist`, { type: "info" });
  };

  const clearWishlist = async () => {
    if (user) {
      try {
        await clearRemoteWishlist();
      } catch (error) {
        showToast(error.message, { type: "error" });
        return;
      }
    }
    setWishlistItems([]);
  };

  const value = {
    items,
    isLoading,
    loadError,
    count: items.length,
    isWishlisted,
    toggleWishlist,
    removeFromWishlist,
    clearWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
}
