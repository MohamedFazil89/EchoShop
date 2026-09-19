const VARIANTS = {
  new: "bg-moss-700 text-cream-50",
  sale: "bg-clay-500 text-cream-50",
  bestseller: "bg-ink-800 text-cream-50",
  outline: "bg-cream-50/90 text-ink-800 border border-ink-800/15",
  low: "bg-cream-200 text-clay-600",
};

export default function Badge({ children, variant = "outline", className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold
        uppercase tracking-wide ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
