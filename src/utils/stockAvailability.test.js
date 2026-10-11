import { describe, expect, it } from "vitest";
import {
  canPurchaseStock,
  getStockAvailability,
  LOW_STOCK_THRESHOLD,
} from "./stockAvailability";

describe("stock availability", () => {
  it("uses a documented positive low-stock threshold", () => {
    expect(LOW_STOCK_THRESHOLD).toBeGreaterThan(0);
    expect(getStockAvailability(LOW_STOCK_THRESHOLD)).toEqual({
      status: "low-stock",
      label: `Only ${LOW_STOCK_THRESHOLD} left`,
    });
    expect(getStockAvailability(LOW_STOCK_THRESHOLD + 1)).toEqual({
      status: "in-stock",
      label: "In Stock",
    });
  });

  it("reports zero stock as out of stock", () => {
    expect(getStockAvailability(0)).toEqual({
      status: "out-of-stock",
      label: "Out of Stock",
    });
    expect(canPurchaseStock(0)).toBe(false);
  });

  it.each([undefined, null, "4", -1, 1.5, Number.NaN])(
    "treats unknown or invalid stock (%s) as unavailable",
    (stock) => {
      expect(getStockAvailability(stock)).toEqual({
        status: "unknown",
        label: "Availability unknown",
      });
      expect(canPurchaseStock(stock)).toBe(false);
    }
  );

  it("allows adding only when a positive stock value is known", () => {
    expect(canPurchaseStock(1)).toBe(true);
    expect(canPurchaseStock(15)).toBe(true);
    expect(canPurchaseStock(undefined)).toBe(false);
  });

  it("supports an explicit threshold for non-default configurations", () => {
    expect(getStockAvailability(4, 4).status).toBe("low-stock");
    expect(getStockAvailability(5, 4).status).toBe("in-stock");
  });
});
