
import type { Db, MenuItemRow, RestaurantRow } from "./database.js";
import type { MenuItemDto, RestaurantDto } from "../types.js";

export function menuItemToDto(row: MenuItemRow): MenuItemDto {
  return {
    id: row.id,
    name: row.name,
    desc: row.description,
    price: row.price,
    delisted: row.delisted === 1,
    prepMinutes: row.prep_minutes,
    ...(row.image !== null ? { image: row.image } : {}),
  };
}

function restaurantToDto(row: RestaurantRow, items: MenuItemDto[]): RestaurantDto {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    category: row.category,
    dimension: row.dimension,
    rating: row.rating,
    time: row.time,
    fee: row.fee,
    hue: row.hue,
    ...(row.promoted === 1 ? { promoted: true } : {}),
    ...(row.image !== null ? { image: row.image } : {}),
    items,
  };
}

export function findRestaurantRow(db: Db, id: string): RestaurantRow | undefined {
  return db.prepare("SELECT * FROM restaurants WHERE id = ?").get(id) as
    | RestaurantRow
    | undefined;
}

/** Every restaurant with its menu, in catalog (insertion) order. */
export function listRestaurantsWithItems(
  db: Db,
  opts: { includeDelisted: boolean },
): RestaurantDto[] {
  const restaurantRows = db
    .prepare("SELECT * FROM restaurants ORDER BY rowid")
    .all() as unknown as RestaurantRow[];
  const itemRows = db
    .prepare(
      `SELECT * FROM menu_items ${opts.includeDelisted ? "" : "WHERE delisted = 0"} ORDER BY rowid`,
    )
    .all() as unknown as MenuItemRow[];

  const itemsByRestaurant = new Map<string, MenuItemDto[]>();
  for (const row of itemRows) {
    const list = itemsByRestaurant.get(row.restaurant_id) ?? [];
    list.push(menuItemToDto(row));
    itemsByRestaurant.set(row.restaurant_id, list);
  }
  return restaurantRows.map((row) =>
    restaurantToDto(row, itemsByRestaurant.get(row.id) ?? []),
  );
}

/** One restaurant with its menu, or undefined if it doesn't exist. */
export function getRestaurantWithItems(
  db: Db,
  id: string,
  opts: { includeDelisted: boolean },
): RestaurantDto | undefined {
  const row = findRestaurantRow(db, id);
  if (!row) return undefined;
  const itemRows = db
    .prepare(
      `SELECT * FROM menu_items WHERE restaurant_id = ? ${opts.includeDelisted ? "" : "AND delisted = 0"} ORDER BY rowid`,
    )
    .all(id) as unknown as MenuItemRow[];
  return restaurantToDto(row, itemRows.map(menuItemToDto));
}
