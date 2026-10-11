import { apiRequest } from "./apiClient";

export async function placeOrder({ items, customer }) {
  const { order } = await apiRequest("/api/orders", {
    method: "POST",
    body: {
      items: items.map(({ id, quantity }) => ({ id, quantity })),
      customer,
    },
  });
  return order;
}

export async function fetchOrders() {
  const { orders } = await apiRequest("/api/orders");
  return orders;
}

export async function fetchOrderById(orderNumber) {
  const { order } = await apiRequest(`/api/orders/${encodeURIComponent(orderNumber)}`);
  return order;
}
