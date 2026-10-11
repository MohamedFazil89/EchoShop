import { Link } from "react-router-dom";
import { useCategories } from "../../hooks/useCategories";
import SplitText from "../ui/SplitText";
import { handleProductImageError } from "../../utils/productImage";

export default function CategoryStrip() {
  const { categories, error } = useCategories();

  return (
    <section className="container-shop mt-20">
      <div className="flex items-end justify-between">
        <div>
          <span className="eyebrow">Browse</span>
          <h2 className="mt-2 font-display text-2xl text-ink-900 sm:text-3xl"><SplitText text="Shop by category" /></h2>
        </div>
        <Link to="/shop" className="link-underline hidden text-sm font-semibold text-moss-700 sm:inline">
          View all
        </Link>
      </div>

      {error ? (
        <p role="alert" className="mt-7 text-sm text-clay-600">{error}</p>
      ) : (
      <div className="mt-7 flex gap-4 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-6">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/shop?category=${cat.id}`}
            className="group relative block w-40 shrink-0 overflow-hidden rounded-2xl sm:w-auto"
          >
            <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl bg-moss-100">
              <img
                src={cat.image}
                alt=""
                loading="lazy"
                onError={handleProductImageError}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-ink-900/70 via-ink-900/0 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="font-display text-base text-cream-50">{cat.name}</p>
              <p className="mt-0.5 text-xs text-cream-100/75">{cat.tagline}</p>
            </div>
          </Link>
        ))}
      </div>
      )}
    </section>
  );
}
