export function Spinner({ size = 22, className = "" }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-ink-800/15
        border-t-moss-700 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] w-full rounded-2xl bg-moss-100" />
      <div className="mt-3 h-3 w-2/3 rounded-full bg-moss-100" />
      <div className="mt-2 h-3 w-1/3 rounded-full bg-moss-100" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
