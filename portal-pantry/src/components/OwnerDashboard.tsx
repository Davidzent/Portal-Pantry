import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Icon } from "./Icon";
import { PortalMark } from "./PortalMark";
import {
  categories,
  CURRENCY,
  dimensions,
  type MenuItem,
  type Restaurant,
} from "../data";
import { imageUrl } from "../images";
import { fileToWebpDataUrl } from "../imageUpload";
import { ApiError } from "../api/authApi";
import type { User } from "../api/authApi";
import {
  createOwnerMenuItem,
  getFinance,
  getOwnerOrders,
  getOwnerRestaurant,
  getOwnerReviews,
  markOrderDelivered,
  replyToReview,
  updateOwnerMenuItem,
  updateOwnerRestaurant,
  type Finance,
  type OwnerOrder,
  type Review,
} from "../api/storeApi";

type Tab = "menu" | "orders" | "money" | "reviews";

const TABS: { id: Tab; label: string }[] = [
  { id: "menu", label: "Menu" },
  { id: "orders", label: "Orders" },
  { id: "money", label: "Money" },
  { id: "reviews", label: "Reviews" },
];

const STATUS_LABEL: Record<OwnerOrder["status"], string> = {
  pending: "Pending",
  delivered: "Delivered",
  "wrong-dimension": "Wrong dimension",
  lost: "Lost · refunded",
};

function money(n: number): string {
  return `${n.toLocaleString()}${CURRENCY}`;
}

function formatWhen(iso: string): string {
  const then = new Date(iso).getTime();
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="pp-stars" aria-label={`${rating} out of 5 stars`}>
      {"★★★★★".slice(0, rating)}
      <span className="pp-stars-empty">{"★★★★★".slice(rating)}</span>
    </span>
  );
}

function PhotoButton({
  maxEdge,
  label,
  onPicked,
  disabled,
}: {
  maxEdge: number;
  label: string;
  onPicked: (dataUrl: string) => Promise<void> | void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          try {
            onPicked(await fileToWebpDataUrl(file, maxEdge));
          } finally {
            setBusy(false);
          }
        }}
      />
      <button
        type="button"
        className="pp-btn pp-btn-ghost pp-btn-sm"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Processing…" : label}
      </button>
    </>
  );
}

function MenuItemEditor({
  item,
  onSaved,
}: {
  item: MenuItem;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(item.name);
  const [desc, setDesc] = useState(item.desc);
  const [price, setPrice] = useState(String(item.price));
  const [prep, setPrep] = useState(String(item.prepMinutes ?? 10));
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(item.name);
    setDesc(item.desc);
    setPrice(String(item.price));
    setPrep(String(item.prepMinutes ?? 10));
  }, [item.name, item.desc, item.price, item.prepMinutes]);

  const dirty =
    name !== item.name ||
    desc !== item.desc ||
    Number(price) !== item.price ||
    Number(prep) !== (item.prepMinutes ?? 10);

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await updateOwnerMenuItem(item.id, {
        name: name.trim(),
        desc: desc.trim(),
        price: Number(price),
        prepMinutes: Number(prep),
      });
      await onSaved();
      setFlash(true);
      window.setTimeout(() => setFlash(false), 1600);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed — try again.");
    } finally {
      setBusy(false);
    }
  };

  const toggleDelist = async () => {
    setBusy(true);
    setError("");
    try {
      await updateOwnerMenuItem(item.id, { delisted: !item.delisted });
      await onSaved();
    } catch {
      setError("Couldn't update the listing — try again.");
    } finally {
      setBusy(false);
    }
  };

  const changePhoto = async (dataUrl: string) => {
    setBusy(true);
    setError("");
    try {
      await updateOwnerMenuItem(item.id, { image: dataUrl });
      await onSaved();
    } catch {
      setError("Couldn't save the photo — try a smaller image.");
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async () => {
    setBusy(true);
    try {
      await updateOwnerMenuItem(item.id, { image: "" });
      await onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={`pp-edit-item${item.delisted ? " delisted" : ""}`}>
      <span className="pp-item-tile" aria-hidden="true">
        {imageUrl(item.image) ? (
          <img className="pp-item-tile-img" src={imageUrl(item.image)} alt="" />
        ) : (
          <Icon name="utensils" size={22} />
        )}
      </span>
      <div className="pp-edit-fields">
        <input
          className="pp-edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
          aria-label={`Dish name (currently ${item.name})`}
        />
        <textarea
          className="pp-edit-desc"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          disabled={busy}
          rows={2}
          aria-label={`Description for ${item.name}`}
        />
        <div className="pp-edit-row2">
          <span className="pp-edit-field-inline">
            <label>Price</label>
            <span className="pp-edit-price">
              <input
                type="number"
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={busy}
                aria-label={`Price for ${item.name} in zeeps`}
              />
              <span aria-hidden="true">{CURRENCY}</span>
            </span>
          </span>
          <span className="pp-edit-field-inline">
            <label>Prep</label>
            <span className="pp-edit-price">
              <input
                type="number"
                min="1"
                value={prep}
                onChange={(e) => setPrep(e.target.value)}
                disabled={busy}
                aria-label={`Prep time for ${item.name} in minutes`}
              />
              <span aria-hidden="true">min</span>
            </span>
          </span>
          {item.delisted && <span className="pp-delisted-badge">Delisted</span>}
        </div>
        <div className="pp-edit-photo">
          <PhotoButton
            maxEdge={800}
            label={imageUrl(item.image) ? "Change photo" : "Add photo"}
            onPicked={changePhoto}
            disabled={busy}
          />
          {imageUrl(item.image) && (
            <button
              type="button"
              className="pp-btn-link"
              onClick={removePhoto}
              disabled={busy}
            >
              Remove photo
            </button>
          )}
        </div>
        {error && (
          <p className="pp-edit-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="pp-edit-actions">
        <button
          type="button"
          className="pp-btn pp-btn-primary pp-btn-sm"
          onClick={save}
          disabled={busy || !dirty}
        >
          {flash ? "Saved ✓" : "Save"}
        </button>
        <button
          type="button"
          className="pp-btn-link"
          onClick={toggleDelist}
          disabled={busy}
        >
          {item.delisted ? "Relist" : "Delist"}
        </button>
      </div>
    </li>
  );
}

function AddDishForm({ onAdded }: { onAdded: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [prep, setPrep] = useState("10");
  const [image, setImage] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setName("");
    setDesc("");
    setPrice("");
    setPrep("10");
    setImage(undefined);
    setError("");
  };

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await createOwnerMenuItem({
        name: name.trim(),
        desc: desc.trim(),
        price: Number(price),
        prepMinutes: Number(prep),
        image,
      });
      await onAdded();
      reset();
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't add the dish — try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        className="pp-btn pp-btn-primary pp-add-dish-btn"
        onClick={() => setOpen(true)}
      >
        <Icon name="plus" size={15} /> Add a dish
      </button>
    );
  }

  return (
    <div className="pp-add-dish">
      <div className="pp-edit-item">
        <span className="pp-item-tile" aria-hidden="true">
          {image ? (
            <img className="pp-item-tile-img" src={image} alt="" />
          ) : (
            <Icon name="utensils" size={22} />
          )}
        </span>
        <div className="pp-edit-fields">
          <div className="pp-edit-row2">
            <PhotoButton
              maxEdge={800}
              label={image ? "Change photo" : "Add photo"}
              onPicked={setImage}
              disabled={busy}
            />
          </div>
          <input
            className="pp-edit-name"
            placeholder="Dish name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
          />
          <textarea
            className="pp-edit-desc"
            placeholder="Description"
            rows={2}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            disabled={busy}
          />
          <div className="pp-edit-row2">
            <span className="pp-edit-field-inline">
              <label>Price</label>
              <span className="pp-edit-price">
                <input
                  type="number"
                  min="1"
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={busy}
                />
                <span aria-hidden="true">{CURRENCY}</span>
              </span>
            </span>
            <span className="pp-edit-field-inline">
              <label>Prep</label>
              <span className="pp-edit-price">
                <input
                  type="number"
                  min="1"
                  value={prep}
                  onChange={(e) => setPrep(e.target.value)}
                  disabled={busy}
                />
                <span aria-hidden="true">min</span>
              </span>
            </span>
          </div>
          {error && (
            <p className="pp-edit-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
      <div className="pp-add-dish-actions">
        <button
          type="button"
          className="pp-btn-link"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          type="button"
          className="pp-btn pp-btn-primary pp-btn-sm"
          onClick={submit}
          disabled={busy || !name.trim() || !price}
        >
          {busy ? "Adding…" : "Add dish"}
        </button>
      </div>
    </div>
  );
}

function MenuTab({
  store,
  reload,
}: {
  store: Restaurant;
  reload: () => Promise<void>;
}) {
  const [name, setName] = useState(store.name);
  const [tagline, setTagline] = useState(store.tagline);
  const [category, setCategory] = useState(store.category);
  const [dimension, setDimension] = useState(store.dimension);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(store.name);
    setTagline(store.tagline);
    setCategory(store.category);
    setDimension(store.dimension);
  }, [store.name, store.tagline, store.category, store.dimension]);

  const dirty =
    name !== store.name ||
    tagline !== store.tagline ||
    category !== store.category ||
    dimension !== store.dimension;

  const saveStore = async () => {
    setBusy(true);
    setError("");
    try {
      await updateOwnerRestaurant({
        name: name.trim(),
        tagline: tagline.trim(),
        category,
        dimension,
      });
      await reload();
      setFlash(true);
      window.setTimeout(() => setFlash(false), 1600);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed — try again.");
    } finally {
      setBusy(false);
    }
  };

  const setPhoto = async (dataUrl: string) => {
    setBusy(true);
    setError("");
    try {
      await updateOwnerRestaurant({ image: dataUrl });
      await reload();
    } catch {
      setError("Couldn't save the photo — try a smaller image.");
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async () => {
    setBusy(true);
    try {
      await updateOwnerRestaurant({ image: "" });
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const bannerUrl = imageUrl(store.image);

  return (
    <div className="pp-dash-panel">
      <div className="pp-store-form">
        <div className="pp-store-photo">
          <div
            className="pp-store-photo-preview"
            style={{ "--hue": store.hue } as CSSProperties}
          >
            {bannerUrl ? (
              <img src={bannerUrl} alt="" />
            ) : (
              <span>
                <Icon name="utensils" size={40} />
              </span>
            )}
          </div>
          <div className="pp-store-photo-actions">
            <span className="pp-field-label">Restaurant photo</span>
            <div className="pp-photo-btns">
              <PhotoButton
                maxEdge={1440}
                label={bannerUrl ? "Change photo" : "Upload photo"}
                onPicked={setPhoto}
                disabled={busy}
              />
              {bannerUrl && (
                <button
                  type="button"
                  className="pp-btn-link"
                  onClick={removePhoto}
                  disabled={busy}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <label className="pp-field">
          <span>Kitchen name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
        </label>
        <label className="pp-field">
          <span>Tagline</span>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            disabled={busy}
          />
        </label>
        <div className="pp-store-row">
          <label className="pp-field">
            <span>Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={busy}
            >
              {categories
                .filter((c) => c !== "All")
                .map((c) => (
                  <option key={c}>{c}</option>
                ))}
            </select>
          </label>
          <label className="pp-field">
            <span>Dimension</span>
            <select
              value={dimension}
              onChange={(e) => setDimension(e.target.value)}
              disabled={busy}
            >
              {dimensions
                .filter((d) => d !== "All dimensions")
                .map((d) => (
                  <option key={d}>{d}</option>
                ))}
            </select>
          </label>
        </div>
        {error && (
          <p className="pp-edit-error" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          className="pp-btn pp-btn-primary pp-btn-sm"
          onClick={saveStore}
          disabled={busy || !dirty}
        >
          {flash ? "Saved ✓" : "Save store details"}
        </button>
      </div>

      <h3 className="pp-menu-heading">
        Dishes{" "}
        <span className="pp-dash-hint">
          ({store.items.filter((i) => !i.delisted).length} of {store.items.length}{" "}
          listed · prep times &amp; photos show to customers)
        </span>
      </h3>
      <AddDishForm onAdded={reload} />
      {store.items.length === 0 && (
        <p className="pp-dash-empty">No dishes yet — add your first one above.</p>
      )}
      <ul className="pp-edit-list">
        {store.items.map((item) => (
          <MenuItemEditor key={item.id} item={item} onSaved={reload} />
        ))}
      </ul>
    </div>
  );
}

function OrderCard({
  order,
  onDelivered,
}: {
  order: OwnerOrder;
  onDelivered: (id: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <li className="pp-oc">
      <div className="pp-oc-head">
        <span className="pp-oc-id">{order.id}</span>
        <span className={`pp-status pp-status-${order.status}`}>
          {STATUS_LABEL[order.status]}
        </span>
      </div>
      <p className="pp-oc-meta">
        {order.customerName} · {order.dimension} · {formatWhen(order.placedAt)}
      </p>
      <ul className="pp-oc-items">
        {order.items.map((it, i) => (
          <li key={i}>
            <span>
              {it.qty}× {it.name}
            </span>
            <span>{money(it.price * it.qty)}</span>
          </li>
        ))}
      </ul>
      <div className="pp-oc-foot">
        <span className="pp-oc-sub">Subtotal {money(order.subtotal)}</span>
        {order.status === "pending" && (
          <button
            type="button"
            className="pp-btn pp-btn-primary pp-btn-sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onDelivered(order.id);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "…" : "Mark delivered"}
          </button>
        )}
      </div>
    </li>
  );
}

function OrdersTab({
  orders,
  reload,
}: {
  orders: OwnerOrder[];
  reload: () => Promise<void>;
}) {
  const markDelivered = async (id: string) => {
    await markOrderDelivered(id);
    await reload();
  };

  const pending = orders.filter((o) => o.status === "pending");
  const past = orders.filter((o) => o.status !== "pending");

  return (
    <div className="pp-dash-panel">
      <section>
        <h3 className="pp-menu-heading">
          Pending <span className="pp-dash-hint">({pending.length} in the queue)</span>
        </h3>
        {pending.length === 0 ? (
          <p className="pp-dash-empty">No orders cooking right now. Quiet kitchen.</p>
        ) : (
          <ul className="pp-oc-list">
            {pending.map((o) => (
              <OrderCard key={o.id} order={o} onDelivered={markDelivered} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="pp-menu-heading">
          Past orders <span className="pp-dash-hint">({past.length})</span>
        </h3>
        {past.length === 0 ? (
          <p className="pp-dash-empty">No history yet.</p>
        ) : (
          <ul className="pp-oc-list">
            {past.map((o) => (
              <OrderCard key={o.id} order={o} onDelivered={markDelivered} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MoneyTab({ finance }: { finance: Finance }) {
  return (
    <div className="pp-dash-panel">
      <div className="pp-money-grid">
        <div className="pp-money-card pp-money-hero">
          <span className="pp-money-label">Net profit</span>
          <span className="pp-money-value">{money(finance.net)}</span>
          <span className="pp-money-note">after platform fee &amp; reality tax</span>
        </div>
        <div className="pp-money-card">
          <span className="pp-money-label">Gross sales</span>
          <span className="pp-money-value">{money(finance.gross)}</span>
          <span className="pp-money-note">{finance.deliveredOrders} delivered</span>
        </div>
        <div className="pp-money-card">
          <span className="pp-money-label">Pending</span>
          <span className="pp-money-value">{money(finance.pending)}</span>
          <span className="pp-money-note">{finance.pendingOrders} in the queue</span>
        </div>
        <div className="pp-money-card">
          <span className="pp-money-label">Refunded</span>
          <span className="pp-money-value">{money(finance.refunded)}</span>
          <span className="pp-money-note">lost / wrong dimension</span>
        </div>
      </div>

      <div className="pp-ledger">
        <h3 className="pp-menu-heading">Payout breakdown</h3>
        <p className="pp-ledger-row">
          <span>Gross sales (delivered)</span>
          <span>{money(finance.gross)}</span>
        </p>
        <p className="pp-ledger-row pp-ledger-neg">
          <span>Portal Pantry fee ({Math.round(finance.platformFeeRate * 100)}%)</span>
          <span>−{money(finance.platformFee)}</span>
        </p>
        <p className="pp-ledger-row pp-ledger-neg">
          <span>Reality tax ({Math.round(finance.taxRate * 100)}%)</span>
          <span>−{money(finance.tax)}</span>
        </p>
        <p className="pp-ledger-row pp-ledger-total">
          <span>Net payout</span>
          <span>{money(finance.net)}</span>
        </p>
      </div>
      <p className="pp-dash-note">
        Figures update as orders are delivered. Reality tax is remitted to the
        Galactic Federation automatically.
      </p>
    </div>
  );
}

function ReviewCard({
  review,
  onReplied,
}: {
  review: Review;
  onReplied: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(review.reply ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    if (draft.trim().length === 0) return;
    setBusy(true);
    setError("");
    try {
      await replyToReview(review.id, draft.trim());
      await onReplied();
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reply failed — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="pp-review">
      <div className="pp-review-head">
        <span className="pp-review-author">
          <span className="pp-review-avatar" aria-hidden="true">
            <Icon name="user" size={15} />
          </span>
          {review.author}
        </span>
        <Stars rating={review.rating} />
      </div>
      <p className="pp-review-body">{review.body}</p>
      <p className="pp-review-when">{formatWhen(review.createdAt)}</p>

      {review.reply && !editing && (
        <div className="pp-review-reply">
          <span className="pp-review-reply-label">
            <PortalMark size={16} /> Your reply
          </span>
          <p>{review.reply}</p>
          <button
            type="button"
            className="pp-btn-link"
            onClick={() => {
              setDraft(review.reply ?? "");
              setEditing(true);
            }}
          >
            Edit reply
          </button>
        </div>
      )}

      {(!review.reply || editing) && (
        <div className="pp-reply-box">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Reply as the owner…"
            rows={2}
            disabled={busy}
            aria-label={`Reply to ${review.author}`}
          />
          {error && (
            <p className="pp-edit-error" role="alert">
              {error}
            </p>
          )}
          <div className="pp-reply-actions">
            {editing && (
              <button
                type="button"
                className="pp-btn-link"
                onClick={() => setEditing(false)}
                disabled={busy}
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              className="pp-btn pp-btn-primary pp-btn-sm"
              onClick={send}
              disabled={busy || draft.trim().length === 0}
            >
              {busy ? "Sending…" : review.reply ? "Update reply" : "Reply"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function ReviewsTab({
  reviews,
  reload,
}: {
  reviews: Review[];
  reload: () => Promise<void>;
}) {
  const avg =
    reviews.length > 0
      ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="pp-dash-panel">
      <div className="pp-review-summary">
        <span className="pp-review-avg">{avg.toFixed(1)}</span>
        <span>
          <Stars rating={Math.round(avg)} />
          <span className="pp-dash-hint"> · {reviews.length} reviews</span>
        </span>
      </div>
      <ul className="pp-review-list">
        {reviews.map((r) => (
          <ReviewCard key={r.id} review={r} onReplied={reload} />
        ))}
      </ul>
    </div>
  );
}

interface OwnerDashboardProps {
  user: User;
  onSignOut: () => void;
  onViewStorefront: () => void;
  onCatalogChanged: () => Promise<void> | void;
}

export default function OwnerDashboard({
  user,
  onSignOut,
  onViewStorefront,
  onCatalogChanged,
}: OwnerDashboardProps) {
  const [tab, setTab] = useState<Tab>("orders");
  const [store, setStore] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<OwnerOrder[] | null>(null);
  const [finance, setFinance] = useState<Finance | null>(null);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState("");

  const loadStore = useCallback(async () => {
    setStore(await getOwnerRestaurant());
  }, []);
  const loadOrders = useCallback(async () => {
    setOrders(await getOwnerOrders());
  }, []);
  const loadFinance = useCallback(async () => {
    setFinance(await getFinance());
  }, []);
  const loadReviews = useCallback(async () => {
    setReviews(await getOwnerReviews());
  }, []);

  useEffect(() => {
    Promise.all([loadStore(), loadOrders(), loadFinance(), loadReviews()]).catch(
      (err) =>
        setError(
          err instanceof ApiError
            ? err.message
            : "Couldn't reach your kitchen's records.",
        ),
    );
  }, [loadStore, loadOrders, loadFinance, loadReviews]);

  const afterMenuChange = useCallback(async () => {
    await loadStore();
    void onCatalogChanged();
  }, [loadStore, onCatalogChanged]);

  const afterOrderChange = useCallback(async () => {
    await Promise.all([loadOrders(), loadFinance()]);
  }, [loadOrders, loadFinance]);

  return (
    <div className="pp-page pp-dash">
      <header className="pp-header">
        <div className="pp-shell pp-header-inner">
          <div className="pp-dash-brand">
            <PortalMark size={34} />
            <div>
              <span className="pp-dash-title">
                {store?.name ?? user.restaurantName ?? "Your kitchen"}
              </span>
              <span className="pp-dash-tag">Kitchen dashboard</span>
            </div>
          </div>
          <div className="pp-header-actions">
            <button
              type="button"
              className="pp-btn pp-btn-ghost pp-btn-sm"
              onClick={onViewStorefront}
            >
              View storefront
            </button>
            <span className="pp-user-chip pp-user-chip-static">
              <span className="pp-user-avatar" aria-hidden="true">
                <Icon name="user" size={16} />
              </span>
              <span className="pp-user-name">{user.name.split(" ")[0]}</span>
            </span>
            <button
              type="button"
              className="pp-iconbtn"
              onClick={onSignOut}
              aria-label="Sign out"
              title="Sign out"
            >
              <Icon name="log-out" size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="pp-dash-tabs-wrap">
        <div className="pp-shell">
          <nav className="pp-dash-tabs" aria-label="Dashboard sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`pp-dash-tab${tab === t.id ? " active" : ""}`}
                aria-pressed={tab === t.id}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="pp-shell pp-dash-main">
        {error && (
          <p className="pp-login-error" role="alert">
            {error}
          </p>
        )}

        {tab === "menu" &&
          (store ? (
            <MenuTab store={store} reload={afterMenuChange} />
          ) : (
            <DashLoading label="Loading your menu…" />
          ))}

        {tab === "orders" &&
          (orders ? (
            <OrdersTab orders={orders} reload={afterOrderChange} />
          ) : (
            <DashLoading label="Loading the order book…" />
          ))}

        {tab === "money" &&
          (finance ? (
            <MoneyTab finance={finance} />
          ) : (
            <DashLoading label="Counting zeeps…" />
          ))}

        {tab === "reviews" &&
          (reviews ? (
            <ReviewsTab reviews={reviews} reload={loadReviews} />
          ) : (
            <DashLoading label="Loading reviews…" />
          ))}
      </main>
    </div>
  );
}

function DashLoading({ label }: { label: string }) {
  return (
    <p className="pp-orders-loading">
      <span className="pp-spin pp-spin-green" aria-hidden="true" />
      {label}
    </p>
  );
}
