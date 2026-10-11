import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";
import Rating from "../components/ui/Rating";
import { useWishlist } from "../hooks/useWishlist";
import { useCart } from "../hooks/useCart";
import { formatCurrency } from "../utils/formatCurrency";

export default function Wishlist() {
  const { items, isLoading, loadError, removeFromWishlist } = useWishlist();
  const { addItem } = useCart();

  if (isLoading) {
    return <div className="container-shop py-16 text-center text-sm text-ink-400">Loading your wishlist…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="container-shop py-16">
        {loadError && <p role="alert" className="mb-5 text-sm text-clay-600">{loadError}</p>}
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save pieces you love here and come back to them anytime."
          actionLabel="Browse products"
          actionTo="/shop"
        />
      </div>
    );
  }

  const handleMoveToCart = (wishlistItem) => {
    addItem(wishlistItem, 1);
  };

  return (
    <div className="container-shop py-10">
      {loadError && <p role="alert" className="mb-5 text-sm text-clay-600">{loadError}</p>}
      <h1 className="font-display text-3xl text-ink-900 sm:text-4xl">Your wishlist</h1>
      <p className="mt-1 text-sm text-ink-400">{items.length} saved item{items.length > 1 ? "s" : ""}</p>

      <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="group">
            <div className="relative overflow-hidden rounded-2xl bg-moss-100">
              <Link to={`/product/${item.slug}`} className="block aspect-[4/5] w-full overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                />
              </Link>
              <button
                onClick={() => removeFromWishlist(item.id, item.title)}
                aria-label={`Remove ${item.title} from wishlist`}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full
                  bg-cream-50/90 text-ink-800 shadow-soft hover:text-clay-600"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <div className="mt-3">
              <Link to={`/product/${item.slug}`} className="font-display text-[15px] text-ink-900 hover:underline">
                {item.title}
              </Link>
              <Rating value={item.rating} className="mt-1.5" />
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="font-semibold text-ink-800">{formatCurrency(item.price)}</span>
                {item.compareAtPrice && (
                  <span className="text-xs text-ink-400 line-through">
                    {formatCurrency(item.compareAtPrice)}
                  </span>
                )}
              </div>
              <button onClick={() => handleMoveToCart(item)} className="btn-secondary mt-3 w-full text-xs">
                <ShoppingBag size={14} />
                Move to cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
