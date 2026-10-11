import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Heart, Leaf, Menu, Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "../../hooks/useCart";
import { useWishlist } from "../../hooks/useWishlist";
import { useCategories } from "../../hooks/useCategories";
import MobileMenu from "./MobileMenu";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { categories, error: categoriesError } = useCategories();
  const navigate = useNavigate();

  useEffect(() => {
    const updateScrolledState = () => setScrolled(window.innerWidth >= 768 && window.scrollY > 80);
    updateScrolledState();
    window.addEventListener("scroll", updateScrolledState, { passive: true });
    window.addEventListener("resize", updateScrolledState);
    return () => {
      window.removeEventListener("scroll", updateScrolledState);
      window.removeEventListener("resize", updateScrolledState);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `link-underline font-medium transition-all duration-[350ms] ease-out ${scrolled ? "text-[13px]" : "text-sm"} ${
      isActive ? "text-ink-900" : "text-ink-600 hover:text-ink-900"
    }`;

  return (
    <>
      <header className={`sticky top-0 z-50 border-b border-ink-800/[0.06] bg-cream-50/90 backdrop-blur-md transition-all duration-[350ms] ease-out ${scrolled ? "bg-cream-50/80 shadow-soft" : ""}`}>
        <div className={`container-shop flex items-center justify-between gap-4 transition-all duration-[350ms] ease-out ${scrolled ? "h-[52px]" : "h-[72px]"}`}>
          {/* Left: mobile menu + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="btn-icon h-10 w-10 text-ink-800 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <Link to="/" className={`flex items-center gap-2 transition-transform duration-[350ms] ease-out ${scrolled ? "scale-[0.85]" : ""}`} aria-label="Homeleaf home">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-moss-700 text-cream-50">
                <Leaf size={18} />
              </span>
              <span className="font-display text-xl font-medium tracking-tightest text-ink-900">
                Homeleaf
              </span>
            </Link>
          </div>

          {/* Center: nav links */}
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/shop" className={navLinkClass}>
              Shop
            </NavLink>
            <NavLink to="/account" className={navLinkClass}>
              Profile
            </NavLink>
            <NavLink to="/account#orders" className={navLinkClass}>
              Orders
            </NavLink>
            {categories.slice(0, 4).map((c) => (
              <NavLink key={c.id} to={`/shop?category=${c.id}`} className={navLinkClass}>
                {c.name}
              </NavLink>
            ))}
          </nav>
          {categoriesError && <span role="alert" className="sr-only">{categoriesError}</span>}

          {/* Right: search + icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <form
              onSubmit={handleSearchSubmit}
              className={`relative hidden items-center overflow-hidden transition-all duration-300 sm:flex
                ${searchOpen ? "w-52" : "w-0"}`}
            >
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
                aria-label="Search products"
                className={`input-field h-10 py-0 ${searchOpen ? "opacity-100" : "opacity-0"}`}
              />
            </form>
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="btn-icon h-10 w-10 text-ink-800"
              aria-label="Toggle search"
              aria-expanded={searchOpen}
            >
              <Search size={19} />
            </button>

            <Link
              to="/account"
              className="btn-icon hidden h-10 w-10 text-ink-800 sm:inline-flex"
              aria-label="Account"
            >
              <User size={19} />
            </Link>

            <Link
              to="/wishlist"
              className="btn-icon relative h-10 w-10 text-ink-800"
              aria-label={`Wishlist, ${wishlistCount} items`}
            >
              <Heart size={19} />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-clay-500 text-[10px] font-bold text-cream-50">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              className="btn-icon relative h-10 w-10 text-ink-800"
              aria-label={`Cart, ${itemCount} items`}
            >
              <ShoppingBag size={19} />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-moss-700 text-[10px] font-bold text-cream-50">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile search row */}
        {searchOpen && (
          <form onSubmit={handleSearchSubmit} className="border-t border-ink-800/[0.06] px-5 py-3 sm:hidden">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
                aria-label="Search products"
                className="input-field pl-10"
              />
            </div>
          </form>
        )}
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
