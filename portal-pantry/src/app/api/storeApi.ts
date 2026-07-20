import { api } from "./apiClient";
import type { Restaurant } from "../data";
import type { OrderItem, OrderStatus } from "./ordersApi";

export interface StorePatch {
  name?: string;
  tagline?: string;
  category?: string;
  dimension?: string;
  image?: string;
}

export interface MenuItemPatch {
  name?: string;
  desc?: string;
  price?: number;
  delisted?: boolean;
  prepMinutes?: number;
  image?: string;
}

export interface NewMenuItem {
  name: string;
  desc: string;
  price: number;
  prepMinutes?: number;
  image?: string;
}

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

export async function getRestaurants(): Promise<Restaurant[]> {
  const response = await api<{ restaurants: Restaurant[] }>(
    "GET",
    "/restaurants",
  );
  return response.restaurants;
}

export async function getRestaurantReviews(id: string): Promise<Review[]> {
  const response = await api<{ reviews: Review[] }>(
    "GET",
    `/restaurants/${id}/reviews`,
  );
  return response.reviews;
}

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

export async function getOwnerRestaurant(): Promise<Restaurant> {
  const response = await api<{ restaurant: Restaurant }>(
    "GET",
    "/owner/restaurant",
  );
  return response.restaurant;
}

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

export async function updateOwnerMenuItem(
  itemId: string,
  patch: MenuItemPatch,
): Promise<void> {
  await api("PATCH", `/owner/menu-items/${itemId}`, patch);
}

export async function createOwnerMenuItem(item: NewMenuItem): Promise<void> {
  await api("POST", "/owner/menu-items", item);
}

export async function getOwnerOrders(): Promise<OwnerOrder[]> {
  const response = await api<{ orders: OwnerOrder[] }>("GET", "/owner/orders");
  return response.orders;
}

export async function markOrderDelivered(orderId: string): Promise<OwnerOrder> {
  const response = await api<{ order: OwnerOrder }>(
    "PATCH",
    `/owner/orders/${orderId}`,
    { status: "delivered" },
  );
  return response.order;
}

export async function getFinance(): Promise<Finance> {
  const response = await api<{ finance: Finance }>("GET", "/owner/finance");
  return response.finance;
}

export async function getOwnerReviews(): Promise<Review[]> {
  const response = await api<{ reviews: Review[] }>("GET", "/owner/reviews");
  return response.reviews;
}

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
