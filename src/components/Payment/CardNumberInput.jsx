import React, { useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
  detectCardBrand,
  formatCardNumber,
  getCardNumberError,
  getMaxLengthForCardNumber,
} from "../../utils/payment";
import { CardBrandIcon } from "./CardBrandIcon";

/**
 * Card number input with:
 * - Accepts digits only and auto-formats in groups (Amex 4-6-5)
 * - Limits input to the maximum length for its detected card network
 * - Uses a numeric keyboard and card-number autocomplete
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
  placeholder = "Card number",
  required = true,
}) {
  const [touched, setTouched] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);
  const [caretRevision, setCaretRevision] = useState(0);
  const inputRef = useRef(null);
  const pendingCaret = useRef(null);
  const [brand, setBrand] = useState("unknown");
  const [showIcon, setShowIcon] = useState(false);

  const errorId = `${id}-error`;
  const maxDigits = getMaxLengthForCardNumber(displayValue);
  const detectedBrand = detectCardBrand(displayValue);
  const maxCharacters = maxDigits +
    (detectedBrand === "amex" ? 2 : Math.floor((maxDigits - 1) / 4));

  // Keep displayValue in sync with value prop (e.g., on reset or external change)
  useEffect(() => {
    setDisplayValue(value);
    setBrand(detectCardBrand(value));
    setShowIcon(!!value.trim());
  }, [value]);

  useLayoutEffect(() => {
    if (pendingCaret.current === null) return;
    inputRef.current?.setSelectionRange(pendingCaret.current, pendingCaret.current);
    pendingCaret.current = null;
  }, [displayValue, caretRevision]);

  const updateValue = useCallback((rawValue, rawCaret, allowTruncate = false) => {
    const digits = rawValue.replace(/\D/g, "");
    const currentDigitCount = displayValue.replace(/\D/g, "").length;
    const maxLength = getMaxLengthForCardNumber(digits);
    if (!allowTruncate && currentDigitCount >= maxLength && digits.length > maxLength) return;

    const digitsBeforeCaret = rawValue.slice(0, rawCaret).replace(/\D/g, "").length;
    const acceptedDigits = digits.slice(0, maxLength);
    const formatted = formatCardNumber(acceptedDigits);
    const caretPosition = formattedPositionForDigitCount(
      formatted,
      Math.min(digitsBeforeCaret, acceptedDigits.length)
    );

    pendingCaret.current = caretPosition;
    setCaretRevision((revision) => revision + 1);
    setBrand(detectCardBrand(formatted));
    setShowIcon(formatted.trim().length > 0);
    setDisplayValue(formatted);
    if (onChange) onChange(formatted);
  }, [displayValue, onChange]);

  // Handle blur - triggers validation
  const handleBlur = useCallback(
    (e) => {
      setTouched(true);
      if (onBlur) onBlur(e);
    },
    [onBlur]
  );

  // Preserve malformed input for validation, and restore the caret after formatting.
  const handleChange = useCallback(
    (e) => {
      updateValue(e.target.value, e.target.selectionStart ?? e.target.value.length);
    },
    [updateValue]
  );

  // Replace only the selected text so paste works naturally during editing.
  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData("text");
      const input = e.currentTarget;
      const start = input.selectionStart ?? displayValue.length;
      const end = input.selectionEnd ?? start;
      const nextValue = `${displayValue.slice(0, start)}${pasteData}${displayValue.slice(end)}`;
      updateValue(nextValue, start + pasteData.length, true);
    },
    [displayValue, updateValue]
  );

  const handleKeyDown = useCallback((e) => {
    const input = e.currentTarget;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    if (start !== end) return;

    if (e.key === "Backspace" && start > 1 && input.value[start - 1] === " ") {
      e.preventDefault();
      const digitIndex = start - 2;
      const nextValue = `${input.value.slice(0, digitIndex)}${input.value.slice(digitIndex + 1)}`;
      updateValue(nextValue, digitIndex);
    } else if (e.key === "Delete" && input.value[start] === " ") {
      e.preventDefault();
      const nextValue = `${input.value.slice(0, start)}${input.value.slice(start + 2)}`;
      updateValue(nextValue, start);
    }
  }, [updateValue]);

  // Compute error state: show error only if touched and invalid
  // Also show if explicit error prop is passed (for submit-time validation)
  const hasError = error || (touched && getCardNumberError(displayValue, brand));
  const errorMessage = error || (touched ? getCardNumberError(displayValue, brand) : null);

  return (
    <div className="relative">
      <label htmlFor={id} className="block">
        <span className="mb-1.5 block text-sm text-ink-600">{label}</span>
        <div className="relative">
          <input
            type="text"
            id={id}
            ref={inputRef}
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            required={required}
            placeholder={placeholder}
            inputMode="numeric"
            maxLength={maxCharacters}
            autoComplete="cc-number"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={hasError ? "true" : "false"}
            aria-describedby={errorMessage ? errorId : undefined}
            className={`input-field pr-10 ${hasError ? "border-red-500 focus:border-red-500" : ""}`}
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

function formattedPositionForDigitCount(value, digitCount) {
  if (digitCount === 0) return 0;
  let digitsSeen = 0;
  let position = 0;
  for (; position < value.length; position += 1) {
    if (/\d/.test(value[position])) digitsSeen += 1;
    if (digitsSeen === digitCount) {
      position += 1;
      while (value[position] === " ") position += 1;
      return position;
    }
  }
  return value.length;
}