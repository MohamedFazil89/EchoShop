import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import "./config.js";
import { categories } from "../../src/data/categories.js";
import { products } from "../../src/data/products.js";
import { pool, withTransaction } from "./db.js";

const categoryIds = new Set(categories.map((category) => category.id));
const publicDirectory = fileURLToPath(new URL("../../public/", import.meta.url));

async function validateImageAsset(image, owner) {
  if (
    !image.startsWith("/products/") ||
    image.includes("..") ||
    image.includes("\\") ||
    !image.endsWith(".jpg")
  ) {
    throw new Error(`${owner} has an invalid local image path: ${image}`);
  }

  const assetPath = resolve(publicDirectory, image.slice(1));
  let asset;
  try {
    asset = await stat(assetPath);
  } catch (cause) {
    throw new Error(`${owner} references missing image asset: ${image}`, { cause });
  }
  if (!asset.isFile() || asset.size === 0) {
    throw new Error(`${owner} references an empty or non-file image asset: ${image}`);
  }
}

async function validateCatalog() {
  const productIds = new Set();
  const slugs = new Set();
  const productImages = new Set();

  for (const product of products) {
    if (productIds.has(product.id)) throw new Error(`Duplicate product ID: ${product.id}`);
    if (slugs.has(product.slug)) throw new Error(`Duplicate product slug: ${product.slug}`);
    if (!categoryIds.has(product.category)) {
      throw new Error(`Product ${product.id} references missing category ${product.category}.`);
    }
    if (product.compareAtPrice != null && product.compareAtPrice < product.price) {
      throw new Error(`Product ${product.id} has a sale price above its regular price.`);
    }
    if (!Array.isArray(product.images) || product.images.length === 0) {
      throw new Error(`Product ${product.id} must have at least one image.`);
    }
    for (const image of product.images) {
      if (productImages.has(image)) {
        throw new Error(`Product image is assigned to more than one product: ${image}`);
      }
      await validateImageAsset(image, `Product ${product.id}`);
      productImages.add(image);
    }
    productIds.add(product.id);
    slugs.add(product.slug);
  }

  for (const category of categories) {
    await validateImageAsset(category.image, `Category ${category.id}`);
  }
}

try {
  await validateCatalog();
  await withTransaction(async (client) => {
    for (const category of categories) {
      await client.query(
        `INSERT INTO categories (id, name, tagline, image_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           tagline = EXCLUDED.tagline,
           image_url = EXCLUDED.image_url,
           updated_at = NOW()`,
        [category.id, category.name, category.tagline, category.image]
      );
    }

    for (const product of products) {
      await client.query(
        `INSERT INTO products (
           id, slug, sku, title, subtitle, category_id, brand,
           price_minor, compare_at_price_minor, rating, review_count, stock,
           is_new, is_bestseller, colors, material, description, features, images
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
           $15, $16, $17, $18, $19
         )
         ON CONFLICT (id) DO UPDATE SET
           slug = EXCLUDED.slug,
           sku = EXCLUDED.sku,
           title = EXCLUDED.title,
           subtitle = EXCLUDED.subtitle,
           category_id = EXCLUDED.category_id,
           brand = EXCLUDED.brand,
           price_minor = EXCLUDED.price_minor,
           compare_at_price_minor = EXCLUDED.compare_at_price_minor,
           rating = EXCLUDED.rating,
           review_count = EXCLUDED.review_count,
           is_new = EXCLUDED.is_new,
           is_bestseller = EXCLUDED.is_bestseller,
           colors = EXCLUDED.colors,
           material = EXCLUDED.material,
           description = EXCLUDED.description,
           features = EXCLUDED.features,
           images = EXCLUDED.images,
           updated_at = NOW()`,
        [
          product.id,
          product.slug,
          `HL-${product.id.toUpperCase()}`,
          product.title,
          product.subtitle,
          product.category,
          product.brand,
          Math.round(product.price * 100),
          product.compareAtPrice == null ? null : Math.round(product.compareAtPrice * 100),
          product.rating,
          product.reviewCount,
          product.stock,
          product.isNew,
          product.isBestseller,
          product.colors,
          product.material,
          product.description,
          product.features,
          product.images,
        ]
      );
    }
  });

  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
} catch (error) {
  console.error("Failed to seed the catalog:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
