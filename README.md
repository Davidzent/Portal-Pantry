<div align="center">

# Portal Pantry

**Interdimensional food delivery — Uber Eats for the multiverse.**

[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-dev%20%26%20build-646CFF?logo=vite&logoColor=white)](https://vite.dev)
![Backend](https://img.shields.io/badge/backend-in--browser%20mock%20or%20Node%20%2B%20SQLite-9be05a)
![Tests](https://img.shields.io/badge/tests-Vitest-6E9F18?logo=vitest&logoColor=white)
[![Live demo](https://img.shields.io/badge/live-Firebase%20Hosting-FFCA28?logo=firebase&logoColor=white)](https://www.zntsns.com/portal-pantry/)

**[▶ Try the live demo](https://www.zntsns.com/portal-pantry/)** · built by
[David Guijosa](https://www.zntsns.com)

</div>

![Portal Pantry storefront](./docs/storefront.png)

Portal Pantry is a full food-delivery app with a **production-shaped
architecture** — two account roles (customer & store owner), session auth, an
owner analytics dashboard, reviews, and in-browser image uploads. It runs **two
ways from the same UI**: against a zero-setup **in-browser mock backend** (state
persists to `localStorage`), or against the included **real Node.js + SQLite
backend** — identical API contract, switched with a single environment variable.

> Everything here is fictional. Any resemblance to your dimension is a
> scheduling coincidence.

---

## What it does

### For customers
- **Browse & filter** kitchens by *dimension* and food category, with search.
- **Kitchen menus** with dish photos, descriptions, per-item **prep times**, and
  a photo lightbox — opened *through a portal* rather than in a modal.
- **A shipping manifest** instead of a cart: line items, wormhole toll, and a
  total that matches what the server actually charges, to the last unit.
- **Checkout** as a timestamped transit log, ending in a docket number — your
  order lands in the kitchen's live queue as *in transit*.
- **Shipment record** scoped to your account, with live statuses.
- **File reports** (star rating + text) that update the kitchen's rating.
- **Open an account** or sign in.

### For store owners
- A dedicated **kitchen desk** (its own hash route, `#/manage`) with four tabs:
  - **Queue** — orders awaiting confirmation plus everything closed; confirm
    deliveries. Carries a live count badge.
  - **Dishes** — rename/reprice dishes, edit descriptions & prep times, add new
    ones, upload/replace photos, take them off the board, edit the storefront.
  - **Payout** — gross, held, written off, carrier fee (15%), reality tax (8%)
    and **net payout** — all computed server-side.
  - **Reports** — read every report and respond to it.
- **Create your own kitchen** at registration.
- Owners can't order (enforced by the server, not just the UI).

<table>
  <tr>
    <td width="50%"><img src="./docs/menu.png" alt="Kitchen menu"><p align="center"><em>Kitchen menu — arrives through the portal</em></p></td>
    <td width="50%"><img src="./docs/checkout.png" alt="Order confirmed"><p align="center"><em>Checkout — the payoff screen</em></p></td>
  </tr>
  <tr>
    <td width="50%"><img src="./docs/desk-queue.png" alt="Kitchen desk queue"><p align="center"><em>Kitchen desk — the order queue</em></p></td>
    <td width="50%"><img src="./docs/desk-payout.png" alt="Kitchen desk payout"><p align="center"><em>Kitchen desk — payout, computed server-side</em></p></td>
  </tr>
  <tr>
    <td width="50%"><img src="./docs/record.png" alt="Shipment record"><p align="center"><em>Shipment record</em></p></td>
    <td width="50%"><img src="./docs/desk-dishes.png" alt="Kitchen desk dishes"><p align="center"><em>Kitchen desk — menu editing</em></p></td>
  </tr>
</table>

<table>
  <tr>
    <td width="60%"><img src="./docs/signin.png" alt="Account dialog"><p align="center"><em>Account dialog</em></p></td>
    <td width="40%"><img src="./docs/mobile.png" alt="The board at 390px"><p align="center"><em>The board at 390px</em></p></td>
  </tr>
</table>

---

## Architecture

The app is wired like a real client/server app across three layers. The typed
SDK the UI imports never changes — only the transport beneath it does, so the
same components run against either backend.

```
components/ ──► api/*.ts ──► apiClient ──┬─► server/             in-browser mock (localStorage)
  React UI      typed SDK    transport   └─► portal-pantry-back/ real Node API (Express 5 + node:sqlite)
```

- **`api/*.ts`** — typed SDK modules (`authApi`, `storeApi`, `ordersApi`) the
  components import. The UI never touches a "database" directly.
- **`api/apiClient.ts`** — a `fetch`-shaped transport with an automatic bearer
  token. When `VITE_API_URL` is set it makes **real HTTP calls** to the Node
  backend; when it isn't, it routes to the in-browser mock (simulated latency).
- **`server/` — in-browser mock.** A normalized **database** (`users`,
  `sessions`, `restaurants`, `menu_items`, `orders`, `reviews`) seeded on first
  run and persisted to `localStorage`, behind a **router** with real HTTP
  semantics: bearer-token sessions, ownership checks, status-coded validation
  (`401` / `403` / `404` / `409` / `422`).
- **`portal-pantry-back/` — real backend.** The same contract as a standalone
  **Express 5 + TypeScript** service on Node's built-in `node:sqlite`: same
  tables, same status codes, seeded on first boot. Delisted dishes are filtered
  and finances computed server-side in both.

### A few endpoints

Both backends implement the same contract:

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

## Design system

**Concept: municipal paperwork for an impossible service.** A licensed
interdimensional freight operator that has the forms to prove it. The cart is a
shipping manifest, the receipt is a docket, reviews are filed reports, and every
disclaimer is a § clause nobody reads.

**Tokens.** Every colour, size, radius and duration in the app resolves to
`styles/tokens.css`. Enforced, not aspirational: there is no raw hex and no
hardcoded duration anywhere else in the stylesheets.

**Rationed colour.** Portal green appears only on things that *transport,
transact or confirm* — the checkout button, the manifest total, the confirmation,
a delivered shipment. The `Portal` component's three states (`closed` /
`charging` / `open`) make that rule structural rather than a convention someone
has to remember. Teal carries everything interactive; a deliberately unlovely
salmon carries everything that went wrong.

**Type.** Three self-hosted variable faces, **93 kB total** — Bricolage
Grotesque (display), Public Sans (body), Spline Sans Mono (codes, dockets,
prices, fine print). Subset from the full upstream files with `fontTools`, with
Bricolage's optical-size axis pinned. Each has a metric-matched fallback
`@font-face`, so a font swap moves nothing: **zero CLS**, and no third-party
font request.

**The signature.** Opening a kitchen is not a modal. A `clip-path: circle()`
expands from the centre of the card you clicked, with a green ring flare from
the same point — the menu arrives *through* an aperture cut in the board. The
same reveal carries checkout, because an order genuinely is going through a
portal.

**Accessibility is a floor, not a pass.** Every interactive control is ≥44px;
every text pair meets WCAG AA measured on rendered pixels with alpha
compositing; one focus treatment everywhere; a real ARIA tablist with arrow-key
navigation on the kitchen desk; open dialogs mark the page behind them `inert`
so Tab cannot escape. All motion is either inside a
`prefers-reduced-motion: no-preference` guard or explicitly cancelled.

## Tech

- **Frontend** — React 19 + TypeScript (strict), no state library (plain hooks),
  hand-written CSS built from tokens, self-hosted subset webfonts, built with
  Vite. **Zero third-party runtime dependencies** — the portal transition, the
  charging indicator and the transit log are all CSS and SVG.
- **Backend (optional)** — Node 22+ · Express 5 · `node:sqlite` · Zod validation
  · pino logging · Vitest. Typed end-to-end; seeds its database on first boot.

### Build-time tooling

Small dependency-free scripts under `portal-pantry/scripts/`, all committed
output so a normal build needs none of them:

| Script | What it does |
|---|---|
| `build-fonts.sh` | Downloads the upstream variable fonts, subsets them, pins Bricolage's `opsz`, and prints the metric overrides for the fallback faces. |
| `build-ink.mjs` | Bakes the hand-drawn manifest tear line to a static SVG data URI — the jitter is computed once at authoring time so no SVG filter runs at paint time. |
| `check-classes.mjs` | Fails the build if markup uses a `pp-*` class no stylesheet defines, and reports CSS rules nothing uses. Currently clean in both directions. |
| `screenshots.mjs` | Regenerates every image in `docs/` by driving headless Chrome over the DevTools Protocol — no Playwright install, just Node's built-in `fetch` and `WebSocket`. |

## Run it

**Option A — zero setup (in-browser mock).** No backend, no config; state lives
in `localStorage`.

```bash
cd portal-pantry
npm install
npm run dev
# then open http://localhost:5173/portal-pantry/
```

**Option B — with the real backend.** Run the API (needs **Node ≥ 22.5** for
`node:sqlite`), then point the frontend at it.

```bash
# 1) start the API — seeds a SQLite DB on first boot, listens on :4000
cd portal-pantry-back
npm install
npm run dev

# 2) in another shell, point the frontend at it and run it
cd portal-pantry
npm install
# uncomment VITE_API_URL in .env.local (or create the file):
#   VITE_API_URL=http://localhost:4000
npm run dev
```

Delete `.env.local` (or unset `VITE_API_URL`) to fall back to the mock. Backend
config — port, DB path, CORS origins, session TTL — is documented in
`portal-pantry-back/.env.example`.

The backend ships a **Vitest** suite (auth, catalog, orders, and the owner API);
run it with `npm test` from `portal-pantry-back`.

**Regenerate the screenshots** in `docs/` after a design change — with the dev
server running, `node scripts/screenshots.mjs` from `portal-pantry`.

**Try the owner side:** sign in as `owner@neutrino.pp` with any password of
four characters or more, or open a new kitchen account to build one from
scratch.

**Reset the demo:** on the mock, clear the site's `localStorage` (DevTools →
Application → Local storage) and reload; on the real backend, delete its SQLite
file under `portal-pantry-back/data/` and restart. Either way the universe
reseeds itself.

---

## Deployment

The frontend is a static build (`npm run build`) served under the
`/portal-pantry/` base path — it ships as one project inside my portfolio
**monorepo**, which builds and deploys it to **Firebase Hosting**. The live
site is **<https://www.zntsns.com/portal-pantry/>**. (That CI/CD lives in the
monorepo, not this repo.)

The hosted build ships the in-browser mock, so the public demo runs entirely
client-side with no server to operate. To serve it against a live API instead,
set `VITE_API_URL` at build time and add the site's origin to the backend's
`CORS_ORIGINS`.
