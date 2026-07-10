<div align="center">

# 🌀 Portal Pantry

**Interdimensional food delivery — Uber Eats for the multiverse.**

[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-dev%20%26%20build-646CFF?logo=vite&logoColor=white)](https://vite.dev)
![Client-side](https://img.shields.io/badge/backend-mocked%20in--browser-7be04b)
![State](https://img.shields.io/badge/state-100%25%20client--side-ff5fa2)

**[▶ Try the live demo](https://www.zntsns.com/portal-pantry/)** · built by
[David Guijosa](https://www.zntsns.com)

</div>

![Portal Pantry storefront](./docs/storefront.jpg)

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
  portal sequence — your order lands in the kitchen's live queue as *pending*.
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
    <td width="50%"><img src="./docs/restaurant.jpg" alt="Restaurant menu"><p align="center"><em>Restaurant menu — photos, prep times & reviews</em></p></td>
    <td width="50%"><img src="./docs/checkout.jpg" alt="Checkout"><p align="center"><em>Checkout — order placed through the portal</em></p></td>
  </tr>
  <tr>
    <td width="50%"><img src="./docs/owner-orders.jpg" alt="Owner orders"><p align="center"><em>Owner dashboard — live order queue</em></p></td>
    <td width="50%"><img src="./docs/owner-money.jpg" alt="Owner finances"><p align="center"><em>Owner dashboard — payout breakdown</em></p></td>
  </tr>
</table>

---

## Architecture

The interesting part: the app is wired like a real client/server app across
three layers, so the UI has no idea its backend lives in the same tab.

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
3. **`api/apiClient.ts`** — a `fetch`-shaped transport (simulated latency,
   automatic bearer token) that routes requests to the mock server.
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

```bash
cd portal-pantry
npm install
npm run dev
# then open http://localhost:5173/portal-pantry/
```

**Try the owner side:** sign in as `owner@neutrino.pp` (any 4+ char password),
or register a new owner account to create your own kitchen from scratch.

**Reset the demo:** clear the site's `localStorage` (DevTools → Application →
Local storage) and reload — the universe reseeds itself.
