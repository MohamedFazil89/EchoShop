import { apiRequest } from "./apiClient";

export async function fetchCart() {
  const { items } = await apiRequest("/api/cart");
  return items;
}

export async function mergeCart(items) {
  const { items: savedItems } = await apiRequest("/api/cart/merge", {
    method: "POST",
    body: { items: items.map(({ id, quantity }) => ({ id, quantity })) },
  });
  return savedItems;
}

export async function addCartItem(id, quantity) {
  const { items } = await apiRequest(`/api/cart/${encodeURIComponent(id)}`, {
    method: "POST",
    body: { quantity },
  });
  return items;
}

export async function updateCartItem(id, quantity) {
  const { items } = await apiRequest(`/api/cart/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { quantity },
  });
  return items;
}

export function removeCartItem(id) {
  return apiRequest(`/api/cart/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function clearRemoteCart() {
  return apiRequest("/api/cart", { method: "DELETE" });
}
