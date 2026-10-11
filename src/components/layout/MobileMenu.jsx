import { Link } from "react-router-dom";
import { LogIn, User, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useCategories } from "../../hooks/useCategories";

export default function MobileMenu({ open, onClose }) {
  const { isAuthenticated, user } = useAuth();
  const { categories, error: categoriesError } = useCategories();

  return (
    <div
      className={`fixed inset-0 z-[60] lg:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-ink-900/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <nav
        aria-label="Mobile"
        className={`absolute left-0 top-0 h-full w-[82%] max-w-xs bg-cream-50 shadow-lift
          transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <span className="font-display text-lg text-ink-900">Menu</span>
          <button onClick={onClose} className="btn-icon h-9 w-9 text-ink-800" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col px-5 py-2">
          <Link onClick={onClose} to="/" className="border-b border-ink-800/[0.06] py-3.5 text-ink-800">
            Home
          </Link>
          <Link onClick={onClose} to="/shop" className="border-b border-ink-800/[0.06] py-3.5 text-ink-800">
            Shop all
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              onClick={onClose}
              to={`/shop?category=${c.id}`}
              className="border-b border-ink-800/[0.06] py-3.5 text-ink-600"
            >
              {c.name}
            </Link>
          ))}
          {categoriesError && <p role="alert" className="py-3 text-sm text-clay-600">{categoriesError}</p>}
        </div>

        <div className="mt-4 px-5">
          <Link
            onClick={onClose}
            to="/account"
            className="btn-secondary w-full"
          >
            {isAuthenticated ? <User size={16} /> : <LogIn size={16} />}
            {isAuthenticated ? `Hi, ${user.name.split(" ")[0]}` : "Sign in"}
          </Link>
          <Link onClick={onClose} to="/account#orders" className="btn-secondary mt-3 w-full">
            Order history
          </Link>
        </div>
      </nav>
    </div>
  );
}
