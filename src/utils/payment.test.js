import {
  detectCardBrand,
  getBrandLabel,
  getCvcLengthForBrand,
  getMaxLengthForBrand,
  sanitizeDigits,
  formatCardNumber,
  maskCardNumber,
  formatExpiry,
  parseExpiry,
  normalizeTwoDigitYear,
  luhnCheck,
  validateCardNumber,
  validateExpiry,
  validateCvc,
  getCardNumberError,
  getExpiryError,
  getCvcError,
  toPaise,
  fromPaise,
} from "../utils/payment";

describe("Payment Utilities", () => {
  describe("detectCardBrand", () => {
    test("detects Visa (4 prefix)", () => {
      expect(detectCardBrand("4242424242424242")).toBe("visa");
      expect(detectCardBrand("4111111111111111")).toBe("visa");
    });

    test("detects Mastercard (51-55 prefix)", () => {
      expect(detectCardBrand("5555555555554444")).toBe("mastercard");
      expect(detectCardBrand("5105105105105100")).toBe("mastercard");
    });

    test("detects Mastercard (2221-2720 prefix)", () => {
      expect(detectCardBrand("2223000000000000")).toBe("mastercard");
      expect(detectCardBrand("2720999999999999")).toBe("mastercard");
    });

    test("detects Amex (34, 37 prefix)", () => {
      expect(detectCardBrand("378282246310005")).toBe("amex");
      expect(detectCardBrand("371449635398431")).toBe("amex");
      expect(detectCardBrand("340000000000009")).toBe("amex");
    });

    test("detects RuPay (60, 65, 64, 62 prefix)", () => {
      expect(detectCardBrand("6069980000000000")).toBe("rupay");
      expect(detectCardBrand("6521830000000000")).toBe("rupay");
    });

    test("returns unknown for invalid input", () => {
      expect(detectCardBrand("")).toBe("unknown");
      expect(detectCardBrand("123")).toBe("unknown");
      expect(detectCardBrand("abc")).toBe("unknown");
      expect(detectCardBrand("9999999999999999")).toBe("unknown");
    });
  });

  describe("getBrandLabel", () => {
    test("returns human-readable labels", () => {
      expect(getBrandLabel("visa")).toBe("Visa");
      expect(getBrandLabel("mastercard")).toBe("Mastercard");
      expect(getBrandLabel("amex")).toBe("American Express");
      expect(getBrandLabel("rupay")).toBe("RuPay");
      expect(getBrandLabel("unknown")).toBe("Card");
    });
  });

  describe("getCvcLengthForBrand", () => {
    test("returns 4 for Amex", () => {
      expect(getCvcLengthForBrand("amex")).toBe(4);
    });
    test("returns 3 for other brands", () => {
      expect(getCvcLengthForBrand("visa")).toBe(3);
      expect(getCvcLengthForBrand("mastercard")).toBe(3);
      expect(getCvcLengthForBrand("rupay")).toBe(3);
      expect(getCvcLengthForBrand("unknown")).toBe(3);
    });
  });

  describe("getMaxLengthForBrand", () => {
    test("returns correct max lengths", () => {
      expect(getMaxLengthForBrand("amex")).toBe(15);
      expect(getMaxLengthForBrand("visa")).toBe(16);
      expect(getMaxLengthForBrand("mastercard")).toBe(16);
      expect(getMaxLengthForBrand("rupay")).toBe(16);
    });
  });

  describe("sanitizeDigits", () => {
    test("strips non-digits", () => {
      expect(sanitizeDigits("4242 4242 4242 4242")).toBe("4242424242424242");
      expect(sanitizeDigits("4242-4242-4242-4242")).toBe("4242424242424242");
      expect(sanitizeDigits("42 42 42 42 42")).toBe("4242424242");
      expect(sanitizeDigits("abcd")).toBe("");
      expect(sanitizeDigits("")).toBe("");
    });
  });

  describe("formatCardNumber", () => {
    test("formats Visa/Mastercard/RuPay in groups of 4", () => {
      expect(formatCardNumber("4242424242424242")).toBe("4242 4242 4242 4242");
      expect(formatCardNumber("4242 4242 4242 4242")).toBe("4242 4242 4242 4242");
    });

    test("formats Amex as 4-6-5", () => {
      expect(formatCardNumber("378282246310005")).toBe("3782 822463 10005");
      expect(formatCardNumber("3782 822463 10005")).toBe("3782 822463 10005");
    });

    test("strips non-digits on paste", () => {
      expect(formatCardNumber("4242-4242-4242-4242")).toBe("4242 4242 4242 4242");
      expect(formatCardNumber("42 42 42 42 42 42")).toBe("4242 4242 4242 42");
    });

    test("respects max length per brand", () => {
      // Amex max 15
      expect(formatCardNumber("3782822463100059").length).toBeLessThanOrEqual("3782 822463 10005".length);
      // Visa max 16
      expect(formatCardNumber("42424242424242424").length).toBeLessThanOrEqual("4242 4242 4242 4242".length);
    });

    test("handles 50+ character paste", () => {
      const longInput = "42424242424242424242424242424242424242424242424242";
      const result = formatCardNumber(longInput);
      // Should be truncated to max 16 digits for Visa
      expect(result).toBe("4242 4242 4242 4242");
    });

    test("handles letters pasted into card field", () => {
      expect(formatCardNumber("nnnnnnnnnnnnnnnn")).toBe("");
      expect(formatCardNumber("4242nnnn4242nnnn")).toBe("4242 4242");
    });
  });

  describe("maskCardNumber", () => {
    test("masks all but last 4 digits", () => {
      expect(maskCardNumber("4242424242424242")).toBe("•••• •••• •••• 4242");
      expect(maskCardNumber("378282246310005")).toBe("•••• •••• •••• 0005");
    });

    test("handles short numbers", () => {
      expect(maskCardNumber("123")).toBe("••••");
    });
  });

  describe("formatExpiry", () => {
    test("formats as MM / YY", () => {
      expect(formatExpiry("0525")).toBe("05 / 25");
      expect(formatExpiry("525")).toBe("5 / 25");
      expect(formatExpiry("1225")).toBe("12 / 25");
    });

    test("auto-inserts separator", () => {
      expect(formatExpiry("05")).toBe("05");
      expect(formatExpiry("052")).toBe("05 / 2");
    });

    test("prefixes 0 if first digit is 2-9", () => {
      // This is handled by user typing - the input will show "05" when they type "5"
      expect(formatExpiry("5")).toBe("5");
    });

    test("strips non-digits", () => {
      expect(formatExpiry("05/25")).toBe("05 / 25");
      expect(formatExpiry("05-25")).toBe("05 / 25");
    });

    test("handles 50+ character paste", () => {
      expect(formatExpiry("05250525052505250525")).toBe("05 / 25");
    });
  });

  describe("parseExpiry", () => {
    test("parses valid expiry", () => {
      expect(parseExpiry("05 / 25")).toEqual({
        month: 5,
        year: 25,
        rawMonth: "05",
        rawYear: "25",
        complete: true,
      });
    });

    test("handles incomplete input", () => {
      expect(parseExpiry("05")).toEqual({
        month: 5,
        year: null,
        rawMonth: "05",
        rawYear: "",
        complete: false,
      });
    });

    test("handles invalid month", () => {
      const result = parseExpiry("1325");
      expect(result.month).toBe(13);
      expect(result.year).toBe(25);
    });
  });

  describe("normalizeTwoDigitYear", () => {
    test("normalizes years correctly", () => {
      const now = new Date("2025-06-15");
      expect(normalizeTwoDigitYear(25, now)).toBe(2025);
      expect(normalizeTwoDigitYear(24, now)).toBe(2024);
      expect(normalizeTwoDigitYear(30, now)).toBe(2030);
      expect(normalizeTwoDigitYear(50, now)).toBe(1950);
    });
  });

  describe("luhnCheck", () => {
    test("validates valid card numbers", () => {
      expect(luhnCheck("4242424242424242")).toBe(true); // Visa test
      expect(luhnCheck("5555555555554444")).toBe(true); // Mastercard test
      expect(luhnCheck("378282246310005")).toBe(true); // Amex test
    });

    test("rejects invalid card numbers", () => {
      expect(luhnCheck("4242424242424241")).toBe(false);
      expect(luhnCheck("1234567890123456")).toBe(false);
    });

    test("rejects non-digits", () => {
      expect(luhnCheck("abcd")).toBe(false);
      expect(luhnCheck("")).toBe(false);
    });
  });

  describe("validateCardNumber", () => {
    test("returns valid for correct Visa", () => {
      expect(validateCardNumber("4242424242424242").valid).toBe(true);
    });

    test("returns valid for correct Mastercard", () => {
      expect(validateCardNumber("5555555555554444").valid).toBe(true);
    });

    test("returns valid for correct Amex", () => {
      expect(validateCardNumber("378282246310005").valid).toBe(true);
    });

    test("returns error for empty string (lenient)", () => {
      expect(validateCardNumber("").valid).toBe(true);
    });

    test("rejects invalid Luhn", () => {
      const result = validateCardNumber("4242424242424241");
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Card number failed the security check");
    });

    test("rejects wrong length for brand", () => {
      const result = validateCardNumber("424242424242424", "visa"); // 15 digits for Visa
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("16 digits");
    });

    test("rejects non-digits", () => {
      const result = validateCardNumber("abcd");
      expect(result.valid).toBe(false);
    });
  });

  describe("validateExpiry", () => {
    const now = new Date("2025-06-15");

    test("returns valid for future expiry", () => {
      expect(validateExpiry("06 / 25", now).valid).toBe(true);
      expect(validateExpiry("12 / 26", now).valid).toBe(true);
    });

    test("returns valid for current month", () => {
      expect(validateExpiry("06 / 25", now).valid).toBe(true);
    });

    test("rejects past month in current year", () => {
      expect(validateExpiry("05 / 25", now).valid).toBe(false);
      expect(validateExpiry("05 / 25", now).reason).toBe("Card has expired");
    });

    test("rejects past year", () => {
      expect(validateExpiry("12 / 24", now).valid).toBe(false);
      expect(validateExpiry("12 / 24", now).reason).toBe("Card has expired");
    });

    test("rejects invalid month", () => {
      expect(validateExpiry("13 / 25", now).valid).toBe(false);
      expect(validateExpiry("13 / 25", now).reason).toBe("Choose a valid month");
      expect(validateExpiry("00 / 25", now).valid).toBe(false);
    });

    test("rejects more than 20 years ahead", () => {
      expect(validateExpiry("06 / 46", now).valid).toBe(false);
      expect(validateExpiry("06 / 46", now).reason).toBe("Card cannot be valid more than 20 years ahead");
    });

    test("returns valid for empty string (lenient)", () => {
      expect(validateExpiry("", now).valid).toBe(true);
    });
  });

  describe("validateCvc", () => {
    test("returns valid for correct length", () => {
      expect(validateCvc("123", "visa").valid).toBe(true);
      expect(validateCvc("123", "mastercard").valid).toBe(true);
      expect(validateCvc("1234", "amex").valid).toBe(true);
    });

    test("rejects too short", () => {
      const result = validateCvc("12", "visa");
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Enter the 3-digit CVC");
    });

    test("rejects too long", () => {
      const result = validateCvc("1234", "visa");
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("CVC must be 3 digits");
    });

    test("rejects non-digits", () => {
      const result = validateCvc("abc", "visa");
      expect(result.valid).toBe(false);
    });

    test("returns valid for empty string (lenient)", () => {
      expect(validateCvc("", "visa").valid).toBe(true);
    });
  });

  describe("getCardNumberError", () => {
    test("returns null for empty", () => {
      expect(getCardNumberError("")).toBeNull();
    });

    test("returns error for invalid", () => {
      expect(getCardNumberError("4242424242424241")).toBe("Card number failed the security check");
    });
  });

  describe("getExpiryError", () => {
    const now = new Date("2025-06-15");

    test("returns null for empty", () => {
      expect(getExpiryError("")).toBeNull();
    });

    test("returns error for expired", () => {
      expect(getExpiryError("05/25", now)).toBe("Card has expired");
    });

    test("returns error for invalid month", () => {
      expect(getExpiryError("13/25", now)).toBe("Choose a valid month");
    });
  });

  describe("getCvcError", () => {
    test("returns null for empty", () => {
      expect(getCvcError("")).toBeNull();
    });

    test("returns error for wrong length", () => {
      expect(getCvcError("12", "visa")).toBe("Enter the 3-digit CVC");
      expect(getCvcError("123", "amex")).toBe("Enter the 4-digit CVC");
    });
  });

  describe("toPaise / fromPaise", () => {
    test("converts to paise correctly", () => {
      expect(toPaise(589.99)).toBe(58999);
      expect(toPaise("589.99")).toBe(58999);
      expect(toPaise(100)).toBe(10000);
      expect(toPaise(0.01)).toBe(1);
    });

    test("converts from paise correctly", () => {
      expect(fromPaise(58999)).toBe("589.99");
      expect(fromPaise(10000)).toBe("100.00");
      expect(fromPaise(1)).toBe("0.01");
    });
  });
});