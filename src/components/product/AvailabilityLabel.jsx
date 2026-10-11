import { getStockAvailability } from "../../utils/stockAvailability";

const STATUS_STYLES = {
  "in-stock": "text-moss-700",
  "low-stock": "text-clay-600",
  "out-of-stock": "text-clay-600",
  unknown: "text-ink-400",
};

export default function AvailabilityLabel({ stock, className = "" }) {
  const availability = getStockAvailability(stock);

  return (
    <span
      role="status"
      className={`text-xs font-medium ${STATUS_STYLES[availability.status]} ${className}`}
    >
      {availability.label}
    </span>
  );
}
