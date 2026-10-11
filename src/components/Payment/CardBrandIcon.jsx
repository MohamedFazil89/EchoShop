import { getBrandLabel } from "../../utils/payment";

/**
 * Card brand icon component.
 * Uses Lucide icons via simple SVG paths for Visa, Mastercard, Amex, RuPay.
 * For a real product you might want to use actual brand logos from the gateway
 * or an icon set like react-payments.
 */
export function CardBrandIcon({ brand, className = "" }) {
  // Brand colors for visual feedback
  const colors = {
    visa: "#1A1F71",
    mastercard: "#F79E1B",
    amex: "#0080C0",
    rupay: "#FF9933",
    unknown: "#6B7280",
  };

  const color = colors[brand] || colors.unknown;
  const label = getBrandLabel(brand);

  // Simple geometric icons representing the brands
  // These are intentionally minimalistic to avoid trademark issues in a demo
  // In production you'd use the actual brand assets from your payment gateway
  const getPaths = (brand) => {
    switch (brand) {
      case "visa": {
        // Simple blue rectangle with white cutout (stylized Visa)
        return (
          <>
            <rect x="0" y="0" width="20" height="12" rx="2" fill={color} />
            <rect x="4" y="3" width="12" height="6" rx="1" fill="#fff" />
          </>
        );
      }
      case "mastercard": {
        // Two overlapping circles (stylized Mastercard)
        return (
          <>
            <circle cx="8" cy="10" r="6" fill={color} />
            <circle cx="12" cy="10" r="6" fill={color} opacity={0.9} />
          </>
        );
      }
      case "amex": {
        // Simple representation: blue square with white corners
        return (
          <>
            <rect x="0" y="0" width="18" height="12" rx="2" fill={color} />
            <path d="M3 3h12v6H3z M6 6h6v3H6z" fill="#fff" />
          </>
        );
      }
      case "rupay": {
        // Stylized "R" shape in orange
        return (
          <>
            <path d="M4 3h12v2H4zM4 7h8v2H4zM4 11h6v2H4z" fill={color} />
          </>
        );
      }
      default: {
        // Generic rounded square
        return <rect x="0" y="0" width="18" height="12" rx="2" fill={color} />;
      }
    }
  };

  return (
    <svg
      width="20"
      height="12"
      viewBox="0 0 20 12"
      role="img"
      aria-label={label}
      className={className}
    >
      {getPaths(brand)}
    </svg>
  );
}