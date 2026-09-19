import { Minus, Plus } from "lucide-react";

export default function QuantityInput({ value, onChange, min = 1, max = 99, size = "md" }) {
  const dims = size === "sm" ? "h-8 w-8" : "h-10 w-10";

  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className="inline-flex items-center rounded-full border border-ink-800/15 bg-cream-50">
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={`${dims} flex items-center justify-center rounded-full text-ink-600
          hover:bg-moss-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors`}
      >
        <Minus size={14} />
      </button>
      <span
        className="w-8 text-center text-sm font-semibold text-ink-800 tabular-nums"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={`${dims} flex items-center justify-center rounded-full text-ink-600
          hover:bg-moss-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors`}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
