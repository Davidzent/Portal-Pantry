/**
 * Orders SDK. Orders belong to the signed-in account — the backend
 * scopes every query by the session token, exactly like production.
 */

import { api } from "./apiClient";

export type OrderStatus = "pending" | "delivered" | "wrong-dimension" | "lost";

export interface OrderItem {
  /** FK → restaurants.id — lets the backend attribute revenue by kitchen. */
  restaurantId: string;
  name: string;
  emoji: string;
  qty: number;
  price: number;
  restaurant: string;
}

export interface Order {
  id: string;
  /** ISO timestamp. */
  placedAt: string;
  status: OrderStatus;
  /** Dimension the order was delivered to. */
  dimension: string;
  items: OrderItem[];
  /** Grand total in zeeps, wormhole toll included. */
  total: number;
}

export interface NewOrderInput {
  items: OrderItem[];
  total: number;
  dimension: string;
}

/** GET /orders — the signed-in user's history, newest first. */
export async function getOrders(): Promise<Order[]> {
  const response = await api<{ orders: Order[] }>("GET", "/orders");
  return response.orders;
}

/** POST /orders — places an order for the signed-in user. */
export async function createOrder(input: NewOrderInput): Promise<Order> {
  const response = await api<{ order: Order }>("POST", "/orders", input);
  return response.order;
}
