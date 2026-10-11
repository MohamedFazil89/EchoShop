import {
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  getBrandLabel,
  getCardNumberError,
  getCvcError,
  getCvcLengthForBrand,
  getExpiryError,
  getMaxLengthForCardNumber,
  getMaxLengthForBrand,
  luhnCheck,
  maskCardNumber,
  normalizeTwoDigitYear,
  parseExpiry,
  sanitizeDigits,
  toPaise,
  fromPaise,
  validateCardNumber,
  validateCvc,
  validateExpiry,
  validatePaymentDetails,
} from "./payment";

const date = (year, month, day = 15) => new Date(year, month - 1, day);

function makeLuhnNumber(prefix, length) {
  const payload = `${prefix}${"0".repeat(length - prefix.length - 1)}`;
  for (let digit = 0; digit <= 9; digit += 1) {
    const candidate = `${payload}${digit}`;
    if (luhnCheck(candidate)) return candidate;
  }
  throw new Error("Could not generate test card fixture");
}

describe("payment format utilities", () => {
  test("detects supported networks from their actual prefixes", () => {
    expect(detectCardBrand("4242 4242 4242 4242")).toBe("visa");
    expect(detectCardBrand("5555555555554444")).toBe("mastercard");
    expect(detectCardBrand("2223000000000000")).toBe("mastercard");
    expect(detectCardBrand("2720999999999999")).toBe("mastercard");
    expect(detectCardBrand("378282246310005")).toBe("amex");
    expect(detectCardBrand("6069980000000000")).toBe("rupay");
    expect(detectCardBrand("6521830000000000")).toBe("rupay");
  });

  test("does not infer an unsupported brand by number length", () => {
    expect(detectCardBrand("9999999999999999")).toBe("unknown");
    expect(detectCardBrand("2220999999999999")).toBe("unknown");
    expect(detectCardBrand("2721999999999999")).toBe("unknown");
    expect(detectCardBrand("4242x42424242424")).toBe("unknown");
  });

  test("returns brand labels, security-code lengths, and maximum lengths", () => {
    expect(getBrandLabel("amex")).toBe("American Express");
    expect(getBrandLabel("unknown")).toBe("Card");
    expect(getCvcLengthForBrand("amex")).toBe(4);
    expect(getCvcLengthForBrand("visa")).toBe(3);
    expect(getMaxLengthForBrand("visa")).toBe(19);
    expect(getMaxLengthForBrand("mastercard")).toBe(16);
    expect(getMaxLengthForCardNumber("4")).toBe(19);
    expect(getMaxLengthForCardNumber("37")).toBe(15);
    expect(getMaxLengthForCardNumber("222")).toBe(16);
    expect(getMaxLengthForCardNumber("291")).toBe(19);
  });

  test("sanitizes permitted formatting for display helpers", () => {
    expect(sanitizeDigits("4242-4242 4242-4242")).toBe("4242424242424242");
    expect(formatCardNumber("4242424242424242")).toBe("4242 4242 4242 4242");
    expect(formatCardNumber("378282246310005")).toBe("3782 822463 10005");
    expect(formatCardNumber("4242424242424242424")).toBe("4242 4242 4242 4242 424");
    expect(formatCardNumber("4242x4242")).toBe("4242x4242");
    expect(maskCardNumber("4242424242424242")).toBe("•••• •••• •••• 4242");
  });
});

describe("card number validation", () => {
  test("requires a supported network, supported length, and a valid Luhn checksum", () => {
    expect(validateCardNumber("").valid).toBe(false);
    expect(validateCardNumber("   ").valid).toBe(false);
    expect(validateCardNumber("4242-4242-4242-4242").valid).toBe(true);
    expect(validateCardNumber("4242424242424241").reason).toBe("Card number checksum is invalid");
    expect(validateCardNumber("424242424242424").valid).toBe(false);
    const longVisa = makeLuhnNumber("4", 19);
    expect(validateCardNumber(longVisa).valid).toBe(true);
    expect(validateCardNumber(makeLuhnNumber("4", 13)).valid).toBe(true);
    expect(validateCardNumber("5555555555554444").valid).toBe(true);
    expect(validateCardNumber("378282246310005").valid).toBe(true);
    expect(validateCardNumber(makeLuhnNumber("60", 16)).valid).toBe(true);
    expect(validateCardNumber("9999999999999999").valid).toBe(false);
  });

  test("rejects letters and symbols instead of silently stripping them", () => {
    expect(validateCardNumber("4242abcd42424242").valid).toBe(false);
    expect(validateCardNumber("4242/4242/4242/4242").valid).toBe(false);
    expect(luhnCheck("4242abcd42424242")).toBe(false);
  });

  test("keeps overlong pasted input invalid rather than truncating it", () => {
    const pasted = "4242424242424242424242424242424242424242";
    expect(formatCardNumber(pasted)).not.toBe("4242 4242 4242 4242");
    expect(validateCardNumber(pasted).valid).toBe(false);
  });

  test("reports the card-number field error for incomplete and corrected values", () => {
    expect(getCardNumberError("4242")).toBe("Enter a valid card number");
    expect(getCardNumberError("4242424242424242")).toBeNull();
  });

  test("applies supported brand-specific lengths", () => {
    expect(validateCardNumber("378282246310005").valid).toBe(true);
    expect(validateCardNumber("37828224631000").valid).toBe(false);
    expect(validateCardNumber("5105105105105100").valid).toBe(true);
    expect(validateCardNumber("510510510510510").valid).toBe(false);
  });
});

describe("expiry formatting and validation", () => {
  const now = date(2025, 6);

  test("formats two- and four-digit years and preserves malformed input", () => {
    expect(formatExpiry("0525")).toBe("05 / 25");
    expect(formatExpiry("525")).toBe("5 / 25");
    expect(formatExpiry("05/25")).toBe("05 / 25");
    expect(formatExpiry("052025")).toBe("05 / 2025");
    expect(formatExpiry("05/2025")).toBe("05 / 2025");
    expect(formatExpiry("05x25")).toBe("05x25");
    expect(formatExpiry("0525052505")).toBe("05 / 25052505");
  });

  test("parses complete and incomplete expiry values without NaN", () => {
    expect(parseExpiry("05 / 25")).toMatchObject({
      month: 5, year: 25, rawMonth: "05", rawYear: "25", yearDigits: 2, complete: true,
    });
    expect(parseExpiry("05")).toMatchObject({
      month: 5, year: null, rawMonth: "05", rawYear: "", complete: false,
    });
    expect(parseExpiry("05 / 2")).toMatchObject({
      month: 5, year: null, rawYear: "2", complete: false,
    });
    expect(parseExpiry("05x25").complete).toBe(false);
  });

  test("requires a complete valid date and accepts the current expiry month", () => {
    expect(validateExpiry("", now).valid).toBe(false);
    expect(validateExpiry("05", now).valid).toBe(false);
    expect(validateExpiry("05 / 2", now).valid).toBe(false);
    expect(validateExpiry("06 / 25", now).valid).toBe(true);
    expect(validateExpiry("06 / 2025", now).valid).toBe(true);
    expect(validateExpiry("12 / 26", now).valid).toBe(true);
    expect(validateExpiry("05 / 25", now).reason).toBe("Card has expired");
  });

  test("rejects invalid months and malformed values", () => {
    expect(validateExpiry("00 / 25", now).valid).toBe(false);
    expect(validateExpiry("13 / 25", now).reason).toBe("Choose a valid month");
    expect(validateExpiry("06x25", now).valid).toBe(false);
    expect(validateExpiry("06 / 0000", now).valid).toBe(false);
    expect(validateExpiry("06 / 2", now).valid).toBe(false);
  });

  test("handles two-digit years, year boundaries, and the 20-year limit", () => {
    expect(normalizeTwoDigitYear(25, now)).toBe(2025);
    expect(normalizeTwoDigitYear(24, now)).toBe(2024);
    expect(normalizeTwoDigitYear(30, now)).toBe(2030);
    expect(normalizeTwoDigitYear(50, now)).toBe(1950);
    expect(validateExpiry("12 / 24", now).reason).toBe("Card has expired");
    expect(validateExpiry("06 / 45", now).valid).toBe(true);
    expect(validateExpiry("07 / 45", now).reason).toBe("Card cannot be valid more than 20 years ahead");
    expect(validateExpiry("01 / 26", date(2025, 12)).valid).toBe(true);
    expect(validateExpiry("12 / 25", date(2026, 1)).reason).toBe("Card has expired");
  });

  test("returns useful errors for empty, expired, and invalid values", () => {
    expect(getExpiryError("")).toBe("Enter the expiry date");
    expect(getExpiryError("05/25")).toBe("Card has expired");
    expect(getExpiryError("13/25")).toBe("Choose a valid month");
  });
});

describe("security-code validation", () => {
  test("requires the length associated with the detected brand", () => {
    expect(validateCvc("", "visa").valid).toBe(false);
    expect(validateCvc("123", "visa").valid).toBe(true);
    expect(validateCvc("12", "visa").valid).toBe(false);
    expect(validateCvc("1234", "visa").valid).toBe(false);
    expect(validateCvc("1234", "amex").valid).toBe(true);
    expect(validateCvc("123", "amex").valid).toBe(false);
  });

  test("trims surrounding whitespace but rejects letters, symbols, and interior spaces", () => {
    expect(validateCvc(" 123 ", "visa").valid).toBe(true);
    expect(validateCvc("12x", "visa").valid).toBe(false);
    expect(validateCvc("12 3", "visa").valid).toBe(false);
    expect(validateCvc("12-3", "visa").valid).toBe(false);
  });

  test("reports missing values and updates validity when corrected", () => {
    expect(getCvcError("", "visa")).toBe("Enter the CVC");
    expect(getCvcError("12", "amex")).toBe("Enter the 4-digit CVC");
    expect(getCvcError("1234", "amex")).toBeNull();
  });

  test("revalidates the security-code length when the detected brand changes", () => {
    expect(validateCvc("1234", "amex").valid).toBe(true);
    expect(validateCvc("1234", "visa").valid).toBe(false);
  });
});

describe("shared payment validation and amount helpers", () => {
  const now = date(2025, 6);
  const goodValues = {
    cardNumber: "4242 4242 4242 4242",
    expiry: "06 / 25",
    cvc: "123",
  };

  test("validates all fields using one result shape and catches missing fields", () => {
    expect(validatePaymentDetails(goodValues, now)).toEqual({
      valid: true,
      errors: { cardNumber: null, expiry: null, cvc: null },
    });
    const empty = validatePaymentDetails({ cardNumber: "", expiry: "", cvc: "" }, now);
    expect(empty.valid).toBe(false);
    expect(empty.errors).toEqual({
      cardNumber: "Enter your card number",
      expiry: "Enter the expiry date",
      cvc: "Enter the CVC",
    });
  });

  test("supports correction after an invalid submit without discarding other fields", () => {
    const invalid = validatePaymentDetails({ ...goodValues, cvc: "12" }, now);
    expect(invalid.errors.cvc).toBe("Enter the 3-digit CVC");
    expect(validatePaymentDetails({ ...goodValues, cvc: "123" }, now).valid).toBe(true);
  });

  test("converts rupees and paise", () => {
    expect(toPaise(589.99)).toBe(58999);
    expect(toPaise("589.99")).toBe(58999);
    expect(fromPaise(58999)).toBe("589.99");
  });
});
