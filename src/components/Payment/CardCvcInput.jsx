import { useState, useCallback, useEffect } from "react";
import {
  sanitizeDigits,
  validateCvc,
  getCvcError,
  getCvcLengthForBrand,
  detectCardBrand,
} from "../../utils/payment";

/**
 * CVC/AVS input with:
 * - Digits only, max 3 digits (4 for Amex, based on detected brand)
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
      const raw = e.target.value;
      const sanitized = sanitizeDigits(raw);
      const capped = sanitized.slice(0, cvcLength);
      setDisplayValue(capped);
      if (onChange) onChange(capped);
    },
    [onChange, cvcLength]
  );

  // Handle paste - strip non-digits automatically
  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData("text");
      const sanitized = sanitizeDigits(pasteData);
      const capped = sanitized.slice(0, cvcLength);
      setDisplayValue(capped);
      if (onChange) onChange(capped);
    },
    [onChange, cvcLength]
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
          autoComplete="cc-csc"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={hasError ? "true" : "false"}
          aria-describedby={errorMessage ? errorId : undefined}
          className={`input-field ${hasError ? "border-red-500 focus:border-red-500" : ""}`}
          maxLength={cvcLength}
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