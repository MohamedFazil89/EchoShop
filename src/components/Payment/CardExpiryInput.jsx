import { useState, useCallback, useEffect } from "react";
import {
  formatExpiry,
  sanitizeDigits,
  parseExpiry,
  validateExpiry,
  getExpiryError,
} from "../../utils/payment";

/**
 * Expiry date input with:
 * - Format as "MM / YY", digits only, max 4 digits
 * - Auto-insert the separator after 2 digits
 * - Prefix "0" if first digit is 2-9 (e.g., typing "5" becomes "05 / ")
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
      const raw = e.target.value;
      const sanitized = sanitizeDigits(raw);

      // Format with automatic separator insertion
      const formatted = formatExpiry(sanitized);

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
      const sanitized = sanitizeDigits(pasteData);
      const formatted = formatExpiry(sanitized);
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
          autoComplete="cc-exp"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={hasError ? "true" : "false"}
          aria-describedby={errorMessage ? errorId : undefined}
          className={`input-field ${hasError ? "border-red-500 focus:border-red-500" : ""}`}
          maxLength={7} // "MM / YY" is 5 chars plus 2 spaces for safety
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