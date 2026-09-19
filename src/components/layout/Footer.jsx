import { Link } from "react-router-dom";
import { AtSign, Globe, Leaf, Rss, Share2 } from "lucide-react";

const columns = [
  {
    title: "Shop",
    links: [
      { label: "All products", to: "/shop" },
      { label: "Cookware", to: "/shop?category=cookware" },
      { label: "Drinkware", to: "/shop?category=drinkware" },
      { label: "New arrivals", to: "/shop?sort=newest" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Track order", to: "/account" },
      { label: "Shipping & returns", to: "/shop" },
      { label: "FAQs", to: "/shop" },
      { label: "Contact us", to: "/shop" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Our story", to: "/" },
      { label: "Sustainability", to: "/" },
      { label: "Wholesale", to: "/" },
      { label: "Careers", to: "/" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-24 bg-moss-900 text-cream-100">
      <div className="container-shop grid grid-cols-2 gap-10 py-16 md:grid-cols-5">
        <div className="col-span-2">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-50 text-moss-800">
              <Leaf size={18} />
            </span>
            <span className="font-display text-xl text-cream-50">Homeleaf</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-cream-100/70">
            Thoughtfully made, planet-friendly kitchenware — sustainable materials,
            low-impact production, and ethical sourcing in every piece.
          </p>
          <div className="mt-6 flex items-center gap-3">
            {[AtSign, Share2, Rss, Globe].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social media link"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-cream-50/15
                  text-cream-100 transition-colors hover:bg-cream-50/10"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="eyebrow text-cream-100/60">{col.title}</h4>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-cream-100/85 transition-colors hover:text-cream-50"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-cream-50/10 py-6">
        <div className="container-shop flex flex-col items-center justify-between gap-3 text-xs text-cream-100/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Homeleaf. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/" className="hover:text-cream-100">Privacy</Link>
            <Link to="/" className="hover:text-cream-100">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
