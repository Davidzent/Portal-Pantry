
export type UserRole = "customer" | "owner";

export interface UserDto {
  id: string;
  email: string;
  name: string;
  avatar: string;
  dimension: string;
  memberSince: string;
  role: UserRole;
  restaurantId?: string;
  restaurantName?: string;
}

export interface MenuItemDto {
  id: string;
  name: string;
  desc: string;
  price: number;
  delisted: boolean;
  prepMinutes: number;
  image?: string;
}

export interface RestaurantDto {
  id: string;
  name: string;
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
  qty: number;
  price: number;
  restaurant: string;
}

export interface OrderDto {
  id: string;
  customerName: string;
  placedAt: string;
  status: OrderStatus;
  dimension: string;
  items: OrderItemDto[];
  total: number;
}

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
