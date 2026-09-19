# Homeleaf — Eco-Friendly Kitchenware Storefront

A complete, scalable React + Vite e-commerce frontend inspired by the reference
layout: sage-green/cream palette, editorial serif headings, rounded product
cards, and a warm, premium "sustainable kitchenware" feel.

## Tech stack

- React 19 + Vite
- Tailwind CSS (custom design tokens — see `tailwind.config.js`)
- React Router v7
- Context API + `useReducer` for cart / wishlist / auth / toast state
- lucide-react icons
- Mock data + a `services/` layer shaped like a real API client

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
npm run build      # production build to /dist
npm run preview    # preview the production build locally
```

No environment variables are required to run the demo — everything is backed
by mock data and `localStorage`.

## Project structure

```
src/
  assets/                 Local images/icons (empty — currently using remote URLs)
  components/
    home/                 Hero, CategoryStrip, ProductRail, Newsletter
    layout/                Navbar, MobileMenu, Footer, Layout (Outlet shell)
    product/               ProductCard, ProductGrid, FilterSidebar, SortDropdown,
                            ProductGallery, RelatedProducts
    ui/                    Rating, Badge, QuantityInput, Spinner/skeletons,
                            EmptyState, ToastContainer
  context/                 CartContext, WishlistContext, AuthContext, ToastContext
  data/                    products.js, categories.js (mock catalog)
  hooks/                   useCart/useWishlist/useAuth/useToast (re-exports),
                            useLocalStorage, useProducts, useDebounce
  pages/                   Home, Shop, ProductDetails, Cart, Wishlist, Checkout,
                            Login, Register, Account, NotFound
  services/                productService.js, authService.js — the "API layer"
  utils/                   formatCurrency.js, calculateCart.js
  App.jsx                  Route table
  main.jsx                 Provider tree + router root
  index.css                Tailwind layers + design-system component classes
```

## How the state management works

**Cart (`CartContext.jsx`)** — a `useReducer` (`ADD_ITEM`, `REMOVE_ITEM`,
`UPDATE_QUANTITY`, `CLEAR_CART`) holds the cart array. A `useEffect` mirrors
every state change into `localStorage` via the generic `useLocalStorage` hook,
so the cart survives refreshes. `totals` (subtotal, discount, shipping, total)
are derived with `useMemo` from `utils/calculateCart.js`, kept as pure
functions so they're easy to unit test independently of React.

**Wishlist (`WishlistContext.jsx`)** — simpler get/set state directly backed
by `useLocalStorage`, with `toggleWishlist`/`isWishlisted` helpers.

**Auth (`AuthContext.jsx`)** — wraps a mock `authService` (also
`localStorage`-backed) that simulates registration/login with latency and
error cases (e.g. duplicate email, wrong password). Swap the internals of
`authService.js` for real `fetch`/SDK calls and every consuming component
keeps working unchanged.

**Toast (`ToastContext.jsx`)** — a small independent queue that Cart/Wishlist/
Auth actions push into; `ToastContainer` renders it fixed to the viewport.

Every context exposes a `use*` hook that throws if called outside its
provider, so misuse fails fast during development. The provider order in
`main.jsx` is: `ToastProvider` → `AuthProvider` → `CartProvider` →
`WishlistProvider`, since the latter three all call `useToast()`.

**Data fetching** — `services/productService.js` wraps the mock catalog in
`Promise`-returning functions with artificial latency, filtering, and
sorting — this is the seam where a real backend plugs in. `hooks/useProducts.js`
wraps that service with `loading` / `success` / `error` state for the Shop
page; `components/home/ProductRail.jsx` does the same inline for the
homepage's featured/new-arrivals rails.

## Connecting a real backend later

1. Replace the function bodies in `src/services/productService.js` and
   `src/services/authService.js` with real `fetch()` (or your SDK) calls,
   keeping the same function signatures and return shapes (or update the
   handful of components that assume specific field names — `title`, `price`,
   `images[0]`, etc.).
2. Swap `authService`'s localStorage-backed session for real JWT/cookie-based
   auth, and consider moving cart/wishlist persistence server-side (merging
   the local cart into the account's cart on login is the usual pattern).
3. If you introduce SSR/edge rendering later, the `services/` boundary means
   only that layer needs to change — components and contexts are unaffected.

## Adding a payment gateway

The `Checkout.jsx` page currently simulates payment with a `setTimeout` and a
plain card-details form (no real card data is transmitted or stored). To go
live:

- **Stripe** is the most common fit: use Stripe Elements/Payment Element for
  PCI-compliant card capture instead of the raw `<input>`s, create a
  PaymentIntent from your backend, and confirm it client-side.
- **Razorpay** is a strong option if you're targeting Indian customers —
  similarly, create an order server-side and open the Razorpay checkout
  modal from the client.
- Either way, never send raw card numbers to your own server — the gateway's
  client SDK should tokenize the card, and your backend should only see the
  token/PaymentIntent id.
- On success, call `clearCart()` from `useCart()` (already wired) and
  redirect/display the confirmation state that's already built into
  `Checkout.jsx`.

## Notes

- Product images use `picsum.photos` placeholders (deterministic per seed) so
  the app has no external image-hosting dependency — replace `src/data/products.js`
  image URLs with real product photography when you have it.
- Currency formatting defaults to USD (`utils/formatCurrency.js`) to match the
  reference design; pass a different `currency`/`locale` argument to localize.
- Accessibility: interactive icons have `aria-label`s, form fields use
  associated `<label>`s, focus states are visible (`:focus-visible` in
  `index.css`), and the mobile drawer/mobile filters trap focus within a
  dismissible overlay.
