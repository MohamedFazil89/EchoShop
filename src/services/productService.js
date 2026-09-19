const API_URL = "https://dummyjson.com/products";
const PRODUCT_LIMIT = 100;
let cachedProducts = null;

const DEFAULT_COLORS = ["#3F6247", "#B56B3C", "#221E19"];

const slugify = (value) =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");

const capitalize = (value) =>
  value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : "";

const normalizeProduct = (apiProduct) => {
  const price = Number(apiProduct.price) || 0;
  const discount = Number(apiProduct.discountPercentage) || 0;
  const compareAtPrice = discount > 0 ? Number((price / (1 - discount / 100)).toFixed(2)) : null;
  const images = Array.isArray(apiProduct.images) && apiProduct.images.length > 0
    ? apiProduct.images
    : apiProduct.thumbnail
    ? [apiProduct.thumbnail]
    : [];

  const categoryText = apiProduct.category
    ? apiProduct.category.replace(/-/g, " ")
    : "";

  return {
    id: String(apiProduct.id),
    slug: slugify(apiProduct.title),
    title: apiProduct.title,
    subtitle: categoryText ? `${capitalize(categoryText)} essentials` : "",
    category: apiProduct.category || "",
    brand: apiProduct.brand || "EcoShop",
    price,
    compareAtPrice,
    rating: Number(apiProduct.rating) || 0,
    reviewCount:
      typeof apiProduct.stock === "number"
        ? Math.max(apiProduct.stock, 1)
        : Math.round((Number(apiProduct.rating) || 0) * 20),
    stock: apiProduct.stock ?? 0,
    isNew: apiProduct.stock > 50,
    isBestseller: apiProduct.rating >= 4.5,
    colors: DEFAULT_COLORS,
    material: capitalize(apiProduct.category || "material"),
    description: apiProduct.description || "",
    features: [],
    images,
  };
};

const fetchApiProducts = async (signal) => {
  if (cachedProducts) return cachedProducts;

  const response = await fetch(`${API_URL}?limit=${PRODUCT_LIMIT}`, { signal });
  if (!response.ok) {
    throw new Error(`Products API request failed (${response.status})`);
  }

  const data = await response.json();
  if (!data?.products || !Array.isArray(data.products)) {
    throw new Error("Invalid product data received from API");
  }

  cachedProducts = data.products.map(normalizeProduct);
  return cachedProducts;
};

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
  const products = await fetchApiProducts(signal);
  let results = [...products];

  if (category && category !== "all") {
    results = results.filter((p) => p.category === category);
  }
  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }
  if (typeof minPrice === "number") {
    results = results.filter((p) => p.price >= minPrice);
  }
  if (typeof maxPrice === "number") {
    results = results.filter((p) => p.price <= maxPrice);
  }
  if (typeof minRating === "number" && minRating > 0) {
    results = results.filter((p) => p.rating >= minRating);
  }
  if (inStockOnly) {
    results = results.filter((p) => p.stock > 0);
  }

  switch (sortBy) {
    case "price-asc":
      results.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      results.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      results.sort((a, b) => b.rating - a.rating);
      break;
    case "newest":
      results.sort((a, b) => Number(b.isNew) - Number(a.isNew));
      break;
    case "popularity":
    default:
      results.sort((a, b) => b.reviewCount - a.reviewCount);
      break;
  }

  return results;
}

export async function fetchProductBySlug(slug, signal) {
  const products = await fetchApiProducts(signal);
  const product = products.find((p) => p.slug === slug);
  if (!product) throw new Error("Product not found");
  return product;
}

export async function fetchRelatedProducts(product, limit = 4, signal) {
  const products = await fetchApiProducts(signal);
  return products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limit);
}

export async function fetchFeaturedProducts(limit = 4, signal) {
  const products = await fetchApiProducts(signal);
  return products.filter((p) => p.isBestseller).slice(0, limit);
}

export async function fetchNewArrivals(limit = 4, signal) {
  const products = await fetchApiProducts(signal);
  return products.filter((p) => p.isNew).slice(0, limit);
}
