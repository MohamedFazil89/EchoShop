import { createHash, randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, withTransaction } from "./db.js";

const SESSION_COOKIE = "ecoshop_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const hashToken = (token) =>
  createHash("sha256").update(token).digest("hex");

export const clearSessionCookie = (response) =>
  response.clearCookie(SESSION_COOKIE, sessionCookieOptions());

export const publicUser = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  shippingAddress: row.shipping_address,
});

export const sessionCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_TTL_MS,
});

export async function createUserSession(userId, response) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await pool.query("DELETE FROM user_sessions WHERE expires_at <= NOW()");
  await pool.query(
    `INSERT INTO user_sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [hashToken(token), userId, expiresAt]
  );
  response.cookie(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function requireAuth(request, response, next) {
  try {
    const token = request.cookies?.[SESSION_COOKIE];
    if (!token) {
      response.status(401).json({ error: "Sign in to continue." });
      return;
    }

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.shipping_address
       FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
      [hashToken(token)]
    );
    if (result.rowCount === 0) {
      clearSessionCookie(response);
      response.status(401).json({ error: "Your session has expired. Sign in again." });
      return;
    }

    request.user = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuth(request, response, next) {
  try {
    const token = request.cookies?.[SESSION_COOKIE];
    if (token) {
      const result = await pool.query(
        `SELECT u.id, u.name, u.email, u.phone, u.shipping_address
         FROM user_sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
        [hashToken(token)]
      );
      if (result.rowCount > 0) {
        request.user = result.rows[0];
      } else {
        clearSessionCookie(response);
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}

export async function register({ name, email, password }, response) {
  const id = randomUUID();
  const token = randomBytes(32).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const user = await withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO users (id, name, email, password_hash)
       VALUES ($1, $2, lower($3), $4)
       RETURNING id, name, email, phone, shipping_address`,
      [id, name.trim(), email.trim(), passwordHash]
    );
    await client.query(
      `INSERT INTO user_sessions (token_hash, user_id, expires_at)
       VALUES ($1, $2, $3)`,
      [hashToken(token), id, expiresAt]
    );
    return result.rows[0];
  });
  response.cookie(SESSION_COOKIE, token, sessionCookieOptions());
  return publicUser(user);
}

export async function login({ email, password }, response) {
  const result = await pool.query(
    `SELECT id, name, email, phone, shipping_address, password_hash
     FROM users WHERE lower(email) = lower($1)`,
    [email.trim()]
  );
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return null;
  }
  await createUserSession(user.id, response);
  return publicUser(user);
}

export async function logout(request, response) {
  const token = request.cookies?.[SESSION_COOKIE];
  if (token) {
    await pool.query("DELETE FROM user_sessions WHERE token_hash = $1", [hashToken(token)]);
  }
  clearSessionCookie(response);
}
