import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Icon } from "./components/Icon";
import { PortalMark } from "./components/PortalMark";
import { imageUrl } from "./images";
import {
  categories,
  CURRENCY,
  dimensions,
  type MenuItem,
  type Restaurant,
} from "./data";
import RestaurantModal from "./components/RestaurantModal";
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

function RestaurantCard({
  restaurant,
  onOpen,
}: {
  restaurant: Restaurant;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className="pp-card"
      onClick={onOpen}
      style={{ "--hue": restaurant.hue } as CSSProperties}
    >
      <span className="pp-card-cover">
        {imageUrl(restaurant.image) ? (
          <img
            className="pp-cover-img"
            src={imageUrl(restaurant.image)}
            alt=""
            loading="lazy"
          />
        ) : (
          <span className="pp-card-emoji">
            <Icon name="utensils" size={44} />
          </span>
        )}
        {restaurant.promoted && <span className="pp-flag">Promoted</span>}
        <span className="pp-dim-badge">{restaurant.dimension}</span>
      </span>
      <span className="pp-card-body">
        <span className="pp-card-name">{restaurant.name}</span>
        <span className="pp-card-tagline">{restaurant.tagline}</span>
        <span className="pp-card-meta">
          <span className="pp-rating">
            <Icon name="star" size={13} />
            {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : "New"}
          </span>
          <span className="pp-meta-item">
            <Icon name="clock" size={13} />
            {restaurant.time}
          </span>
          <span className="pp-meta-item pp-fee">
            {restaurant.fee === 0
              ? "Free portal"
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [route, setRoute] = useState(readRoute);
  const [placedTotal, setPlacedTotal] = useState(0);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

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
    getRestaurants().then((list) => {
      if (mounted) {
        setAllRestaurants(list);
        setCatalogLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
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
    const deliverTo =
      dimension === "All dimensions" ? (user?.dimension ?? "C-131") : dimension;
    try {
      // The kitchen prices the order; the local `total` is display-only.
      const placed = await createOrder({
        items: cart.map((e) => ({
          restaurantId: e.restaurantId,
          itemId: e.itemId,
          qty: e.qty,
        })),
        dimension: deliverTo,
      });
      setPlacedTotal(placed.total);
      setCart([]);
      setCheckoutOpen(true);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "The portal flickered — try again.",
      );
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

  return (
    <div className="pp-page">
      <header className="pp-header">
        <div className="pp-shell pp-header-inner">
          <a href={import.meta.env.BASE_URL} className="pp-brand">
            <PortalMark size={36} />
            <span className="pp-brand-name">
              Portal<span> Pantry</span>
            </span>
          </a>

          <div className="pp-header-actions">
            <label className="pp-dim-select">
              <Icon name="map-pin" size={15} />
              <select
                value={dimension}
                onChange={(e) => setDimension(e.target.value)}
                aria-label="Delivery dimension"
              >
                {dimensions.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
              <Icon name="chevron-down" size={14} className="pp-select-arrow" />
            </label>

            {user ? (
              <div className="pp-user">
                <button
                  type="button"
                  className="pp-user-chip"
                  onClick={() => (isOwner ? goManage() : setOrdersOpen(true))}
                  aria-label={isOwner ? "Open kitchen dashboard" : "View order history"}
                  title={
                    isOwner
                      ? `${user.email} — manage ${user.restaurantName ?? "your kitchen"}`
                      : `${user.email} — view order history`
                  }
                >
                  <span className="pp-user-avatar" aria-hidden="true">
                    <Icon name="user" size={16} />
                  </span>
                  <span className="pp-user-name">{user.name.split(" ")[0]}</span>
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
                className="pp-signin-btn"
                onClick={() => setLoginOpen(true)}
              >
                <Icon name="user" size={16} />
                <span className="pp-signin-label">Sign in</span>
              </button>
            )}

            {isOwner ? (
              <button
                type="button"
                className="pp-cart-btn pp-manage-btn"
                onClick={goManage}
              >
                <span className="pp-cart-label">Manage</span>
              </button>
            ) : (
              <button
                type="button"
                className="pp-cart-btn"
                onClick={() => setDrawerOpen(true)}
                aria-label={`Open cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
              >
                <Icon name="cart" size={18} />
                <span className="pp-cart-label">Cart</span>
                {cartCount > 0 && (
                  <span className="pp-cart-badge" key={cartCount}>
                    {cartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="pp-shell pp-main">
        <section className="pp-hero">
          <p className="pp-kicker">
            {user
              ? isOwner
                ? `Managing ${user.restaurantName ?? "your kitchen"}`
                : `Welcome back, ${user.name.split(" ")[0]}!`
              : "Serving 5 realities since 2847"}
          </p>
          <h1 className="pp-h1">
            Any craving.
            <br />
            Any universe.
          </h1>
          <p className="pp-sub">
            {isOwner
              ? "You're signed in as a kitchen. Browse the storefront, or head to your dashboard to manage orders, money, and reviews."
              : "Portal-fresh meals from the multiverse's weirdest kitchens — delivered in ~20 minutes, your local causality permitting."}
          </p>

          {isOwner && (
            <button type="button" className="pp-btn pp-btn-primary" onClick={goManage}>
              Open kitchen dashboard
            </button>
          )}

          <div className="pp-search">
            <Icon name="search" size={18} className="pp-search-icon" />
            <input
              className="pp-search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Burgers, broth, questionable jars…"
              aria-label="Search kitchens"
            />
          </div>

          <div className="pp-chips" role="group" aria-label="Food category">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className={`pp-chip${category === c ? " active" : ""}`}
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        <p className="pp-count" aria-live="polite">
          {visible.length} kitchen{visible.length === 1 ? "" : "s"} delivering to{" "}
          <strong>{dimension.toLowerCase()}</strong>
        </p>

        {catalogLoading ? (
          <p className="pp-hint">Opening portals to 5 realities…</p>
        ) : visible.length === 0 ? (
          <div className="pp-empty">
            <span className="pp-empty-emoji">
              <Icon name="search" size={40} />
            </span>
            <p>
              No kitchens found in this reality. Try another dimension — or
              lower your standards, this is the multiverse.
            </p>
          </div>
        ) : (
          <div className="pp-grid">
            {visible.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} onOpen={() => setActive(r)} />
            ))}
          </div>
        )}
      </main>

      <footer className="pp-footer">
        <p className="pp-footer-brand">
          <PortalMark size={20} /> Portal Pantry™
        </p>
        <p>
          Not liable for meals delivered to alternate versions of you ·
          allergen info varies by reality · couriers are unionized in 3
          dimensions
        </p>
        <p className="pp-footer-credit">
          A demo by <a href="/">David Guijosa</a> — no real food, portals, or
          Kevins were harmed
        </p>
      </footer>

      {active && (
        <RestaurantModal
          restaurant={active}
          cart={cart}
          canOrder={!isOwner}
          user={user}
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
        <CartDrawer
          cart={cart}
          subtotal={subtotal}
          onChangeQty={changeQty}
          onClose={() => setDrawerOpen(false)}
          onCheckout={() => {
            setDrawerOpen(false);
            if (user) {
              void placeOrder();
            } else {
              resumeCheckout.current = true;
              setLoginOpen(true);
            }
          }}
        />
      )}

      {checkoutOpen && (
        <CheckoutModal
          total={placedTotal}
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
