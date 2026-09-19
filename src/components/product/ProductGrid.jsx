import { SearchX } from "lucide-react";
import ProductCard from "./ProductCard";
import EmptyState from "../ui/EmptyState";
import { ProductGridSkeleton } from "../ui/Spinner";
import { useScrollAnimation } from "../../hooks/useScrollAnimation";

export default function ProductGrid({ products, isLoading, error }) {
  const { ref, isVisible } = useScrollAnimation(null, {
    resetKey: products?.map((product) => product.id).join(","),
    // A long results grid can never have 15% of its full height in the
    // viewport. Reveal it as soon as any part reaches the viewport instead.
    threshold: 0,
    rootMargin: "0px 0px -8% 0px",
  });
  if (isLoading) return <ProductGridSkeleton />;

  if (error) {
    return (
      <EmptyState
        icon={SearchX}
        title="Couldn't load products"
        description={error}
      />
    );
  }

  if (!products || products.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="No products match your filters"
        description="Try widening your price range or clearing a filter."
      />
    );
  }

  return (
    <div ref={ref} className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} isRevealed={isVisible} revealDelay={index * 80} />
      ))}
    </div>
  );
}
