import { apiRequest } from "./apiClient";

export async function fetchWishlist() {
  const { items } = await apiRequest("/api/wishlist");
  return items;
}

export function addWishlistItem(id) {
  return apiRequest(`/api/wishlist/${encodeURIComponent(id)}`, { method: "PUT" });
}

export function removeWishlistItem(id) {
  return apiRequest(`/api/wishlist/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function clearRemoteWishlist() {
  return apiRequest("/api/wishlist", { method: "DELETE" });
}
