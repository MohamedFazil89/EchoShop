# Homeleaf — Eco-Friendly Kitchenware Storefront

A React + Vite e-commerce storefront for sustainable kitchenware, backed by a
local PostgreSQL database and a small Express API.

## Tech stack

- React 19, Vite, React Router, Tailwind CSS
- Express API with PostgreSQL (`pg`)
- bcrypt password hashing and database-backed HttpOnly cookie sessions
- Context API for transient UI state (cart, wishlist, auth, toasts)

## Local setup with pgAdmin

1. Install PostgreSQL and create a database named `ecoshop` in pgAdmin.
2. Select `ecoshop`, open **Tools → Query Tool**, open
   `backend/sql/schema.sql`, and execute it. The schema script is safe to run
   again.
3. Copy `.env.example` to `.env` and set `DATABASE_URL` to your local PostgreSQL
   connection string. Keep `.env` private.
4. Install dependencies and seed the product/category catalog:

   ```bash
   npm install
   npm run db:seed
   ```

5. Start the API and frontend in separate terminals:

   ```bash
   npm run dev:api    # http://localhost:3000
   npm run dev        # http://localhost:5173; Vite proxies /api to the API
   ```

The frontend reports database/API errors instead of presenting stale demo data
as a successful operation. `npm run build` creates the frontend production
build. Production must route `/api` to the backend and serve both from the same
origin for the session cookie to work.

## Project structure

```text
src/
  components/      Home, layout, product, account, payment, and UI components
  context/          Auth, cart, wishlist, and toast React providers
  data/             Product and category seed data
  hooks/            Context hooks, catalog hooks, and UI hooks
  pages/            Store, checkout, auth, account, and order pages
  services/         API client plus auth, catalog, cart, wishlist, profile, orders
  utils/            Currency, cart calculation, and payment-form helpers
backend/
  sql/schema.sql    pgAdmin-ready PostgreSQL schema
  src/server.js     Express API routes and order transactions
  src/auth.js       Password and session handling
  src/db.js         PostgreSQL connection pool and transaction helper
  src/seed.js       Seed categories and products from src/data/
```

## Data model and behavior

The schema includes categories, products and inventory, customer accounts,
hashed-password session records, carts and cart items, wishlists, orders, and
order-item snapshots. Monetary values are stored in integer paise and returned
to the existing UI as rupees. The catalog seed command upserts its categories
and stable product IDs, preserves existing inventory quantities, and does not
delete products, accounts, or orders.

- Product browsing, search, filtering, sorting, featured products, related
  products, and category navigation read from PostgreSQL.
- Product cards, product details, carts, and checkout show stock availability
  without exposing exact quantities except for low-stock warnings. Low stock
  means 3 or fewer units by default; set `VITE_LOW_STOCK_THRESHOLD` to a
  positive integer to configure the warning boundary. Missing stock is shown
  as unknown, while the API remains authoritative for cart and order validation.
- The seed catalog contains 28 kitchenware and home products across the
  categories served by the existing category API. There is no admin product
  management interface.
- The 20 existing demo products keep their stable IDs but have intentionally
  corrected, generic product names and descriptions where prior claims were
  unsupported. The seed adds eight products (`p21`–`p28`). Existing product
  stock is not changed by an upsert; new products start with the seed quantity.
- Catalog photography is stored locally in `public/products/`, included in the
  Vite build, and referenced by the PostgreSQL seed. Asset mappings and image
  verification results are recorded in
  [the catalog image validation report](./docs/product-image-validation.md).
  Original source and license metadata is not currently tracked in the repository.
- Registered customers' profiles, carts, wishlists, and orders are stored in
  PostgreSQL and scoped to their signed-in account. Guest carts and wishlists
  exist only in memory and are merged into the account at sign-in.
- Guest checkout remains available. The API reads product prices and stock,
  computes shipping/totals, and inserts order snapshots while decrementing
  inventory in a transaction. Client totals are never trusted. Checkout
  submissions use an attempt-scoped idempotency key so transient retries do
  not create duplicate orders or decrement inventory twice.
- Product availability uses the existing nonnegative `products.stock` value.
  The storefront labels positive stock at or below the low-stock threshold as
  “Only N left”; the threshold defaults to 3 and can be configured with
  `VITE_LOW_STOCK_THRESHOLD`. Existing stock is preserved by catalog reseeds,
  so inventory changes for existing products must be made deliberately in the
  database.
- The light/dark theme preference is stored locally in the browser and uses
  the operating-system preference until the customer makes an explicit choice.
  Theme selection does not require a database column or API call.
- Sessions use HttpOnly, SameSite=Lax cookies that are Secure in production.
  Passwords are bcrypt-hashed. Card fields are not sent to the API or stored;
  checkout is still a simulated payment flow.
- This project has no admin dashboard, product CRUD, shipping/tracking
  integration, coupon engine, or payment gateway.

### Persistence inventory

| Data | Previous source | PostgreSQL destination / behavior |
| --- | --- | --- |
| Catalog, category labels, image URLs, price, inventory | `src/data/`, plus the old DummyJSON product request | `categories` and `products`; `npm run db:seed` imports the starter data |
| Customer identity and password | `ecoshop_users` in browser storage (plaintext password) | `users` with a bcrypt hash; authenticated by expiring `user_sessions` |
| Profile and delivery details | `ec_user` in browser storage | `users` profile columns and JSON address |
| Registered customer's cart | `ecoshop_cart` in browser storage | `carts` and `cart_items`; guests keep only in-memory state |
| Wishlist | `ecoshop_wishlist` in browser storage | `wishlist_items` for signed-in users; guests keep only in-memory state |
| Order headers and delivery snapshot | `ec_orders` in browser storage | `orders` and `order_items`; product title, SKU, image, unit price, and quantity are snapshotted |
| Card/payment data | In-memory demo form only | Not sent to the API and not stored; order payment status remains `simulated` |
| Toasts, filters, and unfinished checkout form | React component state | Intentionally transient; not persisted |

### Existing browser data

The old demo kept users (including plaintext passwords), profiles, carts,
wishlists, and orders in browser `localStorage`. The migrated app no longer
reads or deletes those records. They cannot be safely imported as authenticated
PostgreSQL accounts without verifying each customer's identity; existing demo
users should create a new account. Clearing browser storage does not delete
PostgreSQL records.

## Other notes

- Product ratings and discount prices are left unset until real review and
  pricing information is available; catalog prices are stored as INR paise.
- Currency formatting defaults to INR in `src/utils/formatCurrency.js`.
- The payment form is for the demo only. For a real launch, use hosted payment
  fields such as Stripe Elements or Razorpay Checkout; never send raw card
  details to this API. Current card checks only validate supported formats
  locally; they do not authorize a charge. Demo orders remain `simulated`.
- Interactive icons and form fields include accessible labels and focus states.
