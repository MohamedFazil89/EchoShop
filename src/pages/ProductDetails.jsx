import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Heart, PackageX, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import ProductGallery from "../components/product/ProductGallery";
import RelatedProducts from "../components/product/RelatedProducts";
import AvailabilityLabel from "../components/product/AvailabilityLabel";
import Rating from "../components/ui/Rating";
import Badge from "../components/ui/Badge";
import QuantityInput from "../components/ui/QuantityInput";
import { Spinner } from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import { formatCurrency } from "../utils/formatCurrency";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";
import { fetchProductBySlug, fetchRelatedProducts } from "../services/productService";
import { useToast } from "../hooks/useToast";
import { canPurchaseStock } from "../utils/stockAvailability";

export default function ProductDetails() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [status, setStatus] = useState("loading");
  const [quantity, setQuantity] = useState(1);
  const [activeColor, setActiveColor] = useState(0);
  const [error, setError] = useState("");

  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setQuantity(1);

    fetchProductBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
        setStatus("success");
        fetchRelatedProducts(data)
          .then((relatedData) => {
            if (!cancelled) setRelated(relatedData);
          })
          .catch((relatedError) => {
            if (!cancelled) showToast(relatedError.message, { type: "error" });
          });
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message);
          setStatus(requestError.status === 404 ? "not-found" : "error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug, showToast]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  if (status === "not-found") {
    return (
      <div className="container-shop py-16">
        <EmptyState
          icon={PackageX}
          title="Product not found"
          description="This item may have been removed or the link is incorrect."
          actionLabel="Back to shop"
          actionTo="/shop"
        />
      </div>
    );
  }

  if (status === "error") {
    return <div role="alert" className="container-shop py-16 text-sm text-clay-600">{error}</div>;
  }

  const wishlisted = isWishlisted(product.id);
  const canPurchase = canPurchaseStock(product.stock);
  const quantityLimit = canPurchase ? product.stock : quantity;

  return (
    <div className="container-shop py-10">
      <nav className="mb-6 text-xs text-ink-400" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-ink-800">Home</Link>
        <span className="mx-1.5">/</span>
        <Link to="/shop" className="hover:text-ink-800">Shop</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-600">{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={product.images} title={product.title} />

        <div>
          <div className="flex items-center gap-2">
            {product.isNew && <Badge variant="new">New</Badge>}
            {product.compareAtPrice && <Badge variant="sale">Sale</Badge>}
          </div>
          {product.brand && (
            <p className="mt-4 text-xs uppercase tracking-wide text-moss-600">{product.brand}</p>
          )}
          <h1 className="mt-1 font-display text-3xl text-ink-900 sm:text-4xl">{product.title}</h1>
          <p className="mt-1 text-sm text-ink-400">{product.subtitle}</p>

          <div className="mt-3">
            <Rating value={product.rating} count={product.reviewCount} />
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-3xl text-ink-900">
              {formatCurrency(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-base text-ink-400 line-through">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>

          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink-600">
            {product.description}
          </p>

          {product.colors?.length > 0 && (
            <div className="mt-6">
              <p className="eyebrow mb-2.5">Color</p>
              <div className="flex gap-2.5">
                {product.colors.map((color, i) => (
                  <button
                    key={color}
                    onClick={() => setActiveColor(i)}
                    aria-label={`Select color ${i + 1}`}
                    aria-pressed={activeColor === i}
                    className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-cream-50 transition-all
                      ${activeColor === i ? "ring-moss-700" : "ring-transparent"}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <QuantityInput value={quantity} onChange={setQuantity} max={quantityLimit} />
            <button
              onClick={() => addItem(product, quantity)}
              disabled={!canPurchase}
              className="btn-primary flex-1 sm:flex-none sm:px-10"
            >
              {canPurchase ? "Add to cart" : "Unavailable"}
            </button>
            <button
              onClick={() => toggleWishlist(product)}
              aria-pressed={wishlisted}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className="btn-icon h-12 w-12 border border-ink-800/15 text-ink-800"
            >
              <Heart size={18} className={wishlisted ? "fill-clay-500 text-clay-500" : ""} />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
            <AvailabilityLabel stock={product.stock} />
            {canPurchase && (
              <p className="text-xs text-ink-400">Usually ships within 2 business days.</p>
            )}
          </div>

          <ul className="mt-8 grid grid-cols-1 gap-3 border-t border-ink-800/[0.06] pt-6 sm:grid-cols-3">
            <li className="flex items-center gap-2.5 text-xs text-ink-600">
              <Truck size={16} className="text-moss-700" /> Free shipping over ₹6,225
            </li>
            <li className="flex items-center gap-2.5 text-xs text-ink-600">
              <RotateCcw size={16} className="text-moss-700" /> 30-day easy returns
            </li>
            <li className="flex items-center gap-2.5 text-xs text-ink-600">
              <ShieldCheck size={16} className="text-moss-700" /> 2-year warranty
            </li>
          </ul>

          {product.features?.length > 0 && (
            <div className="mt-8 border-t border-ink-800/[0.06] pt-6">
              <p className="eyebrow mb-3">Details</p>
              <ul className="space-y-2 text-sm text-ink-600">
                {product.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-moss-600" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <RelatedProducts products={related} />
    </div>
  );
}
