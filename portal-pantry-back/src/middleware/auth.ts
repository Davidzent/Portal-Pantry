import type { Request } from "express";
import type { Db, UserRow } from "../db/database.js";
import { HttpError } from "../lib/http-error.js";
import { hashSessionToken } from "../lib/ids.js";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  dimension: string;
  memberSince: string;
  role: "customer" | "owner";
  restaurantId: string | null;
}

export type OwnerUser = AuthUser & { restaurantId: string };

const SESSION_EXPIRED = "Session expired — beam in again.";

export function bearerToken(req: Request): string | null {
  const match = /^Bearer\s+(.+)$/i.exec(req.headers.authorization ?? "");
  return match?.[1]?.trim() || null;
}

export function authenticate(db: Db, req: Request): AuthUser {
  const token = bearerToken(req);
  if (!token) throw new HttpError(401, SESSION_EXPIRED);

  const tokenHash = hashSessionToken(token);
  const row = db
    .prepare(
      `SELECT u.*, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`,
    )
    .get(tokenHash) as unknown as (UserRow & { expires_at: string }) | undefined;

  if (!row) throw new HttpError(401, SESSION_EXPIRED);
  if (row.expires_at <= new Date().toISOString()) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
    throw new HttpError(401, SESSION_EXPIRED);
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatar: row.avatar,
    dimension: row.dimension,
    memberSince: row.member_since,
    role: row.role,
    restaurantId: row.restaurant_id,
  };
}

export function requireOwner(db: Db, req: Request): OwnerUser {
  const user = authenticate(db, req);
  if (user.role !== "owner" || !user.restaurantId) {
    throw new HttpError(403, "Owner access only — this isn't your kitchen.");
  }
  return user as OwnerUser;
}
