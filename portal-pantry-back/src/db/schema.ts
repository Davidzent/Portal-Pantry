/**
 * SQLite schema. Normalized the way a Postgres backend would be:
 * restaurants ← menu_items, users ← sessions/orders, orders ← order_items
 * (line items snapshot name/price at purchase so history survives menu
 * edits), restaurants ← reviews.
 * This will eventually change to add more details like store phone number
 * employees accounts, that will have little authorization and manager accounts
 * 
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS restaurants (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  emoji      TEXT NOT NULL DEFAULT '',
  tagline    TEXT NOT NULL DEFAULT '',
  category   TEXT NOT NULL,
  dimension  TEXT NOT NULL,
  rating     REAL NOT NULL DEFAULT 0,
  time       TEXT NOT NULL,
  fee        REAL NOT NULL DEFAULT 0,
  hue        INTEGER NOT NULL DEFAULT 0,
  promoted   INTEGER NOT NULL DEFAULT 0,
  image      TEXT
);



CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  avatar        TEXT NOT NULL DEFAULT '',
  dimension     TEXT NOT NULL,
  member_since  TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('customer', 'owner')),
  restaurant_id TEXT REFERENCES restaurants(id),
  -- NULL marks a seeded demo account: any 4+ character password signs in.
  password_hash TEXT,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS menu_items (
  id            TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id),
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  price         REAL NOT NULL CHECK (price > 0),
  emoji         TEXT NOT NULL DEFAULT '',
  delisted      INTEGER NOT NULL DEFAULT 0,
  prep_minutes  INTEGER NOT NULL CHECK (prep_minutes > 0),
  image         TEXT
);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);

CREATE TABLE IF NOT EXISTS orders (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id),
  customer_name TEXT NOT NULL,
  placed_at     TEXT NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('pending', 'delivered', 'wrong-dimension', 'lost')),
  dimension     TEXT NOT NULL,
  total         REAL NOT NULL CHECK (total > 0)
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, placed_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id        TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  restaurant_id   TEXT NOT NULL REFERENCES restaurants(id),
  name            TEXT NOT NULL,
  emoji           TEXT NOT NULL DEFAULT '',
  qty             INTEGER NOT NULL CHECK (qty > 0),
  price           REAL NOT NULL CHECK (price >= 0),
  restaurant_name TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_restaurant ON order_items(restaurant_id);

CREATE TABLE IF NOT EXISTS reviews (
  id            TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id),
  author        TEXT NOT NULL,
  avatar        TEXT NOT NULL DEFAULT '',
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body          TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  reply         TEXT,
  replied_at    TEXT
);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant ON reviews(restaurant_id);
`;
