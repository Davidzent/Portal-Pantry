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

export interface NewOrderInput {
  items: OrderItem[];
  total: number;
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
