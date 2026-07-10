import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SCHEMA_SQL } from "./schema.js";

export type Db = DatabaseSync;

export function openDatabase(path: string): Db {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA busy_timeout = 5000");
  db.exec(SCHEMA_SQL);
  return db;
}

export function withTransaction<T>(db: Db, fn: () => T): T {
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}


export interface UserRow {
  id: string;
  email: string;
  name: string;
  avatar: string;
  dimension: string;
  member_since: string;
  role: "customer" | "owner";
  restaurant_id: string | null;
  password_hash: string | null;
  created_at: string;
}

export interface RestaurantRow {
  id: string;
  name: string;
  tagline: string;
  category: string;
  dimension: string;
  rating: number;
  time: string;
  fee: number;
  hue: number;
  promoted: number;
  image: string | null;
}

export interface MenuItemRow {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  delisted: number;
  prep_minutes: number;
  image: string | null;
}

export interface OrderRow {
  id: string;
  user_id: string;
  customer_name: string;
  placed_at: string;
  status: "pending" | "delivered" | "wrong-dimension" | "lost";
  dimension: string;
  total: number;
}

export interface OrderItemRow {
  id: number;
  order_id: string;
  restaurant_id: string;
  name: string;
  qty: number;
  price: number;
  restaurant_name: string;
}

export interface ReviewRow {
  id: string;
  restaurant_id: string;
  author: string;
  avatar: string;
  rating: number;
  body: string;
  created_at: string;
  reply: string | null;
  replied_at: string | null;
}
