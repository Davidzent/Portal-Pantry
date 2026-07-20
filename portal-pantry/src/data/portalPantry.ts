/**
 * portalPantry.ts — every word on the case-study page lives here.
 *
 * The page at /portal-pantry/ renders this file. Edit copy, dishes, tracker
 * stops, reviews, or links here; no component contains prose of its own.
 *
 * Register: deadpan corporate delivery-app voice. The product is serious;
 * the multiverse is a logistics detail. Every claim below is true of the
 * codebase (tests, endpoints, fees, counts) — only the framing is fictional.
 */

/* ------------------------------------------------------------------ shared */

export interface SectionLabel {
  /** Plain-language eyebrow, e.g. "MENU — FEATURES". Never hidden. */
  eyebrow: string;
  /** The in-fiction heading. */
  title: string;
  /** Accessible section name for screen readers / aria-label. */
  plain: string;
}

export const site = {
  wordmark: "Portal Pantry",
  tagline: "Interdimensional Eats",
  metaTitle: "Portal Pantry — a case study, served as an order",
  /** CTA targets */
  demoHref: import.meta.env.BASE_URL, // the app now lives at /portal-pantry/
  sourceHref: "https://github.com/Davidzent/Portal-Pantry",
  portfolioHref: "https://www.zntsns.com",
  author: "David Guijosa",
} as const;

/* ------------------------------------------------------- 1 · STOREFRONT */

export const storefront = {
  label: {
    eyebrow: "STOREFRONT — PROJECT OVERVIEW",
    title: "Portal Pantry",
    plain: "Project overview",
  } as SectionLabel,
  sub: "Interdimensional Eats · Est. 2847",
  rating: { stars: "4.9", note: "(2,847 ratings, multiverse average)" },
  statusLine: "Open now · Delivering to 5 dimensions",
  metaChips: [
    "Est. arrival 12 min (local time)",
    "12ƶ flat portal toll",
    "Allergen data unavailable for extradimensional ingredients",
  ],
  /**
   * The recruiter paragraph. Plain language, all real:
   * this is the fastest way to get every fact on the page.
   */
  blurb:
    "Portal Pantry is a full-stack food-delivery platform: a React 19 + " +
    "TypeScript storefront on Vite, a REST API in Express 5 with SQLite — or " +
    "a zero-setup in-browser mock that speaks the same contract — two account " +
    "roles, orders priced on the server, and a Vitest suite covering the cart " +
    "math and the API.",
  ctas: {
    primary: {
      label: "Start an order",
      note: "open the live demo",
      href: import.meta.env.BASE_URL,
    },
    secondary: {
      label: "View the kitchen",
      note: "source on GitHub",
      href: "https://github.com/Davidzent/Portal-Pantry",
    },
  },
  finePrint: "No signup required. The demo runs entirely in your browser.",
} as const;

/* ------------------------------------------------------------- 2 · MENU */

export interface DimensionChip {
  id: string;
  label: string;
  /** Accent hue (HSL) the section adopts while this chip is active. */
  hue: number;
}

/** The same five dimensions the app ships with, plus the default. */
export const dimensionChips: DimensionChip[] = [
  { id: "all", label: "All dimensions", hue: 152 },
  { id: "c131", label: "C-131", hue: 152 },
  { id: "o77", label: "Ω-77", hue: 190 },
  { id: "b612", label: "B-612", hue: 262 },
  { id: "p9", label: "Pickle-9", hue: 96 },
  { id: "f42", label: "Fantasy-42", hue: 28 },
];

export interface MenuDish {
  id: string;
  /** Deadpan dish name, menu-style. */
  name: string;
  /** The menu-card annotation, e.g. "a house classic". */
  flourish: string;
  /** One-liner that carries real information. */
  line: string;
  /** Shown where a price would be — a real stat. */
  stat: string;
  /** Expanded technical detail (hover / tap / focus). */
  detail: string;
  /** Screenshot key from src/case-study/shots. */
  shot: string;
  shotAlt: string;
  /** Home dimension — the chip that promotes this card to the top. */
  dimension: string;
}

export const menu = {
  label: {
    eyebrow: "MENU — FEATURES",
    title: "Tonight's menu",
    plain: "Features",
  } as SectionLabel,
  sub: "Six house dishes. Every price is checked by the kitchen.",
  chipsHint: "Filtering re-plates the menu — the same feature the app ships.",
  dishes: [
    {
      id: "marketplace",
      name: "Two-Sided Marketplace",
      flourish: "a house classic",
      line: "Customers order; owners cook. One storefront, two account roles, zero shared assumptions.",
      stat: "2 roles",
      detail:
        "Session auth with bearer tokens. Customers browse, order, and review; " +
        "owners run a kitchen. The server refuses owner-placed orders with a " +
        "403 — policy lives in the API, not in the buttons.",
      shot: "06-login",
      shotAlt:
        "Screenshot of the Portal Pantry sign-in dialog with customer and store-owner account modes",
      dimension: "C-131",
    },
    {
      id: "filters",
      name: "Dimension Filters",
      flourish: "served chilled",
      line: "Filter ten kitchens by dimension, category, and search. The chips above this menu are the same feature, re-plated.",
      stat: "5 dims",
      detail:
        "Faceted client-side filtering — dimension × category × free text — " +
        "with a promoted-first sort. The chips on this page reuse the exact " +
        "interaction: pick a dimension and the menu re-themes and re-deals.",
      shot: "02-filter",
      shotAlt:
        "Screenshot of the storefront filtered to dimension Ω-77, showing matching kitchens",
      dimension: "Ω-77",
    },
    {
      id: "cart",
      name: "Live Cart",
      flourish: "always warm",
      line: "Add, remove, re-quantify. Totals update as you shop; the portal toll stays flat at 12ƶ.",
      stat: "12ƶ toll",
      detail:
        "Plain React hooks — no state library. Line items are keyed per " +
        "kitchen and dish; if your session lapses mid-craving, checkout " +
        "resumes itself right after you sign in.",
      shot: "05-cart",
      shotAlt:
        "Screenshot of the cart drawer with line items, subtotal, wormhole toll, and total",
      dimension: "B-612",
    },
    {
      id: "pricing",
      name: "Server-Priced Checkout",
      flourish: "market price",
      line: "The kitchen prices your order from its own catalog. Client math is decorative.",
      stat: "+12ƶ",
      detail:
        "POST /orders sends dish ids and quantities — nothing else. Both " +
        "backends price every line from the catalog, add the toll, and ignore " +
        "any client-sent totals. There is a test that claims the pho costs " +
        "0.01ƶ; it is billed 91ƶ.",
      shot: "08-placed",
      shotAlt:
        "Screenshot of the order-placed confirmation showing the server-computed 91ƶ total",
      dimension: "Pickle-9",
    },
    {
      id: "mock",
      name: "In-Browser Backend",
      flourish: "chef's table",
      line: "No server? The browser runs one: same endpoints, same status codes, state in localStorage.",
      stat: "0 servers",
      detail:
        "A fetch-shaped client picks its transport at build time: with " +
        "VITE_API_URL set it calls Express 5 + SQLite; without it, an " +
        "in-browser mock with normalized tables, bearer sessions, and " +
        "401 / 403 / 404 / 409 / 422 semantics. Identical contract — the UI " +
        "can't tell.",
      shot: "07-checkout",
      shotAlt:
        "Screenshot of the checkout portal sequence with progress steps mid-animation",
      dimension: "Fantasy-42",
    },
    {
      id: "owner",
      name: "Owner's Dashboard",
      flourish: "by reservation",
      line: "Owners edit menus, watch a live queue, and read a payout computed for them.",
      stat: "15% + 8%",
      detail:
        "Four tabs behind a hash route (#/manage): Menu — add, reprice, " +
        "delist, photos re-encoded to WebP in the browser; Orders — pending " +
        "to delivered; Money — gross, 15% platform fee, 8% reality tax, net " +
        "payout, all server-side; Reviews — read and reply.",
      shot: "12-owner-menu",
      shotAlt:
        "Screenshot of the owner dashboard menu tab with editable dishes, prices, and prep times",
      dimension: "C-131",
    },
  ] as MenuDish[],
} as const;

/* ---------------------------------------------------------- 3 · RECEIPT */

export interface ReceiptLine {
  qty: string;
  item: string;
  note: string;
}

export const receipt = {
  label: {
    eyebrow: "RECEIPT — STACK",
    title: "Your receipt",
    plain: "Tech stack",
  } as SectionLabel,
  header: {
    store: "PORTAL PANTRY #0001",
    line1: "DINE-IN: THE MULTIVERSE",
    line2: "SERVER: NODE · TICKET: FULL-STACK",
  },
  lines: [
    { qty: "1", item: "React 19", note: "UI, plain hooks, zero runtime deps" },
    { qty: "1", item: "TypeScript (strict)", note: "typed SDK, end to end" },
    { qty: "1", item: "Vite", note: "dev server & static build" },
    { qty: "1", item: "Express 5", note: "REST API, bearer sessions" },
    { qty: "1", item: "SQLite (node:sqlite)", note: "embedded DB, seeds itself" },
    { qty: "1", item: "Zod", note: "validates every request at the door" },
    { qty: "1", item: "Vitest", note: "31 checks across 4 suites" },
    { qty: "0", item: "Client-side pricing", note: "not stocked" },
  ] as ReceiptLine[],
  totals: {
    subtotalLabel: "SUBTOTAL",
    subtotalValue: "computed server-side",
    tollLabel: "PORTAL TOLL",
    tollValue: "12ƶ, flat",
    totalLabel: "TOTAL",
    totalValue: "COMPUTED SERVER-SIDE",
  },
  punchline: "Client math is not trusted.",
  footer: [
    "THANK YOU FOR EATING RESPONSIBLY ACROSS REALITIES",
    "Paper: thermal. Facts: real.",
  ],
} as const;

/* ---------------------------------------------------------- 4 · TRACKER */

export interface TrackerStop {
  id: string;
  /** Delivery-tracker style status. */
  status: string;
  /** Where in the system this happens. */
  place: string;
  /** Expanded technical note. */
  note: string;
}

export const tracker = {
  label: {
    eyebrow: "TRACK YOUR ORDER — ARCHITECTURE",
    title: "Your order is on its way",
    plain: "Architecture: the request lifecycle",
  } as SectionLabel,
  sub: "One POST /orders, door to door.",
  stops: [
    {
      id: "placed",
      status: "Order placed",
      place: "Client — React storefront",
      note:
        "The UI calls a typed SDK (authApi, storeApi, ordersApi) over a " +
        "fetch-shaped client that attaches the bearer token. Components " +
        "never touch a database.",
    },
    {
      id: "received",
      status: "Received",
      place: "Express 5 API",
      note:
        "Routes under /auth, /restaurants, /orders, and /owner. Session " +
        "middleware resolves the token; pino logs the arrival.",
    },
    {
      id: "priced",
      status: "Validated & priced",
      place: "Server",
      note:
        "Zod screens the payload. Every line is looked up in the catalog and " +
        "priced by the kitchen — unknown, delisted, or misassigned dishes get " +
        "a 422. Owners trying to order get a 403.",
    },
    {
      id: "stored",
      status: "Stored",
      place: "SQLite",
      note:
        "node:sqlite writes the order and its line items in a transaction. " +
        "The database seeds itself on first boot.",
    },
    {
      id: "queued",
      status: "In the kitchen queue",
      place: "Owner dashboard",
      note:
        "The order appears as pending in the owner's live queue; delivery is " +
        "one PATCH away. Finance rolls up server-side: 15% platform fee, " +
        "8% reality tax, net payout.",
    },
    {
      id: "delivered",
      status: "Delivered",
      place: "Response",
      note:
        "The confirmed order — with its server-computed total — returns to " +
        "the customer and lands in their history with a live status.",
    },
  ] as TrackerStop[],
  detour: {
    badge: "ALTERNATE ROUTE",
    status: "Kitchen offline?",
    note:
      "The order reroutes to the in-browser mock: same endpoints, same " +
      "status codes, same seed data — persisted to localStorage. The public " +
      "demo runs this route, so there is no server to keep alive.",
  },
} as const;

/* ---------------------------------------------------------- 5 · REVIEWS */

export interface TestReview {
  stars: number;
  body: string;
  /** e.g. "vitest · verified order · orders.test.ts" */
  source: string;
}

export const reviews = {
  label: {
    eyebrow: "REVIEWS — TESTS",
    title: "Verified reviews",
    plain: "Testing",
  } as SectionLabel,
  sub: "All reviewers ordered through the API. No incentives were provided.",
  placard: {
    heading: "HEALTH INSPECTION",
    grade: "A",
    line: "31 / 31 checks passed · 4 suites",
    detail: "auth (9) · catalog (5) · orders (6) · owner (11)",
    inspector: "Inspected by Vitest 3 · renewed on every push",
  },
  entries: [
    {
      stars: 5,
      body: "Cart matched to the last ƶ across four dimensions. Would recompute again.",
      source: "vitest · verified order · orders.test.ts",
    },
    {
      stars: 5,
      body: "Claimed my pho cost 0.01ƶ. Was billed 91ƶ, politely. The kitchen does not negotiate.",
      source: "vitest · verified order · server-side pricing",
    },
    {
      stars: 5,
      body: "Tried to order as the owner. Refused at the door — 403 — exactly as the sign says.",
      source: "vitest · verified visit · orders.test.ts",
    },
    {
      stars: 5,
      body: "Asked for a dish that doesn't exist in this reality. Received a firm 422 and no soup.",
      source: "vitest · verified attempt · orders.test.ts",
    },
    {
      stars: 5,
      body: "Peeked at another kitchen's queue. There is, legally, nothing to see there (owner-scoped).",
      source: "vitest · verified snoop · owner.test.ts",
    },
    {
      stars: 5,
      body: "Wrong password, five different ways. Never got past the host stand (401).",
      source: "vitest · verified lockout · auth.test.ts",
    },
  ] as TestReview[],
  footnote: "31 reviews · average 5.0 · sorted by severity",
} as const;

/* ------------------------------------------------------------ 6 · ROLES */

export interface RolePanel {
  id: "customer" | "owner";
  label: string;
  headline: string;
  features: string[];
  note: string;
  shots: { key: string; alt: string }[];
}

export const roles = {
  label: {
    eyebrow: "SWITCH ACCOUNT — THE TWO ROLES",
    title: "One app, two accounts",
    plain: "The two user roles",
  } as SectionLabel,
  sub: "Flip the account. The feature set flips with it.",
  panels: [
    {
      id: "customer",
      label: "Customer",
      headline: "Browse → cart → checkout → history → review",
      features: [
        "Browse & filter 10 kitchens by dimension, category, and search",
        "Menus with dish photos, prep times, and a lightbox",
        "Cart with a flat 12ƶ portal toll; checkout resumes through sign-in",
        "Order history scoped to the account, with live statuses",
        "Star reviews that update the kitchen's rating",
      ],
      note: "Customers cannot edit menus. Obviously.",
      shots: [
        { key: "01-storefront", alt: "Screenshot: the storefront grid of kitchens" },
        { key: "05-cart", alt: "Screenshot: the cart drawer with totals" },
        { key: "09-history", alt: "Screenshot: order history with statuses" },
        { key: "10-review", alt: "Screenshot: writing a five-star review" },
      ],
    },
    {
      id: "owner",
      label: "Owner",
      headline: "Menu management → live queue → payouts → replies",
      features: [
        "Menu management: add, reprice, delist; photos re-encoded to WebP in-browser",
        "Live pending queue; mark orders delivered with one PATCH",
        "Payouts computed for them: gross, 15% platform fee, 8% reality tax, net",
        "Read and reply to every review",
        "Ordering disabled — the server enforces it (403), not just the UI",
      ],
      note: "Owners cannot place orders. The server checks, in case the interface is too polite.",
      shots: [
        { key: "12-owner-menu", alt: "Screenshot: owner menu management tab" },
        { key: "11-owner-orders", alt: "Screenshot: owner live order queue" },
        { key: "13-owner-money", alt: "Screenshot: owner payout breakdown" },
        { key: "14-owner-reviews", alt: "Screenshot: owner reviews with replies" },
      ],
    },
  ] as RolePanel[],
} as const;

/* --------------------------------------------------------- 7 · CHECKOUT */

export const checkout = {
  label: {
    eyebrow: "CHECKOUT — WHERE TO NEXT",
    title: "Your order",
    plain: "Summary and links",
  } as SectionLabel,
  sub: "Everything above, bagged and ready.",
  /** Line items mirror the sections; ticks fill in as sections are viewed. */
  summary: [
    { id: "storefront", label: "Overview", detail: "one full-stack delivery platform" },
    { id: "menu", label: "Features", detail: "6 dishes" },
    { id: "receipt", label: "Stack", detail: "7 line items, 0 client math" },
    { id: "tracker", label: "Architecture", detail: "6 stops + 1 alternate route" },
    { id: "reviews", label: "Tests", detail: "31 / 31 passed" },
    { id: "roles", label: "Roles", detail: "customer ⇄ owner" },
    { id: "checkout", label: "This screen", detail: "you are here" },
  ],
  totalRow: { label: "TOTAL", value: "one case study · 0ƶ" },
  ctas: {
    place: {
      label: "Place order",
      note: "open the live demo",
      href: import.meta.env.BASE_URL,
    },
    save: {
      label: "Save for later",
      note: "view source on GitHub",
      href: "https://github.com/Davidzent/Portal-Pantry",
    },
  },
  orderAgain: {
    heading: "Order again",
    sub: "Other kitchens by the same cook",
    items: [
      {
        name: "Simmer — Recipe Finder",
        note: "React + TypeScript · search 300+ dishes by name, ingredient, or chaos",
        href: "https://www.zntsns.com",
      },
      {
        name: "Multiplayer Cooking Game",
        note: "Unity + C# · solo build: code, design, and 3D art",
        href: "https://www.zntsns.com",
      },
      {
        name: "Flappy Bird AI",
        note: "Java · a hand-built neural net, evolved until it out-flapped its author",
        href: "https://www.zntsns.com",
      },
    ],
  },
  footer: {
    legal:
      "Portal Pantry is fictional. The engineering is not. Not liable for " +
      "meals delivered to alternate versions of you.",
    credit: `A case study by ${site.author} · zntsns.com`,
  },
} as const;

/* --------------------------------------------------------- cart gimmick */

export const cartBadge = {
  /** Sections counted by the floating badge, in page order. */
  sections: [
    "storefront",
    "menu",
    "receipt",
    "tracker",
    "reviews",
    "roles",
    "checkout",
  ],
  label: "Your order",
  fullLabel: "Order ready",
  fullHint: "Go to checkout",
  /** aria-live announcement, {section} replaced. */
  announce: "Added to your order: {section}",
} as const;
