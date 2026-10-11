import Rating from "../ui/Rating";

export default function FilterSidebar({
  filters,
  onChange,
  onReset,
  categories = [],
  className = "",
}) {
  const set = (patch) => onChange({ ...filters, ...patch });

  return (
    <aside className={`space-y-8 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-ink-900">Filters</h2>
        <button
          onClick={onReset}
          className="text-xs font-semibold text-moss-700 underline-offset-2 hover:underline"
        >
          Clear all
        </button>
      </div>

      {/* Category */}
      <fieldset>
        <legend className="eyebrow mb-3">Category</legend>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-600">
            <input
              type="radio"
              name="category"
              checked={filters.category === "all"}
              onChange={() => set({ category: "all" })}
              className="h-4 w-4 accent-moss-700"
            />
            All products
          </label>
          {categories.map((c) => (
            <label
              key={c.id}
              className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-600"
            >
              <input
                type="radio"
                name="category"
                checked={filters.category === c.id}
                onChange={() => set({ category: c.id })}
                className="h-4 w-4 accent-moss-700"
              />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Price */}
      <fieldset>
        <legend className="eyebrow mb-3">Price</legend>
        <div className="flex items-center gap-3">
          <label className="flex-1">
            <span className="mb-1 block text-xs text-ink-400">Min</span>
            <input
              type="number"
              min={0}
              value={filters.minPrice}
              onChange={(e) => set({ minPrice: Number(e.target.value) || 0 })}
              className="input-field py-2"
            />
          </label>
          <span className="mt-4 text-ink-400">–</span>
          <label className="flex-1">
            <span className="mb-1 block text-xs text-ink-400">Max</span>
            <input
              type="number"
              min={0}
              value={filters.maxPrice}
              onChange={(e) => set({ maxPrice: Number(e.target.value) || 0 })}
              className="input-field py-2"
            />
          </label>
        </div>
      </fieldset>

      {/* Rating */}
      <fieldset>
        <legend className="eyebrow mb-3">Minimum rating</legend>
        <div className="space-y-2">
          {[4, 3, 2, 0].map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2.5">
              <input
                type="radio"
                name="rating"
                checked={filters.minRating === r}
                onChange={() => set({ minRating: r })}
                className="h-4 w-4 accent-moss-700"
              />
              {r === 0 ? (
                <span className="text-sm text-ink-600">Any rating</span>
              ) : (
                <Rating value={r} />
              )}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Availability */}
      <fieldset>
        <legend className="eyebrow mb-3">Availability</legend>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-600">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => set({ inStockOnly: e.target.checked })}
            className="h-4 w-4 rounded accent-moss-700"
          />
          In stock only
        </label>
      </fieldset>
    </aside>
  );
}
