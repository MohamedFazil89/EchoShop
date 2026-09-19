import { createContext, useContext } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useToast } from "./ToastContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [items, setItems] = useLocalStorage("ecoshop_wishlist", []);
  const { showToast } = useToast();

  const isWishlisted = (productId) => items.some((i) => i.id === productId);

  const toggleWishlist = (product) => {
    if (isWishlisted(product.id)) {
      setItems((prev) => prev.filter((i) => i.id !== product.id));
      showToast(`${product.title} removed from wishlist`, { type: "info" });
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: product.id,
          slug: product.slug,
          title: product.title,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          image: product.images[0],
          rating: product.rating,
        },
      ]);
      showToast(`${product.title} added to wishlist`, { type: "success" });
    }
  };

  const removeFromWishlist = (productId, title) => {
    setItems((prev) => prev.filter((i) => i.id !== productId));
    if (title) showToast(`${title} removed from wishlist`, { type: "info" });
  };

  const clearWishlist = () => setItems([]);

  const value = {
    items,
    count: items.length,
    isWishlisted,
    toggleWishlist,
    removeFromWishlist,
    clearWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
