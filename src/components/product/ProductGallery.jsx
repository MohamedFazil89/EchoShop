import { useState } from "react";
import { FALLBACK_PRODUCT_IMAGE, handleProductImageError } from "../../utils/productImage";

export default function ProductGallery({ images, title }) {
  const [active, setActive] = useState(0);
  const activeImage = images?.[active] || FALLBACK_PRODUCT_IMAGE;

  return (
    <div>
      <div className="aspect-[4/5] w-full overflow-hidden rounded-3xl bg-moss-100">
        <img
          src={activeImage}
          alt={`${title} — view ${active + 1}`}
          loading="eager"
          fetchPriority="high"
          onError={handleProductImageError}
          className="h-full w-full object-cover"
        />
      </div>
      {Array.isArray(images) && images.length > 1 && (
        <div className="mt-4 flex gap-3">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1} of ${title}`}
              aria-current={active === i}
              className={`h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors
                ${active === i ? "border-moss-700" : "border-transparent"}`}
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                onError={handleProductImageError}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
