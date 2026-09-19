export const FREE_SHIPPING_THRESHOLD = 75;
const FLAT_SHIPPING = 6.95;
const TAX_RATE = 0.0; // set to e.g. 0.08 to enable tax display

export function calculateSubtotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calculateDiscount(items) {
  return items.reduce((sum, item) => {
    if (!item.compareAtPrice) return sum;
    return sum + (item.compareAtPrice - item.price) * item.quantity;
  }, 0);
}

export function calculateShipping(subtotal) {
  if (subtotal === 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
}

export function calculateTax(subtotal) {
  return subtotal * TAX_RATE;
}

export function calculateTotals(items, promoDiscount = 0) {
  const subtotal = calculateSubtotal(items);
  const discount = calculateDiscount(items);
  const shipping = calculateShipping(subtotal);
  const tax = calculateTax(subtotal);
  const total = Math.max(subtotal + shipping + tax - promoDiscount, 0);
  return { subtotal, discount, shipping, tax, promoDiscount, total };
}
