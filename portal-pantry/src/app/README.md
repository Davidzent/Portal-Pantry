<div align="center">

# Portal Pantry

**Interdimensional food delivery — Uber Eats for the multiverse.**

[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
![Client-side](https://img.shields.io/badge/backend-mocked%20in--browser-7be04b)
![State](https://img.shields.io/badge/state-100%25%20client--side-ff5fa2)

A live demo by [David Guijosa](https://www.zntsns.com) · part of the
[portfolio](../../../README.md) · served at `/portal-pantry/` (the case-study
page for this project lives at `/portal-pantry/case-study/`)

</div>

![Portal Pantry storefront](../../docs/portal-pantry/storefront.jpg)

Portal Pantry is a full food-delivery front end with a **production-shaped
architecture** — except the entire backend is mocked in the browser. It has two
account roles (customer & store owner), a normalized mock database, session
auth, an owner analytics dashboard, reviews, and image uploads. No server, no
build step beyond Vite; everything persists to `localStorage`.

> Everything here is fictional. Any resemblance to your dimension is a
> scheduling coincidence.

---

## What it does

### For customers
- **Browse & filter** kitchens by *dimension* and food category, with search.
- **Restaurant menus** with dish photos, descriptions, per-item **prep times**,
  and a photo **lightbox** ("open it bigger").
- **Cart & checkout** with a wormhole toll, "reality tax", and an animated
  portal delivery sequence.
- **Order history** scoped to your account, with live statuses.
- **Write reviews** (star rating + text) that update the kitchen's rating.
- **Register** a new account or sign in.

### For store owners
- A dedicated **dashboard** (its own hash route, `#/manage`) with four tabs:
  - **Menu** — rename/reprice dishes, edit descriptions & prep times, add new
    dishes, upload/replace photos, delist/relist, edit the storefront.
  - **Orders** — the live pending queue + past orders; mark orders delivered.
  - **Money** — gross sales, pending, refunds, platform fee (15%), reality tax
    (8%), and **net payout** — all computed server-side.
  - **Reviews** — read every review and reply to them.
- **Create your own restaurant** at registration.
- Owners can't order (enforced by the server, not just the UI).

<table>
  <tr>
    <td width="50%"><img src="../../docs/portal-pantry/restaurant.jpg" alt="Restaurant menu"><p align="center"><em>Restaurant menu, photos & reviews</em></p></td>
    <td width="50%"><img src="../../docs/portal-pantry/owner-orders.jpg" alt="Owner orders"><p align="center"><em>Owner dashboard — order queue</em></p></td>
  </tr>
  <tr>
    <td width="50%"><img src="../../docs/portal-pantry/owner-money.jpg" alt="Owner finances"><p align="center"><em>Owner dashboard — money</em></p></td>
    <td width="50%"><img src="../../docs/portal-pantry/storefront.jpg" alt="Storefront"><p align="center"><em>Storefront</em></p></td>
  </tr>
</table>

---

## Architecture

The interesting part: the app is wired like a real client/server app across
three layers, so swapping the mock for a real backend wouldn't touch the UI.

```
components/  ─────────►  api/  ─────────►  server/
  React UI               SDK + HTTP        mock backend
  (only calls the SDK)   client            (DB + router)
```

1. **`server/db.ts`** — a normalized mock **database**: `users`, `sessions`,
   `restaurants`, `menu_items`, `orders`, `reviews`. Seeded on first run and
   persisted to `localStorage` as one blob (like a tiny Postgres).
2. **`server/index.ts`** — a **router** with real HTTP semantics: bearer-token
   sessions, ownership checks, and status-coded validation (`401` / `403` /
   `404` / `409` / `422`). Delisted dishes are filtered server-side; finances
   are computed server-side.
3. **`api/apiClient.ts`** — a `fetch`-shaped transport (latency, auto
   bearer-token) that currently routes to the mock server.
4. **`api/*.ts`** — typed SDK modules (`authApi`, `storeApi`, `ordersApi`) that
   the components import. The UI never touches the "database" directly.

### A few endpoints

| Method & path | Auth | Purpose |
|---|---|---|
| `POST /auth/register` · `POST /auth/login` | — | create / start a session |
| `GET /restaurants` | — | public catalog (delisted items hidden) |
| `POST /restaurants/:id/reviews` | customer | leave a review |
| `GET /owner/orders` · `PATCH /owner/orders/:id` | owner | queue & mark delivered |
| `GET /owner/finance` | owner | gross, fees, tax, net |
| `POST /owner/menu-items` · `PATCH /owner/menu-items/:id` | owner | add / edit dishes |

Owner-uploaded images are resized & re-encoded to WebP **in the browser**
(canvas) and stored as data URLs, so uploads stay small and survive reloads.

---

## Tech

- React 19 + TypeScript (strict), no state library — plain hooks
- Hand-written CSS (cosmic dark theme, `Titan One` + `Baloo 2`)
- Zero third-party runtime dependencies

## Run it

It's part of the portfolio monorepo:

```bash
npm install
npm run dev
# then open http://localhost:5173/portal-pantry/
```

**Try the owner side:** sign in as `owner@neutrino.pp` (any 4+ char password),
or register a new owner account to create your own kitchen from scratch.

## Run it against the real backend

The same app also runs against a real Node.js + Express + SQLite backend that
implements this exact API contract: [`portal-pantry-back`](../portal-pantry-back).
Start that server (`npm run dev`, port 4000), then create a `.env.local` here:

```bash
VITE_API_URL=http://localhost:4000
```

The API client switches from the in-browser mock to real `fetch` — nothing
else changes. Delete `.env.local` to go back to the serverless demo.
