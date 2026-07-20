
import type { Request } from "express";
import { z } from "zod";
import type { Db, MenuItemRow, OrderRow } from "../db/database.js";
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

/** Flat delivery fee added to every order, in ƶ. Matches the storefront's advertised toll. */
const PORTAL_TOLL = 12;

const orderItemSchema = z.object({
  restaurantId: z.string().min(1).max(64),
  itemId: z.string().min(1).max(64),
  qty: z.number().int().min(1).max(999),
});

const newOrderSchema = z.object({
  items: z.array(orderItemSchema).max(100).optional(),
  // Clients may still send name/price/total; the kitchen prices every line
  // itself from the catalog, so anything client-priced is ignored.
  total: z.unknown().optional(),
  dimension: z.string().max(40).optional(),
});

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

  // Price every line from the catalog. The client's arithmetic is not consulted.
  const lookupItem = db.prepare(
    `SELECT m.*, r.name AS restaurant_name
       FROM menu_items m JOIN restaurants r ON r.id = m.restaurant_id
      WHERE m.id = ?`,
  );
  const pricedItems = body.items.map((line) => {
    const row = lookupItem.get(line.itemId) as
      | (MenuItemRow & { restaurant_name: string })
      | undefined;
    if (!row || row.restaurant_id !== line.restaurantId) {
      throw new HttpError(422, "One of those dishes isn't on a menu in this reality.");
    }
    if (row.delisted) {
      throw new HttpError(422, "That dish has been delisted — the menu has moved on.");
    }
    return {
      restaurantId: row.restaurant_id,
      name: row.name,
      qty: line.qty,
      price: row.price,
      restaurant: row.restaurant_name,
    };
  });
  const subtotal = pricedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal + PORTAL_TOLL;
  if (total > 10_000_000) {
    throw new HttpError(422, "Order total looks non-euclidean.");
  }

  const order = withTransaction(db, () => {
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
      items: pricedItems,
      total,
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
