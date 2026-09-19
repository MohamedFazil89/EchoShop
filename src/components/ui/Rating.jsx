import { Star } from "lucide-react";

export default function Rating({ value = 0, count, size = 14, className = "" }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center" role="img" aria-label={`Rated ${value} out of 5`}>
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i + 1 <= Math.round(value);
          return (
            <Star
              key={i}
              size={size}
              className={filled ? "fill-clay-500 text-clay-500" : "fill-transparent text-ink-800/20"}
              strokeWidth={1.5}
            />
          );
        })}
      </div>
      {count !== undefined && (
        <span className="text-xs text-ink-400">({count})</span>
      )}
    </div>
  );
}
