import { useState, useCallback, useEffect } from "react";
import { detectCardBrand, getBrandLabel, validateCardNumber, validateExpiry, validateCvc, toPaise } from "../../utils/payment";
import { CardNumberInput } from "./CardNumberInput";
import { CardExpiryInput } from "./CardExpiryInput";
import { CardCvcInput } from "./CardCvcInput";
import { Lock } from "lucide-react";

/**
 * PaymentSection - The complete payment form section.
 *
 * Features:
 * - Hosted-field-style inputs with full validation
 * - Brand detection with icon
 * - Validation on blur and submit
 * - Demo mode notice (when PAYMENT_MODE=demo)
 * - Loading state with spinner, double-click prevention
 * - Idempotency key for order attempts
 * - Proper accessibility: labels, aria-invalid, aria-describedby, role="alert"
 * - Keyboard navigable, mobile-friendly (font-size >= 16px via input-field)
 */
export function PaymentSection({
  form,
  update,
  isSubmitting,
  onSubmit,
  totals,
  disabled = false,
}) {
  // Demo mode flag from env
  const isDemoMode = import.meta.env.VITE_PAYMENT_MODE === "demo";

  // Form state for card fields
  const [cardNumber, setCardNumber] = useState(form.cardNumber || "");
  const [expiry, setExpiry] = useState(form.expiry || "");
  const [cvc, setCvc] = useState(form.cvc || "");

  // Brand detection from card number
  const [cardBrand, setCardBrand] = useState(() => detectCardBrand(cardNumber));
  const [showBrandIcon, setShowBrandIcon] = useState(!!cardNumber.trim());

  // Validation errors (for submit-time)
  const [errors, setErrors] = useState({
    cardNumber: null,
    expiry: null,
    cvc: null,
  });

  // Touched state for blur validation
  const [touched, setTouched] = useState({
    cardNumber: false,
    expiry: false,
    cvc: false,
  });

  // Idempotency key for this order attempt
  const [idempotencyKey] = useState(() => `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);

  // Update brand when card number changes
  useEffect(() => {
    const brand = detectCardBrand(cardNumber);
    setCardBrand(brand);
    setShowBrandIcon(cardNumber.trim().length > 0);
  }, [cardNumber]);

  // Sync form state with parent
  useEffect(() => {
    if (form.cardNumber !== cardNumber) setCardNumber(form.cardNumber || "");
    if (form.expiry !== expiry) setExpiry(form.expiry || "");
    if (form.cvc !== cvc) setCvc(form.cvc || "");
  }, [form]);

  // Validation on blur
  const validateField = useCallback((field) => {
    let error = null;
    switch (field) {
      case "cardNumber":
        error = validateCardNumber(cardNumber, cardBrand).reason;
        break;
      case "expiry":
        error = validateExpiry(expiry).reason;
        break;
      case "cvc":
        error = validateCvc(cvc, cardBrand).reason;
        break;
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, [cardNumber, expiry, cvc, cardBrand]);

  const handleBlur = useCallback((field) => (e) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  }, [validateField]);

  const handleChange = useCallback((field) => (value) => {
    update(field)(value);
    // Clear error as soon as user starts fixing it
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  }, [update, errors]);

  // Full form validation
  const validateAll = useCallback(() => {
    const cardNumberError = validateCardNumber(cardNumber, cardBrand).reason;
    const expiryError = validateExpiry(expiry).reason;
    const cvcError = validateCvc(cvc, cardBrand).reason;

    const newErrors = {
      cardNumber: cardNumberError,
      expiry: expiryError,
      cvc: cvcError,
    };

    setErrors(newErrors);
    setTouched({ cardNumber: true, expiry: true, cvc: true });

    return { cardNumberError, expiryError, cvcError };
  }, [cardNumber, expiry, cvc, cardBrand]);

  // Check if all fields are valid
  const isValid =
    !validateCardNumber(cardNumber, cardBrand).reason &&
    !validateExpiry(expiry).reason &&
    !validateCvc(cvc, cardBrand).reason &&
    cardNumber.trim().length > 0 &&
    expiry.trim().length > 0 &&
    cvc.trim().length > 0;

  // Get the amount in paise for server-side verification
  const amountInPaise = toPaise(totals.total);

  // Handle submit
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (isSubmitting) return; // Double-click prevention
      if (!isValid) {
        const validationErrors = validateAll();
        // Focus first invalid field
        if (validationErrors.cardNumberError) {
          document.getElementById("card-number")?.focus();
        } else if (validationErrors.expiryError) {
          document.getElementById("card-expiry")?.focus();
        } else if (validationErrors.cvcError) {
          document.getElementById("card-cvc")?.focus();
        }
        return;
      }

      // Call parent submit with additional payment data
      onSubmit({
        ...form,
        cardNumber,
        expiry,
        cvc,
        idempotencyKey,
        amountInPaise,
      });
    },
    [isSubmitting, isValid, validateAll, form, cardNumber, expiry, cvc, idempotencyKey, amountInPaise, onSubmit]
  );

  return (
    <section>
      <h2 className="eyebrow mb-4 flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
        Payment
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <CardNumberInput
          id="card-number"
          label="Card number"
          value={cardNumber}
          onChange={handleChange("cardNumber")}
          onBlur={handleBlur("cardNumber")}
          error={errors.cardNumber}
          disabled={disabled || isSubmitting}
          required
        />
        <CardExpiryInput
          id="card-expiry"
          label="Expiry"
          value={expiry}
          onChange={handleChange("expiry")}
          onBlur={handleBlur("expiry")}
          error={errors.expiry}
          disabled={disabled || isSubmitting}
          required
        />
        <CardCvcInput
          id="card-cvc"
          label="CVC"
          value={cvc}
          onChange={handleChange("cvc")}
          onBlur={handleBlur("cvc")}
          error={errors.cvc}
          cardBrand={cardBrand}
          disabled={disabled || isSubmitting}
          required
        />
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-400">
        <Lock size={12} />
        {isDemoMode ? (
          "This is a demo form — no real payment is processed."
        ) : (
          "Secured by payment gateway"
        )}
      </p>
    </section>
  );
}