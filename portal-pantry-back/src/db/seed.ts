
import { withTransaction, type Db } from "./database.js";
import { defaultPrepMinutes, seedCatalog } from "./catalog-data.js";
import { insertOrderWithItems, type OrderRecord } from "./orders.js";
import { randomInt } from "node:crypto";

/** The kitchen the canonical demo owner account manages. */
export const OWNER_RESTAURANT_ID = "neutrino";

const nowIso = () => new Date().toISOString();

function daysAgo(days: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function minutesAgo(mins: number): string {
  return new Date(Date.now() - mins * 60_000).toISOString();
}

function seedOrderId(base: number): string {
  return `PP-${base + randomInt(0, 10_000)}`;
}

export function insertWelcomeOrders(db: Db, userId: string, customerName: string): void {
  const orders: OrderRecord[] = [
    {
      id: seedOrderId(80_000),
      userId,
      customerName,
      placedAt: daysAgo(3, 19, 42),
      status: "delivered",
      dimension: "Ω-77",
      items: [
        { restaurantId: "neutrino", name: "Phase-Through Pho", qty: 2, price: 29, restaurant: "Neutrino Noodles" },
        { restaurantId: "neutrino", name: "Zero-G Gyoza", qty: 1, price: 21, restaurant: "Neutrino Noodles" },
      ],
      total: 91,
    },
    {
      id: seedOrderId(70_000),
      userId,
      customerName,
      placedAt: daysAgo(9, 13, 8),
      status: "delivered",
      dimension: "C-131",
      items: [
        { restaurantId: "gargantua", name: "Event Horizon Burger", qty: 1, price: 45, restaurant: "Greasy Gargantua" },
        { restaurantId: "gargantua", name: "Singularity Fries", qty: 2, price: 18, restaurant: "Greasy Gargantua" },
        { restaurantId: "gargantua", name: "Dark Matter Shake", qty: 1, price: 22, restaurant: "Greasy Gargantua" },
      ],
      total: 115,
    },
    {
      id: seedOrderId(60_000),
      userId,
      customerName,
      placedAt: daysAgo(16, 20, 27),
      status: "wrong-dimension",
      dimension: "B-612",
      items: [
        { restaurantId: "zorp", name: "Tentacle Pot Pie", qty: 1, price: 33, restaurant: "Grandma Zorp's" },
        { restaurantId: "zorp", name: "Warm Plasma Pudding", qty: 2, price: 15, restaurant: "Grandma Zorp's" },
      ],
      total: 75,
    },
    {
      id: seedOrderId(50_000),
      userId,
      customerName,
      placedAt: daysAgo(23, 11, 55),
      status: "lost",
      dimension: "Pickle-9",
      items: [
        { restaurantId: "brined-one", name: "Dill-emma Dog", qty: 2, price: 19, restaurant: "The Brined One" },
        { restaurantId: "brined-one", name: "Brine Smoothie", qty: 1, price: 11, restaurant: "The Brined One" },
      ],
      total: 61,
    },
  ];
  for (const order of orders) insertOrderWithItems(db, order);
}

/** Neutrino Noodles' order book — what the demo owner sees on day one. */
function neutrinoOrders(): OrderRecord[] {
  const pho = { restaurantId: "neutrino", name: "Phase-Through Pho", price: 29, restaurant: "Neutrino Noodles" };
  const gyoza = { restaurantId: "neutrino", name: "Zero-G Gyoza", price: 21, restaurant: "Neutrino Noodles" };
  const broth = { restaurantId: "neutrino", name: "Antimatter Broth Refill", price: 3, restaurant: "Neutrino Noodles" };
  const egg = { restaurantId: "neutrino", name: "Neutron Star Egg", price: 12, restaurant: "Neutrino Noodles" };

  return [
    // Pending — the live queue.
    { id: "PP-91443", userId: "usr_seed_cust", customerName: "Morty S.", placedAt: minutesAgo(6), status: "pending", dimension: "Ω-77", items: [{ ...pho, qty: 2 }, { ...broth, qty: 1 }], total: 73 },
    { id: "PP-91380", userId: "usr_seed_cust2", customerName: "Summer S.", placedAt: minutesAgo(18), status: "pending", dimension: "C-131", items: [{ ...gyoza, qty: 3 }, { ...egg, qty: 1 }], total: 87 },
    { id: "PP-91201", userId: "usr_seed_cust", customerName: "Morty S.", placedAt: minutesAgo(41), status: "pending", dimension: "Ω-77", items: [{ ...pho, qty: 1 }, { ...gyoza, qty: 1 }], total: 62 },
    // Delivered — the earnings history.
    { id: "PP-90888", userId: "usr_seed_cust2", customerName: "Summer S.", placedAt: daysAgo(1, 20, 12), status: "delivered", dimension: "Ω-77", items: [{ ...pho, qty: 4 }], total: 128 },
    { id: "PP-90715", userId: "usr_seed_cust", customerName: "Morty S.", placedAt: daysAgo(2, 12, 40), status: "delivered", dimension: "C-131", items: [{ ...gyoza, qty: 2 }, { ...broth, qty: 2 }, { ...egg, qty: 1 }], total: 72 },
    { id: "PP-90540", userId: "usr_seed_cust3", customerName: "Birdperson", placedAt: daysAgo(4, 18, 5), status: "delivered", dimension: "B-612", items: [{ ...pho, qty: 3 }, { ...gyoza, qty: 2 }], total: 141 },
    { id: "PP-90390", userId: "usr_seed_cust3", customerName: "Birdperson", placedAt: daysAgo(6, 19, 33), status: "delivered", dimension: "Ω-77", items: [{ ...pho, qty: 2 }, { ...egg, qty: 2 }], total: 94 },
    // A hiccup — refunded, so it dents the numbers realistically.
    { id: "PP-90211", userId: "usr_seed_cust2", customerName: "Summer S.", placedAt: daysAgo(8, 21, 19), status: "wrong-dimension", dimension: "Pickle-9", items: [{ ...pho, qty: 2 }], total: 70 },
  ];
}

interface SeedUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  dimension: string;
  memberSince: string;
  role: "customer" | "owner";
  restaurantId?: string;
}

/** Demo accounts. No password hash → any 4+ character password works. */
const seedUsers: SeedUser[] = [
  { id: "usr_seed_owner", email: "owner@neutrino.pp", name: "Noodle Boss", avatar: "", dimension: "Ω-77", memberSince: "2839", role: "owner", restaurantId: OWNER_RESTAURANT_ID },
  { id: "usr_seed_cust", email: "morty@citadel.pp", name: "Morty S.", avatar: "", dimension: "Ω-77", memberSince: "2841", role: "customer" },
  { id: "usr_seed_cust2", email: "summer@citadel.pp", name: "Summer S.", avatar: "", dimension: "C-131", memberSince: "2842", role: "customer" },
  { id: "usr_seed_cust3", email: "birdperson@birdworld.pp", name: "Birdperson", avatar: "", dimension: "B-612", memberSince: "2840", role: "customer" },
];

interface SeedReview {
  id: string;
  restaurantId: string;
  author: string;
  avatar: string;
  rating: number;
  body: string;
  createdAt: string;
  reply?: string;
  repliedAt?: string;
}

/** The Neutrino Noodles review wall — a couple already answered. */
function seedReviews(): SeedReview[] {
  return [
    {
      id: "rev_1",
      restaurantId: "neutrino",
      author: "Rick S.",
      avatar: "",
      rating: 5,
      body: "The Phase-Through Pho literally passed through me and I STILL think about it. *burp* That's science, baby. Ten stars, your form only allows five.",
      createdAt: daysAgo(2, 22, 14),
      reply: "Thanks Rick. Genuinely begging you to stop bringing the portal gun into the dining area though.",
      repliedAt: daysAgo(2, 23, 1),
    },
    {
      id: "rev_2",
      restaurantId: "neutrino",
      author: "Morty S.",
      avatar: "",
      rating: 4,
      body: "Aw geez, the Zero-G Gyoza floated right off my plate a-and I had to chase them around the ship, but they were r-really good, so, y'know, four stars.",
      createdAt: daysAgo(5, 13, 40),
    },
    {
      id: "rev_3",
      restaurantId: "neutrino",
      author: "Birdperson",
      avatar: "",
      rating: 5,
      body: "In my culture, Antimatter Broth is served only at weddings and funerals. This bowl honored both traditions with dignity.",
      createdAt: daysAgo(7, 9, 5),
      reply: "It is an honor to feed you, Birdperson.",
      repliedAt: daysAgo(7, 10, 22),
    },
    {
      id: "rev_4",
      restaurantId: "neutrino",
      author: "Summer S.",
      avatar: "",
      rating: 3,
      body: "The Neutron Star Egg cracked my table in half. Kind of iconic honestly but three stars because now I eat on the floor.",
      createdAt: daysAgo(9, 18, 52),
    },
    {
      id: "rev_5",
      restaurantId: "neutrino",
      author: "Squanchy",
      avatar: "",
      rating: 4,
      body: "Great spot to really squanch a warm bowl of noodles in peace. Cozy lighting, no questions asked. That's all a guy needs.",
      createdAt: daysAgo(12, 1, 30),
    },
  ];
}

/** Seeds an empty database; returns whether anything was inserted. */
export function seedDatabaseIfEmpty(db: Db): boolean {
  const row = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  if (row.n > 0) return false;

  withTransaction(db, () => {
    const insertRestaurant = db.prepare(
      `INSERT INTO restaurants (id, name, tagline, category, dimension, rating, time, fee, hue, promoted, image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertMenuItem = db.prepare(
      `INSERT INTO menu_items (id, restaurant_id, name, description, price, delisted, prep_minutes, image)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    );
    for (const r of seedCatalog) {
      insertRestaurant.run(
        r.id, r.name, r.tagline, r.category, r.dimension,
        r.rating, r.time, r.fee, r.hue, r.promoted ? 1 : 0, r.image ?? null,
      );
      for (const item of r.items) {
        insertMenuItem.run(
          item.id, r.id, item.name, item.desc, item.price,
          item.prepMinutes ?? defaultPrepMinutes(item.price), item.image ?? null,
        );
      }
    }

    const insertUser = db.prepare(
      `INSERT INTO users (id, email, name, avatar, dimension, member_since, role, restaurant_id, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
    );
    for (const u of seedUsers) {
      insertUser.run(
        u.id, u.email, u.name, u.avatar, u.dimension, u.memberSince,
        u.role, u.restaurantId ?? null, nowIso(),
      );
    }

    for (const order of neutrinoOrders()) insertOrderWithItems(db, order);

    const insertReview = db.prepare(
      `INSERT INTO reviews (id, restaurant_id, author, avatar, rating, body, created_at, reply, replied_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const rev of seedReviews()) {
      insertReview.run(
        rev.id, rev.restaurantId, rev.author, rev.avatar, rev.rating,
        rev.body, rev.createdAt, rev.reply ?? null, rev.repliedAt ?? null,
      );
    }
  });
  return true;
}
