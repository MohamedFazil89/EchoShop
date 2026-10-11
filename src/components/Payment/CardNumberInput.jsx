import { useState, useCallback, useEffect } from "react";
import {
  detectCardBrand,
  formatCardNumber,
  sanitizeDigits,
  getMaxLengthForBrand,
  validateCardNumber,
  getCardNumberError,
} from "../../utils/payment";
import { CardBrandIcon } from "./CardBrandIcon";

/**
 * Card number input with:
 * - Digits only, auto-format in groups of 4 (Amex 4-6-5)
 * - Max 19 digits, strip spaces/dashes/non-digits on paste and autofill
 * - inputmode="numeric", autocomplete="cc-number", autocorrect="off", spellcheck="false"
 * - Brand detection from BIN prefix with icon
 * - Luhn + length validation on blur/submit
 * - Inline error messages, red border, aria-invalid, aria-describedby
 */
export function CardNumberInput({
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  id = "card-number",
  label = "Card number",
  placeholder = "4242 4242 4242 4242",
  required = true,
}) {
  const [touched, setTouched] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);
  const [brand, setBrand] = useState("unknown");
  const [showIcon, setShowIcon] = useState(false);

  const errorId = `${id}-error`;

  // Keep displayValue in sync with value prop (e.g., on reset or external change)
  useEffect(() => {
    setDisplayValue(value);
    if (value) {
      const detected = detectCardBrand(value);
      setBrand(detected);
      setShowIcon(!!value.trim());
    }
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

      // Detect brand from sanitized digits
      const detectedBrand = detectCardBrand(sanitized);
      setBrand(detectedBrand);
      setShowIcon(sanitized.length > 0);

      // Format according to brand
      const formatted = formatCardNumber(sanitized);

      // Update display and call onChange with formatted value
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
      const detectedBrand = detectCardBrand(sanitized);
      setBrand(detectedBrand);
      setShowIcon(sanitized.length > 0);

      const formatted = formatCardNumber(sanitized);
      setDisplayValue(formatted);
      if (onChange) onChange(formatted);
    },
    [onChange]
  );

  // Compute error state: show error only if touched and invalid
  // Also show if explicit error prop is passed (for submit-time validation)
  const hasError = error || (touched && getCardNumberError(displayValue, brand));
  const errorMessage = error || (touched ? getCardNumberError(displayValue, brand) : null);

  // Determine max length for this brand (for accessibility/indicator)
  const maxLength = getMaxLengthForBrand(brand);

  return (
    <div className="relative">
      <label htmlFor={id} className="block">
        <span className="mb-1.5 block text-sm text-ink-600">{label}</span>
        <div className="relative">
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
            autoComplete="cc-number"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={hasError ? "true" : "false"}
            aria-describedby={errorMessage ? errorId : undefined}
            className={`input-field pr-10 ${hasError ? "border-red-500 focus:border-red-500" : ""}`}
            maxLength={maxLength + Math.floor(maxLength / 4)} // Account for spaces in formatted value
          />
          {showIcon && (
            <div
              className="absolute inset-y-0 right-3 flex items-center pointer-events-none"
              aria-hidden="true"
            >
              <CardBrandIcon brand={brand} />
            </div>
          )}
        </div>
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