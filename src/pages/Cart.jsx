import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Tag, Trash2 } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";
import QuantityInput from "../components/ui/QuantityInput";
import { useCart } from "../hooks/useCart";
import { formatCurrency } from "../utils/formatCurrency";
import { FREE_SHIPPING_THRESHOLD } from "../utils/calculateCart";
import { useToast } from "../hooks/useToast";

export default function Cart() {
  const { items, totals, updateQuantity, removeItem, clearCart } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const { showToast } = useToast();

  if (items.length === 0) {
    return (
      <div className="container-shop py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet — let's fix that."
          actionLabel="Start shopping"
          actionTo="/shop"
        />
      </div>
    );
  }

  const remainingForFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - totals.subtotal, 0);

  const handlePromo = (e) => {
    e.preventDefault();
    showToast("That code isn't valid — try WELCOME10 at checkout.", { type: "info" });
    setPromoCode("");
  };

  return (
    <div className="container-shop py-10">
      <h1 className="font-display text-3xl text-ink-900 sm:text-4xl">Your cart</h1>
      <p className="mt-1 text-sm text-ink-400">{items.length} item{items.length > 1 ? "s" : ""}</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <ul className="divide-y divide-ink-800/[0.06] border-y border-ink-800/[0.06]">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4 py-6">
                <Link to={`/product/${item.slug}`} className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-moss-100">
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                </Link>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to={`/product/${item.slug}`} className="font-display text-base text-ink-900 hover:underline">
                        {item.title}
                      </Link>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-ink-800">
                          {formatCurrency(item.price)}
                        </span>
                        {item.compareAtPrice && (
                          <span className="text-xs text-ink-400 line-through">
                            {formatCurrency(item.compareAtPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id, item.title)}
                      aria-label={`Remove ${item.title} from cart`}
                      className="btn-icon h-8 w-8 text-ink-400 hover:text-clay-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <QuantityInput
                      size="sm"
                      value={item.quantity}
                      onChange={(q) => updateQuantity(item.id, q)}
                    />
                    <span className="text-sm font-semibold text-ink-800">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-center justify-between">
            <Link to="/shop" className="link-underline text-sm font-semibold text-moss-700">
              Continue shopping
            </Link>
            <button
              onClick={clearCart}
              className="text-sm font-semibold text-ink-400 hover:text-clay-600"
            >
              Clear cart
            </button>
          </div>
        </div>

        <aside className="card-surface h-fit p-6">
          <h2 className="font-display text-lg text-ink-900">Order summary</h2>

          {remainingForFreeShipping > 0 ? (
            <p className="mt-3 text-xs text-moss-700">
              Add {formatCurrency(remainingForFreeShipping)} more for free shipping
            </p>
          ) : (
            <p className="mt-3 text-xs text-moss-700">You've unlocked free shipping 🎉</p>
          )}

          <form onSubmit={handlePromo} className="mt-5 flex gap-2">
            <div className="relative flex-1">
              <Tag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Promo code"
                className="input-field py-2.5 pl-9 text-sm"
              />
            </div>
            <button type="submit" className="btn-secondary px-4 py-2.5 text-xs">
              Apply
            </button>
          </form>

          <dl className="mt-6 space-y-3 border-t border-ink-800/[0.06] pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-400">Subtotal</dt>
              <dd className="font-medium text-ink-800">{formatCurrency(totals.subtotal)}</dd>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-400">Discount</dt>
                <dd className="font-medium text-clay-600">
                  −{formatCurrency(totals.discount)}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-400">Shipping</dt>
              <dd className="font-medium text-ink-800">
                {totals.shipping === 0 ? "Free" : formatCurrency(totals.shipping)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-ink-800/[0.06] pt-3 text-base">
              <dt className="font-semibold text-ink-900">Total</dt>
              <dd className="font-display text-lg text-ink-900">{formatCurrency(totals.total)}</dd>
            </div>
          </dl>

          <Link to="/checkout" className="btn-primary mt-6 w-full">
            Checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}
