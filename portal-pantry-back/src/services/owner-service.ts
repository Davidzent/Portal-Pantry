
import type { Request } from "express";
import { z } from "zod";
import type { Db, MenuItemRow, OrderRow, RestaurantRow, ReviewRow } from "../db/database.js";
import { getRestaurantWithItems, menuItemToDto } from "../db/restaurants.js";
import { itemsByOrder } from "../db/orders.js";
import { newId } from "../lib/ids.js";
import { HttpError } from "../lib/http-error.js";
import { imageField, parseBody } from "../lib/validate.js";
import { requireOwner, type OwnerUser } from "../middleware/auth.js";
import { reviewToDto } from "./catalog-service.js";
import type {
  FinanceDto,
  MenuItemDto,
  OrderItemDto,
  OwnerOrderDto,
  RestaurantDto,
  ReviewDto,
} from "../types.js";

export const PLATFORM_FEE_RATE = 0.15;
export const REALITY_TAX_RATE = 0.08;

const KITCHEN_GONE = "Your kitchen fell out of this reality.";

function ownerRestaurant(db: Db, owner: OwnerUser): RestaurantDto {
  const restaurant = getRestaurantWithItems(db, owner.restaurantId, { includeDelisted: true });
  if (!restaurant) throw new HttpError(404, KITCHEN_GONE);
  return restaurant;
}


export function getRestaurant(db: Db, req: Request): RestaurantDto {
  return ownerRestaurant(db, requireOwner(db, req));
}

const storePatchSchema = z.object({
  name: z.string().max(80, "Keep the kitchen name under 80 characters.").optional(),
  tagline: z.string().max(200, "Keep the tagline under 200 characters.").optional(),
  category: z.string().max(40).optional(),
  dimension: z.string().max(40).optional(),
  image: imageField.optional(),
});

export function updateRestaurant(db: Db, req: Request, rawBody: unknown): RestaurantDto {
  const owner = requireOwner(db, req);
  const row = db
    .prepare("SELECT * FROM restaurants WHERE id = ?")
    .get(owner.restaurantId) as unknown as RestaurantRow | undefined;
  if (!row) throw new HttpError(404, KITCHEN_GONE);

  const patch = parseBody(storePatchSchema, rawBody);
  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) {
      throw new HttpError(422, "Your kitchen needs a name in at least one reality.");
    }
    row.name = name;
  }
  if (patch.tagline !== undefined) row.tagline = patch.tagline.trim();
  if (patch.category !== undefined && patch.category.trim()) row.category = patch.category.trim();
  if (patch.dimension !== undefined && patch.dimension.trim()) row.dimension = patch.dimension.trim();
  if (patch.image !== undefined) row.image = patch.image || null;

  db.prepare(
    `UPDATE restaurants
     SET name = ?, tagline = ?, category = ?, dimension = ?, image = ?
     WHERE id = ?`,
  ).run(row.name, row.tagline, row.category, row.dimension, row.image, row.id);

  return ownerRestaurant(db, owner);
}


const menuItemPatchSchema = z.object({
  name: z.string().max(120, "Keep dish names under 120 characters.").optional(),
  desc: z.string().max(500, "Keep descriptions under 500 characters.").optional(),
  price: z.number().optional(),
  delisted: z.boolean().optional(),
  prepMinutes: z.number().optional(),
  image: imageField.optional(),
});

const newMenuItemSchema = menuItemPatchSchema.extend({});

const PRICE_ERROR = "Price must be a positive number of zeeps.";
const PREP_ERROR = "Prep time must be a positive number of minutes.";
const DISH_NAME_ERROR = "A dish needs a name. Even the questionable ones.";

export function createMenuItem(db: Db, req: Request, rawBody: unknown): MenuItemDto {
  const owner = requireOwner(db, req);
  const body = parseBody(newMenuItemSchema, rawBody);
  const name = (body.name ?? "").trim();
  if (!name) throw new HttpError(422, DISH_NAME_ERROR);
  if (!Number.isFinite(body.price) || (body.price ?? 0) <= 0) {
    throw new HttpError(422, PRICE_ERROR);
  }
  const prep = body.prepMinutes;
  const row: MenuItemRow = {
    id: newId("item"),
    restaurant_id: owner.restaurantId,
    name,
    description: (body.desc ?? "").trim(),
    price: body.price ?? 0,
    delisted: 0,
    prep_minutes: Number.isFinite(prep) && (prep ?? 0) > 0 ? Math.round(prep ?? 0) : 10,
    image: body.image || null,
  };
  db.prepare(
    `INSERT INTO menu_items (id, restaurant_id, name, description, price, delisted, prep_minutes, image)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
  ).run(row.id, row.restaurant_id, row.name, row.description, row.price, row.prep_minutes, row.image);
  return menuItemToDto(row);
}

export function updateMenuItem(
  db: Db,
  req: Request,
  itemId: string,
  rawBody: unknown,
): MenuItemDto {
  const owner = requireOwner(db, req);
  const row = db.prepare("SELECT * FROM menu_items WHERE id = ?").get(itemId) as unknown as
    | MenuItemRow
    | undefined;
  if (!row) throw new HttpError(404, "No such dish on file.");
  if (row.restaurant_id !== owner.restaurantId) {
    throw new HttpError(403, "That dish belongs to someone else's kitchen.");
  }

  const patch = parseBody(menuItemPatchSchema, rawBody);
  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) throw new HttpError(422, DISH_NAME_ERROR);
    row.name = name;
  }
  if (patch.desc !== undefined) row.description = patch.desc.trim();
  if (patch.price !== undefined) {
    if (!Number.isFinite(patch.price) || patch.price <= 0) {
      throw new HttpError(422, PRICE_ERROR);
    }
    row.price = patch.price;
  }
  if (patch.prepMinutes !== undefined) {
    if (!Number.isFinite(patch.prepMinutes) || patch.prepMinutes <= 0) {
      throw new HttpError(422, PREP_ERROR);
    }
    row.prep_minutes = Math.round(patch.prepMinutes);
  }
  if (patch.delisted !== undefined) row.delisted = patch.delisted ? 1 : 0;
  if (patch.image !== undefined) row.image = patch.image || null;

  db.prepare(
    `UPDATE menu_items
     SET name = ?, description = ?, price = ?, delisted = ?, prep_minutes = ?, image = ?
     WHERE id = ?`,
  ).run(row.name, row.description, row.price, row.delisted, row.prep_minutes, row.image, row.id);

  return menuItemToDto(row);
}


/** An order as the kitchen sees it: only their items, plus their cut. */
function toOwnerOrderDto(row: OrderRow, items: OrderItemDto[]): OwnerOrderDto {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return {
    id: row.id,
    customerName: row.customer_name,
    placedAt: row.placed_at,
    status: row.status,
    dimension: row.dimension,
    items,
    subtotal,
  };
}

function ordersForKitchen(db: Db, restaurantId: string): OrderRow[] {
  return db
    .prepare(
      `SELECT o.* FROM orders o
       WHERE EXISTS (
         SELECT 1 FROM order_items oi
         WHERE oi.order_id = o.id AND oi.restaurant_id = ?
       )
       ORDER BY o.placed_at DESC`,
    )
    .all(restaurantId) as unknown as OrderRow[];
}

export function listOwnerOrders(db: Db, req: Request): OwnerOrderDto[] {
  const owner = requireOwner(db, req);
  const rows = ordersForKitchen(db, owner.restaurantId);
  const items = itemsByOrder(db, rows.map((row) => row.id), owner.restaurantId);
  return rows.map((row) => toOwnerOrderDto(row, items.get(row.id) ?? []));
}

const orderStatusSchema = z.object({
  status: z.string().max(32).optional(),
});

export function markOrderDelivered(
  db: Db,
  req: Request,
  orderId: string,
  rawBody: unknown,
): OwnerOrderDto {
  const owner = requireOwner(db, req);
  const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as unknown as
    | OrderRow
    | undefined;
  const items = row ? (itemsByOrder(db, [row.id], owner.restaurantId).get(row.id) ?? []) : [];
  if (!row || items.length === 0) {
    throw new HttpError(404, "No such order in your kitchen.");
  }
  const body = parseBody(orderStatusSchema, rawBody);
  if (body.status !== "delivered") {
    throw new HttpError(422, "Kitchens can only mark orders delivered.");
  }
  // Refunded orders stay refunded — money already went back to the customer.
  if (row.status === "wrong-dimension" || row.status === "lost") {
    throw new HttpError(409, "That order was refunded — it can't be delivered anymore.");
  }
  if (row.status !== "delivered") {
    db.prepare("UPDATE orders SET status = 'delivered' WHERE id = ?").run(row.id);
    row.status = "delivered";
  }
  return toOwnerOrderDto(row, items);
}


export function getFinance(db: Db, req: Request): FinanceDto {
  const owner = requireOwner(db, req);
  const rows = db
    .prepare(
      `SELECT o.status, SUM(oi.price * oi.qty) AS subtotal
       FROM orders o JOIN order_items oi ON oi.order_id = o.id
       WHERE oi.restaurant_id = ?
       GROUP BY o.id`,
    )
    .all(owner.restaurantId) as unknown as { status: OrderRow["status"]; subtotal: number }[];

  let gross = 0;
  let pending = 0;
  let refunded = 0;
  let deliveredOrders = 0;
  let pendingOrders = 0;
  for (const { status, subtotal } of rows) {
    if (status === "delivered") {
      gross += subtotal;
      deliveredOrders += 1;
    } else if (status === "pending") {
      pending += subtotal;
      pendingOrders += 1;
    } else {
      // wrong-dimension / lost → refunded to the customer.
      refunded += subtotal;
    }
  }

  const platformFee = Math.round(gross * PLATFORM_FEE_RATE);
  const tax = Math.round(gross * REALITY_TAX_RATE);
  return {
    gross,
    pending,
    refunded,
    deliveredOrders,
    pendingOrders,
    platformFeeRate: PLATFORM_FEE_RATE,
    taxRate: REALITY_TAX_RATE,
    platformFee,
    tax,
    net: gross - platformFee - tax,
  };
}


export function listOwnerReviews(db: Db, req: Request): ReviewDto[] {
  const owner = requireOwner(db, req);
  const rows = db
    .prepare("SELECT * FROM reviews WHERE restaurant_id = ? ORDER BY created_at DESC")
    .all(owner.restaurantId) as unknown as ReviewRow[];
  return rows.map(reviewToDto);
}

const replySchema = z.object({
  reply: z.string().max(2000, "Keep replies under 2000 characters.").optional(),
});

export function replyToReview(
  db: Db,
  req: Request,
  reviewId: string,
  rawBody: unknown,
): ReviewDto {
  const owner = requireOwner(db, req);
  const row = db.prepare("SELECT * FROM reviews WHERE id = ?").get(reviewId) as unknown as
    | ReviewRow
    | undefined;
  if (!row || row.restaurant_id !== owner.restaurantId) {
    throw new HttpError(404, "That review isn't for your kitchen.");
  }
  const body = parseBody(replySchema, rawBody);
  const reply = (body.reply ?? "").trim();
  if (!reply) throw new HttpError(422, "A reply needs some words in it.");

  const repliedAt = new Date().toISOString();
  db.prepare("UPDATE reviews SET reply = ?, replied_at = ? WHERE id = ?").run(reply, repliedAt, row.id);
  return reviewToDto({ ...row, reply, replied_at: repliedAt });
}
