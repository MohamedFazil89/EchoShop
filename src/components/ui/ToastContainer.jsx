import { CheckCircle2, Info, X } from "lucide-react";
import { useToast } from "../../context/ToastContext";

const ICONS = {
  success: <CheckCircle2 size={18} className="text-moss-700" />,
  info: <Info size={18} className="text-ink-600" />,
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-20 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:right-6"
      aria-live="assertive"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="animate-toastIn flex items-center gap-3 rounded-2xl border border-ink-800/[0.06]
            bg-cream-50 px-4 py-3 shadow-lift"
        >
          {ICONS[toast.type] ?? ICONS.info}
          <p className="flex-1 text-sm font-medium text-ink-800">{toast.message}</p>
          <button
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="btn-icon h-6 w-6 shrink-0 text-ink-400"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
