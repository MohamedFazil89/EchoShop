import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  clearRemoteCart,
  fetchCart,
  mergeCart,
  removeCartItem,
  addCartItem,
  updateCartItem,
} from "../services/cartService";
import { calculateTotals } from "../utils/calculateCart";
import { canPurchaseStock, isStockKnown } from "../utils/stockAvailability";
import { useToast } from "./ToastContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const itemsRef = useRef(items);
  const activeUserId = useRef(null);
  const { user, isLoading: isAuthLoading } = useAuth();
  const userId = user?.id;
  const { showToast } = useToast();

  const setCartItems = (nextItems) => {
    itemsRef.current = nextItems;
    setItems(nextItems);
  };

  const markInventoryUnknown = () => {
    setCartItems(itemsRef.current.map((item) => ({ ...item, stock: undefined })));
  };

  const openMiniCart = () => setIsMiniCartOpen(true);
  const closeMiniCart = () => setIsMiniCartOpen(false);

  useEffect(() => {
    if (isAuthLoading) return undefined;
    let cancelled = false;

    if (!userId) {
      if (activeUserId.current) {
        setCartItems([]);
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
    fetchCart()
      .then(async (remoteItems) => {
        if (cancelled) return;
        if (guestItems.length === 0) {
          setCartItems(remoteItems);
          return;
        }

        try {
          const savedItems = await mergeCart(guestItems);
          if (!cancelled) setCartItems(savedItems);
        } catch (error) {
          if (!cancelled) {
            setCartItems(guestItems.map((item) => ({ ...item, stock: undefined })));
            setLoadError(error.message);
            showToast(error.message, { type: "error" });
          }
        }
      })
      .catch((error) => {
        if (!cancelled) {
          markInventoryUnknown();
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

  const addItem = async (product, quantity = 1) => {
    const currentItems = itemsRef.current;
    const existing = currentItems.find((item) => item.id === product.id);
    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    if (!canPurchaseStock(product.stock)) {
      showToast(
        isStockKnown(product.stock)
          ? "This product is out of stock."
          : "Availability could not be confirmed.",
        { type: "error" }
      );
      return;
    }
    if (nextQuantity > product.stock) {
      showToast("Requested quantity exceeds available stock.", { type: "error" });
      return;
    }
    if (user) {
      try {
        setCartItems(await addCartItem(product.id, quantity));
      } catch (error) {
        markInventoryUnknown();
        showToast(error.message, { type: "error" });
        return;
      }
    } else {
      const nextItems = existing
        ? currentItems.map((item) =>
            item.id === product.id ? { ...item, quantity: nextQuantity } : item
          )
        : [...currentItems, { ...product, quantity }];
      setCartItems(nextItems);
    }
    showToast(`${product.title} added to cart`, { type: "success" });
    openMiniCart();
  };

  const removeItem = async (id, title) => {
    if (user) {
      try {
        await removeCartItem(id);
      } catch (error) {
        showToast(error.message, { type: "error" });
        return;
      }
    }
    setCartItems(itemsRef.current.filter((item) => item.id !== id));
    if (title) showToast(`${title} removed from cart`, { type: "info" });
  };

  const updateQuantity = async (id, quantity) => {
    if (user) {
      try {
        setCartItems(await updateCartItem(id, quantity));
      } catch (error) {
        markInventoryUnknown();
        showToast(error.message, { type: "error" });
      }
      return;
    }
    setCartItems(
      itemsRef.current.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.min(
                Math.max(1, quantity),
                isStockKnown(item.stock) ? Math.max(1, item.stock) : item.quantity
              ),
            }
          : item
      )
    );
  };

  const clearCart = async (syncRemote = true) => {
    if (user && syncRemote) {
      try {
        await clearRemoteCart();
      } catch (error) {
        showToast(error.message, { type: "error" });
        return;
      }
    }
    setCartItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totals = useMemo(() => calculateTotals(items), [items]);
  const value = {
    items,
    isMiniCartOpen,
    isLoading,
    loadError,
    itemCount,
    totals,
    addItem,
    openMiniCart,
    closeMiniCart,
    removeItem,
    updateQuantity,
    clearCart,
    markInventoryUnknown,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
