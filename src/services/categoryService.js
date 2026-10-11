import { apiRequest } from "./apiClient";

export function fetchCategories(signal) {
  return apiRequest("/api/categories", { signal });
}
