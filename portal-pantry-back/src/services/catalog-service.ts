/**
 * The public storefront: the restaurant catalog (delisted dishes
 * filtered server-side) and per-kitchen reviews, including posting one
 * as a signed-in customer.
 */
import type { Request } from "express";
import { z } from "zod";
import type { Db, ReviewRow } from "../db/database.js";
import { findRestaurantRow, listRestaurantsWithItems } from "../db/restaurants.js";
import { newId } from "../lib/ids.js";
import { HttpError } from "../lib/http-error.js";
import { parseBody } from "../lib/validate.js";
import { authenticate } from "../middleware/auth.js";
import type { RestaurantDto, ReviewDto } from "../types.js";

export function reviewToDto(row: ReviewRow): ReviewDto {
  return {
    id: row.id,
    author: row.author,
    avatar: row.avatar,
    rating: row.rating,
    body: row.body,
    createdAt: row.created_at,
    ...(row.reply !== null ? { reply: row.reply } : {}),
    ...(row.replied_at !== null ? { repliedAt: row.replied_at } : {}),
  };
}

/** The customer-facing catalog — delisted dishes are already gone. */
export function listCatalog(db: Db): RestaurantDto[] {
  return listRestaurantsWithItems(db, { includeDelisted: false });
}

/** Public reviews for one kitchen, newest first. */
export function listReviews(db: Db, restaurantId: string): ReviewDto[] {
  const rows = db
    .prepare("SELECT * FROM reviews WHERE restaurant_id = ? ORDER BY created_at DESC")
    .all(restaurantId) as unknown as ReviewRow[];
  return rows.map(reviewToDto);
}

/** A restaurant's rating is the average of its reviews (1 decimal). */
export function recomputeRating(db: Db, restaurantId: string): void {
  db.prepare(
    `UPDATE restaurants
     SET rating = COALESCE(
       (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE restaurant_id = ?),
       rating
     )
     WHERE id = ?`,
  ).run(restaurantId, restaurantId);
}

const newReviewSchema = z.object({
  rating: z.number().optional(),
  body: z.string().max(2000, "Keep reviews under 2000 characters.").optional(),
});

export function addReview(
  db: Db,
  req: Request,
  restaurantId: string,
  rawBody: unknown,
): ReviewDto {
  const user = authenticate(db, req);
  if (user.role !== "customer") {
    throw new HttpError(403, "Only customers can leave reviews.");
  }
  if (!findRestaurantRow(db, restaurantId)) {
    throw new HttpError(404, "No such kitchen.");
  }
  const body = parseBody(newReviewSchema, rawBody);
  const rating = Math.round(body.rating ?? 0);
  if (rating < 1 || rating > 5) {
    throw new HttpError(422, "Pick a rating between 1 and 5 stars.");
  }
  const text = (body.body ?? "").trim();
  if (!text) {
    throw new HttpError(422, "Add a few words to your review.");
  }

  const review: ReviewRow = {
    id: newId("rev"),
    restaurant_id: restaurantId,
    author: user.name,
    avatar: user.avatar,
    rating,
    body: text,
    created_at: new Date().toISOString(),
    reply: null,
    replied_at: null,
  };
  db.prepare(
    `INSERT INTO reviews (id, restaurant_id, author, avatar, rating, body, created_at, reply, replied_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
  ).run(review.id, review.restaurant_id, review.author, review.avatar, review.rating, review.body, review.created_at);
  recomputeRating(db, restaurantId);
  return reviewToDto(review);
}
