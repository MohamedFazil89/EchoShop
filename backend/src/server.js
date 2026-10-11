import "./config.js";
import { randomBytes, randomUUID } from "node:crypto";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { pool, withTransaction } from "./db.js";
import {
  login,
  logout,
  optionalAuth,
  publicUser,
  register,
  requireAuth,
} from "./auth.js";

const app = express();
const port = Number(process.env.API_PORT) || 3000;
const FREE_SHIPPING_MINOR = 622_500;
const FLAT_SHIPPING_MINOR = 57_700;
const asyncRoute = (handler) => (request, response, next) =>
  Promise.resolve(handler(request, response, next)).catch(next);

app.disable("x-powered-by");
app.set("trust proxy", process.env.TRUST_PROXY === "true");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Try again later." },
});

const productFromRow = (row) => ({
  id: row.id,
  slug: row.slug,
  sku: row.sku,
  title: row.title,
  subtitle: row.subtitle,
  category: row.category_id,
  brand: row.brand,
  price: Number(row.price_minor) / 100,
  compareAtPrice:
    row.compare_at_price_minor == null ? null : Number(row.compare_at_price_minor) / 100,
  rating: Number(row.rating),
  reviewCount: row.review_count,
  stock: row.stock,
  isNew: row.is_new,
  isBestseller: row.is_bestseller,
  colors: row.colors,
  material: row.material,
  description: row.description,
  features: row.features,
  images: row.images,
  image: row.images[0] ?? "",
});

const PRODUCT_COLUMNS = `p.id, p.slug, p.sku, p.title, p.subtitle, p.category_id,
  p.brand, p.price_minor, p.compare_at_price_minor, p.rating, p.review_count,
  p.stock, p.is_new, p.is_bestseller, p.colors, p.material, p.description, p.features, p.images`;

const badRequest = (message) => Object.assign(new Error(message), { status: 400 });
const unauthorized = (message) => Object.assign(new Error(message), { status: 401 });
const notFound = (message) => Object.assign(new Error(message), { status: 404 });
const conflict = (message) => Object.assign(new Error(message), { status: 409 });

const requiredString = (value, label, maximum, { allowEmpty = false } = {}) => {
  if (typeof value !== "string") throw badRequest(`${label} is required.`);
  const normalized = value.trim();
  if ((!allowEmpty && !normalized) || normalized.length > maximum) {
    throw badRequest(`${label} must be ${allowEmpty ? "at most " : "between 1 and "}${maximum} characters.`);
  }
  return normalized;
};

const validateEmail = (value) => {
  const email = requiredString(value, "Email", 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw badRequest("Enter a valid email address.");
  }
  return email;
};

const validatePassword = (value) => {
  if (
    typeof value !== "string" ||
    value.length < 6 ||
    Buffer.byteLength(value, "utf8") > 72
  ) {
    throw badRequest("Password must be at least 6 characters and no more than 72 bytes.");
  }
  return value;
};

const validateAddress = (value, { required = true } = {}) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw badRequest("A shipping address is required.");
  }
  return {
    street: requiredString(value.street ?? "", "Street address", 240, { allowEmpty: !required }),
    city: requiredString(value.city ?? "", "City", 120, { allowEmpty: !required }),
    state: requiredString(value.state ?? "", "State", 120, { allowEmpty: !required }),
    pincode: requiredString(value.pincode ?? "", "Postal code", 24, { allowEmpty: !required }),
  };
};

const validateProductId = (value) => {
  if (typeof value !== "string" || value.length < 1 || value.length > 80) {
    throw badRequest("Invalid product ID.");
  }
  return value;
};

const queryNumber = (value, label, maximum) => {
  if (value === undefined) return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > maximum) {
    throw badRequest(`${label} must be between 0 and ${maximum}.`);
  }
  return number;
};

const validateOrderItems = (items) => {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    throw badRequest("Add between 1 and 50 products before checking out.");
  }
  const normalized = new Map();
  for (const item of items) {
    if (!item || typeof item.id !== "string" || !item.id.trim()) {
      throw badRequest("Each cart item must include a product ID.");
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      throw badRequest("Product quantities must be between 1 and 99.");
    }
    const productId = validateProductId(item.id.trim());
    normalized.set(productId, (normalized.get(productId) ?? 0) + item.quantity);
  }
  if ([...normalized.values()].some((quantity) => quantity > 99)) {
    throw badRequest("A product quantity cannot exceed 99.");
  }
  return [...normalized].map(([id, quantity]) => ({ id, quantity }));
};

const getOrCreateCart = async (client, userId) => {
  const result = await client.query(
    `INSERT INTO carts (id, user_id) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
     RETURNING id`,
    [randomUUID(), userId]
  );
  return result.rows[0].id;
};

const readCart = async (client, cartId) => {
  const result = await client.query(
    `SELECT ${PRODUCT_COLUMNS}, ci.quantity
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = $1 ORDER BY ci.created_at`,
    [cartId]
  );
  return result.rows.map((row) => ({ ...productFromRow(row), quantity: row.quantity }));
};

app.get("/api/health", asyncRoute(async (_request, response) => {
  await pool.query("SELECT 1");
  response.json({ status: "ok", database: "connected" });
}));

app.get("/api/categories", asyncRoute(async (_request, response) => {
  const result = await pool.query(
    `SELECT c.id, c.name, c.tagline, c.image_url AS image
     FROM categories c
     WHERE EXISTS (SELECT 1 FROM products p WHERE p.category_id = c.id)
     ORDER BY c.name`
  );
  response.json(result.rows);
}));

app.get("/api/products", asyncRoute(async (request, response) => {
  const { category, search, minPrice, maxPrice, minRating, inStockOnly, sortBy } = request.query;
  const clauses = [];
  const values = [];
  const minimum = queryNumber(minPrice, "Minimum price", 1_000_000);
  const maximum = queryNumber(maxPrice, "Maximum price", 1_000_000);
  const rating = queryNumber(minRating, "Minimum rating", 5);
  if (typeof search === "string" && search.length > 200) {
    throw badRequest("Search must be no more than 200 characters.");
  }
  if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
    throw badRequest("Minimum price cannot exceed maximum price.");
  }
  if (inStockOnly !== undefined && inStockOnly !== "true" && inStockOnly !== "false") {
    throw badRequest("inStockOnly must be true or false.");
  }
  const addValue = (value) => {
    values.push(value);
    return `$${values.length}`;
  };

  if (typeof category === "string" && category !== "all") {
    clauses.push(`p.category_id = ${addValue(validateProductId(category))}`);
  }
  if (typeof search === "string" && search.trim()) {
    const term = addValue(`%${search.trim()}%`);
    clauses.push(`(p.title ILIKE ${term} OR p.subtitle ILIKE ${term}
      OR p.brand ILIKE ${term} OR p.category_id ILIKE ${term})`);
  }
  if (minimum !== undefined) {
    clauses.push(`p.price_minor >= ${addValue(Math.round(minimum * 100))}`);
  }
  if (maximum !== undefined) {
    clauses.push(`p.price_minor <= ${addValue(Math.round(maximum * 100))}`);
  }
  if (rating !== undefined) {
    clauses.push(`p.rating >= ${addValue(rating)}`);
  }
  if (inStockOnly === "true") clauses.push("p.stock > 0");

  const orderBy = {
    "price-asc": "p.price_minor ASC",
    "price-desc": "p.price_minor DESC",
    rating: "p.rating DESC, p.review_count DESC",
    newest: "p.is_new DESC, p.created_at DESC",
    popularity: "p.review_count DESC",
  }[sortBy] ?? "p.review_count DESC";

  const result = await pool.query(
    `SELECT ${PRODUCT_COLUMNS} FROM products p
     ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}
     ORDER BY ${orderBy}, p.id LIMIT 200`,
    values
  );
  response.json(result.rows.map(productFromRow));
}));

app.get("/api/products/:slug/related", asyncRoute(async (request, response) => {
  const limit = Math.min(Math.max(Number(request.query.limit) || 4, 1), 12);
  const product = await pool.query("SELECT category_id, id FROM products WHERE slug = $1", [
    request.params.slug,
  ]);
  if (product.rowCount === 0) throw notFound("Product not found.");
  const result = await pool.query(
    `SELECT ${PRODUCT_COLUMNS} FROM products p
     WHERE p.category_id = $1 AND p.id <> $2
     ORDER BY p.is_bestseller DESC, p.review_count DESC LIMIT $3`,
    [product.rows[0].category_id, product.rows[0].id, limit]
  );
  response.json(result.rows.map(productFromRow));
}));

app.get("/api/products/:slug", asyncRoute(async (request, response) => {
  const result = await pool.query(
    `SELECT ${PRODUCT_COLUMNS} FROM products p WHERE p.slug = $1`,
    [request.params.slug]
  );
  if (result.rowCount === 0) throw notFound("Product not found.");
  response.json(productFromRow(result.rows[0]));
}));

app.get("/api/featured-products", asyncRoute(async (request, response) => {
  const limit = Math.min(Math.max(Number(request.query.limit) || 4, 1), 12);
  const result = await pool.query(
    `SELECT ${PRODUCT_COLUMNS} FROM products p WHERE p.is_bestseller = TRUE
     ORDER BY p.review_count DESC LIMIT $1`,
    [limit]
  );
  response.json(result.rows.map(productFromRow));
}));

app.get("/api/new-arrivals", asyncRoute(async (request, response) => {
  const limit = Math.min(Math.max(Number(request.query.limit) || 4, 1), 12);
  const result = await pool.query(
    `SELECT ${PRODUCT_COLUMNS} FROM products p WHERE p.is_new = TRUE
     ORDER BY p.created_at DESC LIMIT $1`,
    [limit]
  );
  response.json(result.rows.map(productFromRow));
}));

app.get("/api/auth/me", optionalAuth, (request, response) => {
  response.json({ user: request.user ? publicUser(request.user) : null });
});

app.post("/api/auth/register", loginLimiter, asyncRoute(async (request, response) => {
  const name = requiredString(request.body?.name, "Name", 160);
  const email = validateEmail(request.body?.email);
  const password = validatePassword(request.body?.password);
  try {
    const user = await register({ name, email, password }, response);
    response.status(201).json({ user });
  } catch (error) {
    if (error.code === "23505") throw conflict("An account with this email already exists.");
    throw error;
  }
}));

app.post("/api/auth/login", loginLimiter, asyncRoute(async (request, response) => {
  const email = validateEmail(request.body?.email);
  const password = validatePassword(request.body?.password);
  const user = await login({ email, password }, response);
  if (!user) throw unauthorized("Invalid email or password.");
  response.json({ user });
}));

app.post("/api/auth/logout", asyncRoute(async (request, response) => {
  await logout(request, response);
  response.status(204).end();
}));

app.get("/api/profile", requireAuth, (request, response) => {
  response.json(publicUser(request.user));
});

app.put("/api/profile", requireAuth, asyncRoute(async (request, response) => {
  const name = requiredString(request.body?.name, "Name", 160);
  const email = validateEmail(request.body?.email);
  const phone = requiredString(request.body?.phone ?? "", "Phone", 40, { allowEmpty: true });
  const shippingAddress = validateAddress(request.body?.shippingAddress, { required: false });
  try {
    const result = await pool.query(
      `UPDATE users SET name = $1, email = lower($2), phone = $3,
         shipping_address = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, name, email, phone, shipping_address`,
      [name, email, phone, shippingAddress, request.user.id]
    );
    response.json(publicUser(result.rows[0]));
  } catch (error) {
    if (error.code === "23505") throw conflict("An account with this email already exists.");
    throw error;
  }
}));

app.get("/api/cart", requireAuth, asyncRoute(async (request, response) => {
  const items = await withTransaction(async (client) => {
    const cartId = await getOrCreateCart(client, request.user.id);
    return readCart(client, cartId);
  });
  response.json({ items });
}));

app.post("/api/cart/merge", requireAuth, asyncRoute(async (request, response) => {
  const items = validateOrderItems(request.body?.items).sort((a, b) => a.id.localeCompare(b.id));
  const savedItems = await withTransaction(async (client) => {
    const cartId = await getOrCreateCart(client, request.user.id);
    for (const item of items) {
      const product = await client.query(
        `SELECT p.stock, ci.quantity AS cart_quantity
         FROM products p LEFT JOIN cart_items ci
           ON ci.product_id = p.id AND ci.cart_id = $2
         WHERE p.id = $1 FOR UPDATE OF p`,
        [item.id, cartId]
      );
      if (product.rowCount === 0) throw notFound(`Product ${item.id} was not found.`);
      const totalQuantity = item.quantity + (product.rows[0].cart_quantity ?? 0);
      if (totalQuantity > product.rows[0].stock || totalQuantity > 99) {
        throw conflict("One or more items exceed the available stock.");
      }
    }
    for (const item of items) {
      await client.query(
        `INSERT INTO cart_items (cart_id, product_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (cart_id, product_id) DO UPDATE SET
           quantity = cart_items.quantity + EXCLUDED.quantity,
           updated_at = NOW()`,
        [cartId, item.id, item.quantity]
      );
    }
    await client.query("UPDATE carts SET updated_at = NOW() WHERE id = $1", [cartId]);
    return readCart(client, cartId);
  });
  response.json({ items: savedItems });
}));

app.post("/api/cart/:productId", requireAuth, asyncRoute(async (request, response) => {
  const productId = validateProductId(request.params.productId);
  const quantity = request.body?.quantity;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw badRequest("Product quantity must be between 1 and 99.");
  }
  const items = await withTransaction(async (client) => {
    const cartId = await getOrCreateCart(client, request.user.id);
    const product = await client.query(
      `SELECT p.stock, ci.quantity AS cart_quantity
       FROM products p LEFT JOIN cart_items ci
         ON ci.product_id = p.id AND ci.cart_id = $2
       WHERE p.id = $1 FOR UPDATE OF p`,
      [productId, cartId]
    );
    if (product.rowCount === 0) throw notFound("Product not found.");
    const nextQuantity = quantity + (product.rows[0].cart_quantity ?? 0);
    if (nextQuantity > product.rows[0].stock || nextQuantity > 99) {
      throw conflict("Requested quantity exceeds available stock.");
    }
    await client.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id) DO UPDATE SET
         quantity = cart_items.quantity + EXCLUDED.quantity,
         updated_at = NOW()`,
      [cartId, productId, quantity]
    );
    return readCart(client, cartId);
  });
  response.json({ items });
}));

app.patch("/api/cart/:productId", requireAuth, asyncRoute(async (request, response) => {
  const productId = validateProductId(request.params.productId);
  const quantity = request.body?.quantity;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw badRequest("Product quantity must be between 1 and 99.");
  }
  const result = await withTransaction(async (client) => {
    const cartId = await getOrCreateCart(client, request.user.id);
    const product = await client.query(
      "SELECT stock FROM products WHERE id = $1 FOR UPDATE",
      [productId]
    );
    if (product.rowCount === 0) throw notFound("Product not found.");
    if (quantity > product.rows[0].stock) throw conflict("Quantity exceeds available stock.");
    const updated = await client.query(
      `UPDATE cart_items SET quantity = $1, updated_at = NOW()
       WHERE cart_id = $2 AND product_id = $3 RETURNING product_id`,
      [quantity, cartId, productId]
    );
    if (updated.rowCount === 0) throw notFound("Cart item not found.");
    return readCart(client, cartId);
  });
  response.json({ items: result });
}));

app.delete("/api/cart/:productId", requireAuth, asyncRoute(async (request, response) => {
  const productId = validateProductId(request.params.productId);
  await withTransaction(async (client) => {
    const cart = await client.query(
      "SELECT id FROM carts WHERE user_id = $1 FOR UPDATE",
      [request.user.id]
    );
    if (cart.rowCount > 0) {
      await client.query(
        "DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2",
        [cart.rows[0].id, productId]
      );
    }
  });
  response.status(204).end();
}));

app.delete("/api/cart", requireAuth, asyncRoute(async (request, response) => {
  await withTransaction(async (client) => {
    const cart = await client.query(
      "SELECT id FROM carts WHERE user_id = $1 FOR UPDATE",
      [request.user.id]
    );
    if (cart.rowCount > 0) {
      await client.query("DELETE FROM cart_items WHERE cart_id = $1", [cart.rows[0].id]);
    }
  });
  response.status(204).end();
}));

app.get("/api/wishlist", requireAuth, asyncRoute(async (request, response) => {
  const result = await pool.query(
    `SELECT ${PRODUCT_COLUMNS} FROM wishlist_items wi
     JOIN products p ON p.id = wi.product_id
     WHERE wi.user_id = $1 ORDER BY wi.created_at DESC`,
    [request.user.id]
  );
  response.json({ items: result.rows.map(productFromRow) });
}));

app.put("/api/wishlist/:productId", requireAuth, asyncRoute(async (request, response) => {
  const productId = validateProductId(request.params.productId);
  try {
    await pool.query(
      `INSERT INTO wishlist_items (user_id, product_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [request.user.id, productId]
    );
  } catch (error) {
    if (error.code === "23503") throw notFound("Product not found.");
    throw error;
  }
  response.status(204).end();
}));

app.delete("/api/wishlist/:productId", requireAuth, asyncRoute(async (request, response) => {
  const productId = validateProductId(request.params.productId);
  await pool.query(
    "DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2",
    [request.user.id, productId]
  );
  response.status(204).end();
}));

app.delete("/api/wishlist", requireAuth, asyncRoute(async (request, response) => {
  await pool.query("DELETE FROM wishlist_items WHERE user_id = $1", [request.user.id]);
  response.status(204).end();
}));

app.post("/api/orders", optionalAuth, asyncRoute(async (request, response) => {
  const customer = request.body?.customer;
  const buyerName = requiredString(customer?.name, "Name", 160);
  const buyerEmail = validateEmail(customer?.email);
  const buyerPhone = requiredString(customer?.phone ?? "", "Phone", 40, { allowEmpty: true });
  const shippingAddress = validateAddress(customer?.shippingAddress);

  const order = await withTransaction(async (client) => {
    let items;
    if (request.user) {
      await client.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [request.user.id]);
      const cartId = await getOrCreateCart(client, request.user.id);
      items = await client.query(
        `SELECT product_id AS id, quantity FROM cart_items
         WHERE cart_id = $1 ORDER BY product_id`,
        [cartId]
      );
      items = items.rows;
    } else {
      items = validateOrderItems(request.body?.items);
    }
    if (!items.length) throw badRequest("Your cart is empty.");

    const productIds = items.map((item) => item.id).sort();
    const productsResult = await client.query(
      `SELECT id, sku, title, images, price_minor, stock
       FROM products WHERE id = ANY($1::text[]) ORDER BY id FOR UPDATE`,
      [productIds]
    );
    if (productsResult.rowCount !== productIds.length) throw notFound("A product is no longer available.");
    const productsById = new Map(productsResult.rows.map((product) => [product.id, product]));

    let subtotalMinor = 0;
    const orderItems = items.map((item) => {
      const product = productsById.get(item.id);
      if (item.quantity > product.stock) {
        throw conflict(`${product.title} no longer has enough stock.`);
      }
      const unitPriceMinor = Number(product.price_minor);
      subtotalMinor += unitPriceMinor * item.quantity;
      return { ...item, product, unitPriceMinor };
    });
    const shippingMinor = subtotalMinor === 0 || subtotalMinor >= FREE_SHIPPING_MINOR
      ? 0
      : FLAT_SHIPPING_MINOR;
    const totalMinor = subtotalMinor + shippingMinor;
    const orderId = randomUUID();
    const orderNumber = `ORD-${Date.now()}-${randomBytes(3).toString("hex").toUpperCase()}`;

    const orderResult = await client.query(
      `INSERT INTO orders (
         id, order_number, user_id, buyer_name, buyer_email, buyer_phone,
         shipping_address, subtotal_minor, shipping_minor, total_minor
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, order_number, user_id, buyer_name, buyer_email, buyer_phone,
         shipping_address, status, payment_status, subtotal_minor, discount_minor,
         shipping_minor, tax_minor, total_minor, currency, created_at`,
      [
        orderId,
        orderNumber,
        request.user?.id ?? null,
        buyerName,
        buyerEmail,
        buyerPhone,
        shippingAddress,
        subtotalMinor,
        shippingMinor,
        totalMinor,
      ]
    );

    for (const item of orderItems) {
      const stockUpdate = await client.query(
        `UPDATE products SET stock = stock - $1, updated_at = NOW()
         WHERE id = $2 AND stock >= $1 RETURNING stock`,
        [item.quantity, item.id]
      );
      if (stockUpdate.rowCount === 0) throw conflict(`${item.product.title} is out of stock.`);
      await client.query(
        `INSERT INTO order_items (
           id, order_id, product_id, sku, product_title, product_image,
           quantity, unit_price_minor, line_total_minor
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          randomUUID(),
          orderId,
          item.id,
          item.product.sku,
          item.product.title,
          item.product.images[0] ?? "",
          item.quantity,
          item.unitPriceMinor,
          item.unitPriceMinor * item.quantity,
        ]
      );
    }

    if (request.user) {
      await client.query(
        `UPDATE users SET name = $1, email = lower($2), phone = $3,
           shipping_address = $4, updated_at = NOW() WHERE id = $5`,
        [buyerName, buyerEmail, buyerPhone, shippingAddress, request.user.id]
      );
      await client.query("DELETE FROM cart_items WHERE cart_id = $1", [
        await getOrCreateCart(client, request.user.id),
      ]);
    }

    return {
      ...orderResult.rows[0],
      items: orderItems.map((item) => ({
        id: item.id,
        title: item.product.title,
        image: item.product.images[0] ?? "",
        quantity: item.quantity,
        price: item.unitPriceMinor / 100,
      })),
    };
  });
  response.status(201).json({
    order: {
      ...order,
      id: order.order_number,
      date: order.created_at,
      total: Number(order.total_minor) / 100,
      shippingAddress: order.shipping_address,
    },
  });
}));

app.get("/api/orders", requireAuth, asyncRoute(async (request, response) => {
  const result = await pool.query(
    `SELECT order_number AS id, status, created_at AS date, total_minor AS total,
       currency, buyer_name, buyer_email, buyer_phone, shipping_address
     FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [request.user.id]
  );
  response.json({
    orders: result.rows.map((order) => ({
      ...order,
      total: Number(order.total) / 100,
    })),
  });
}));

app.get("/api/orders/:orderNumber", requireAuth, asyncRoute(async (request, response) => {
  const orderResult = await pool.query(
    `SELECT id AS db_id, order_number AS id, status, created_at AS date, total_minor AS total,
       currency, buyer_name, buyer_email, buyer_phone, shipping_address
     FROM orders WHERE order_number = $1 AND user_id = $2`,
    [request.params.orderNumber, request.user.id]
  );
  if (orderResult.rowCount === 0) throw notFound("Order not found.");
  const itemResult = await pool.query(
    `SELECT product_id AS id, product_title AS title, product_image AS image,
       quantity, unit_price_minor AS price
     FROM order_items WHERE order_id = $1 ORDER BY created_at`,
    [orderResult.rows[0].db_id]
  );
  const order = orderResult.rows[0];
  response.json({
    order: {
      ...order,
      total: Number(order.total) / 100,
      shippingAddress: order.shipping_address,
      items: itemResult.rows.map((item) => ({
        ...item,
        price: Number(item.price) / 100,
      })),
    },
  });
}));

app.use((request, response) => {
  response.status(404).json({ error: `API route not found: ${request.method} ${request.path}` });
});

app.use((error, _request, response, _next) => {
  if (response.headersSent) return;
  if (error.code === "23505") {
    response.status(409).json({ error: "A record with that value already exists." });
    return;
  }
  if (error.code === "23503") {
    response.status(400).json({ error: "The request refers to a record that does not exist." });
    return;
  }
  if (error.type === "entity.parse.failed") {
    response.status(400).json({ error: "Request body must contain valid JSON." });
    return;
  }
  if (error.status) {
    response.status(error.status).json({ error: error.message });
    return;
  }
  console.error("API request failed:", error);
  response.status(500).json({ error: "The server could not complete this request." });
});

const server = app.listen(port, () => {
  console.log(`EchoShop API listening on http://localhost:${port}`);
});

const shutdown = () => {
  server.close(() => {
    pool.end().then(() => process.exit(0)).catch((error) => {
      console.error("Failed to close the PostgreSQL pool:", error);
      process.exit(1);
    });
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
