import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { calculateTotals } from "../utils/calculateCart";
import { useToast } from "./ToastContext";

const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case "HYDRATE": {
      return action.payload;
    }
    case "ADD_ITEM": {
      const { product, quantity } = action.payload;
      const existing = state.find((i) => i.id === product.id);
      if (existing) {
        return state.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...state,
        {
          id: product.id,
          slug: product.slug,
          title: product.title,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          image: product.images?.[0] ?? product.image ?? "",
          quantity,
        },
      ];
    }
    case "REMOVE_ITEM":
      return state.filter((i) => i.id !== action.payload.id);
    case "UPDATE_QUANTITY":
      return state
        .map((i) =>
          i.id === action.payload.id
            ? { ...i, quantity: Math.max(1, action.payload.quantity) }
            : i
        )
        .filter((i) => i.quantity > 0);
    case "CLEAR_CART":
      return [];
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [persisted, setPersisted] = useLocalStorage("ecoshop_cart", []);
  const [items, dispatch] = useReducer(cartReducer, persisted);
  const { showToast } = useToast();

  // Keep localStorage in sync any time the reducer state changes.
  useEffect(() => setPersisted(items), [items]); // eslint-disable-line react-hooks/exhaustive-deps

  const addItem = (product, quantity = 1) => {
    dispatch({ type: "ADD_ITEM", payload: { product, quantity } });
    showToast(`${product.title} added to cart`, { type: "success" });
  };

  const removeItem = (id, title) => {
    dispatch({ type: "REMOVE_ITEM", payload: { id } });
    if (title) showToast(`${title} removed from cart`, { type: "info" });
  };

  const updateQuantity = (id, quantity) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } });
  };

  const clearCart = () => dispatch({ type: "CLEAR_CART" });

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totals = useMemo(() => calculateTotals(items), [items]);

  const value = {
    items,
    itemCount,
    totals,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
