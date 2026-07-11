
import type { Db, OrderItemRow, OrderRow } from "./database.js";
import type { OrderDto, OrderItemDto, OrderStatus } from "../types.js";

export interface OrderRecord {
  id: string;
  userId: string;
  customerName: string;
  placedAt: string;
  status: OrderStatus;
  dimension: string;
  items: OrderItemDto[];
  total: number;
}

export function insertOrderWithItems(db: Db, order: OrderRecord): void {
  db.prepare(
    `INSERT INTO orders (id, user_id, customer_name, placed_at, status, dimension, total)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    order.id,
    order.userId,
    order.customerName,
    order.placedAt,
    order.status,
    order.dimension,
    order.total,
  );
  const insertItem = db.prepare(
    `INSERT INTO order_items (order_id, restaurant_id, name, qty, price, restaurant_name)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  for (const item of order.items) {
    insertItem.run(
      order.id,
      item.restaurantId,
      item.name,
      item.qty,
      item.price,
      item.restaurant,
    );
  }
}

export function orderIdExists(db: Db, id: string): boolean {
  return db.prepare("SELECT 1 FROM orders WHERE id = ?").get(id) !== undefined;
}

function itemToDto(row: OrderItemRow): OrderItemDto {
  return {
    restaurantId: row.restaurant_id,
    name: row.name,
    qty: row.qty,
    price: row.price,
    restaurant: row.restaurant_name,
  };
}


export function itemsByOrder(
  db: Db,
  orderIds: string[],
  restaurantId?: string,
): Map<string, OrderItemDto[]> {
  const grouped = new Map<string, OrderItemDto[]>();
  if (orderIds.length === 0) return grouped;

  const placeholders = orderIds.map(() => "?").join(", ");
  const filter = restaurantId === undefined ? "" : "AND restaurant_id = ?";
  const rows = db
    .prepare(
      `SELECT * FROM order_items WHERE order_id IN (${placeholders}) ${filter} ORDER BY id`,
    )
    .all(...orderIds, ...(restaurantId === undefined ? [] : [restaurantId])) as unknown as OrderItemRow[];

  for (const row of rows) {
    const list = grouped.get(row.order_id) ?? [];
    list.push(itemToDto(row));
    grouped.set(row.order_id, list);
  }
  return grouped;
}

export function orderToDto(row: OrderRow, items: OrderItemDto[]): OrderDto {
  return {
    id: row.id,
    customerName: row.customer_name,
    placedAt: row.placed_at,
    status: row.status,
    dimension: row.dimension,
    items,
    total: row.total,
  };
}
