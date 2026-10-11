import { apiRequest } from "./apiClient";

export function fetchProfile() {
  return apiRequest("/api/profile");
}

export function updateProfile(profile) {
  return apiRequest("/api/profile", { method: "PUT", body: profile });
}
