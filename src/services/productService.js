import { apiRequest } from "./apiClient";

export async function fetchProducts(
  {
    category,
    search,
    minPrice,
    maxPrice,
    minRating,
    inStockOnly,
    sortBy,
  } = {},
  signal
) {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (search?.trim()) params.set("search", search.trim());
  if (typeof minPrice === "number") params.set("minPrice", String(minPrice));
  if (typeof maxPrice === "number") params.set("maxPrice", String(maxPrice));
  if (typeof minRating === "number") params.set("minRating", String(minRating));
  if (inStockOnly) params.set("inStockOnly", "true");
  if (sortBy) params.set("sortBy", sortBy);
  const query = params.size > 0 ? `?${params}` : "";
  return apiRequest(`/api/products${query}`, { signal });
}

export function fetchProductBySlug(slug, signal) {
  return apiRequest(`/api/products/${encodeURIComponent(slug)}`, { signal });
}

export function fetchRelatedProducts(product, limit = 4, signal) {
  return apiRequest(
    `/api/products/${encodeURIComponent(product.slug)}/related?limit=${limit}`,
    { signal }
  );
}

export function fetchFeaturedProducts(limit = 4, signal) {
  return apiRequest(`/api/featured-products?limit=${limit}`, { signal });
}

export function fetchNewArrivals(limit = 4, signal) {
  return apiRequest(`/api/new-arrivals?limit=${limit}`, { signal });
}
