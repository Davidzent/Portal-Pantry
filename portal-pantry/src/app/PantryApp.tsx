import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./components/Icon";
import { PortalMark } from "./components/PortalMark";
import { Portal } from "./components/Portal";
import Manifest from "./components/Manifest";
import { imageUrl } from "./images";
import {
  categories,
  CURRENCY,
  dimensions,
  type MenuItem,
  type Restaurant,
} from "./data";
import RestaurantModal, {
  type PortalOrigin,
} from "./components/RestaurantModal";
import CartDrawer from "./components/CartDrawer";
import CheckoutModal from "./components/CheckoutModal";
import LoginModal from "./components/LoginModal";
import OrderHistoryModal from "./components/OrderHistoryModal";
import OwnerDashboard from "./components/OwnerDashboard";
import { getMe, logout, type User } from "./api/authApi";
import { createOrder } from "./api/ordersApi";
import { getRestaurants } from "./api/storeApi";

export interface CartEntry {
  key: string;
  restaurantId: string;
  itemId: string;
  name: string;
  price: number;
  qty: number;
  restaurant: string;
}

function readRoute(): string {
  return window.location.hash.replace(/^#\/?/, "").split(/[/?]/)[0];
}

/** A manifest number, fixed for the session. Paperwork needs a docket number. */
function newManifestId(): string {
  return `PP-${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(
    10 + Math.random() * 89,
  )}`;
}

function KitchenCard({
  restaurant,
  onOpen,
}: {
  restaurant: Restaurant;
  onOpen: (origin: PortalOrigin) => void;
}) {
  const cover = imageUrl(restaurant.image);
  const toll =
    restaurant.fee === 0 ? "no toll" : `${restaurant.fee} ${CURRENCY} toll`;
  /* Without this the computed name is the whole card read end to end, opening
     with the dimension code and the word "promoted". Lead with the action and
     the kitchen; keep the rest as supporting detail in the same order it is
     shown. */
  const label = `Open ${restaurant.name} — ${restaurant.dimension}, ${
    restaurant.rating > 0 ? `rated ${restaurant.rating} of 5` : "unrated"
  }, ${restaurant.time}, ${toll}`;

  return (
    <button
      type="button"
      className="pp-panel pp-card pp-reveal"
      onClick={(e) => {
        /* The portal opens from the card's centre, not the cursor — keyboard
           activation has no cursor, and both paths should look identical. */
        const r = e.currentTarget.getBoundingClientRect();
        onOpen({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
      aria-label={label}
    >
      <span className="pp-card__cover">
        {cover ? (
          <img src={cover} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className="pp-card__cover-blank">
            <Icon name="utensils" size={22} />
            No photo on file
          </span>
        )}
        <span className="pp-card__flags">
          <span className="pp-tag">{restaurant.dimension}</span>
          {restaurant.promoted && (
            <span className="pp-tag pp-tag--note">Paid placement</span>
          )}
        </span>
        <span className="pp-card__portal" aria-hidden="true">
          <Portal size={34} state="open" />
        </span>
      </span>

      <span className="pp-card__body">
        <span className="pp-card__name">{restaurant.name}</span>
        <span className="pp-card__tagline">{restaurant.tagline}</span>
        <span className="pp-card__meta">
          <span>
            <Icon name="star" size={12} />
            {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : "Unrated"}
          </span>
          <span>
            <Icon name="clock" size={12} />
            {restaurant.time}
          </span>
          <span className={restaurant.fee === 0 ? "pp-is-free" : undefined}>
            {restaurant.fee === 0
              ? "No toll"
              : `${restaurant.fee}${CURRENCY} toll`}
          </span>
        </span>
      </span>
    </button>
  );
}

export default function PantryApp() {
  const [dimension, setDimension] = useState("All dimensions");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [active, setActive] = useState<Restaurant | null>(null);
  const [portalOrigin, setPortalOrigin] = useState<PortalOrigin | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [route, setRoute] = useState(readRoute);
  const [placed, setPlaced] = useState<{ id: string; total: number } | null>(
    null,
  );
  const [checkoutOrigin, setCheckoutOrigin] = useState<PortalOrigin | null>(null);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [manifestId] = useState(newManifestId);

  const isOwner = user?.role === "owner";

  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const goManage = useCallback(() => {
    window.location.hash = "#/manage";
    setRoute("manage");
  }, []);

  const goStorefront = useCallback(() => {
    history.pushState("", "", window.location.pathname + window.location.search);
    setRoute("");
  }, []);

  useEffect(() => {
    let mounted = true;
    getRestaurants().then(
      (list) => {
        if (!mounted) return;
        setAllRestaurants(list);
        setCatalogError(null);
        setCatalogLoading(false);
      },
      () => {
        if (!mounted) return;
        setCatalogError("catalog");
        setCatalogLoading(false);
      },
    );
    return () => {
      mounted = false;
    };
  }, []);

  /* Retry path: the only place that flips back into the loading state. */
  const retryCatalog = useCallback(() => {
    setCatalogLoading(true);
    setCatalogError(null);
    getRestaurants().then(
      (list) => {
        setAllRestaurants(list);
        setCatalogLoading(false);
      },
      () => {
        setCatalogError("catalog");
        setCatalogLoading(false);
      },
    );
  }, []);

  const refreshRestaurants = useCallback(async () => {
    setAllRestaurants(await getRestaurants());
  }, []);
  const resumeCheckout = useRef(false);

  useEffect(() => {
    let mounted = true;
    getMe().then((restored) => {
      if (mounted && restored) setUser(restored);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const signOut = useCallback(() => {
    void logout();
    setUser(null);
    setCart([]);
    goStorefront();
  }, [goStorefront]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRestaurants
      .filter(
        (r) =>
          (dimension === "All dimensions" || r.dimension === dimension) &&
          (category === "All" || r.category === category) &&
          (!q ||
            r.name.toLowerCase().includes(q) ||
            r.tagline.toLowerCase().includes(q)),
      )
      .sort(
        (a, b) =>
          Number(b.promoted ?? false) - Number(a.promoted ?? false) ||
          b.rating - a.rating,
      );
  }, [allRestaurants, dimension, category, query]);

  /* Where this order actually lands. One definition, used by the manifest's
     terms line, the order request, and the receipt. */
  const deliverTo =
    dimension === "All dimensions" ? (user?.dimension ?? "C-131") : dimension;

  const cartCount = cart.reduce((n, e) => n + e.qty, 0);
  const subtotal = cart.reduce((n, e) => n + e.price * e.qty, 0);

  const addItem = (restaurant: Restaurant, item: MenuItem) => {
    const key = `${restaurant.id}:${item.id}`;
    setCart((prev) => {
      const found = prev.find((e) => e.key === key);
      if (found) {
        return prev.map((e) => (e.key === key ? { ...e, qty: e.qty + 1 } : e));
      }
      return [
        ...prev,
        {
          key,
          restaurantId: restaurant.id,
          itemId: item.id,
          name: item.name,
          price: item.price,
          qty: 1,
          restaurant: restaurant.name,
        },
      ];
    });
  };

  const changeQty = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((e) => (e.key === key ? { ...e, qty: e.qty + delta } : e))
        .filter((e) => e.qty > 0),
    );
  };

  const placeOrder = async () => {
    setOrderError(null);
    setPlacing(true);
    try {
      // The kitchen prices the order; the local `total` is display-only.
      const order = await createOrder({
        items: cart.map((e) => ({
          restaurantId: e.restaurantId,
          itemId: e.itemId,
          qty: e.qty,
        })),
        dimension: deliverTo,
      });
      setPlaced({ id: order.id, total: order.total });
      setCart([]);
      setCheckoutOpen(true);
    } catch (err) {
      // Errors state what happened and what to do next, in the app's voice.
      // They never apologise, and they never become an OS alert box.
      setOrderError(
        err instanceof Error
          ? err.message
          : "The portal refused the manifest. Nothing was charged. Try opening it again.",
      );
      setDrawerOpen(true);
    } finally {
      setPlacing(false);
    }
  };

  const startCheckout = (origin: PortalOrigin) => {
    setCheckoutOrigin(origin);
    setDrawerOpen(false);
    if (user) {
      void placeOrder();
    } else {
      resumeCheckout.current = true;
      setLoginOpen(true);
    }
  };

  if (isOwner && route === "manage" && user) {
    return (
      <OwnerDashboard
        user={user}
        onSignOut={signOut}
        onViewStorefront={goStorefront}
        onCatalogChanged={refreshRestaurants}
      />
    );
  }

  const manifest = (
    <Manifest
      cart={cart}
      subtotal={subtotal}
      dimension={deliverTo}
      onChangeQty={changeQty}
      onCheckout={startCheckout}
      manifestId={manifestId}
      busy={placing}
    />
  );

  /* Any full-screen overlay makes the storefront behind it inert, so Tab
     cannot walk out of the dialog into content the user cannot see. Covers
     every overlay at once rather than trapping focus in each of them. */
  const overlayOpen =
    Boolean(active) || drawerOpen || checkoutOpen || ordersOpen || loginOpen;

  return (
    <div className="pp-page">
      <div className="pp-app" inert={overlayOpen || undefined}>
      <a className="pp-skip" href="#board">
        Skip to the kitchens
      </a>

      <header className="pp-topbar">
        <div className="pp-shell pp-topbar__inner">
          <a href={import.meta.env.BASE_URL} className="pp-brand">
            <PortalMark size={36} />
            <span className="pp-brand__name">
              Portal Pantry
              <span>Licensed interdimensional freight</span>
            </span>
          </a>

          <div className="pp-topbar__actions">
            {user ? (
              <div className="pp-user">
                <button
                  type="button"
                  className="pp-user__chip"
                  onClick={() => (isOwner ? goManage() : setOrdersOpen(true))}
                >
                  <Icon name="user" size={16} />
                  {user.name.split(" ")[0]}
                  <span className="pp-sr">
                    {isOwner
                      ? `— manage ${user.restaurantName ?? "your kitchen"}`
                      : "— open your shipment history"}
                  </span>
                </button>
                <button
                  type="button"
                  className="pp-iconbtn"
                  onClick={signOut}
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <Icon name="log-out" size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="pp-btn"
                onClick={() => setLoginOpen(true)}
              >
                <Icon name="user" size={16} />
                Sign in
              </button>
            )}

            {isOwner ? (
              <button type="button" className="pp-btn" onClick={goManage}>
                Kitchen desk
              </button>
            ) : (
              <button
                type="button"
                className="pp-btn"
                onClick={() => setDrawerOpen(true)}
              >
                <Icon name="cart" size={16} />
                Manifest
                {cartCount > 0 && (
                  <span className="pp-cartbtn__count">{cartCount}</span>
                )}
                <span className="pp-sr">
                  {cartCount === 0
                    ? "— nothing declared"
                    : `— ${cartCount} item${cartCount === 1 ? "" : "s"} declared`}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="pp-shell">
        <section className="pp-hero">
          <div className="pp-hero__plate">
            <span className="pp-tag">Carrier no. PP-0042-D</span>
            <span className="pp-tag pp-tag--go">Cleared for 5 dimensions</span>
            <span className="pp-tag pp-tag--bad">Bonded since 2847</span>
          </div>

          <h1 className="pp-hero__title">
            Hot meals through <em>cold wormholes</em>
          </h1>

          <p className="pp-hero__sub">
            {isOwner
              ? `You are signed in as a kitchen. Browse the board, or open the kitchen desk to work your queue, your money and your reviews.`
              : user
                ? `Welcome back, ${user.name.split(" ")[0]}. Same paperwork, same ~20 minutes, your local causality.`
                : "Any craving, any universe, roughly twenty minutes — your local causality. Freight is bonded, insured, and delivered by couriers who have mostly signed the forms."}
          </p>

          {isOwner && (
            <p>
              <button type="button" className="pp-btn" onClick={goManage}>
                Open the kitchen desk
              </button>
            </p>
          )}

          {/* Destination and search sit together: both are filters on the board,
              and the chrome should not pretend one of them is navigation. */}
          <div className="pp-hero__tools">
            <div className="pp-hero__row">
              <label className="pp-field pp-field--dim">
                <Icon name="map-pin" size={16} />
                <span className="pp-sr">Deliver to dimension</span>
                <select
                  value={dimension}
                  onChange={(e) => setDimension(e.target.value)}
                >
                  {dimensions.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
                <Icon name="chevron-down" size={14} />
              </label>

              <label className="pp-field pp-field--search">
                <Icon name="search" size={18} />
                <span className="pp-sr">Search kitchens</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Broth, burgers, unlabelled jars…"
                />
              </label>
            </div>

            <div className="pp-chips" role="group" aria-label="Filter by cargo class">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="pp-chip"
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="pp-board" id="board">
          <div className="pp-board__main">
            <div className="pp-board__head">
              <p className="pp-board__count" aria-live="polite">
                <strong>{visible.length}</strong> kitchen
                {visible.length === 1 ? "" : "s"} cleared for{" "}
                <strong>{dimension.replace("All dimensions", "all zones")}</strong>
              </p>
            </div>
            <hr className="pp-rule" />

            {catalogError ? (
              <div className="pp-state pp-state--board">
                <Portal size={88} state="closed" />
                <p className="pp-state__title">The board went dark</p>
                <p className="pp-state__body">
                  We could not reach the depot listing. Nothing you have declared
                  was lost. Ask for the board again.
                </p>
                <button type="button" className="pp-btn" onClick={retryCatalog}>
                  Request the board again
                </button>
              </div>
            ) : catalogLoading ? (
              <div className="pp-state pp-state--board">
                <Portal size={88} state="charging" label="Loading kitchens" />
                <p className="pp-state__title">Reading the board</p>
                <p className="pp-state__body">
                  Checking which kitchens are cleared to ship into your dimension
                  today.
                </p>
              </div>
            ) : visible.length === 0 ? (
              <div className="pp-state pp-state--board">
                <Portal size={88} state="closed" />
                <p className="pp-state__title">Nothing cleared</p>
                <p className="pp-state__body">
                  No kitchen matches that filter in this zone. Widen the
                  dimension, drop the category, or accept that some realities
                  simply do not do breakfast.
                </p>
                <button
                  type="button"
                  className="pp-btn"
                  onClick={() => {
                    setCategory("All");
                    setDimension("All dimensions");
                    setQuery("");
                  }}
                >
                  Clear the filters
                </button>
              </div>
            ) : (
              <div className="pp-grid">
                {visible.map((r) => (
                  <KitchenCard
                    key={r.id}
                    restaurant={r}
                    onOpen={(o) => {
                      setPortalOrigin(o);
                      setActive(r);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <aside
            className="pp-panel pp-board__rail"
            aria-label="Shipping manifest"
          >
            {orderError && (
              <p className="pp-alert">
                <Icon name="alert" size={18} />
                {orderError}
              </p>
            )}
            {manifest}
          </aside>
        </div>
      </main>

      <footer className="pp-footer">
        <div className="pp-shell pp-footer__inner">
          <p className="pp-footer__brand">
            <PortalMark size={22} /> Portal Pantry
          </p>
          <p className="pp-footer__fine">
            § 1 Portal Pantry is a bonded carrier, not a restaurant. § 2 Meals
            delivered to an alternate version of you are considered delivered.
            § 3 Allergen information is accurate in the dimension of origin only.
            § 4 Couriers are unionised in three dimensions and openly hostile in
            a fourth. § 5 Do not taunt the portal.
          </p>
          <p className="pp-footer__fine">
            A demo by <a href="/">David Guijosa</a>. No real food, portals or
            couriers were involved.
          </p>
        </div>
      </footer>
      </div>

      {active && (
        <RestaurantModal
          restaurant={active}
          cart={cart}
          canOrder={!isOwner}
          user={user}
          origin={portalOrigin}
          onAdd={addItem}
          onChangeQty={changeQty}
          onClose={() => setActive(null)}
          onOpenCart={() => {
            setActive(null);
            setDrawerOpen(true);
          }}
          onReviewAdded={refreshRestaurants}
        />
      )}

      {drawerOpen && (
        <CartDrawer onClose={() => setDrawerOpen(false)} error={orderError}>
          {manifest}
        </CartDrawer>
      )}

      {checkoutOpen && placed && (
        <CheckoutModal
          total={placed.total}
          docket={placed.id}
          dimension={deliverTo}
          origin={checkoutOrigin}
          onClose={() => setCheckoutOpen(false)}
          onFinish={() => setCheckoutOpen(false)}
          onViewOrders={() => {
            setCheckoutOpen(false);
            setOrdersOpen(true);
          }}
        />
      )}

      {ordersOpen && <OrderHistoryModal onClose={() => setOrdersOpen(false)} />}

      {loginOpen && (
        <LoginModal
          onSuccess={(signedIn) => {
            setUser(signedIn);
            setLoginOpen(false);
            if (signedIn.role === "owner") {
              resumeCheckout.current = false;
              goManage();
            } else if (resumeCheckout.current) {
              resumeCheckout.current = false;
              void placeOrder();
            }
          }}
          onClose={() => {
            setLoginOpen(false);
            resumeCheckout.current = false;
          }}
        />
      )}
    </div>
  );
}
