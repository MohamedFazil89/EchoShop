import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../product/ProductCard";
import { ProductGridSkeleton } from "../ui/Spinner";
import { useScrollAnimation } from "../../hooks/useScrollAnimation";
import SplitText from "../ui/SplitText";

export default function ProductRail({ title, eyebrow, fetcher, viewAllHref }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { ref: gridRef, isVisible } = useScrollAnimation(null, { resetKey: products.map((product) => product.id).join(",") });

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetcher().then((results) => {
      if (!cancelled) {
        setProducts(results);
        setIsLoading(false);
      }
    }).catch((requestError) => {
      if (!cancelled) {
        setError(requestError.message);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fetcher]);

  if (!isLoading && products.length === 0 && !error) return null;

  if (error) {
    return <p role="alert" className="container-shop mt-8 text-sm text-clay-600">{error}</p>;
  }

  return (
    <section className="container-shop mt-20">
      <div className="flex items-end justify-between">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="mt-2 font-display text-2xl text-ink-900 sm:text-3xl"><SplitText text={title} /></h2>
        </div>
        {viewAllHref && (
          <Link to={viewAllHref} className="link-underline hidden text-sm font-semibold text-moss-700 sm:inline">
            View all
          </Link>
        )}
      </div>

      <div className="mt-7">
        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <div ref={gridRef} className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} isRevealed={isVisible} revealDelay={index * 80} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
