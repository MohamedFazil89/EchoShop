import React, { useState, useCallback, useEffect } from "react";
import {
  getCvcError,
  getCvcLengthForBrand,
} from "../../utils/payment";

/**
 * CVC/AVS input with:
 * - Accepts only digits; limits length to 3 (4 for Amex)
 * - inputmode="numeric", autocomplete="cc-csc", autocorrect="off", spellcheck="false"
 * - Brand-aware validation (3 digits for Visa/MC/RuPay, 4 for Amex)
 * - Inline error messages, red border, aria-invalid, aria-describedby
 */
export function CardCvcInput({
  value,
  onChange,
  onBlur,
  error,
  cardBrand = "unknown",
  disabled = false,
  id = "card-cvc",
  label = "CVC",
  placeholder = "123",
  required = true,
}) {
  const [touched, setTouched] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  const errorId = `${id}-error`;
  const cvcLength = getCvcLengthForBrand(cardBrand);

  // Keep displayValue in sync with value prop
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  // Handle blur - triggers validation
  const handleBlur = useCallback(
    (e) => {
      setTouched(true);
      if (onBlur) onBlur(e);
    },
    [onBlur]
  );

  // Handle input changes
  const handleChange = useCallback(
    (e) => {
      const raw = e.target.value.replace(/\D/g, "").slice(0, cvcLength);
      setDisplayValue(raw);
      if (onChange) onChange(raw);
    },
    [cvcLength, onChange]
  );

  // Handle paste - strip non-digits automatically
  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData("text");
      const digits = pasteData.replace(/\D/g, "").slice(0, cvcLength);
      setDisplayValue(digits);
      if (onChange) onChange(digits);
    },
    [cvcLength, onChange]
  );

  // Compute error state
  const hasError = error || (touched && getCvcError(displayValue, cardBrand));
  const errorMessage =
    error || (touched ? getCvcError(displayValue, cardBrand) : null);

  // Update placeholder based on brand
  const actualPlaceholder = placeholder === "123" && cvcLength === 4 ? "1234" : placeholder;

  return (
    <div className="relative">
      <label htmlFor={id} className="block">
        <span className="mb-1.5 block text-sm text-ink-600">{label}</span>
        <input
          type="text"
          id={id}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onPaste={handlePaste}
          disabled={disabled}
          required={required}
          placeholder={actualPlaceholder}
          inputMode="numeric"
          maxLength={cvcLength}
          autoComplete="cc-csc"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={hasError ? "true" : "false"}
          aria-describedby={errorMessage ? errorId : undefined}
          className={`input-field ${hasError ? "border-red-500 focus:border-red-500" : ""}`}
        />
        {errorMessage && (
          <p
            id={errorId}
            role="alert"
            className="mt-1.5 text-sm text-red-600"
            aria-live="polite"
          >
            {errorMessage}
          </p>
        )}
      </label>
    </div>
  );
}