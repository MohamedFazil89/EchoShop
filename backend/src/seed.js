import "dotenv/config";
import { categories } from "../../src/data/categories.js";
import { products } from "../../src/data/products.js";
import { pool } from "./db.js";

const generatedCategories = new Map(
  categories.map((category) => [category.id, category])
);

for (const product of products) {
  if (!generatedCategories.has(product.category)) {
    generatedCategories.set(product.category, {
      id: product.category,
      name: product.category
        .split("-")
        .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
        .join(" "),
      tagline: "",
      image: product.images[0] ?? "",
    });
  }
}

try {
  for (const category of generatedCategories.values()) {
    await pool.query(
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
    await pool.query(
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

  console.log(`Seeded ${generatedCategories.size} categories and ${products.length} products.`);
} catch (error) {
  console.error("Failed to seed the catalog:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
