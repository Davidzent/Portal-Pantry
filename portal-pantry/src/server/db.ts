/**
 * The mock database. Normalized tables (users, sessions, restaurants,
 * menu_items, orders, reviews) seeded on first run and persisted to
 * localStorage as a single blob — stands in for Postgres while keeping
 * the exact shape a real backend would query.
 */

import { restaurants as seedCatalog } from "../data";

export type DbUserRole = "customer" | "owner";

export interface DbUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  dimension: string;
  memberSince: string;
  role: DbUserRole;
  /** FK → restaurants.id. Only set for owner accounts. */
  restaurantId?: string;
}

export interface DbSession {
  token: string;
  userId: string;
  createdAt: string;
}

export interface DbRestaurant {
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
  /** Image key, resolved to a bundled asset on the client. */
  image?: string;
}

export interface DbMenuItem {
  id: string;
  /** FK → restaurants.id. */
  restaurantId: string;
  name: string;
  desc: string;
  price: number;
  emoji: string;
  delisted: boolean;
  /** Kitchen prep time in minutes — owner-adjustable, shown to customers. */
  prepMinutes: number;
  /** Image key, resolved to a bundled asset on the client. */
  image?: string;
}

/** pending → the kitchen hasn't dispatched it yet. */
export type DbOrderStatus =
  | "pending"
  | "delivered"
  | "wrong-dimension"
  | "lost";

export interface DbOrderItem {
  /** FK → restaurants.id — rename-proof way to attribute revenue. */
  restaurantId: string;
  name: string;
  emoji: string;
  qty: number;
  price: number;
  restaurant: string;
}

export interface DbOrder {
  id: string;
  /** FK → users.id. */
  userId: string;
  /** Display name of the customer (denormalized for the owner's view). */
  customerName: string;
  placedAt: string;
  status: DbOrderStatus;
  dimension: string;
  items: DbOrderItem[];
  total: number;
}

export interface DbReview {
  id: string;
  /** FK → restaurants.id. */
  restaurantId: string;
  author: string;
  avatar: string;
  /** 1–5 stars. */
  rating: number;
  body: string;
  createdAt: string;
  /** Owner reply, if any. */
  reply?: string;
  repliedAt?: string;
}

export interface Database {
  users: DbUser[];
  sessions: DbSession[];
  restaurants: DbRestaurant[];
  menuItems: DbMenuItem[];
  orders: DbOrder[];
  reviews: DbReview[];
}

const DB_KEY = "pp-db-v4";
/** Storage keys from earlier iterations — cleaned up on first seed. */
const LEGACY_KEYS = [
  "pp-db-v1",
  "pp-db-v2",
  "pp-db-v3",
  "pp-session",
  "pp-orders",
  "pp-store-overrides",
  "pp-token",
];

/** The kitchen every demo owner account is linked to. */
export const OWNER_RESTAURANT_ID = "neutrino";

const AVATARS = ["🧑‍🚀", "👽", "🤖", "🧪", "🛸", "🥒", "🦑", "🔮"];

function avatarFor(email: string): string {
  let hash = 0;
  for (const ch of email) hash = (hash + ch.charCodeAt(0)) % 997;
  return AVATARS[hash % AVATARS.length];
}

/** "you.name-42@x.com" → "You Name". */
function nameFor(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local
    .split(/[._-]+/)
    .map((p) => p.replace(/\d+/g, ""))
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase() + p.slice(1).toLowerCase());
  return parts.length > 0 ? parts.join(" ") : "Traveler";
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Sensible default prep time when the catalog doesn't specify one. */
function defaultPrep(price: number): number {
  return Math.max(5, Math.round(price / 3));
}

function daysAgo(days: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function minutesAgo(mins: number): string {
  return new Date(Date.now() - mins * 60_000).toISOString();
}

/** Welcome history attached to every new customer account. */
function seedOrdersFor(userId: string, customerName: string): DbOrder[] {
  return [
    {
      id: `PP-${Math.floor(80000 + Math.random() * 9999)}`,
      userId,
      customerName,
      placedAt: daysAgo(3, 19, 42),
      status: "delivered",
      dimension: "Ω-77",
      items: [
        { restaurantId: "neutrino", name: "Phase-Through Pho", emoji: "🍜", qty: 2, price: 29, restaurant: "Neutrino Noodles" },
        { restaurantId: "neutrino", name: "Zero-G Gyoza", emoji: "🥟", qty: 1, price: 21, restaurant: "Neutrino Noodles" },
      ],
      total: 91,
    },
    {
      id: `PP-${Math.floor(70000 + Math.random() * 9999)}`,
      userId,
      customerName,
      placedAt: daysAgo(9, 13, 8),
      status: "delivered",
      dimension: "C-131",
      items: [
        { restaurantId: "gargantua", name: "Event Horizon Burger", emoji: "🍔", qty: 1, price: 45, restaurant: "Greasy Gargantua" },
        { restaurantId: "gargantua", name: "Singularity Fries", emoji: "🍟", qty: 2, price: 18, restaurant: "Greasy Gargantua" },
        { restaurantId: "gargantua", name: "Dark Matter Shake", emoji: "🥤", qty: 1, price: 22, restaurant: "Greasy Gargantua" },
      ],
      total: 115,
    },
    {
      id: `PP-${Math.floor(60000 + Math.random() * 9999)}`,
      userId,
      customerName,
      placedAt: daysAgo(16, 20, 27),
      status: "wrong-dimension",
      dimension: "B-612",
      items: [
        { restaurantId: "zorp", name: "Tentacle Pot Pie", emoji: "🥧", qty: 1, price: 33, restaurant: "Grandma Zorp's" },
        { restaurantId: "zorp", name: "Warm Plasma Pudding", emoji: "🍮", qty: 2, price: 15, restaurant: "Grandma Zorp's" },
      ],
      total: 75,
    },
    {
      id: `PP-${Math.floor(50000 + Math.random() * 9999)}`,
      userId,
      customerName,
      placedAt: daysAgo(23, 11, 55),
      status: "lost",
      dimension: "Pickle-9",
      items: [
        { restaurantId: "brined-one", name: "Dill-emma Dog", emoji: "🌭", qty: 2, price: 19, restaurant: "The Brined One" },
        { restaurantId: "brined-one", name: "Brine Smoothie", emoji: "🧃", qty: 1, price: 11, restaurant: "The Brined One" },
      ],
      total: 61,
    },
  ];
}

/** Neutrino Noodles order book — what the owner sees on day one. */
function seedNeutrinoOrders(): DbOrder[] {
  const pho = { restaurantId: "neutrino", name: "Phase-Through Pho", emoji: "🍜", price: 29, restaurant: "Neutrino Noodles" };
  const gyoza = { restaurantId: "neutrino", name: "Zero-G Gyoza", emoji: "🥟", price: 21, restaurant: "Neutrino Noodles" };
  const broth = { restaurantId: "neutrino", name: "Antimatter Broth Refill", emoji: "🫕", price: 3, restaurant: "Neutrino Noodles" };
  const egg = { restaurantId: "neutrino", name: "Neutron Star Egg", emoji: "🥚", price: 12, restaurant: "Neutrino Noodles" };

  return [
    // Pending — the live queue.
    {
      id: "PP-91443",
      userId: "usr_seed_cust",
      customerName: "Morty S.",
      placedAt: minutesAgo(6),
      status: "pending",
      dimension: "Ω-77",
      items: [{ ...pho, qty: 2 }, { ...broth, qty: 1 }],
      total: 73,
    },
    {
      id: "PP-91380",
      userId: "usr_seed_cust2",
      customerName: "Summer S.",
      placedAt: minutesAgo(18),
      status: "pending",
      dimension: "C-131",
      items: [{ ...gyoza, qty: 3 }, { ...egg, qty: 1 }],
      total: 87,
    },
    {
      id: "PP-91201",
      userId: "usr_seed_cust",
      customerName: "Morty S.",
      placedAt: minutesAgo(41),
      status: "pending",
      dimension: "Ω-77",
      items: [{ ...pho, qty: 1 }, { ...gyoza, qty: 1 }],
      total: 62,
    },
    // Delivered — the earnings history.
    {
      id: "PP-90888",
      userId: "usr_seed_cust2",
      customerName: "Summer S.",
      placedAt: daysAgo(1, 20, 12),
      status: "delivered",
      dimension: "Ω-77",
      items: [{ ...pho, qty: 4 }],
      total: 128,
    },
    {
      id: "PP-90715",
      userId: "usr_seed_cust",
      customerName: "Morty S.",
      placedAt: daysAgo(2, 12, 40),
      status: "delivered",
      dimension: "C-131",
      items: [{ ...gyoza, qty: 2 }, { ...broth, qty: 2 }, { ...egg, qty: 1 }],
      total: 72,
    },
    {
      id: "PP-90540",
      userId: "usr_seed_cust3",
      customerName: "Birdperson",
      placedAt: daysAgo(4, 18, 5),
      status: "delivered",
      dimension: "B-612",
      items: [{ ...pho, qty: 3 }, { ...gyoza, qty: 2 }],
      total: 141,
    },
    {
      id: "PP-90390",
      userId: "usr_seed_cust3",
      customerName: "Birdperson",
      placedAt: daysAgo(6, 19, 33),
      status: "delivered",
      dimension: "Ω-77",
      items: [{ ...pho, qty: 2 }, { ...egg, qty: 2 }],
      total: 94,
    },
    // A hiccup — refunded, so it dents the numbers realistically.
    {
      id: "PP-90211",
      userId: "usr_seed_cust2",
      customerName: "Summer S.",
      placedAt: daysAgo(8, 21, 19),
      status: "wrong-dimension",
      dimension: "Pickle-9",
      items: [{ ...pho, qty: 2 }],
      total: 70,
    },
  ];
}

/** Sample reviews — Neutrino Noodles only, a couple already answered. */
function seedReviews(): DbReview[] {
  return [
    {
      id: "rev_1",
      restaurantId: "neutrino",
      author: "Rick S.",
      avatar: "🥼",
      rating: 5,
      body: "The Phase-Through Pho literally passed through me and I STILL think about it. *burp* That's science, baby. Ten stars, your form only allows five.",
      createdAt: daysAgo(2, 22, 14),
      reply:
        "Thanks Rick. Genuinely begging you to stop bringing the portal gun into the dining area though.",
      repliedAt: daysAgo(2, 23, 1),
    },
    {
      id: "rev_2",
      restaurantId: "neutrino",
      author: "Morty S.",
      avatar: "😰",
      rating: 4,
      body: "Aw geez, the Zero-G Gyoza floated right off my plate a-and I had to chase them around the ship, but they were r-really good, so, y'know, four stars.",
      createdAt: daysAgo(5, 13, 40),
    },
    {
      id: "rev_3",
      restaurantId: "neutrino",
      author: "Birdperson",
      avatar: "🦅",
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
      avatar: "💅",
      rating: 3,
      body: "The Neutron Star Egg cracked my table in half. Kind of iconic honestly but three stars because now I eat on the floor.",
      createdAt: daysAgo(9, 18, 52),
    },
    {
      id: "rev_5",
      restaurantId: "neutrino",
      author: "Squanchy",
      avatar: "🐱",
      rating: 4,
      body: "Great spot to really squanch a warm bowl of noodles in peace. Cozy lighting, no questions asked. That's all a guy needs.",
      createdAt: daysAgo(12, 1, 30),
    },
  ];
}

function seed(): Database {
  const restaurants: DbRestaurant[] = seedCatalog.map(
    ({ items: _items, ...row }) => ({ ...row }),
  );
  const menuItems: DbMenuItem[] = seedCatalog.flatMap((r) =>
    r.items.map((item) => ({
      ...item,
      delisted: item.delisted ?? false,
      prepMinutes: item.prepMinutes ?? defaultPrep(item.price),
      restaurantId: r.id,
    })),
  );
  return {
    users: [
      // The canonical demo owner account, on file like any real record.
      {
        id: "usr_seed_owner",
        email: "owner@neutrino.pp",
        name: "Noodle Boss",
        avatar: "🍜",
        dimension: "Ω-77",
        memberSince: "2839",
        role: "owner",
        restaurantId: OWNER_RESTAURANT_ID,
      },
    ],
    sessions: [],
    restaurants,
    menuItems,
    orders: seedNeutrinoOrders(),
    reviews: seedReviews(),
  };
}

let cache: Database | null = null;

export function getDb(): Database {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      cache = JSON.parse(raw) as Database;
      return cache;
    }
  } catch {
    // corrupted or unavailable — fall through to a fresh seed
  }
  cache = seed();
  for (const key of LEGACY_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
  persist();
  return cache;
}

export function persist(): void {
  if (!cache) return;
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(cache));
  } catch {
    // storage unavailable — the "database" lives in memory for this tab
  }
}

/** INSERT INTO restaurants — a brand-new kitchen with sensible defaults. */
export function createRestaurant(
  db: Database,
  opts: {
    name: string;
    tagline?: string;
    category?: string;
    dimension?: string;
    emoji?: string;
    image?: string;
  },
): DbRestaurant {
  const restaurant: DbRestaurant = {
    id: newId("rest"),
    name: opts.name.trim(),
    emoji: opts.emoji?.trim() || "",
    tagline: opts.tagline?.trim() || "A fresh new kitchen in the multiverse.",
    category: opts.category || "Human food",
    dimension: opts.dimension || "C-131",
    rating: 0,
    time: "15–30 min",
    fee: 0,
    hue: Math.floor(Math.random() * 360),
    image: opts.image,
  };
  db.restaurants.push(restaurant);
  return restaurant;
}

/**
 * INSERT INTO users. Registration entry point — owner sign-ups also mint
 * a brand-new restaurant and link the account to it.
 */
export function registerAccount(
  db: Database,
  opts: {
    email: string;
    name?: string;
    role: DbUserRole;
    restaurantName?: string;
  },
): DbUser {
  let restaurantId: string | undefined;
  let avatar: string | undefined;
  if (opts.role === "owner") {
    const restaurant = createRestaurant(db, {
      name:
        opts.restaurantName?.trim() ||
        (opts.name ? `${opts.name.trim()}'s Kitchen` : "New Kitchen"),
    });
    restaurantId = restaurant.id;
    avatar = restaurant.emoji;
  }
  const user: DbUser = {
    id: newId("usr"),
    email: opts.email,
    name: opts.name?.trim() || nameFor(opts.email),
    avatar: avatar ?? avatarFor(opts.email),
    dimension: "C-131",
    memberSince: "2847",
    role: opts.role,
    restaurantId,
  };
  db.users.push(user);
  if (opts.role === "customer") {
    db.orders.push(...seedOrdersFor(user.id, user.name));
  }
  return user;
}
