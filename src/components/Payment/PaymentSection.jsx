import React, { useCallback, useRef, useState } from "react";
import {
  detectCardBrand,
  getCvcLengthForBrand,
  validatePaymentDetails,
} from "../../utils/payment";
import { CardNumberInput } from "./CardNumberInput";
import { CardExpiryInput } from "./CardExpiryInput";
import { CardCvcInput } from "./CardCvcInput";
import { Lock } from "lucide-react";

const fields = ["cardNumber", "expiry", "cvc"];

export function PaymentSection({ validationRef, isSubmitting, disabled = false }) {
  const [values, setValues] = useState({ cardNumber: "", expiry: "", cvc: "" });
  const [errors, setErrors] = useState({ cardNumber: null, expiry: null, cvc: null });
  const [touched, setTouched] = useState({ cardNumber: false, expiry: false, cvc: false });
  const submitted = useRef(false);
  const cardBrand = detectCardBrand(values.cardNumber);

  const validateAll = useCallback(() => {
    submitted.current = true;
    const result = validatePaymentDetails(values);
    setTouched({ cardNumber: true, expiry: true, cvc: true });
    setErrors(result.errors);

    if (!result.valid) {
      const firstInvalidField = fields.find((field) => result.errors[field]);
      const inputIds = {
        cardNumber: "card-number",
        expiry: "card-expiry",
        cvc: "card-cvc",
      };
      document.getElementById(inputIds[firstInvalidField])?.focus();
    }
    return result.valid;
  }, [values]);

  validationRef.current = validateAll;

  const handleChange = useCallback((field, value) => {
    const nextValues = { ...values, [field]: value };
    if (field === "cardNumber") {
      const nextBrand = detectCardBrand(value);
      nextValues.cvc = nextValues.cvc.slice(0, getCvcLengthForBrand(nextBrand));
    }
    const nextErrors = validatePaymentDetails(nextValues).errors;
    setValues(nextValues);
    setErrors((current) =>
      Object.fromEntries(
        fields.map((name) => [
          name,
          touched[name] || submitted.current ? nextErrors[name] : current[name],
        ])
      )
    );
  }, [values, touched]);

  const handleBlur = useCallback((field) => {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors((current) => ({
      ...current,
      [field]: validatePaymentDetails(values).errors[field],
    }));
  }, [values]);

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
          value={values.cardNumber}
          onChange={(value) => handleChange("cardNumber", value)}
          onBlur={() => handleBlur("cardNumber")}
          error={errors.cardNumber}
          disabled={disabled || isSubmitting}
          required
        />
        <CardExpiryInput
          id="card-expiry"
          label="Expiry"
          value={values.expiry}
          onChange={(value) => handleChange("expiry", value)}
          onBlur={() => handleBlur("expiry")}
          error={errors.expiry}
          disabled={disabled || isSubmitting}
          required
        />
        <CardCvcInput
          id="card-cvc"
          label="CVC"
          value={values.cvc}
          onChange={(value) => handleChange("cvc", value)}
          onBlur={() => handleBlur("cvc")}
          error={errors.cvc}
          cardBrand={cardBrand}
          disabled={disabled || isSubmitting}
          required
        />
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-400">
        <Lock size={12} />
        Demo only: card details are checked in this browser and never sent to the server. No payment is authorized or processed.
      </p>
    </section>
  );
}
