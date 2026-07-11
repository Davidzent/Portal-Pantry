import { randomInt } from "node:crypto";
import type { Request } from "express";
import { z } from "zod";
import type { AppConfig } from "../config.js";
import { withTransaction, type Db, type UserRow } from "../db/database.js";
import { hashSessionToken, newId, newSessionToken } from "../lib/ids.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { HttpError } from "../lib/http-error.js";
import { parseBody } from "../lib/validate.js";
import { authenticate, bearerToken } from "../middleware/auth.js";
import { insertWelcomeOrders } from "../db/seed.js";
import type { UserDto } from "../types.js";

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const MIN_PASSWORD_LENGTH = 4;

const credentialsSchema = z.object({
  email: z.string().max(254).optional(),
  password: z.string().max(200).optional(),
  name: z.string().max(80).optional(),
  role: z.enum(["customer", "owner"]).optional(),
  restaurantName: z.string().max(80).optional(),
});

function nameFor(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local
    .split(/[._-]+/)
    .map((part) => part.replace(/\d+/g, ""))
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => (part[0] ?? "").toUpperCase() + part.slice(1).toLowerCase());
  return parts.length > 0 ? parts.join(" ") : "Traveler";
}

export function userToDto(db: Db, row: UserRow): UserDto {
  const kitchen = row.restaurant_id
    ? (db.prepare("SELECT name FROM restaurants WHERE id = ?").get(row.restaurant_id) as
        | { name: string }
        | undefined)
    : undefined;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatar: row.avatar,
    dimension: row.dimension,
    memberSince: row.member_since,
    role: row.role,
    ...(row.restaurant_id !== null ? { restaurantId: row.restaurant_id } : {}),
    ...(kitchen !== undefined ? { restaurantName: kitchen.name } : {}),
  };
}

function createSession(db: Db, userId: string, ttlMs: number): string {
  const token = newSessionToken();
  const now = new Date();
  db.prepare(
    "INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
  ).run(
    hashSessionToken(token),
    userId,
    now.toISOString(),
    new Date(now.getTime() + ttlMs).toISOString(),
  );
  return token;
}

export function pruneExpiredSessions(db: Db): number {
  const result = db
    .prepare("DELETE FROM sessions WHERE expires_at <= ?")
    .run(new Date().toISOString());
  return Number(result.changes);
}

export async function login(
  db: Db,
  config: AppConfig,
  rawBody: unknown,
): Promise<{ token: string; user: UserDto }> {
  const body = parseBody(credentialsSchema, rawBody);
  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    throw new HttpError(422, "That doesn't look like an email in any dimension.");
  }
  const password = body.password ?? "";
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(401, "Password rejected in all 5 realities. (Demo hint: 4+ characters.)");
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as unknown as
    | UserRow
    | undefined;
  if (!user) {
    throw new HttpError(404, "No account with that email — create one to beam in.");
  }
  if (user.password_hash !== null && !(await verifyPassword(password, user.password_hash))) {
    throw new HttpError(401, "Wrong password — that combination doesn't exist in this reality.");
  }

  pruneExpiredSessions(db);
  const token = createSession(db, user.id, config.sessionTtlMs);
  return { token, user: userToDto(db, user) };
}

export async function register(
  db: Db,
  config: AppConfig,
  rawBody: unknown,
): Promise<{ token: string; user: UserDto }> {
  const body = parseBody(credentialsSchema, rawBody);
  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    throw new HttpError(422, "That doesn't look like an email in any dimension.");
  }
  const password = body.password ?? "";
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(422, "Password must be at least 4 characters.");
  }
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email) !== undefined) {
    throw new HttpError(409, "An account with that email already exists — sign in instead.");
  }
  const role = body.role === "owner" ? "owner" : "customer";
  const restaurantName = (body.restaurantName ?? "").trim();
  if (role === "owner" && !restaurantName) {
    throw new HttpError(422, "Your kitchen needs a name.");
  }

  const passwordHash = await hashPassword(password);
  const displayName = (body.name ?? "").trim() || nameFor(email);

  const { token, user } = withTransaction(db, () => {
    let restaurantId: string | null = null;
    let avatar: string | null = null;

    if (role === "owner") {
      restaurantId = newId("rest");
      db.prepare(
        `INSERT INTO restaurants (id, name, tagline, category, dimension, rating, time, fee, hue, promoted, image)
         VALUES (?, ?, ?, ?, ?, 0, ?, 0, ?, 0, NULL)`,
      ).run(
        restaurantId,
        restaurantName,
        "A fresh new kitchen in the multiverse.",
        "Human food",
        "C-131",
        "15–30 min",
        randomInt(0, 360),
      );
    }

    const userId = newId("usr");
    db.prepare(
      `INSERT INTO users (id, email, name, avatar, dimension, member_since, role, restaurant_id, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      userId,
      email,
      displayName,
      avatar,
      "C-131",
      "2847",
      role,
      restaurantId,
      passwordHash,
      new Date().toISOString(),
    );


    if (role === "customer") {
      insertWelcomeOrders(db, userId, displayName);
    }

    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as unknown as UserRow;
    return { token: createSession(db, userId, config.sessionTtlMs), user: userToDto(db, row) };
  });

  return { token, user };
}

export function me(db: Db, req: Request): UserDto {
  const user = authenticate(db, req);
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id) as unknown as UserRow;
  return userToDto(db, row);
}

export function logout(db: Db, req: Request): { ok: true } {
  const token = bearerToken(req);
  if (token) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashSessionToken(token));
  }
  return { ok: true };
}
