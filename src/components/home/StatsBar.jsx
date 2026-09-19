import { useEffect, useRef, useState } from "react";
import { useScrollAnimation } from "../../hooks/useScrollAnimation";

const stats = [
  { value: 500, suffix: "+", label: "Products" },
  { value: 10, suffix: "k+", label: "Customers" },
  { value: 4.8, suffix: "★", label: "Rating" },
  { value: 0, suffix: "", label: "Free shipping" },
];

function Counter({ value, suffix, label, shouldAnimate, reducedMotion }) {
  const [displayValue, setDisplayValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!shouldAnimate || started.current) return undefined;
    started.current = true;
    if (reducedMotion || value === 0) {
      setDisplayValue(value);
      return undefined;
    }

    const startedAt = performance.now();
    let frameId;
    const update = (now) => {
      const progress = Math.min((now - startedAt) / 1800, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayValue(value % 1 ? Number((value * eased).toFixed(1)) : Math.round(value * eased));
      if (progress < 1) frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [reducedMotion, shouldAnimate, value]);

  return (
    <div className="text-center">
      <p className="font-display text-3xl text-ink-900 sm:text-4xl">{value === 0 ? "Free" : displayValue}{suffix}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-widest2 text-ink-400">{label}</p>
    </div>
  );
}

export default function StatsBar() {
  const { ref, isVisible, reducedMotion } = useScrollAnimation(null, { threshold: 0.5 });

  return (
    <section ref={ref} className="container-shop mt-20">
      <div className="grid grid-cols-2 gap-y-8 rounded-3xl bg-moss-100 px-6 py-9 sm:grid-cols-4 sm:px-10">
        {stats.map((stat) => <Counter key={stat.label} {...stat} shouldAnimate={isVisible} reducedMotion={reducedMotion} />)}
      </div>
    </section>
  );
}
