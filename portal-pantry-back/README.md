<div align="center">

# Portal Pantry — Backend

**The real Node.js backend behind the interdimensional food-delivery demo.**

![Node](https://img.shields.io/badge/Node-%E2%89%A522.5-5FA04E?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-node%3Asqlite-003B57?logo=sqlite&logoColor=white)
![Tests](https://img.shields.io/badge/tests-vitest%20%2B%20supertest-6E9F18?logo=vitest&logoColor=white)

A live demo backend by [David Guijosa](https://www.zntsns.com) · pairs with
[`../portal-pantry`](../portal-pantry)

</div>

The [Portal Pantry frontend](../portal-pantry) ships with its entire backend
mocked in the browser — a normalized "database" in `localStorage` behind a
router with real HTTP semantics. This package is that backend **for real**:
same 18 endpoints, same payloads, same status codes, same error copy — so the
frontend runs against it unchanged. It adds the things a browser mock can't
have: a real SQL database, password hashing, hashed server-side sessions,
rate limiting, and security headers.

> Everything here is fictional. Any resemblance to your dimension is a
> scheduling coincidence.

---

## Run it

```bash
npm install
npm run dev        # tsx watch, http://localhost:4000
```

First boot creates and seeds `data/portal-pantry.sqlite` (catalog, demo
accounts, an order book, reviews). Delete the file to reset the universe.

Point the frontend at it by dropping one file into `../portal-pantry`:

```bash
# ../portal-pantry/.env.local
VITE_API_URL=http://localhost:4000
```

…then `npm run dev` there as usual. Remove the file to fall back to the
in-browser mock — the app works either way.

**Demo accounts** (seeded, any 4+ character password):

| Email | Role |
|---|---|
| `owner@neutrino.pp` | Owner of Neutrino Noodles — the full dashboard |
| `morty@citadel.pp`, `summer@citadel.pp`, `birdperson@birdworld.pp` | Customers with order history |

Accounts you register yourself get a real scrypt-hashed password and strict
verification.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start with hot reload (tsx watch) |
| `npm run build` / `npm start` | Compile to `dist/` and run the compiled server |
| `npm test` | Integration suite — 28 tests over real HTTP (supertest) against in-memory SQLite |
| `npm run typecheck` / `npm run lint` | Strict tsc / ESLint |

## Configuration

Copy [.env.example](.env.example) to `.env` and adjust; every variable is
optional. Highlights: `PORT` (4000), `DATABASE_PATH`, `CORS_ORIGINS`
(defaults to the Vite dev server), `SESSION_TTL_HOURS` (30 days),
`LOG_LEVEL`.

## API

Same contract the frontend's SDK modules (`src/api/*.ts`) declare. Errors are
`{ "error": { "message": "…" } }` with themed, human-readable copy the UI
shows verbatim; validation problems are `422`s.

| Method & path | Auth | Purpose |
|---|---|---|
| `POST /auth/register` | — | Create account (owners mint a new restaurant) + sign in |
| `POST /auth/login` | — | Start a session (bearer token) |
| `GET /auth/me` · `POST /auth/logout` | session | Restore / revoke the session |
| `GET /restaurants` | — | Public catalog, delisted dishes filtered server-side |
| `GET /restaurants/:id/reviews` | — | Reviews, newest first |
| `POST /restaurants/:id/reviews` | customer | Post a review; recomputes the kitchen's rating |
| `GET /orders` · `POST /orders` | customer | Own history / place an order (owners get `403`) |
| `GET /owner/restaurant` · `PATCH /owner/restaurant` | owner | The owner's kitchen (delistings included) / edit storefront |
| `POST /owner/menu-items` · `PATCH /owner/menu-items/:id` | owner | Add / edit dishes (rename, reprice, prep time, photo, delist) |
| `GET /owner/orders` · `PATCH /owner/orders/:id` | owner | Queue with per-kitchen subtotals / mark delivered |
| `GET /owner/finance` | owner | Gross, pending, refunds, 15% platform fee, 8% reality tax, net |
| `GET /owner/reviews` · `POST /owner/reviews/:id/reply` | owner | Review wall / reply |
| `GET /health` | — | Liveness probe |

## Architecture

```
routes/        thin HTTP: parse params, call a service, shape the JSON
services/      business rules + SQL (auth, catalog, orders, owner)
middleware/    bearer-token auth helpers · JSON 404 · error funnel
db/            node:sqlite bootstrap · schema · seed · shared query helpers
lib/           HttpError · ids/tokens · scrypt passwords · zod body parsing
```

Design decisions worth naming:

- **`node:sqlite`** — Node's built-in SQLite driver: a real, normalized SQL
  database (`restaurants`, `users`, `sessions`, `menu_items`, `orders`,
  `order_items`, `reviews`, WAL, foreign keys, transactions) with **zero
  native dependencies**. Order line items snapshot name/price at purchase so
  history stays truthful after menu edits.
- **Sessions, not JWTs** — opaque bearer tokens stored **SHA-256-hashed**
  with a TTL, so logout genuinely revokes and a leaked DB can't be replayed.
- **Passwords** — scrypt (memory-hard, per-user salt, constant-time compare)
  via `node:crypto`; no password ever leaves the `users` table, and no DTO
  includes the hash.
- **Validation at the boundary** — zod schemas type every body; business
  rules keep the mock's themed error messages so the UI reads identically.
- **Hardening** — helmet headers, CORS allow-list, rate-limited auth
  endpoints, 2 MB body cap with image-payload validation (data-URL or art
  key only), structured pino logs with the `Authorization` header redacted.
- **Testability** — the app is a factory over explicit deps (`db`, `config`);
  the test suite runs the full HTTP stack against `:memory:` databases.

### Deliberate deviations from the mock

Three places where "what the mock did" lost to "what a backend should do",
none of which the UI can observe in normal use:

1. **Wrong passwords are rejected** (`401`) for accounts registered through
   the API. The mock accepted any 4+ character password for everyone; only
   the seeded demo accounts still behave that way.
2. **Refunded orders can't be resurrected** — marking a `wrong-dimension` /
   `lost` order delivered is a `409`. The mock allowed it, which would have
   quietly un-refunded money. Re-delivering a delivered order stays a no-op.
3. **Order kitchens must exist** — line items referencing an unknown
   `restaurantId` are a `422` (the mock trusted them into the database).

One inherited trade-off, kept for contract compatibility and documented in
[order-service.ts](src/services/order-service.ts): the API contract carries
no menu-item ids on order lines, so item prices arrive from the client and
are sanity-checked rather than re-derived. A production contract would send
ids and reprice server-side.
