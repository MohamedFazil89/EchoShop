import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, CreditCard, Lock, ShoppingBag } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";
import { useCart } from "../hooks/useCart";
import { formatCurrency } from "../utils/formatCurrency";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import { getUser, placeOrder, saveUser } from "../utils/userStorage";
import { PaymentSection } from "../components/Payment/PaymentSection";
import { Spinner } from "../components/ui/Spinner";

const initialForm = {
  email: "",
  fullName: "",
  address: "",
  city: "",
  postalCode: "",
  state: "",
  cardNumber: "",
  expiry: "",
  cvc: "",
};

export default function Checkout() {
  const { items, totals, clearCart } = useCart();
  const { user } = useAuth();
  const [form, setForm] = useState(() => {
    const profile = getUser();
    return {
      ...initialForm,
      email: profile?.email ?? user?.email ?? "",
      fullName: profile?.name ?? user?.name ?? "",
      address: profile?.shippingAddress?.street ?? "",
      city: profile?.shippingAddress?.city ?? "",
      state: profile?.shippingAddress?.state ?? "",
      postalCode: profile?.shippingAddress?.pincode ?? "",
    };
  });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [paymentError, setPaymentError] = useState(null);
  const { showToast } = useToast();

  const update = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));

  const handlePaymentSubmit = async (paymentData) => {
    setPaymentError(null);

    // In production, you would send paymentData to your backend
    // The backend would:
    // 1. Verify the amount in paise matches the expected order total
    // 2. Create a payment intent with the gateway (Razorpay/Stripe)
    // 3. Return client token / publishable key to complete payment
    // 4. Handle 3DS / OTP flow via webhook confirmation

    // For this college demo, we simulate the payment processing
    setIsPlacingOrder(true);
    try {
      // Simulated payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // In production: verify payment status via webhook before confirming order
      // For demo: just proceed

      const profile = saveUser({
        name: form.fullName,
        email: form.email,
        phone: getUser()?.phone ?? "",
        shippingAddress: {
          street: form.address,
          city: form.city,
          state: form.state,
          pincode: form.postalCode,
        },
      });

      // In production: verify payment amount server-side using paymentData.amountInPaise
      // Never trust client-side amount
      const newOrderId = placeOrder(items, profile, totals.total);

      setIsPlacingOrder(false);
      setOrderId(newOrderId);
      setOrderPlaced(true);
      clearCart();
      showToast("Order placed successfully!", { type: "success" });
    } catch (err) {
      setIsPlacingOrder(false);
      // Handle different error types with friendly messages
      let message = "Payment failed. Please try again.";
      if (err.code === "card_declined") message = "Your card was declined. Please try a different card.";
      else if (err.code === "insufficient_funds") message = "Insufficient funds on this card.";
      else if (err.code === "expired_card") message = "This card has expired.";
      else if (err.code === "network_error") message = "Network error. Please check your connection and try again.";
      else if (err.code === "timeout") message = "Payment timed out. Please try again.";
      else if (err.code === "gateway_down") message = "Payment service unavailable. Please try again later.";
      else if (err.code === "auth_cancelled") message = "Authentication was cancelled. Please try again.";

      setPaymentError(message);
      showToast(message, { type: "error" });
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
            been sent to {form.email || "your email"}. You'll get a shipping update once it's on its way.
          </p>
          <p className="mt-2 text-sm font-semibold text-ink-600">Order {orderId}</p>
          <div className="mt-8 flex gap-3">
            <Link to="/shop" className="btn-primary">Continue shopping</Link>
            <Link to="/account" className="btn-secondary">View orders</Link>
          </div>
        </div>
      </div>
    );
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

      <form className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
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
            form={form}
            update={update}
            isSubmitting={isPlacingOrder}
            onSubmit={handlePaymentSubmit}
            totals={totals}
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
            type="button"
            onClick={() => handlePaymentSubmit({})}
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
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink-800 text-[10px] font-bold text-cream-50">
                    {item.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink-800">{item.title}</p>
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