import { api } from "./apiClient";

export type OrderStatus = "pending" | "delivered" | "wrong-dimension" | "lost";

export interface OrderItem {
  restaurantId: string;
  name: string;
  qty: number;
  price: number;
  restaurant: string;
}

export interface Order {
  id: string;
  placedAt: string;
  status: OrderStatus;
  dimension: string;
  items: OrderItem[];
  total: number;
}

export interface NewOrderItemInput {
  restaurantId: string;
  itemId: string;
  qty: number;
}

/**
 * A new order names dishes and quantities only — the server looks up prices
 * and computes the total. Client math is never sent, never trusted.
 */
export interface NewOrderInput {
  items: NewOrderItemInput[];
  dimension: string;
}

export async function getOrders(): Promise<Order[]> {
  const response = await api<{ orders: Order[] }>("GET", "/orders");
  return response.orders;
}

export async function createOrder(input: NewOrderInput): Promise<Order> {
  const response = await api<{ order: Order }>("POST", "/orders", input);
  return response.order;
}
