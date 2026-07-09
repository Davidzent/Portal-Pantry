/**
 * Catalog + store-management SDK. The public catalog endpoint already
 * excludes delisted dishes; owner endpoints return and edit the full
 * menu, orders, finances, and reviews for the kitchen linked to the
 * signed-in account (the backend decides which kitchen that is).
 */

import { api } from "./apiClient";
import type { Restaurant } from "../data";
import type { OrderItem, OrderStatus } from "./ordersApi";

export interface StorePatch {
  name?: string;
  tagline?: string;
  emoji?: string;
  category?: string;
  dimension?: string;
  /** Image key or data URL; "" clears it back to the emoji fallback. */
  image?: string;
}

export interface MenuItemPatch {
  name?: string;
  desc?: string;
  price?: number;
  delisted?: boolean;
  prepMinutes?: number;
  /** Image key or data URL; "" clears it back to the emoji fallback. */
  image?: string;
}

export interface NewMenuItem {
  name: string;
  desc: string;
  price: number;
  prepMinutes?: number;
  emoji?: string;
  image?: string;
}

/** An order as the kitchen sees it — only their items and their cut. */
export interface OwnerOrder {
  id: string;
  customerName: string;
  placedAt: string;
  status: OrderStatus;
  dimension: string;
  items: OrderItem[];
  subtotal: number;
}

export interface Finance {
  gross: number;
  pending: number;
  refunded: number;
  deliveredOrders: number;
  pendingOrders: number;
  platformFeeRate: number;
  taxRate: number;
  platformFee: number;
  tax: number;
  net: number;
}

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  body: string;
  createdAt: string;
  reply?: string;
  repliedAt?: string;
}

/* ── Public catalog ── */

/** GET /restaurants — the customer-facing catalog. */
export async function getRestaurants(): Promise<Restaurant[]> {
  const response = await api<{ restaurants: Restaurant[] }>(
    "GET",
    "/restaurants",
  );
  return response.restaurants;
}

/** GET /restaurants/:id/reviews — public reviews for one kitchen. */
export async function getRestaurantReviews(id: string): Promise<Review[]> {
  const response = await api<{ reviews: Review[] }>(
    "GET",
    `/restaurants/${id}/reviews`,
  );
  return response.reviews;
}

/** POST /restaurants/:id/reviews — a signed-in customer posts a review. */
export async function addReview(
  restaurantId: string,
  input: { rating: number; body: string },
): Promise<Review> {
  const response = await api<{ review: Review }>(
    "POST",
    `/restaurants/${restaurantId}/reviews`,
    input,
  );
  return response.review;
}

/* ── Owner: store + menu ── */

/** GET /owner/restaurant — the signed-in owner's kitchen, delistings included. */
export async function getOwnerRestaurant(): Promise<Restaurant> {
  const response = await api<{ restaurant: Restaurant }>(
    "GET",
    "/owner/restaurant",
  );
  return response.restaurant;
}

/** PATCH /owner/restaurant — rename the store / change its tagline. */
export async function updateOwnerRestaurant(
  patch: StorePatch,
): Promise<Restaurant> {
  const response = await api<{ restaurant: Restaurant }>(
    "PATCH",
    "/owner/restaurant",
    patch,
  );
  return response.restaurant;
}

/** PATCH /owner/menu-items/:id — rename, reprice, re-time, re-photo, (de)list. */
export async function updateOwnerMenuItem(
  itemId: string,
  patch: MenuItemPatch,
): Promise<void> {
  await api("PATCH", `/owner/menu-items/${itemId}`, patch);
}

/** POST /owner/menu-items — add a new dish to the owner's kitchen. */
export async function createOwnerMenuItem(item: NewMenuItem): Promise<void> {
  await api("POST", "/owner/menu-items", item);
}

/* ── Owner: orders + finance ── */

/** GET /owner/orders — pending + past orders for the owner's kitchen. */
export async function getOwnerOrders(): Promise<OwnerOrder[]> {
  const response = await api<{ orders: OwnerOrder[] }>("GET", "/owner/orders");
  return response.orders;
}

/** PATCH /owner/orders/:id — mark a pending order delivered. */
export async function markOrderDelivered(orderId: string): Promise<OwnerOrder> {
  const response = await api<{ order: OwnerOrder }>(
    "PATCH",
    `/owner/orders/${orderId}`,
    { status: "delivered" },
  );
  return response.order;
}

/** GET /owner/finance — gross, refunds, platform fee, tax, and net profit. */
export async function getFinance(): Promise<Finance> {
  const response = await api<{ finance: Finance }>("GET", "/owner/finance");
  return response.finance;
}

/* ── Owner: reviews ── */

/** GET /owner/reviews — every review for the owner's kitchen. */
export async function getOwnerReviews(): Promise<Review[]> {
  const response = await api<{ reviews: Review[] }>("GET", "/owner/reviews");
  return response.reviews;
}

/** POST /owner/reviews/:id/reply — post or update the owner's reply. */
export async function replyToReview(
  reviewId: string,
  reply: string,
): Promise<Review> {
  const response = await api<{ review: Review }>(
    "POST",
    `/owner/reviews/${reviewId}/reply`,
    { reply },
  );
  return response.review;
}
