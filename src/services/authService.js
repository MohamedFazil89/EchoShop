import { apiRequest } from "./apiClient";

export async function loginUser(credentials) {
  const { user } = await apiRequest("/api/auth/login", {
    method: "POST",
    body: credentials,
  });
  return user;
}

export async function registerUser(details) {
  const { user } = await apiRequest("/api/auth/register", {
    method: "POST",
    body: details,
  });
  return user;
}

export async function fetchCurrentUser() {
  const { user } = await apiRequest("/api/auth/me");
  return user;
}

export function logoutUser() {
  return apiRequest("/api/auth/logout", { method: "POST" });
}
