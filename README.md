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
to the existing UI as rupees. The catalog seed command can be re-run without
resetting existing inventory.

- Product browsing, search, filtering, sorting, featured products, related
  products, and category navigation read from PostgreSQL.
- Registered customers' profiles, carts, wishlists, and orders are stored in
  PostgreSQL and scoped to their signed-in account. Guest carts and wishlists
  exist only in memory and are merged into the account at sign-in.
- Guest checkout remains available. The API reads product prices and stock,
  computes shipping/totals, and inserts order snapshots while decrementing
  inventory in a transaction. Client totals are never trusted.
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

- Product images use deterministic `picsum.photos` placeholders from the seed
  catalog. Replace them with product photography when available.
- Currency formatting defaults to INR in `src/utils/formatCurrency.js`.
- The payment form is for the demo only. For a real launch, use hosted payment
  fields such as Stripe Elements or Razorpay Checkout; never send raw card
  details to this API.
- Interactive icons and form fields include accessible labels and focus states.
