export const FALLBACK_PRODUCT_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 1000'%3E%3Crect width='900' height='1000' fill='%23f8f4ec'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%237a6c5e' font-family='system-ui, sans-serif' font-size='48'%3EImage unavailable%3C/text%3E%3C/svg%3E";

export function handleProductImageError(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
}
