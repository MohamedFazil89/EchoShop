/**
 * Payment utilities.
 *
 * NOTE: In this college demo these helpers run fully client-side. No card data is sent
 * anywhere. In a real production build you would mount the gateway's hosted fields
 * (Razorpay / Stripe Elements) so card numbers never enter your own inputs at all,
 * and all amount calculations would be verified server-side.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BRAND = {
  VISA: "visa",
  MASTERCARD: "mastercard",
  AMEX: "amex",
  RUPAY: "rupay",
  UNKNOWN: "unknown",
};

const MAX_CARD_DIGITS = 19;
const YEAR_AHEAD_LIMIT_MONTHS = 20 * 12;

function cardDigits(value) {
  if (typeof value !== "string" || !/^[\d\s-]*$/.test(value)) return null;
  return value.replace(/[\s-]/g, "");
}

const cardLengths = {
  [BRAND.VISA]: [13, 16, 19],
  [BRAND.MASTERCARD]: [16],
  [BRAND.AMEX]: [15],
  [BRAND.RUPAY]: [16],
};

// ---------------------------------------------------------------------------
// Brand detection
// ---------------------------------------------------------------------------

/**
 * Detect the card brand from the raw card number (digits only).
 * Uses supported BIN-prefix rules and returns unknown for all other numbers.
 */
export function detectCardBrand(rawNumber) {
  const digits = cardDigits(rawNumber);
  if (!digits) return BRAND.UNKNOWN;

  if (digits.startsWith("4")) return BRAND.VISA;
  if (digits.startsWith("34") || digits.startsWith("37")) return BRAND.AMEX;
  if (/^5[1-5]/.test(digits)) return BRAND.MASTERCARD;
  if (digits.length >= 4 && Number(digits.slice(0, 4)) >= 2221 && Number(digits.slice(0, 4)) <= 2720) {
    return BRAND.MASTERCARD;
  }
  if (/^(60|62|64|65)/.test(digits)) return BRAND.RUPAY;
  return BRAND.UNKNOWN;
}

/**
 * Get human-readable brand label.
 */
export function getBrandLabel(brand) {
  switch (brand) {
    case BRAND.VISA:
      return "Visa";
    case BRAND.MASTERCARD:
      return "Mastercard";
    case BRAND.AMEX:
      return "American Express";
    case BRAND.RUPAY:
      return "RuPay";
    default:
      return "Card";
  }
}

/**
 * Get the expected CVC length for a brand.
 */
export function getCvcLengthForBrand(brand) {
  if (brand === BRAND.AMEX) return 4;
  return 3;
}

/**
 * Maximum number of digits for a brand (based on known length, capped by global max).
 */
export function getMaxLengthForBrand(brand) {
  return Math.max(...(cardLengths[brand] ?? [MAX_CARD_DIGITS]));
}

export function getMaxLengthForCardNumber(value) {
  const digits = sanitizeDigits(value);
  const brand = detectCardBrand(digits);
  if (brand !== BRAND.UNKNOWN) return getMaxLengthForBrand(brand);

  if (/^2/.test(digits)) {
    const prefix = Number(digits.slice(0, 4).padEnd(4, "0"));
    const upperBound = Number(digits.slice(0, 4).padEnd(4, "9"));
    if (prefix <= 2720 && upperBound >= 2221) return cardLengths[BRAND.MASTERCARD][0];
  }
  return MAX_CARD_DIGITS;
}

// ---------------------------------------------------------------------------
// Card number formatting & sanitization
// ---------------------------------------------------------------------------

/**
 * Strip everything except digits. Used to sanitize pasted/copied content.
 */
export function sanitizeDigits(value) {
  return (value || "").replace(/\D/g, "");
}

/**
 * Format card digits for display. Excess digits remain visible for validation.
 */
export function formatCardNumber(value) {
  if (cardDigits(value) === null) return value;
  const digits = sanitizeDigits(value);
  const brand = detectCardBrand(digits);

  if (brand === BRAND.AMEX) {
    const g1 = digits.slice(0, 4);
    const g2 = digits.slice(4, 10);
    const g3 = digits.slice(10);
    return [g1, g2, g3].filter(Boolean).join(" ");
  }

  return digits
    .match(new RegExp(`.{1,4}`, "g"))
    ?.join(" ") ?? digits;
}

/**
 * Mask a card number for display in error reports: "•••• •••• •••• 4242".
 */
export function maskCardNumber(number) {
  const digits = sanitizeDigits(number);
  if (digits.length < 4) return "••••";
  const last4 = digits.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

// ---------------------------------------------------------------------------
// Expiry formatting & parsing
// ---------------------------------------------------------------------------

/**
 * Format an expiry as "MM / YY" or "MM / YYYY" without discarding invalid input.
 */
export function formatExpiry(value) {
  if (typeof value !== "string" || !/^[\d\s/-]*$/.test(value)) return value;
  const trimmed = value.trim();
  if (!trimmed) return "";

  const separated = /^(\d{1,2})\s*(?:\/|-|\s+)\s*(\d{0,4})$/.exec(trimmed);
  if (separated) {
    return separated[2] ? `${separated[1]} / ${separated[2]}` : `${separated[1]} /`;
  }
  if (!/^\d+$/.test(trimmed)) return value;

  const digits = trimmed;
  if (digits.length <= 2) return digits;
  if (digits.length === 3 && Number(digits.slice(0, 2)) > 12) {
    return `${digits[0]} / ${digits.slice(1)}`;
  }
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

/**
 * Parse an expiry string into { month, year, rawMonth, rawYear }.
 * Accepts slash, hyphen, or whitespace separators.
 */
export function parseExpiry(value) {
  if (typeof value !== "string") {
    return { month: null, year: null, rawMonth: null, rawYear: null, yearDigits: 0, complete: false };
  }
  const trimmed = value.trim();
  let rawMonth;
  let rawYear;
  const separated = /^(\d{1,2})\s*(?:\/|-|\s+)\s*(\d{0,4})$/.exec(trimmed);

  if (separated) {
    [, rawMonth, rawYear] = separated;
  } else if (/^\d{1,6}$/.test(trimmed)) {
    if (trimmed.length <= 2) {
      rawMonth = trimmed;
      rawYear = "";
    } else if (trimmed.length === 3 && Number(trimmed.slice(0, 2)) > 12) {
      rawMonth = trimmed.slice(0, 1);
      rawYear = trimmed.slice(1);
    } else {
      rawMonth = trimmed.slice(0, 2);
      rawYear = trimmed.slice(2);
    }
  } else {
    return { month: null, year: null, rawMonth: null, rawYear: null, yearDigits: 0, complete: false };
  }

  const month = rawMonth ? Number(rawMonth) : null;
  const complete = rawYear.length === 2 || rawYear.length === 4;
  return {
    month,
    year: complete ? Number(rawYear) : null,
    rawMonth,
    rawYear,
    yearDigits: rawYear.length,
    complete,
  };
}

/**
 * Normalize a 2-digit year to a full year based on "now".
 */
export function normalizeTwoDigitYear(yy, now = new Date()) {
  if (!Number.isInteger(yy) || yy < 0 || yy > 99) return yy;
  const currentYear = now.getFullYear();
  let year = Math.floor(currentYear / 100) * 100 + yy;
  if ((year - currentYear) * 12 > YEAR_AHEAD_LIMIT_MONTHS) year -= 100;
  return year;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Luhn algorithm check.
 */
export function luhnCheck(number) {
  const digits = cardDigits(number);
  if (!digits || !/^\d+$/.test(digits)) return false;
  if (digits.length < 2) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Validate a full card number: Luhn + length per brand.
 */
export function validateCardNumber(number, brandOverride = null) {
  const digits = cardDigits(number);
  if (digits === null) return { valid: false, reason: "Enter a valid card number" };
  if (!digits) return { valid: false, reason: "Enter your card number" };
  if (!/^\d+$/.test(digits) || digits.length < 12 || digits.length > MAX_CARD_DIGITS) {
    return { valid: false, reason: "Enter a valid card number" };
  }

  const brand = detectCardBrand(digits);
  if (brand === BRAND.UNKNOWN || (brandOverride && brandOverride !== brand)) {
    return { valid: false, reason: "Enter a card number from a supported network" };
  }
  if (!cardLengths[brand].includes(digits.length)) {
    return {
      valid: false,
      reason: `Enter a valid ${getBrandLabel(brand)} number (${cardLengths[brand].join(", ")} digits)`,
    };
  }
  if (!luhnCheck(digits)) {
    return { valid: false, reason: "Card number checksum is invalid" };
  }

  return { valid: true, reason: null };
}

/**
 * Validate expiry date.
 * - month 01-12
 * - the current month remains valid; earlier months are expired
 * - not more than 20 years ahead
 */
export function validateExpiry(value, now = new Date()) {
  if (typeof value !== "string" || !value.trim()) {
    return { valid: false, reason: "Enter the expiry date" };
  }
  const { month, year, yearDigits, complete } = parseExpiry(value);
  if (month === null || !complete || year === null) {
    return { valid: false, reason: "Enter a valid expiry date" };
  }

  if (month < 1 || month > 12) {
    return { valid: false, reason: "Choose a valid month" };
  }

  if ((yearDigits === 2 && year === 0) || (yearDigits === 4 && year < 1)) {
    return { valid: false, reason: "Enter a valid expiry date" };
  }
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const fullYear = yearDigits === 2 ? normalizeTwoDigitYear(year, now) : year;
  const monthDifference = (fullYear - currentYear) * 12 + month - currentMonth;
  if (monthDifference < 0) {
    return { valid: false, reason: "Card has expired" };
  }
  if (monthDifference > YEAR_AHEAD_LIMIT_MONTHS) {
    return { valid: false, reason: "Card cannot be valid more than 20 years ahead" };
  }

  return { valid: true, reason: null };
}

/**
 * Validate CVC: correct length for the detected brand.
 */
export function validateCvc(number, brandOverride = null) {
  if (typeof number !== "string" || !number.trim()) {
    return { valid: false, reason: "Enter the CVC" };
  }
  const value = number.trim();
  if (!/^\d+$/.test(value)) return { valid: false, reason: "Enter a valid CVC" };
  const brand = brandOverride || BRAND.UNKNOWN;
  const expected = getCvcLengthForBrand(brand);
  if (value.length < expected) {
    return { valid: false, reason: `Enter the ${expected}-digit CVC` };
  }
  if (value.length > expected) {
    return { valid: false, reason: `CVC must be ${expected} digit${expected === 1 ? "" : "s"}` };
  }

  return { valid: true, reason: null };
}

// ---------------------------------------------------------------------------
// Error state helpers
// ---------------------------------------------------------------------------

/**
 * Produce the error message for a card field given its current value.
 */
export function getCardNumberError(number, brandOverride = null) {
  return validateCardNumber(number, brandOverride).reason;
}

export function getExpiryError(value) {
  return validateExpiry(value).reason;
}

export function getCvcError(number, brandOverride = null) {
  return validateCvc(number, brandOverride).reason;
}

export function validatePaymentDetails({ cardNumber, expiry, cvc }, now = new Date()) {
  const brand = detectCardBrand(cardNumber);
  const errors = {
    cardNumber: validateCardNumber(cardNumber, brand === BRAND.UNKNOWN ? null : brand).reason,
    expiry: validateExpiry(expiry, now).reason,
    cvc: validateCvc(cvc, brand).reason,
  };
  return { valid: Object.values(errors).every((error) => error === null), errors };
}

// ---------------------------------------------------------------------------
// Amount helpers
// ---------------------------------------------------------------------------

/**
 * Convert an INR amount to the smallest currency unit (paise).
 */
export function toPaise(amount) {
  if (typeof amount === "number") {
    return Math.round(amount * 100);
  }
  return Math.round(parseFloat(`${amount}`) * 100);
}

/**
 * Convert paise back to an INR amount string.
 */
export function fromPaise(paise) {
  return (paise / 100).toFixed(2);
}
