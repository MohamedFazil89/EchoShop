import ProductCard from "./ProductCard";

export default function RelatedProducts({ products, title = "You may also like" }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="mt-20">
      <h2 className="font-display text-2xl text-ink-900">{title}</h2>
      <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
