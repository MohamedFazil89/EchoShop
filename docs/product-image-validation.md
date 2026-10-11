# Product image validation

## Result

The unavailable images were caused by stale image URLs in PostgreSQL and a
filename mismatch in the current seed source:

- The running API initially returned external `picsum.photos` URLs for all 20
  database products. The page's `img-src` Content Security Policy permits only
  same-origin, `data:`, and `blob:` images, so those external product images
  were blocked by the browser.
- The current local assets are named `p01.jpg` through `p28.jpg`, but the seed
  source generated `/products/<slug>.jpg`. Those files do not exist. Vite's
  SPA fallback returned HTML for a representative missing path
  (`/products/cast-iron-skillet.jpg`, HTTP 200, `text/html`), which is not a
  usable image response.
- Category image references also used slug-based filenames that were absent.

The canonical product and category paths now point to the files in
`public/products/`. The idempotent seed was run twice to repair the catalog
image fields and populate the current 28-product catalog. It upserts catalog
rows; it does not truncate tables or modify customer, cart, wishlist, or order
records. No historical order image snapshots existed in the database at
verification time.

## Product asset report

Every configured product image was checked for an existing file, decoded as a
JPEG with Pillow, requested from Vite's development server, and loaded in
headless Chrome on the shop page. The corresponding assets were also requested
from the production preview.

| ID | Product | Configured URL | File | Validation |
|---|---|---|---|---|
| p01 | Insulated Reusable Bottle | `/products/p01.jpg` | [public/products/p01.jpg](../public/products/p01.jpg) — JPEG, 1024×829 | Decoded; HTTP image/jpeg; loaded |
| p02 | Everyday Cookware Set | `/products/p02.jpg` | [public/products/p02.jpg](../public/products/p02.jpg) — JPEG, 360×500 | Decoded; HTTP image/jpeg; loaded |
| p03 | Kettle and Toaster Set | `/products/p03.jpg` | [public/products/p03.jpg](../public/products/p03.jpg) — JPEG, 1024×683 | Decoded; HTTP image/jpeg; loaded |
| p04 | Bamboo Utensil Holder | `/products/p04.jpg` | [public/products/p04.jpg](../public/products/p04.jpg) — JPEG, 1024×683 | Decoded; HTTP image/jpeg; loaded |
| p05 | Glass Food Storage Set | `/products/p05.jpg` | [public/products/p05.jpg](../public/products/p05.jpg) — JPEG, 500×375 | Decoded; HTTP image/jpeg; loaded |
| p06 | Reusable Produce Bag Set | `/products/p06.jpg` | [public/products/p06.jpg](../public/products/p06.jpg) — JPEG, 1024×768 | Decoded; HTTP image/jpeg; loaded |
| p07 | Ceramic Pour-Over Dripper | `/products/p07.jpg` | [public/products/p07.jpg](../public/products/p07.jpg) — JPEG, 1024×761 | Decoded; HTTP image/jpeg; loaded |
| p08 | Beeswax Food Wraps | `/products/p08.jpg` | [public/products/p08.jpg](../public/products/p08.jpg) — JPEG, 1200×1600 | Decoded; HTTP image/jpeg; loaded; visual relevance needs review |
| p09 | Cast Iron Skillet | `/products/p09.jpg` | [public/products/p09.jpg](../public/products/p09.jpg) — JPEG, 1024×765 | Decoded; HTTP image/jpeg; loaded |
| p10 | Cork Trivet Set | `/products/p10.jpg` | [public/products/p10.jpg](../public/products/p10.jpg) — JPEG, 499×357 | Decoded; HTTP image/jpeg; loaded |
| p11 | Stoneware Dinnerware Set | `/products/p11.jpg` | [public/products/p11.jpg](../public/products/p11.jpg) — JPEG, 1600×1201 | Decoded; HTTP image/jpeg; loaded |
| p12 | Countertop Compost Caddy | `/products/p12.jpg` | [public/products/p12.jpg](../public/products/p12.jpg) — JPEG, 767×1023 | Decoded; HTTP image/jpeg; loaded |
| p13 | Wooden Cutting Board | `/products/p13.jpg` | [public/products/p13.jpg](../public/products/p13.jpg) — JPEG, 1024×768 | Decoded; HTTP image/jpeg; loaded |
| p14 | Glass Tumbler Set | `/products/p14.jpg` | [public/products/p14.jpg](../public/products/p14.jpg) — JPEG, 1024×544 | Decoded; HTTP image/jpeg; loaded |
| p15 | Ceramic Hanging Planter | `/products/p15.jpg` | [public/products/p15.jpg](../public/products/p15.jpg) — JPEG, 1024×701 | Decoded; HTTP image/jpeg; loaded |
| p16 | Reusable Sandwich Bag | `/products/p16.jpg` | [public/products/p16.jpg](../public/products/p16.jpg) — JPEG, 1024×681 | Decoded; HTTP image/jpeg; loaded |
| p17 | Copper Mugs | `/products/p17.jpg` | [public/products/p17.jpg](../public/products/p17.jpg) — JPEG, 1600×1200 | Decoded; HTTP image/jpeg; loaded |
| p18 | Cotton Kitchen Apron | `/products/p18.jpg` | [public/products/p18.jpg](../public/products/p18.jpg) — JPEG, 768×1024 | Decoded; HTTP image/jpeg; loaded |
| p19 | Wooden Spoon Set | `/products/p19.jpg` | [public/products/p19.jpg](../public/products/p19.jpg) — JPEG, 1024×682 | Decoded; HTTP image/jpeg; loaded |
| p20 | Textile Table Runner | `/products/p20.jpg` | [public/products/p20.jpg](../public/products/p20.jpg) — JPEG, 768×1024 | Decoded; HTTP image/jpeg; loaded |
| p21 | Stainless Steel Lunch Box | `/products/p21.jpg` | [public/products/p21.jpg](../public/products/p21.jpg) — JPEG, 1024×718 | Decoded; HTTP image/jpeg; loaded |
| p22 | Silicone Baking Mat | `/products/p22.jpg` | [public/products/p22.jpg](../public/products/p22.jpg) — JPEG, 768×1024 | Decoded; HTTP image/jpeg; loaded |
| p23 | Cotton Kitchen Cloth Set | `/products/p23.jpg` | [public/products/p23.jpg](../public/products/p23.jpg) — JPEG, 1024×768 | Decoded; HTTP image/jpeg; loaded |
| p24 | Wooden Dish Brush | `/products/p24.jpg` | [public/products/p24.jpg](../public/products/p24.jpg) — JPEG, 500×500 | Decoded; HTTP image/jpeg; loaded; visual relevance needs review |
| p25 | Ceramic Mixing Bowl | `/products/p25.jpg` | [public/products/p25.jpg](../public/products/p25.jpg) — JPEG, 1024×682 | Decoded; HTTP image/jpeg; loaded |
| p26 | Glass Oil Dispenser | `/products/p26.jpg` | [public/products/p26.jpg](../public/products/p26.jpg) — JPEG, 1024×683 | Decoded; HTTP image/jpeg; loaded |
| p27 | Stainless Steel Colander | `/products/p27.jpg` | [public/products/p27.jpg](../public/products/p27.jpg) — JPEG, 500×500 | Decoded; HTTP image/jpeg; loaded |
| p28 | Wooden Rolling Pin | `/products/p28.jpg` | [public/products/p28.jpg](../public/products/p28.jpg) — JPEG, 1000×566 | Decoded; HTTP image/jpeg; loaded |

## Category assets

All nine category image references resolve to local JPEGs served by Vite:

| Category | File |
|---|---|
| Cookware | [public/products/p02.jpg](../public/products/p02.jpg) |
| Drinkware | [public/products/p01.jpg](../public/products/p01.jpg) |
| Kitchen Tools | [public/products/p19.jpg](../public/products/p19.jpg) |
| Food Storage | [public/products/p05.jpg](../public/products/p05.jpg) |
| Kitchen Textiles | [public/products/p18.jpg](../public/products/p18.jpg) |
| Tableware | [public/products/p11.jpg](../public/products/p11.jpg) |
| Home Decor | [public/products/p15.jpg](../public/products/p15.jpg) |
| Bakeware | [public/products/p22.jpg](../public/products/p22.jpg) |
| Kitchen Cleaning | [public/products/p23.jpg](../public/products/p23.jpg) |

## End-to-end checks

- The seeded API returned 28 products and 9 categories; no product image URL
  was external or a filesystem path.
- All 28 product images and all 9 category image references returned
  `image/jpeg` from the Vite development server; the 28 product assets also
  returned `image/jpeg` from the production preview.
- Headless Chrome loaded all 28 product-card images on `/shop` and all 4
  images rendered on a product detail page. No broken image or fallback was
  observed in either view.
- `npm run build` passed. `npm run lint` completed with existing warnings.
- `npm run test` reported 49 passing tests and 10 failing payment utility
  tests in `src/utils/payment.test.js`; those failures are unrelated to image
  loading and were not changed.

The files are technically valid and load correctly, but the contact sheet
showed that `p08.jpg` and `p24.jpg` may not depict their assigned products.
They were not replaced because the repository does not contain a verified,
relevant replacement source. Asset source and license provenance is also not
recorded in the repository; verify it before redistributing the images.
