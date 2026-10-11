import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import FilterSidebar from "../components/product/FilterSidebar";
import SortDropdown from "../components/product/SortDropdown";
import ProductGrid from "../components/product/ProductGrid";
import { useProducts } from "../hooks/useProducts";
import { useDebounce } from "../hooks/useDebounce";
import { useCategories } from "../hooks/useCategories";

const DEFAULT_FILTERS = { minPrice: 0, maxPrice: 16600, minRating: 0, inStockOnly: false };

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const category = searchParams.get("category") || "all";
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sort") || "popularity";
  const debouncedSearch = useDebounce(search, 200);
  const { categories, error: categoriesError } = useCategories();

  const queryParams = useMemo(
    () => ({ category, search: debouncedSearch, sortBy, ...filters }),
    [category, debouncedSearch, sortBy, filters]
  );

  const { products, isLoading, error } = useProducts(queryParams);

  const setCategory = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id === "all") {
      next.delete("category");
    } else {
      next.set("category", id);
    }
    setSearchParams(next);
  };

  const setSort = (value) => {
    const next = new URLSearchParams(searchParams);
    next.set("sort", value);
    setSearchParams(next);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchParams({});
  };

  const activeCategory = category !== "all"
    ? categories.find((item) => item.id === category)
    : null;

  return (
    <div className="container-shop py-10">
      <div className="mb-8">
        <span className="eyebrow">Shop</span>
        <h1 className="mt-2 font-display text-3xl text-ink-900 sm:text-4xl">
          {activeCategory ? activeCategory.name : search ? `Results for “${search}”` : "All products"}
        </h1>
        {activeCategory && <p className="mt-1 text-sm text-ink-400">{activeCategory.tagline}</p>}
        {categoriesError && <p role="alert" className="mt-2 text-sm text-clay-600">{categoriesError}</p>}
      </div>

      <div className="flex gap-10">
        <FilterSidebar
          filters={{ category, ...filters }}
          categories={categories}
          onChange={(next) => {
            const { category: nextCategory, ...rest } = next;
            if (nextCategory !== category) setCategory(nextCategory);
            setFilters(rest);
          }}
          onReset={resetFilters}
          className="hidden w-64 shrink-0 lg:block"
        />

        <div className="min-w-0 flex-1">
          <div className="mb-6 flex items-center justify-between gap-3">
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="btn-secondary lg:hidden"
            >
              <SlidersHorizontal size={15} />
              Filters
            </button>
            <p className="hidden text-sm text-ink-400 sm:block">
              {isLoading ? "Loading…" : `${products.length} products`}
            </p>
            <SortDropdown value={sortBy} onChange={setSort} />
          </div>

          <ProductGrid products={products} isLoading={isLoading} error={error} />
        </div>
      </div>

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-cream-50 p-6 shadow-lift">
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="btn-icon mb-4 ml-auto flex h-9 w-9 text-ink-800"
              aria-label="Close filters"
            >
              <X size={20} />
            </button>
            <FilterSidebar
              filters={{ category, ...filters }}
              categories={categories}
              onChange={(next) => {
                const { category: nextCategory, ...rest } = next;
                if (nextCategory !== category) setCategory(nextCategory);
                setFilters(rest);
              }}
              onReset={resetFilters}
            />
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="btn-primary mt-8 w-full"
            >
              Show results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
