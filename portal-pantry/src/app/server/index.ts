import {
  getDb,
  newId,
  persist,
  registerAccount,
  type Database,
  type DbMenuItem,
  type DbOrder,
  type DbRestaurant,
  type DbReview,
  type DbUser,
} from "./db";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

interface MockResponse {
  status: number;
  data: unknown;
}

const PLATFORM_FEE_RATE = 0.15;
const REALITY_TAX_RATE = 0.08;

function userDto(db: Database, user: DbUser) {
  const kitchen = user.restaurantId
    ? db.restaurants.find((r) => r.id === user.restaurantId)
    : undefined;
  return { ...user, restaurantName: kitchen?.name };
}

function itemDto(item: DbMenuItem) {
  const { restaurantId: _restaurantId, ...dto } = item;
  return dto;
}

function restaurantDto(
  db: Database,
  restaurant: DbRestaurant,
  { includeDelisted }: { includeDelisted: boolean },
) {
  const items = db.menuItems
    .filter(
      (item) =>
        item.restaurantId === restaurant.id &&
        (includeDelisted || !item.delisted),
    )
    .map(itemDto);
  return { ...restaurant, items };
}

function orderDto(order: DbOrder) {
  const { userId: _userId, ...dto } = order;
  return dto;
}

function ownerOrderDto(order: DbOrder, restaurantId: string) {
  const items = order.items.filter((i) => i.restaurantId === restaurantId);
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
  return {
    id: order.id,
    customerName: order.customerName,
    placedAt: order.placedAt,
    status: order.status,
    dimension: order.dimension,
    items,
    subtotal,
  };
}

function reviewDto(review: DbReview) {
  const { restaurantId: _restaurantId, ...dto } = review;
  return dto;
}

function requireAuth(db: Database, token: string | null): DbUser {
  const session = token
    ? db.sessions.find((s) => s.token === token)
    : undefined;
  const user = session
    ? db.users.find((u) => u.id === session.userId)
    : undefined;
  if (!user) {
    throw new HttpError(401, "Session expired — beam in again.");
  }
  return user;
}

function requireOwner(db: Database, token: string | null): DbUser {
  const user = requireAuth(db, token);
  if (user.role !== "owner" || !user.restaurantId) {
    throw new HttpError(403, "Owner access only — this isn't your kitchen.");
  }
  return user;
}

interface LoginBody {
  email?: string;
  password?: string;
  role?: "customer" | "owner";
}

function handleLogin(db: Database, raw: unknown): MockResponse {
  const body = (raw ?? {}) as LoginBody;
  const email = (body.email ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new HttpError(422, "That doesn't look like an email in any dimension.");
  }
  if ((body.password ?? "").length < 4) {
    throw new HttpError(
      401,
      "Password rejected in all 5 realities. (Demo hint: 4+ characters.)",
    );
  }

  const user = db.users.find((u) => u.email === email);
  if (!user) {
    throw new HttpError(
      404,
      "No account with that email — create one to beam in.",
    );
  }

  const token = `pp_${newId("tok")}`;
  db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
  persist();

  return { status: 200, data: { token, user: userDto(db, user) } };
}

interface RegisterBody {
  email?: string;
  password?: string;
  name?: string;
  role?: "customer" | "owner";
  restaurantName?: string;
}

function handleRegister(db: Database, raw: unknown): MockResponse {
  const body = (raw ?? {}) as RegisterBody;
  const email = (body.email ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new HttpError(422, "That doesn't look like an email in any dimension.");
  }
  if ((body.password ?? "").length < 4) {
    throw new HttpError(422, "Password must be at least 4 characters.");
  }
  if (db.users.some((u) => u.email === email)) {
    throw new HttpError(
      409,
      "An account with that email already exists — sign in instead.",
    );
  }
  const role = body.role === "owner" ? "owner" : "customer";
  if (role === "owner" && !(body.restaurantName ?? "").trim()) {
    throw new HttpError(422, "Your kitchen needs a name.");
  }

  const user = registerAccount(db, {
    email,
    name: body.name,
    role,
    restaurantName: body.restaurantName,
  });
  const token = `pp_${newId("tok")}`;
  db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
  persist();

  return { status: 201, data: { token, user: userDto(db, user) } };
}

interface StorePatchBody {
  name?: string;
  tagline?: string;
  category?: string;
  dimension?: string;
  image?: string;
}

function handleUpdateStore(db: Database, token: string | null, raw: unknown): MockResponse {
  const owner = requireOwner(db, token);
  const body = (raw ?? {}) as StorePatchBody;
  const restaurant = db.restaurants.find((r) => r.id === owner.restaurantId);
  if (!restaurant) {
    throw new HttpError(404, "Your kitchen fell out of this reality.");
  }
  if (body.name !== undefined) {
    if (body.name.trim().length === 0) {
      throw new HttpError(422, "Your kitchen needs a name in at least one reality.");
    }
    restaurant.name = body.name.trim();
  }
  if (body.tagline !== undefined) {
    restaurant.tagline = body.tagline.trim();
  }
  if (body.category !== undefined && body.category.trim()) {
    restaurant.category = body.category.trim();
  }
  if (body.dimension !== undefined && body.dimension.trim()) {
    restaurant.dimension = body.dimension.trim();
  }
  if (body.image !== undefined) {
    restaurant.image = body.image || undefined;
  }
  persist();
  return {
    status: 200,
    data: { restaurant: restaurantDto(db, restaurant, { includeDelisted: true }) },
  };
}

interface MenuItemPatchBody {
  name?: string;
  desc?: string;
  price?: number;
  delisted?: boolean;
  prepMinutes?: number;
  image?: string;
}

function handleUpdateMenuItem(
  db: Database,
  token: string | null,
  itemId: string,
  raw: unknown,
): MockResponse {
  const owner = requireOwner(db, token);
  const item = db.menuItems.find((i) => i.id === itemId);
  if (!item) {
    throw new HttpError(404, "No such dish on file.");
  }
  if (item.restaurantId !== owner.restaurantId) {
    throw new HttpError(403, "That dish belongs to someone else's kitchen.");
  }
  const body = (raw ?? {}) as MenuItemPatchBody;
  if (body.name !== undefined) {
    if (body.name.trim().length === 0) {
      throw new HttpError(422, "A dish needs a name. Even the questionable ones.");
    }
    item.name = body.name.trim();
  }
  if (body.desc !== undefined) {
    item.desc = body.desc.trim();
  }
  if (body.price !== undefined) {
    if (!Number.isFinite(body.price) || body.price <= 0) {
      throw new HttpError(422, "Price must be a positive number of zeeps.");
    }
    item.price = body.price;
  }
  if (body.prepMinutes !== undefined) {
    if (!Number.isFinite(body.prepMinutes) || body.prepMinutes <= 0) {
      throw new HttpError(422, "Prep time must be a positive number of minutes.");
    }
    item.prepMinutes = Math.round(body.prepMinutes);
  }
  if (body.delisted !== undefined) {
    item.delisted = body.delisted;
  }
  if (body.image !== undefined) {
    item.image = body.image || undefined;
  }
  persist();
  return { status: 200, data: { item: itemDto(item) } };
}

interface NewMenuItemBody {
  name?: string;
  desc?: string;
  price?: number;
  prepMinutes?: number;
  image?: string;
}

function handleCreateMenuItem(
  db: Database,
  token: string | null,
  raw: unknown,
): MockResponse {
  const owner = requireOwner(db, token);
  const body = (raw ?? {}) as NewMenuItemBody;
  if (!(body.name ?? "").trim()) {
    throw new HttpError(422, "A dish needs a name. Even the questionable ones.");
  }
  if (!Number.isFinite(body.price) || (body.price ?? 0) <= 0) {
    throw new HttpError(422, "Price must be a positive number of zeeps.");
  }
  const prep = body.prepMinutes;
  const item: DbMenuItem = {
    id: newId("item"),
    restaurantId: owner.restaurantId!,
    name: body.name!.trim(),
    desc: (body.desc ?? "").trim(),
    price: body.price!,
    delisted: false,
    prepMinutes: Number.isFinite(prep) && (prep ?? 0) > 0 ? Math.round(prep!) : 10,
    image: body.image || undefined,
  };
  db.menuItems.push(item);
  persist();
  return { status: 201, data: { item: itemDto(item) } };
}

interface NewOrderBody {
  items?: DbOrder["items"];
  total?: number;
  dimension?: string;
}

function handleCreateOrder(db: Database, token: string | null, raw: unknown): MockResponse {
  const user = requireAuth(db, token);
  if (user.role === "owner") {
    throw new HttpError(
      403,
      "Store owners can't place orders — you're here to cook, not eat.",
    );
  }
  const body = (raw ?? {}) as NewOrderBody;
  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw new HttpError(422, "An order needs at least one dish.");
  }
  if (!Number.isFinite(body.total) || (body.total ?? 0) <= 0) {
    throw new HttpError(422, "Order total looks non-euclidean.");
  }
  const order: DbOrder = {
    id: `PP-${Math.floor(10000 + Math.random() * 90000)}`,
    userId: user.id,
    customerName: user.name,
    placedAt: new Date().toISOString(),
    status: "pending",
    dimension: body.dimension ?? user.dimension,
    items: body.items,
    total: body.total ?? 0,
  };
  db.orders.push(order);
  persist();
  return { status: 201, data: { order: orderDto(order) } };
}

interface OrderStatusBody {
  status?: DbOrder["status"];
}

function handleUpdateOrder(
  db: Database,
  token: string | null,
  orderId: string,
  raw: unknown,
): MockResponse {
  const owner = requireOwner(db, token);
  const order = db.orders.find((o) => o.id === orderId);
  if (!order || !order.items.some((i) => i.restaurantId === owner.restaurantId)) {
    throw new HttpError(404, "No such order in your kitchen.");
  }
  const body = (raw ?? {}) as OrderStatusBody;
  if (body.status !== "delivered") {
    throw new HttpError(422, "Kitchens can only mark orders delivered.");
  }
  order.status = "delivered";
  persist();
  return { status: 200, data: { order: ownerOrderDto(order, owner.restaurantId!) } };
}

function computeFinance(db: Database, restaurantId: string) {
  let gross = 0;
  let pending = 0;
  let refunded = 0;
  let deliveredOrders = 0;
  let pendingOrders = 0;

  for (const order of db.orders) {
    const mine = order.items.filter((i) => i.restaurantId === restaurantId);
    if (mine.length === 0) continue;
    const sub = mine.reduce((n, i) => n + i.price * i.qty, 0);
    if (order.status === "delivered") {
      gross += sub;
      deliveredOrders += 1;
    } else if (order.status === "pending") {
      pending += sub;
      pendingOrders += 1;
    } else {
      refunded += sub;
    }
  }

  const platformFee = Math.round(gross * PLATFORM_FEE_RATE);
  const tax = Math.round(gross * REALITY_TAX_RATE);
  const net = gross - platformFee - tax;

  return {
    gross,
    pending,
    refunded,
    deliveredOrders,
    pendingOrders,
    platformFeeRate: PLATFORM_FEE_RATE,
    taxRate: REALITY_TAX_RATE,
    platformFee,
    tax,
    net,
  };
}

interface ReplyBody {
  reply?: string;
}

function handleReplyReview(
  db: Database,
  token: string | null,
  reviewId: string,
  raw: unknown,
): MockResponse {
  const owner = requireOwner(db, token);
  const review = db.reviews.find((r) => r.id === reviewId);
  if (!review || review.restaurantId !== owner.restaurantId) {
    throw new HttpError(404, "That review isn't for your kitchen.");
  }
  const body = (raw ?? {}) as ReplyBody;
  const reply = (body.reply ?? "").trim();
  if (reply.length === 0) {
    throw new HttpError(422, "A reply needs some words in it.");
  }
  review.reply = reply;
  review.repliedAt = new Date().toISOString();
  persist();
  return { status: 200, data: { review: reviewDto(review) } };
}

function recomputeRating(db: Database, restaurantId: string): void {
  const reviews = db.reviews.filter((r) => r.restaurantId === restaurantId);
  const restaurant = db.restaurants.find((r) => r.id === restaurantId);
  if (restaurant && reviews.length > 0) {
    const avg = reviews.reduce((n, r) => n + r.rating, 0) / reviews.length;
    restaurant.rating = Math.round(avg * 10) / 10;
  }
}

interface NewReviewBody {
  rating?: number;
  body?: string;
}

function handleAddReview(
  db: Database,
  token: string | null,
  restaurantId: string,
  raw: unknown,
): MockResponse {
  const user = requireAuth(db, token);
  if (user.role !== "customer") {
    throw new HttpError(403, "Only customers can leave reviews.");
  }
  const restaurant = db.restaurants.find((r) => r.id === restaurantId);
  if (!restaurant) {
    throw new HttpError(404, "No such kitchen.");
  }
  const body = (raw ?? {}) as NewReviewBody;
  const rating = Math.round(body.rating ?? 0);
  if (rating < 1 || rating > 5) {
    throw new HttpError(422, "Pick a rating between 1 and 5 stars.");
  }
  if (!(body.body ?? "").trim()) {
    throw new HttpError(422, "Add a few words to your review.");
  }
  const review: DbReview = {
    id: newId("rev"),
    restaurantId,
    author: user.name,
    avatar: user.avatar,
    rating,
    body: body.body!.trim(),
    createdAt: new Date().toISOString(),
  };
  db.reviews.push(review);
  recomputeRating(db, restaurantId);
  persist();
  return { status: 201, data: { review: reviewDto(review) } };
}

export function handleRequest(
  method: string,
  path: string,
  body: unknown,
  token: string | null,
): MockResponse {
  const db = getDb();
  const route = `${method} ${path}`;

  if (route === "POST /auth/login") return handleLogin(db, body);

  if (route === "POST /auth/register") return handleRegister(db, body);

  if (route === "GET /auth/me") {
    return { status: 200, data: { user: userDto(db, requireAuth(db, token)) } };
  }

  if (route === "POST /auth/logout") {
    db.sessions = db.sessions.filter((s) => s.token !== token);
    persist();
    return { status: 200, data: { ok: true } };
  }

  if (route === "GET /restaurants") {
    return {
      status: 200,
      data: {
        restaurants: db.restaurants.map((r) =>
          restaurantDto(db, r, { includeDelisted: false }),
        ),
      },
    };
  }

  if (method === "GET" && path.startsWith("/restaurants/") && path.endsWith("/reviews")) {
    const id = path.slice("/restaurants/".length, -"/reviews".length);
    const reviews = db.reviews
      .filter((r) => r.restaurantId === id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(reviewDto);
    return { status: 200, data: { reviews } };
  }

  if (method === "POST" && path.startsWith("/restaurants/") && path.endsWith("/reviews")) {
    const id = path.slice("/restaurants/".length, -"/reviews".length);
    return handleAddReview(db, token, id, body);
  }

  if (route === "GET /owner/restaurant") {
    const owner = requireOwner(db, token);
    const restaurant = db.restaurants.find((r) => r.id === owner.restaurantId);
    if (!restaurant) {
      throw new HttpError(404, "Your kitchen fell out of this reality.");
    }
    return {
      status: 200,
      data: { restaurant: restaurantDto(db, restaurant, { includeDelisted: true }) },
    };
  }

  if (route === "PATCH /owner/restaurant") {
    return handleUpdateStore(db, token, body);
  }

  if (route === "POST /owner/menu-items") {
    return handleCreateMenuItem(db, token, body);
  }

  if (method === "PATCH" && path.startsWith("/owner/menu-items/")) {
    const itemId = path.slice("/owner/menu-items/".length);
    return handleUpdateMenuItem(db, token, itemId, body);
  }

  if (route === "GET /owner/orders") {
    const owner = requireOwner(db, token);
    const orders = db.orders
      .filter((o) => o.items.some((i) => i.restaurantId === owner.restaurantId))
      .sort(
        (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
      )
      .map((o) => ownerOrderDto(o, owner.restaurantId!));
    return { status: 200, data: { orders } };
  }

  if (method === "PATCH" && path.startsWith("/owner/orders/")) {
    const orderId = path.slice("/owner/orders/".length);
    return handleUpdateOrder(db, token, orderId, body);
  }

  if (route === "GET /owner/finance") {
    const owner = requireOwner(db, token);
    return { status: 200, data: { finance: computeFinance(db, owner.restaurantId!) } };
  }

  if (route === "GET /owner/reviews") {
    const owner = requireOwner(db, token);
    const reviews = db.reviews
      .filter((r) => r.restaurantId === owner.restaurantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(reviewDto);
    return { status: 200, data: { reviews } };
  }

  if (method === "POST" && path.startsWith("/owner/reviews/") && path.endsWith("/reply")) {
    const reviewId = path.slice("/owner/reviews/".length, -"/reply".length);
    return handleReplyReview(db, token, reviewId, body);
  }

  if (route === "GET /orders") {
    const user = requireAuth(db, token);
    const orders = db.orders
      .filter((o) => o.userId === user.id)
      .sort(
        (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
      )
      .map(orderDto);
    return { status: 200, data: { orders } };
  }

  if (route === "POST /orders") {
    return handleCreateOrder(db, token, body);
  }

  throw new HttpError(404, `No such endpoint: ${route}`);
}
