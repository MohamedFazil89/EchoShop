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

// Accepted BIN prefixes and expected total length for known brands.
const BRAND_PREFIXES = [
  // Amex: 34xx, 37xx → 15 digits, CVC 4
  { brand: BRAND.AMEX, prefixes: ["34", "37"], length: 15, cvc: 4 },
  // Mastercard: 51-55, 2221-2720 → 16 digits, CVC 3
  { brand: BRAND.MASTERCARD, prefixes: ["51", "52", "53", "54", "55"], length: 16, cvc: 3 },
  { brand: BRAND.MASTERCARD, prefixes: ["2221", "2222", "2223", "2224", "2225", "2226", "2227", "2228", "2229", "2230", "2231", "2232", "2233", "2234", "2235", "2236", "2237", "2238", "2239", "2240", "2241", "2242", "2243", "2244", "2245", "2246", "2247", "2248", "2249", "2250", "2251", "2252", "2253", "2254", "2255", "2256", "2257", "2258", "2259", "2260", "2261", "2262", "2263", "2264", "2265", "2266", "2267", "2268", "2269", "2270", "2271", "2272", "2273", "2274", "2275", "2276", "2277", "2278", "2279"], length: 16, cvc: 3 },
  // RuPay: 60, 65, 64, 62 → 16 digits, CVC 3 (some 13-19)
  { brand: BRAND.RUPAY, prefixes: ["60", "65", "64", "62"], length: 16, cvc: 3 },
  // Visa: 4 → 13-19 digits, CVC 3
  { brand: BRAND.VISA, prefixes: ["4"], length: 16, cvc: 3 },
];

// Visa has a special expanded prefix range (40-49) handled by the generic "4" rule above,
// but Visa also covers 40, 41, 42, 43, 44, 45, 46, 47, 48, 49.
BRAND_PREFIXES[3].length = 16;
BRAND_PREFIXES[3].cvc = 3;

const MAX_CARD_DIGITS = 19;
const MAX_EXPIRY_DIGITS = 4;
const MAX_CVC_DIGITS = 4;
const YEAR_AHEAD_LIMIT = 20; // years ahead allowed for expiry

// ---------------------------------------------------------------------------
// Brand detection
// ---------------------------------------------------------------------------

/**
 * Detect the card brand from the raw card number (digits only).
 * Uses BIN-prefix rules. Falls back to generic digit-count heuristics.
 */
export function detectCardBrand(rawNumber) {
  const digits = (rawNumber || "").replace(/\s|-/g, "");
  if (!/^\d{4,}$/.test(digits)) return BRAND.UNKNOWN;

  for (const { brand, prefixes, length } of BRAND_PREFIXES) {
    for (const prefix of prefixes) {
      if (digits.startsWith(prefix)) return brand;
    }
  }

  // Length-based fallback for unrecognized but plausible numbers.
  if (digits.length === 15) return BRAND.AMEX;
  if (digits.length === 16) return BRAND.MASTERCARD;
  if (digits.length >= 13 && digits.length <= 19) return BRAND.VISA;

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
  const spec = BRAND_PREFIXES.find((p) => p.brand === brand);
  if (!spec) return MAX_CARD_DIGITS;
  return Math.min(spec.length, MAX_CARD_DIGITS);
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
 * Format a card number: groups of 4, Amex 4-6-5. Max 19 digits.
 */
export function formatCardNumber(value) {
  const digits = sanitizeDigits(value);
  const brand = detectCardBrand(digits);
  const max = getMaxLengthForBrand(brand);
  const capped = digits.slice(0, max);

  if (brand === BRAND.AMEX) {
    // 4-6-5
    const g1 = capped.slice(0, 4);
    const g2 = capped.slice(4, 10);
    const g3 = capped.slice(10, 15);
    return [g1, g2, g3].filter(Boolean).join(" ");
  }

  // 4-4-4-4
  return capped
    .match(new RegExp(`.{1,4}`, "g"))
    ?.join(" ") ?? capped;
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
 * Format expiry as "MM / YY", auto-inserting the separator and padding month with leading 0.
 */
export function formatExpiry(value) {
  const digits = sanitizeDigits(value);
  const capped = digits.slice(0, MAX_EXPIRY_DIGITS);

  if (capped.length === 0) return "";
  if (capped.length <= 2) return capped;

  const mm = capped.slice(0, 2);
  const yy = capped.slice(2, 4);
  return `${mm} / ${yy}`;
}

/**
 * Parse an expiry string into { month, year, rawMonth, rawYear }.
 * "05/25" or "5/25" or "05 25" all work; non-digit separators are tolerated.
 */
export function parseExpiry(value) {
  const digits = sanitizeDigits(value);
  if (digits.length < 2) {
    return { month: null, year: null, rawMonth: null, rawYear: null, complete: digits.length === 2 };
  }

  const rawMonth = digits.slice(0, 2);
  const rawYear = digits.slice(2, 4);
  const month = parseInt(rawMonth, 10);
  const year = parseInt(rawYear, 10);

  return { month, year, rawMonth, rawYear, complete: digits.length === 4 };
}

/**
 * Normalize a 2-digit year to a full year based on "now".
 */
export function normalizeTwoDigitYear(yy, now = new Date()) {
  const century = now.getFullYear() - (now.getFullYear() % 100);
  return yy > 50 ? century - 100 + yy : century + yy;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Luhn algorithm check.
 */
export function luhnCheck(number) {
  const digits = sanitizeDigits(number);
  if (!/^\d+$/.test(digits)) return false;
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
  const digits = sanitizeDigits(number);

  // Empty → leave empty validation to the required-flag; a value must at least look numeric.
  if (digits.length === 0) return { valid: true, reason: null };

  const brand = brandOverride || detectCardBrand(digits);

  if (!/^\d{13,19}$/.test(digits)) {
    return { valid: false, reason: "Enter a valid card number" };
  }

  if (!luhnCheck(digits)) {
    return { valid: false, reason: "Card number failed the security check" };
  }

  const allowed = getMaxLengthForBrand(brand);
  if (digits.length !== allowed) {
    return { valid: false, reason: `Enter a valid ${getBrandLabel(brand)} number (${allowed} digits)` };
  }

  return { valid: true, reason: null };
}

/**
 * Validate expiry date.
 * - month 01-12
 * - not in the past (month and year), using start of the current month
 * - not more than 20 years ahead
 */
export function validateExpiry(value) {
  const digits = sanitizeDigits(value);

  if (digits.length === 0) return { valid: true, reason: null };

  const { month, year, rawMonth, rawYear, complete } = parseExpiry(value);

  if (month === null || year === null) {
    return { valid: false, reason: complete ? "Invalid expiry date" : null };
  }

  if (month < 1 || month > 12) {
    return { valid: false, reason: "Choose a valid month" };
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const fullYear = normalizeTwoDigitYear(year);

  if (fullYear < currentYear) {
    return { valid: false, reason: "Card has expired" };
  }

  if (fullYear === currentYear && month < currentMonth) {
    return { valid: false, reason: "Card has expired" };
  }

  const yearsAhead = fullYear - currentYear;
  if (yearsAhead > YEAR_AHEAD_LIMIT) {
    return { valid: false, reason: "Card cannot be valid more than 20 years ahead" };
  }

  return { valid: true, reason: null };
}

/**
 * Validate CVC: correct length for the detected brand.
 */
export function validateCvc(number, brandOverride = null) {
  const digits = sanitizeDigits(number);

  if (digits.length === 0) return { valid: true, reason: null };

  const brand = brandOverride || detectCardBrand("0000000000000000"); // fallback brand if no card number yet
  const expected = getCvcLengthForBrand(brand);

  if (!/^\d+$/.test(digits)) {
    return { valid: false, reason: "Enter the CVC" };
  }

  if (digits.length < expected) {
    return { valid: false, reason: `Enter the ${expected}-digit CVC` };
  }

  if (digits.length > expected) {
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
  const digits = sanitizeDigits(number);
  if (digits.length === 0) return null;
  return validateCardNumber(number, brandOverride).reason;
}

export function getExpiryError(value) {
  return validateExpiry(value).reason;
}

export function getCvcError(number, brandOverride = null) {
  const digits = sanitizeDigits(number);
  if (digits.length === 0) return null;
  return validateCvc(number, brandOverride).reason;
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
