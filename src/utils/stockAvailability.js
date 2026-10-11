const DEFAULT_LOW_STOCK_THRESHOLD = 3;
const configuredThreshold = Number(import.meta.env.VITE_LOW_STOCK_THRESHOLD);

/**
 * Low-stock warning boundary. Configure with VITE_LOW_STOCK_THRESHOLD; defaults
 * to 3 when unset or invalid. Stock at the threshold is considered low.
 */
export const LOW_STOCK_THRESHOLD =
  Number.isInteger(configuredThreshold) && configuredThreshold > 0
    ? configuredThreshold
    : DEFAULT_LOW_STOCK_THRESHOLD;

export function isStockKnown(stock) {
  return Number.isInteger(stock) && stock >= 0;
}

export function canPurchaseStock(stock) {
  return isStockKnown(stock) && stock > 0;
}

export function getStockAvailability(stock, threshold = LOW_STOCK_THRESHOLD) {
  if (!isStockKnown(stock)) {
    return { status: "unknown", label: "Availability unknown" };
  }
  if (stock === 0) {
    return { status: "out-of-stock", label: "Out of Stock" };
  }
  if (stock <= threshold) {
    return { status: "low-stock", label: `Only ${stock} left` };
  }
  return { status: "in-stock", label: "In Stock" };
}
