import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { Stars } from "./Stars";
import { Portal } from "./Portal";
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

type Tab = "queue" | "dishes" | "payout" | "reports";

const TABS: { id: Tab; label: string }[] = [
  { id: "queue", label: "Queue" },
  { id: "dishes", label: "Dishes" },
  { id: "payout", label: "Payout" },
  { id: "reports", label: "Reports" },
];

/* Same vocabulary the customer sees in their shipment record — an order does
   not change its name because you are looking at it from the kitchen. */
const STATUS: Record<OwnerOrder["status"], { label: string; tone: string }> = {
  pending: { label: "In transit", tone: "pp-tag--note" },
  delivered: { label: "Delivered", tone: "pp-tag--go" },
  "wrong-dimension": { label: "Misrouted", tone: "pp-tag--bad" },
  lost: { label: "Lost · refunded", tone: "pp-tag--bad" },
};

function money(n: number): string {
  return `${n.toLocaleString()}${CURRENCY}`;
}

function formatWhen(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function DeskLoading({ label }: { label: string }) {
  return (
    <div className="pp-state">
      <Portal size={64} state="charging" label={label} />
      <p className="pp-state__body">{label}</p>
    </div>
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
        className="pp-btn pp-btn--quiet pp-btn--sm"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Re-encoding…" : label}
      </button>
    </>
  );
}

function DishEditor({
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
      setError(
        err instanceof ApiError
          ? err.message
          : "The change did not save. Nothing was altered. Try again.",
      );
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
      setError("The listing did not change. Try again.");
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
      setError("The photo did not save. A smaller image will go through.");
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

  const photo = imageUrl(item.image);

  return (
    <li
      className={`pp-panel pp-dish${item.delisted ? " pp-dish--delisted" : ""}`}
    >
      <span className="pp-dish__thumb">
        {photo ? (
          <img src={photo} alt="" />
        ) : (
          <Icon name="utensils" size={22} aria-hidden="true" />
        )}
      </span>

      <div className="pp-dish__fields">
        <label className="pp-form-row">
          <span className="pp-field-label">Dish</span>
          <span className="pp-field">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
            />
          </span>
        </label>

        <label className="pp-form-row">
          <span className="pp-field-label">Description</span>
          <textarea
            className="pp-textarea"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            disabled={busy}
          />
        </label>

        <div className="pp-dish__row">
          <label className="pp-form-row pp-form-row--tight">
            <span className="pp-field-label">Price</span>
            <span className="pp-field">
              <input
                type="number"
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={busy}
              />
              <span className="pp-field__unit" aria-hidden="true">
                {CURRENCY}
              </span>
            </span>
          </label>
          <label className="pp-form-row pp-form-row--tight">
            <span className="pp-field-label">Prep</span>
            <span className="pp-field">
              <input
                type="number"
                min="1"
                value={prep}
                onChange={(e) => setPrep(e.target.value)}
                disabled={busy}
              />
              <span className="pp-field__unit" aria-hidden="true">
                min
              </span>
            </span>
          </label>
          {item.delisted && (
            <span className="pp-tag pp-tag--bad">Off the board</span>
          )}
        </div>

        {error && (
          <p className="pp-alert" role="alert">
            <Icon name="alert" size={18} />
            {error}
          </p>
        )}

        <div className="pp-dish__actions">
          <PhotoButton
            maxEdge={800}
            label={photo ? "Replace photo" : "Add photo"}
            onPicked={changePhoto}
            disabled={busy}
          />
          {photo && (
            <button
              type="button"
              className="pp-btn-link"
              onClick={removePhoto}
              disabled={busy}
            >
              Remove photo
            </button>
          )}
          <span className="pp-spacer" />
          <button
            type="button"
            className="pp-btn-link"
            onClick={toggleDelist}
            disabled={busy}
          >
            {item.delisted ? "Put back on the board" : "Take off the board"}
          </button>
          <button
            type="button"
            className="pp-btn pp-btn--sm"
            onClick={save}
            disabled={busy || !dirty}
          >
            {flash ? (
              <>
                <Icon name="check" size={14} />
                Saved
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </li>
  );
}

function AddDish({ onAdded }: { onAdded: () => Promise<void> }) {
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
        err instanceof ApiError
          ? err.message
          : "The dish was not added. Nothing was filed. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" className="pp-btn" onClick={() => setOpen(true)}>
        <Icon name="plus" size={15} /> Declare a dish
      </button>
    );
  }

  return (
    <div className="pp-panel pp-dish">
      <span className="pp-dish__thumb">
        {image ? (
          <img src={image} alt="" />
        ) : (
          <Icon name="utensils" size={22} aria-hidden="true" />
        )}
      </span>

      <div className="pp-dish__fields">
        <label className="pp-form-row">
          <span className="pp-field-label">Dish</span>
          <span className="pp-field">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name as it appears on the board"
              disabled={busy}
            />
          </span>
        </label>

        <label className="pp-form-row">
          <span className="pp-field-label">Description</span>
          <textarea
            className="pp-textarea"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="What it is, and anything a customs officer would want to know."
            disabled={busy}
          />
        </label>

        <div className="pp-dish__row">
          <label className="pp-form-row pp-form-row--tight">
            <span className="pp-field-label">Price</span>
            <span className="pp-field">
              <input
                type="number"
                min="1"
                placeholder="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={busy}
              />
              <span className="pp-field__unit" aria-hidden="true">
                {CURRENCY}
              </span>
            </span>
          </label>
          <label className="pp-form-row pp-form-row--tight">
            <span className="pp-field-label">Prep</span>
            <span className="pp-field">
              <input
                type="number"
                min="1"
                value={prep}
                onChange={(e) => setPrep(e.target.value)}
                disabled={busy}
              />
              <span className="pp-field__unit" aria-hidden="true">
                min
              </span>
            </span>
          </label>
        </div>

        {error && (
          <p className="pp-alert" role="alert">
            <Icon name="alert" size={18} />
            {error}
          </p>
        )}

        <div className="pp-dish__actions">
          <PhotoButton
            maxEdge={800}
            label={image ? "Replace photo" : "Add photo"}
            onPicked={setImage}
            disabled={busy}
          />
          <span className="pp-spacer" />
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
            className="pp-btn"
            onClick={submit}
            disabled={busy || !name.trim() || !price}
          >
            {busy ? "Filing…" : "Add to the board"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DishesTab({
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
      setError(
        err instanceof ApiError
          ? err.message
          : "The details did not save. Try again.",
      );
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
      setError("The photo did not save. A smaller image will go through.");
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

  const banner = imageUrl(store.image);
  const listed = store.items.filter((i) => !i.delisted).length;

  return (
    <div className="pp-desk__panel">
      <section className="pp-block">
        <div className="pp-block__head">
          <h3>Storefront</h3>
          <span className="pp-block__hint">How the board lists you</span>
        </div>

        <div className="pp-panel pp-settings">
          <div className="pp-settings__photo">
            <span className="pp-settings__preview">
              {banner ? (
                <img src={banner} alt="" />
              ) : (
                <Icon name="utensils" size={28} aria-hidden="true" />
              )}
            </span>
            <div className="pp-settings__actions">
              <PhotoButton
                maxEdge={1440}
                label={banner ? "Replace photo" : "Upload photo"}
                onPicked={setPhoto}
                disabled={busy}
              />
              {banner && (
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
          </div>

          <label className="pp-form-row">
            <span className="pp-field-label">Kitchen name</span>
            <span className="pp-field">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={busy}
              />
            </span>
          </label>

          <label className="pp-form-row">
            <span className="pp-field-label">Tagline</span>
            <span className="pp-field">
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                disabled={busy}
              />
            </span>
          </label>

          <div className="pp-settings__pair">
            <label className="pp-form-row">
              <span className="pp-field-label">Cargo class</span>
              <span className="pp-field">
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
                <Icon name="chevron-down" size={14} />
              </span>
            </label>
            <label className="pp-form-row">
              <span className="pp-field-label">Registered dimension</span>
              <span className="pp-field">
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
                <Icon name="chevron-down" size={14} />
              </span>
            </label>
          </div>

          {error && (
            <p className="pp-alert" role="alert">
              <Icon name="alert" size={18} />
              {error}
            </p>
          )}

          <div className="pp-settings__actions">
            <button
              type="button"
              className="pp-btn"
              onClick={saveStore}
              disabled={busy || !dirty}
            >
              {flash ? (
                <>
                  <Icon name="check" size={14} />
                  Saved
                </>
              ) : (
                "Save storefront"
              )}
            </button>
          </div>
        </div>
      </section>

      <section className="pp-block">
        <div className="pp-block__head">
          <h3>Dishes</h3>
          <span className="pp-block__hint">
            {listed} of {store.items.length} on the board
          </span>
        </div>

        <AddDish onAdded={reload} />

        {store.items.length === 0 ? (
          <div className="pp-state">
            <Portal size={64} state="closed" />
            <p className="pp-state__title">Nothing declared</p>
            <p className="pp-state__body">
              Your licence is current and your board is empty. Declare a dish and
              it goes live immediately.
            </p>
          </div>
        ) : (
          <ul className="pp-dishes">
            {store.items.map((item) => (
              <DishEditor key={item.id} item={item} onSaved={reload} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function QueueCard({
  order,
  onDelivered,
}: {
  order: OwnerOrder;
  onDelivered: (id: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const status = STATUS[order.status];

  return (
    <li className="pp-order">
      <div className="pp-order__head">
        <span className="pp-order__ident">
          <span className="pp-order__id">{order.id}</span>
          <span className="pp-order__meta">
            {order.customerName} · {order.dimension} ·{" "}
            {formatWhen(order.placedAt)}
          </span>
        </span>
        <span className={`pp-tag ${status.tone}`}>{status.label}</span>
      </div>

      <ul className="pp-order__items">
        {order.items.map((it, i) => (
          <li key={i}>
            <span>
              {it.qty}× {it.name}
            </span>
            <span>{money(it.price * it.qty)}</span>
          </li>
        ))}
      </ul>

      <p className="pp-order__total">
        <span>Your share, before fees</span>
        <span>{money(order.subtotal)}</span>
      </p>

      {order.status === "pending" && (
        <div className="pp-settings__actions">
          <button
            type="button"
            className="pp-btn pp-btn--go pp-btn--sm"
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
            {busy ? "Confirming…" : "Confirm delivery"}
          </button>
        </div>
      )}
    </li>
  );
}

function QueueTab({
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
    <div className="pp-desk__panel">
      <section className="pp-block">
        <div className="pp-block__head">
          <h3>In the queue</h3>
          <span className="pp-block__hint">
            {pending.length} awaiting confirmation
          </span>
        </div>
        {pending.length === 0 ? (
          <div className="pp-state">
            <Portal size={64} state="closed" />
            <p className="pp-state__title">Queue clear</p>
            <p className="pp-state__body">
              Nothing is cooking. Every order on file has been confirmed or
              written off.
            </p>
          </div>
        ) : (
          <ul className="pp-record__list">
            {pending.map((o) => (
              <QueueCard key={o.id} order={o} onDelivered={markDelivered} />
            ))}
          </ul>
        )}
      </section>

      <section className="pp-block">
        <div className="pp-block__head">
          <h3>Closed</h3>
          <span className="pp-block__hint">{past.length} on file</span>
        </div>
        {past.length === 0 ? (
          <p className="pp-fine">Nothing closed yet.</p>
        ) : (
          <ul className="pp-record__list">
            {past.map((o) => (
              <QueueCard key={o.id} order={o} onDelivered={markDelivered} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PayoutTab({ finance }: { finance: Finance }) {
  return (
    <div className="pp-desk__panel">
      <section className="pp-block">
        <div className="pp-block__head">
          <h3>Payout</h3>
          <span className="pp-block__hint">
            Updates as deliveries are confirmed
          </span>
        </div>

        <div className="pp-stats">
          <div className="pp-panel pp-stat pp-stat--net">
            <span className="pp-stat__label">Net payout</span>
            <span className="pp-stat__value">{money(finance.net)}</span>
            <span className="pp-stat__note">
              After the platform fee and reality tax. This is what lands.
            </span>
          </div>
          <div className="pp-panel pp-stat">
            <span className="pp-stat__label">Gross</span>
            <span className="pp-stat__value">{money(finance.gross)}</span>
            <span className="pp-stat__note">
              {finance.deliveredOrders} delivered
            </span>
          </div>
          <div className="pp-panel pp-stat">
            <span className="pp-stat__label">Held</span>
            <span className="pp-stat__value">{money(finance.pending)}</span>
            <span className="pp-stat__note">
              {finance.pendingOrders} still in transit
            </span>
          </div>
          <div className="pp-panel pp-stat">
            <span className="pp-stat__label">Written off</span>
            <span className="pp-stat__value">{money(finance.refunded)}</span>
            <span className="pp-stat__note">Lost or misrouted</span>
          </div>
        </div>
      </section>

      <section className="pp-block">
        <div className="pp-block__head">
          <h3>Breakdown</h3>
        </div>
        <div className="pp-panel pp-settings">
          <div className="pp-ledger">
            <p className="pp-ledger__row">
              <span>Gross sales, delivered only</span>
              <span>{money(finance.gross)}</span>
            </p>
            <p className="pp-ledger__row pp-ledger__row--neg">
              <span>
                Carrier fee ({Math.round(finance.platformFeeRate * 100)}%)
              </span>
              <span>−{money(finance.platformFee)}</span>
            </p>
            <p className="pp-ledger__row pp-ledger__row--neg">
              <span>Reality tax ({Math.round(finance.taxRate * 100)}%)</span>
              <span>−{money(finance.tax)}</span>
            </p>
            <p className="pp-ledger__row pp-ledger__row--total">
              <span>Net payout</span>
              <span>{money(finance.net)}</span>
            </p>
          </div>
          <p className="pp-fine">
            § 9.2 — Reality tax is withheld at source and remitted on your
            behalf. Customers are not charged it; it comes out of your side.
            Disputes are heard in the dimension of origin.
          </p>
        </div>
      </section>
    </div>
  );
}

function ReportCard({
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
      setError(
        err instanceof ApiError
          ? err.message
          : "The response was not filed. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="pp-review">
      <div className="pp-review__head">
        <span className="pp-review__author">
          <span className="pp-review__avatar" aria-hidden="true">
            <Icon name="user" size={15} />
          </span>
          {review.author}
          <span className="pp-order__meta">{formatWhen(review.createdAt)}</span>
        </span>
        <Stars rating={review.rating} />
      </div>
      <p className="pp-review__body">{review.body}</p>

      {review.reply && !editing && (
        <div className="pp-review__reply">
          <span className="pp-review__reply-label">Your response, on file</span>
          <p>{review.reply}</p>
          <button
            type="button"
            className="pp-btn-link"
            onClick={() => {
              setDraft(review.reply ?? "");
              setEditing(true);
            }}
          >
            Amend it
          </button>
        </div>
      )}

      {(!review.reply || editing) && (
        <div className="pp-block pp-section__note">
          <label className="pp-form-row">
            <span className="pp-field-label">Response</span>
            <textarea
              className="pp-textarea"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Filed publicly under your kitchen's name."
              disabled={busy}
            />
          </label>
          {error && (
            <p className="pp-alert" role="alert">
              <Icon name="alert" size={18} />
              {error}
            </p>
          )}
          <div className="pp-settings__actions">
            <button
              type="button"
              className="pp-btn pp-btn--sm"
              onClick={send}
              disabled={busy || draft.trim().length === 0}
            >
              {busy ? "Filing…" : review.reply ? "Update response" : "Respond"}
            </button>
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
          </div>
        </div>
      )}
    </li>
  );
}

function ReportsTab({
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
  const unanswered = reviews.filter((r) => !r.reply).length;

  if (reviews.length === 0) {
    return (
      <div className="pp-desk__panel">
        <div className="pp-state">
          <Portal size={64} state="closed" />
          <p className="pp-state__title">Nothing filed</p>
          <p className="pp-state__body">
            No customer has filed a report against this kitchen. Take that
            however you like.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pp-desk__panel">
      <div className="pp-panel pp-avg">
        <span className="pp-avg__score">{avg.toFixed(1)}</span>
        <span className="pp-avg__of">
          <Stars rating={Math.round(avg)} />
          <span className="pp-block__hint">
            {reviews.length} on record
            {unanswered > 0 ? ` · ${unanswered} without a response` : ""}
          </span>
        </span>
      </div>

      <ul className="pp-reviews">
        {reviews.map((r) => (
          <ReportCard key={r.id} review={r} onReplied={reload} />
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
  const [tab, setTab] = useState<Tab>("queue");
  const [store, setStore] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<OwnerOrder[] | null>(null);
  const [finance, setFinance] = useState<Finance | null>(null);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState("");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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
            : "Your kitchen's records are unreachable. Nothing has been lost.",
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

  /* Real tablist keyboard behaviour: arrows move and activate, Home/End jump.
     Only the selected tab is in the tab order, so Tab moves past the whole
     group into the panel — which is the point of a tablist. */
  const onTabKey = (e: React.KeyboardEvent) => {
    const i = TABS.findIndex((t) => t.id === tab);
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const id = TABS[next].id;
    setTab(id);
    tabRefs.current[id]?.focus();
  };

  const pendingCount = orders?.filter((o) => o.status === "pending").length ?? 0;

  return (
    <div className="pp-page">
      <header className="pp-desk__bar">
        <div className="pp-shell pp-desk__bar-inner">
          <div className="pp-desk__brand">
            <PortalMark size={32} />
            <span>
              <span className="pp-desk__name">
                {store?.name ?? user.restaurantName ?? "Your kitchen"}
              </span>
              <span className="pp-desk__role">Kitchen desk</span>
            </span>
          </div>
          <div className="pp-desk__actions">
            <button type="button" className="pp-btn" onClick={onViewStorefront}>
              View the board
            </button>
            <span className="pp-whoami">
              <Icon name="user" size={16} aria-hidden="true" />
              {user.name.split(" ")[0]}
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

      <div className="pp-tabs">
        <div className="pp-shell">
          <div
            className="pp-tabs__list"
            role="tablist"
            aria-label="Kitchen desk sections"
            onKeyDown={onTabKey}
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[t.id] = el;
                }}
                type="button"
                className="pp-tab"
                role="tab"
                id={`pp-tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls={`pp-panel-${t.id}`}
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {t.id === "queue" && pendingCount > 0 && (
                  <span className="pp-tab__count">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main
        className="pp-shell pp-desk__main"
        role="tabpanel"
        id={`pp-panel-${tab}`}
        aria-labelledby={`pp-tab-${tab}`}
        tabIndex={0}
      >
        {error && (
          <p className="pp-alert" role="alert">
            <Icon name="alert" size={18} />
            {error}
          </p>
        )}

        {tab === "queue" &&
          (orders ? (
            <QueueTab orders={orders} reload={afterOrderChange} />
          ) : (
            <DeskLoading label="Reading the order book" />
          ))}

        {tab === "dishes" &&
          (store ? (
            <DishesTab store={store} reload={afterMenuChange} />
          ) : (
            <DeskLoading label="Reading your board" />
          ))}

        {tab === "payout" &&
          (finance ? (
            <PayoutTab finance={finance} />
          ) : (
            <DeskLoading label="Counting" />
          ))}

        {tab === "reports" &&
          (reviews ? (
            <ReportsTab reviews={reviews} reload={loadReviews} />
          ) : (
            <DeskLoading label="Pulling the file" />
          ))}
      </main>
    </div>
  );
}
