/**
 * Customer orders. Every query is scoped by the session's user id;
 * owners are turned away — they're here to cook, not eat.
 *
 * Inherited trade-off, documented: line items arrive priced from the
 * client (the API contract carries no menu-item ids), so totals are
 * sanity-checked, not re-derived. A production system would send item
 * ids and reprice server-side.
 */
import type { Request } from "express";
import { z } from "zod";
import type { Db, OrderRow } from "../db/database.js";
import {
  insertOrderWithItems,
  itemsByOrder,
  orderIdExists,
  orderToDto,
} from "../db/orders.js";
import { withTransaction } from "../db/database.js";
import { newId, newOrderNumber } from "../lib/ids.js";
import { HttpError } from "../lib/http-error.js";
import { parseBody } from "../lib/validate.js";
import { authenticate } from "../middleware/auth.js";
import type { OrderDto } from "../types.js";

const orderItemSchema = z.object({
  restaurantId: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  emoji: z.string().max(16).default(""),
  qty: z.number().int().min(1).max(999),
  price: z.number().finite().min(0).max(1_000_000),
  restaurant: z.string().max(80).default(""),
});

const newOrderSchema = z.object({
  items: z.array(orderItemSchema).max(100).optional(),
  total: z.number().optional(),
  dimension: z.string().max(40).optional(),
});

/** The signed-in user's history, newest first. */
export function listOrders(db: Db, req: Request): OrderDto[] {
  const user = authenticate(db, req);
  const rows = db
    .prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY placed_at DESC")
    .all(user.id) as unknown as OrderRow[];
  const items = itemsByOrder(db, rows.map((row) => row.id));
  return rows.map((row) => orderToDto(row, items.get(row.id) ?? []));
}

export function createOrder(db: Db, req: Request, rawBody: unknown): OrderDto {
  const user = authenticate(db, req);
  if (user.role === "owner") {
    throw new HttpError(403, "Store owners can't place orders — you're here to cook, not eat.");
  }
  const body = parseBody(newOrderSchema, rawBody);
  if (!body.items || body.items.length === 0) {
    throw new HttpError(422, "An order needs at least one dish.");
  }
  if (!Number.isFinite(body.total) || (body.total ?? 0) <= 0 || (body.total ?? 0) > 10_000_000) {
    throw new HttpError(422, "Order total looks non-euclidean.");
  }

  // Every referenced kitchen must actually exist in this reality.
  const kitchenIds = [...new Set(body.items.map((item) => item.restaurantId))];
  const placeholders = kitchenIds.map(() => "?").join(", ");
  const known = db
    .prepare(`SELECT COUNT(*) AS n FROM restaurants WHERE id IN (${placeholders})`)
    .get(...kitchenIds) as { n: number };
  if (known.n !== kitchenIds.length) {
    throw new HttpError(422, "One of those kitchens isn't in this reality.");
  }

  const order = withTransaction(db, () => {
    // PP-numbers are short on purpose; retry the rare collision.
    let id = newOrderNumber();
    for (let attempt = 0; orderIdExists(db, id); attempt += 1) {
      id = attempt < 20 ? newOrderNumber() : newId("PP").toUpperCase();
    }
    const record = {
      id,
      userId: user.id,
      customerName: user.name,
      placedAt: new Date().toISOString(),
      // New orders enter the kitchen's queue as pending.
      status: "pending" as const,
      dimension: (body.dimension ?? "").trim() || user.dimension,
      items: body.items ?? [],
      total: body.total ?? 0,
    };
    insertOrderWithItems(db, record);
    return record;
  });

  return {
    id: order.id,
    customerName: order.customerName,
    placedAt: order.placedAt,
    status: order.status,
    dimension: order.dimension,
    items: order.items,
    total: order.total,
  };
}
