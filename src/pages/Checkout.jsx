import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";
import { useCart } from "../hooks/useCart";
import { formatCurrency } from "../utils/formatCurrency";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import { placeOrder as createOrder } from "../services/orderService";
import { PaymentSection } from "../components/Payment/PaymentSection";
import { Spinner } from "../components/ui/Spinner";
import { handleProductImageError } from "../utils/productImage";
import AvailabilityLabel from "../components/product/AvailabilityLabel";
import { canPurchaseStock } from "../utils/stockAvailability";

const initialForm = {
  email: "",
  fullName: "",
  address: "",
  city: "",
  postalCode: "",
  state: "",
};

export default function Checkout() {
  const {
    items,
    totals,
    isLoading: isCartLoading,
    loadError: cartError,
    clearCart,
    markInventoryUnknown,
  } = useCart();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [form, setForm] = useState(() => {
    return {
      ...initialForm,
      email: user?.email ?? "",
      fullName: user?.name ?? "",
      address: user?.shippingAddress?.street ?? "",
      city: user?.shippingAddress?.city ?? "",
      state: user?.shippingAddress?.state ?? "",
      postalCode: user?.shippingAddress?.pincode ?? "",
    };
  });
  const [orderAttemptId] = useState(() => crypto.randomUUID());
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [paymentError, setPaymentError] = useState(null);
  const paymentValidationRef = useRef(null);
  const submissionLock = useRef(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      email: current.email || user.email,
      fullName: current.fullName || user.name,
      address: current.address || user.shippingAddress?.street || "",
      city: current.city || user.shippingAddress?.city || "",
      state: current.state || user.shippingAddress?.state || "",
      postalCode: current.postalCode || user.shippingAddress?.pincode || "",
    }));
  }, [user]);

  const update = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));

  const handleCheckoutSubmit = async (event) => {
    event.preventDefault();
    if (submissionLock.current || isPlacingOrder) return;

    if (!items.every((item) => canPurchaseStock(item.stock) && item.quantity <= item.stock)) {
      setPaymentError("Remove unavailable items or adjust quantities before checkout.");
      return;
    }
    if (!paymentValidationRef.current?.()) return;
    if (!event.currentTarget.reportValidity()) return;

    submissionLock.current = true;
    setPaymentError(null);
    setIsPlacingOrder(true);
    try {
      const order = await createOrder({
        items,
        idempotencyKey: orderAttemptId,
        customer: {
          name: form.fullName,
          email: form.email,
          phone: user?.phone ?? "",
          shippingAddress: {
            street: form.address,
            city: form.city,
            state: form.state,
            pincode: form.postalCode,
          },
        },
      });

      setOrderId(order.id);
      setOrderPlaced(true);
      clearCart(false);
      showToast("Demo order placed. No payment was processed.", { type: "info" });
    } catch (err) {
      markInventoryUnknown();
      const message = err.message || "Unable to place your order. Please try again.";
      setPaymentError(message);
      showToast(message, { type: "error" });
    } finally {
      submissionLock.current = false;
      setIsPlacingOrder(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="container-shop py-20">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-moss-100 text-moss-700">
            <CheckCircle2 size={30} />
          </span>
          <h1 className="mt-6 font-display text-3xl text-ink-900">Order confirmed</h1>
          <p className="mt-3 text-sm text-ink-400">
            Thanks{form.fullName ? `, ${form.fullName.split(" ")[0]}` : ""} — a confirmation has
            been recorded for {form.email || "your email"}. This demo did not authorize or process a payment.
          </p>
          <p className="mt-2 text-sm font-semibold text-ink-600">Order {orderId}</p>
          <div className="mt-8 flex gap-3">
            <Link to="/shop" className="btn-primary">Continue shopping</Link>
            <Link to={user ? "/account" : "/shop"} className="btn-secondary">
              {user ? "View orders" : "Browse products"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isCartLoading || isAuthLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Spinner size={28} /></div>;
  }

  if (cartError) {
    return <div role="alert" className="container-shop py-16 text-sm text-clay-600">{cartError}</div>;
  }

  if (items.length === 0) {
    return (
      <div className="container-shop py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Nothing to check out"
          description="Add a few items to your cart before heading to checkout."
          actionLabel="Start shopping"
          actionTo="/shop"
        />
      </div>
    );
  }

  return (
    <div className="container-shop py-10">
      <h1 className="font-display text-3xl text-ink-900 sm:text-4xl">Checkout</h1>

      <form noValidate onSubmit={handleCheckoutSubmit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section>
            <h2 className="eyebrow mb-4">Contact</h2>
            <label className="block">
              <span className="mb-1.5 block text-sm text-ink-600">Email address</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email")(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
              />
            </label>
          </section>

          <section>
            <h2 className="eyebrow mb-4">Shipping address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm text-ink-600">Full name</span>
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => update("fullName")(e.target.value)}
                  className="input-field"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm text-ink-600">Address</span>
                <input
                  required
                  value={form.address}
                  onChange={(e) => update("address")(e.target.value)}
                  className="input-field"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-ink-600">City</span>
                <input required value={form.city} onChange={(e) => update("city")(e.target.value)} className="input-field" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-ink-600">Postal code</span>
                <input
                  required
                  value={form.postalCode}
                  onChange={(e) => update("postalCode")(e.target.value)}
                  className="input-field"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm text-ink-600">State</span>
                <input required value={form.state} onChange={(e) => update("state")(e.target.value)} className="input-field" />
              </label>
            </div>
          </section>

          <PaymentSection
            validationRef={paymentValidationRef}
            isSubmitting={isPlacingOrder}
            disabled={isPlacingOrder}
          />

          {paymentError && (
            <div
              role="alert"
              className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
            >
              {paymentError}
            </div>
          )}

          <button
            type="submit"
            disabled={isPlacingOrder}
            className="btn-primary w-full sm:w-auto sm:px-12"
          >
            {isPlacingOrder ? (
              <>
                <Spinner size={18} />
                Processing…
              </>
            ) : (
              `Place order — ${formatCurrency(totals.total)}`
            )}
          </button>
        </div>

        <aside className="card-surface h-fit p-6">
          <h2 className="font-display text-lg text-ink-900">Order summary</h2>
          <ul className="mt-5 space-y-4">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-moss-100">
                  <img src={item.image} alt={item.title} loading="lazy" onError={handleProductImageError} className="h-full w-full object-cover" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink-800 text-[10px] font-bold text-cream-50">
                    {item.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink-800">{item.title}</p>
                  <AvailabilityLabel stock={item.stock} className="mt-1 block" />
                </div>
                <span className="text-sm font-medium text-ink-800">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-3 border-t border-ink-800/[0.06] pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-400">Subtotal</dt>
              <dd className="font-medium text-ink-800">{formatCurrency(totals.subtotal)}</dd>
            </div>
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
        </aside>
      </form>
    </div>
  );
}