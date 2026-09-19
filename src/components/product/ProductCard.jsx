import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import Badge from "../ui/Badge";
import Rating from "../ui/Rating";
import { formatCurrency } from "../../utils/formatCurrency";
import { useCart } from "../../hooks/useCart";
import { useWishlist } from "../../hooks/useWishlist";

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 1000'%3E%3Crect width='900' height='1000' fill='%23f8f4ec'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%237a6c5e' font-family='system-ui, sans-serif' font-size='48'%3EImage unavailable%3C/text%3E%3C/svg%3E";

export default function ProductCard({ product, isRevealed = true, revealDelay = 0 }) {
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const outOfStock = product.stock === 0;

  const handleWishlist = (e) => {
    e.preventDefault();
    toggleWishlist(product);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (outOfStock) return;
    addItem(product, 1);
  };

  const imageSrc = product.images?.[0] || FALLBACK_IMAGE;
  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = FALLBACK_IMAGE;
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className={`product-card-reveal group block ${isRevealed ? "product-card-reveal--visible" : ""}`}
      aria-label={`View ${product.title}`}
      style={{ transitionDelay: `${revealDelay}ms` }}
    >
      <div className="relative overflow-hidden rounded-2xl bg-moss-100">
        <div className="aspect-[4/5] w-full overflow-hidden">
          <img
            src={imageSrc}
            alt={product.title}
            loading="lazy"
            onError={handleImageError}
            className={`clip-reveal h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] ${isRevealed ? "clip-reveal--visible" : ""}`}
          />
        </div>

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.isNew && <Badge variant="new">New</Badge>}
          {product.compareAtPrice && <Badge variant="sale">Sale</Badge>}
          {outOfStock && <Badge variant="low">Sold out</Badge>}
        </div>

        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wishlisted}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full
            bg-cream-50/90 text-ink-800 shadow-soft backdrop-blur transition-transform
            hover:scale-105 active:scale-95"
        >
          <Heart
            size={16}
            className={wishlisted ? "fill-clay-500 text-clay-500" : "text-ink-800"}
          />
        </button>

        <button
          onClick={handleAddToCart}
          disabled={outOfStock}
          className="absolute inset-x-3 bottom-3 flex translate-y-2 items-center justify-center gap-2
            rounded-full bg-ink-900/90 py-2.5 text-xs font-semibold uppercase tracking-wide text-cream-50
            opacity-0 backdrop-blur transition-all duration-300 ease-out
            group-hover:translate-y-0 group-hover:opacity-100
            disabled:cursor-not-allowed disabled:opacity-0"
        >
          <ShoppingBag size={14} />
          Add to cart
        </button>
      </div>

      <div className="mt-3">
        <p className="text-[11px] uppercase tracking-wide text-moss-600">{product.brand}</p>
        <h3 className="mt-0.5 truncate font-display text-[15px] text-ink-900">
          {product.title}
        </h3>
        <Rating value={product.rating} count={product.reviewCount} className="mt-1.5" />
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-semibold text-ink-800">{formatCurrency(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-xs text-ink-400 line-through">
              {formatCurrency(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
