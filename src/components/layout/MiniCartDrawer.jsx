import React, { useEffect, useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "../../hooks/useCart";
import { formatCurrency } from "../../utils/formatCurrency";
import { FALLBACK_PRODUCT_IMAGE, handleProductImageError } from "../../utils/productImage";
import { canPurchaseStock } from "../../utils/stockAvailability";
import AvailabilityLabel from "../product/AvailabilityLabel";

export default function MiniCartDrawer() {
  const {
    items,
    itemCount,
    totals,
    isMiniCartOpen,
    closeMiniCart,
    updateQuantity,
    removeItem,
  } = useCart();
  const closeButtonRef = useRef(null);
  const previousFocus = useRef(null);
  const wasOpen = useRef(false);

  const inventoryValid = items.every((item) =>
    canPurchaseStock(item.stock) && item.quantity <= item.stock
  );

  useLayoutEffect(() => {
    if (isMiniCartOpen) {
      if (!wasOpen.current) previousFocus.current = document.activeElement;
      wasOpen.current = true;
      closeButtonRef.current?.focus();
      return;
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      if (previousFocus.current instanceof HTMLElement) previousFocus.current.focus();
      previousFocus.current = null;
    }
  }, [isMiniCartOpen]);

  useEffect(() => {
    if (!isMiniCartOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMiniCartOpen]);

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMiniCart();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = event.currentTarget.querySelectorAll(
      'button:not(:disabled), a[href]:not([aria-disabled="true"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[80] ${isMiniCartOpen ? "" : "pointer-events-none"}`}
      aria-hidden={!isMiniCartOpen}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close cart"
        onClick={closeMiniCart}
        className={`absolute inset-0 h-full w-full bg-ink-900/40 transition-opacity duration-300 motion-reduce:transition-none ${
          isMiniCartOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="mini-cart-title"
        aria-hidden={!isMiniCartOpen}
        inert={!isMiniCartOpen}
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream-50 text-ink-800 shadow-lift
          transition-transform duration-300 ease-out motion-reduce:transition-none ${
            isMiniCartOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <header className="flex items-center justify-between border-b border-ink-800/[0.08] px-5 py-5 sm:px-7">
          <div>
            <h2 id="mini-cart-title" className="font-display text-2xl text-ink-900">Your Cart</h2>
            <p className="mt-1 text-sm text-ink-400">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeMiniCart}
            aria-label="Close cart drawer"
            className="btn-icon h-10 w-10 text-ink-800"
          >
            <X size={20} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-moss-100 text-moss-700">
              <ShoppingBag size={27} />
            </span>
            <h3 className="mt-5 font-display text-xl text-ink-900">Your cart is taking a break</h3>
            <p className="mt-2 max-w-xs text-sm text-ink-400">
              Find something useful and thoughtfully made for your kitchen.
            </p>
            <Link to="/shop" onClick={closeMiniCart} className="btn-primary mt-6">
              Continue shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-ink-800/[0.08] overflow-y-auto px-5 sm:px-7">
              {items.map((item) => {
                const maxQuantity = canPurchaseStock(item.stock)
                  ? Math.min(99, item.stock)
                  : item.quantity;
                return (
                  <li key={item.id} className="flex gap-4 py-5">
                    <Link
                      to={`/product/${item.slug}`}
                      onClick={closeMiniCart}
                      tabIndex={isMiniCartOpen ? 0 : -1}
                      className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-moss-100"
                      aria-label={`View ${item.title}`}
                    >
                      <img
                        src={item.image || FALLBACK_PRODUCT_IMAGE}
                        alt=""
                        onError={handleProductImageError}
                        className="h-full w-full object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/product/${item.slug}`}
                          onClick={closeMiniCart}
                          tabIndex={isMiniCartOpen ? 0 : -1}
                          className="line-clamp-2 font-display text-base text-ink-900 hover:underline"
                        >
                          {item.title}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id, item.title)}
                          aria-label={`Remove ${item.title} from cart`}
                          className="btn-icon -mr-2 -mt-1 h-8 w-8 shrink-0 text-ink-400 hover:text-clay-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <AvailabilityLabel stock={item.stock} className="mt-1 block" />
                      <p className="mt-1 text-sm font-semibold text-ink-800">
                        {formatCurrency(item.price)}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-full border border-ink-800/15 bg-cream-50">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label={`Decrease ${item.title} quantity`}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-600 hover:bg-moss-100 disabled:opacity-30"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= maxQuantity}
                            aria-label={`Increase ${item.title} quantity`}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-600 hover:bg-moss-100 disabled:opacity-30"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <span className="text-sm font-semibold text-ink-900">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                      {item.quantity > item.stock && (
                        <p role="alert" className="mt-2 text-xs text-clay-600">
                          Reduce the quantity before checkout.
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <footer className="border-t border-ink-800/[0.08] bg-cream-50 px-5 pb-6 pt-5 sm:px-7">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-600">Subtotal</span>
                <span className="font-display text-xl text-ink-900">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-400">
                {itemCount} {itemCount === 1 ? "item" : "items"} · Shipping and any applicable charges are calculated at checkout.
              </p>
              {!inventoryValid && (
                <p role="alert" className="mt-3 text-sm text-clay-600">
                  Confirm availability and quantities before checkout.
                </p>
              )}
              {inventoryValid ? (
                <Link
                  to="/checkout"
                  onClick={closeMiniCart}
                  className="btn-primary mt-5 w-full"
                >
                  Proceed to Checkout
                </Link>
              ) : (
                <button type="button" disabled className="btn-primary mt-5 w-full">
                  Proceed to Checkout
                </button>
              )}
              <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                <Link to="/cart" onClick={closeMiniCart} className="link-underline text-ink-600">
                  View Cart
                </Link>
                <button type="button" onClick={closeMiniCart} className="link-underline text-ink-600">
                  Continue Shopping
                </button>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
