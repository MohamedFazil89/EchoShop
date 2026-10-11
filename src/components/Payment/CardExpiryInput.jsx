import React, { useState, useCallback, useEffect } from "react";
import {
  formatExpiry,
  getExpiryError,
} from "../../utils/payment";

/**
 * Expiry date input with:
 * - Format as "MM / YY" or "MM / YYYY"
 * - Auto-insert the separator after 2 digits
 * - inputmode="numeric", autocomplete="cc-exp", autocorrect="off", spellcheck="false"
 * - Validation: month 01-12, not in the past, not more than 20 years ahead
 * - Inline error messages, red border, aria-invalid, aria-describedby
 */
export function CardExpiryInput({
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  id = "card-expiry",
  label = "Expiry",
  placeholder = "MM / YY",
  required = true,
}) {
  const [touched, setTouched] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  const errorId = `${id}-error`;

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
      const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
      const formatted = formatExpiry(digits);

      setDisplayValue(formatted);
      if (onChange) onChange(formatted);
    },
    [onChange]
  );

  // Handle paste - strip non-digits automatically
  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData("text");
      const digits = pasteData.replace(/\D/g, "").slice(0, 6);
      const formatted = formatExpiry(digits);
      setDisplayValue(formatted);
      if (onChange) onChange(formatted);
    },
    [onChange]
  );

  // Compute error state
  const hasError = error || (touched && getExpiryError(displayValue));
  const errorMessage = error || (touched ? getExpiryError(displayValue) : null);

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
          placeholder={placeholder}
          inputMode="numeric"
          maxLength={9}
          autoComplete="cc-exp"
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