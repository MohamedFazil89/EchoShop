const USER_KEY = "ec_user";
const ORDERS_KEY = "ec_orders";

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private browsing mode.
  }
}

export function getUser() {
  return read(USER_KEY, null);
}

export function saveUser(profileData) {
  const profile = { ...getUser(), ...profileData };
  write(USER_KEY, profile);
  return profile;
}

export function getOrders() {
  return read(ORDERS_KEY, []);
}

export function saveOrder(orderData) {
  const timestamp = new Date().toISOString();
  const order = {
    id: `ORD-${Date.now()}`,
    date: timestamp,
    status: "placed",
    ...orderData,
  };
  write(ORDERS_KEY, [...getOrders(), order]);
  return order;
}

export function getOrderById(orderId) {
  return getOrders().find((order) => order.id === orderId) ?? null;
}

export function placeOrder(cartItems, userInfo, totalAmount) {
  const shippingAddress = userInfo.shippingAddress ?? {
    street: userInfo.street ?? "",
    city: userInfo.city ?? "",
    state: userInfo.state ?? "",
    pincode: userInfo.pincode ?? "",
  };

  return saveOrder({
    items: cartItems,
    shippingAddress,
    total: totalAmount,
  }).id;
}

export function clearUserData() {
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ORDERS_KEY);
  } catch {
    // Storage can be unavailable in private browsing mode.
  }
}
