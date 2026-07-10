/**
 * API payload types (DTOs) — mirrors of the shapes the Portal Pantry
 * frontend declares in its `src/api/*.ts` SDK modules. If a field moves
 * here, it moves there.
 */

export type UserRole = "customer" | "owner";

export interface UserDto {
  id: string;
  email: string;
  name: string;
  avatar: string;
  dimension: string;
  memberSince: string;
  role: UserRole;
  /** Present on owner accounts — the kitchen this account manages. */
  restaurantId?: string;
  /** Joined in for convenience. */
  restaurantName?: string;
}

export interface MenuItemDto {
  id: string;
  name: string;
  desc: string;
  price: number;
  emoji: string;
  delisted: boolean;
  prepMinutes: number;
  image?: string;
}

export interface RestaurantDto {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  category: string;
  dimension: string;
  rating: number;
  time: string;
  fee: number;
  hue: number;
  promoted?: boolean;
  image?: string;
  items: MenuItemDto[];
}

export type OrderStatus = "pending" | "delivered" | "wrong-dimension" | "lost";

export interface OrderItemDto {
  restaurantId: string;
  name: string;
  emoji: string;
  qty: number;
  price: number;
  /** Restaurant display name, snapshotted at purchase time. */
  restaurant: string;
}

/** An order as the customer sees it — every line item, grand total. */
export interface OrderDto {
  id: string;
  customerName: string;
  placedAt: string;
  status: OrderStatus;
  dimension: string;
  items: OrderItemDto[];
  total: number;
}

/** An order as a kitchen sees it — only their items and their cut. */
export interface OwnerOrderDto {
  id: string;
  customerName: string;
  placedAt: string;
  status: OrderStatus;
  dimension: string;
  items: OrderItemDto[];
  subtotal: number;
}

export interface ReviewDto {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  body: string;
  createdAt: string;
  reply?: string;
  repliedAt?: string;
}

export interface FinanceDto {
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
