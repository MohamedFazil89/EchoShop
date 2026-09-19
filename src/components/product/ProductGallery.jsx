import { useState } from "react";

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 1000'%3E%3Crect width='900' height='1000' fill='%23f8f4ec'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%237a6c5e' font-family='system-ui, sans-serif' font-size='48'%3EImage unavailable%3C/text%3E%3C/svg%3E";

export default function ProductGallery({ images, title }) {
  const [active, setActive] = useState(0);
  const activeImage = images?.[active] || FALLBACK_IMAGE;

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = FALLBACK_IMAGE;
  };

  return (
    <div>
      <div className="aspect-[4/5] w-full overflow-hidden rounded-3xl bg-moss-100">
        <img
          src={activeImage}
          alt={`${title} — view ${active + 1}`}
          onError={handleImageError}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="mt-4 flex gap-3">
        {Array.isArray(images) && images.length > 0 ? (
          images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1} of ${title}`}
              aria-current={active === i}
              className={`h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors
                ${active === i ? "border-moss-700" : "border-transparent"}`}
            >
              <img src={src} alt="" onError={handleImageError} className="h-full w-full object-cover" />
            </button>
          ))
        ) : (
          <div className="h-20 w-16 rounded-xl border-2 border-transparent bg-cream-50" />
        )}
      </div>
    </div>
  );
}
