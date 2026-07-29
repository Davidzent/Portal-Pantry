import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Icon } from "./Icon";
import { Stars } from "./Stars";
import { CURRENCY, type MenuItem, type Restaurant } from "../data";
import { addReview, getRestaurantReviews, type Review } from "../api/storeApi";
import { ApiError, type User } from "../api/authApi";
import { imageUrl } from "../images";
import type { CartEntry } from "../PantryApp";

/** Where on screen the portal opened from — the centre of the clicked card. */
export interface PortalOrigin {
  x: number;
  y: number;
}

interface RestaurantModalProps {
  restaurant: Restaurant;
  cart: CartEntry[];
  canOrder: boolean;
  user: User | null;
  origin: PortalOrigin | null;
  onAdd: (restaurant: Restaurant, item: MenuItem) => void;
  onChangeQty: (key: string, delta: number) => void;
  onClose: () => void;
  onOpenCart: () => void;
  onReviewAdded: () => void;
}

function ReviewForm({
  restaurantId,
  onSubmitted,
}: {
  restaurantId: string;
  onSubmitted: () => Promise<void>;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!rating || !body.trim()) {
      setError("A rating and a few words are required. The form is the form.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await addReview(restaurantId, { rating, body: body.trim() });
      await onSubmitted();
      setRating(0);
      setBody("");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "The filing did not go through. Nothing was recorded. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pp-review-form">
      <div className="pp-stars-pick" role="group" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`pp-star-btn${(hover || rating) >= n ? " is-on" : ""}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            aria-pressed={rating === n}
            disabled={busy}
          >
            <Icon name="star" size={22} />
          </button>
        ))}
      </div>
      <textarea
        className="pp-review-input"
        placeholder="What arrived, what condition it was in, and whether it was still the same dish on delivery."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        disabled={busy}
        aria-label="Your account of the delivery"
      />
      {error && (
        <p className="pp-alert" role="alert">
          <Icon name="alert" size={18} />
          {error}
        </p>
      )}
      <div className="pp-review-form__actions">
        <button type="button" className="pp-btn" onClick={submit} disabled={busy}>
          {busy ? "Filing…" : "File it"}
        </button>
        <span className="pp-fine">
          Filed reports are public and cannot be withdrawn.
        </span>
      </div>
    </div>
  );
}

export default function RestaurantModal({
  restaurant,
  cart,
  canOrder,
  user,
  origin,
  onAdd,
  onChangeQty,
  onClose,
  onOpenCart,
  onReviewAdded,
}: RestaurantModalProps) {
  const backRef = useRef<HTMLButtonElement>(null);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [zoom, setZoom] = useState<MenuItem | null>(null);
  const [closing, setClosing] = useState(false);

  /* Kept current in an effect, never assigned during render, so the close
     timer does not restart every time the parent hands us a new callback. */
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  /* Closing runs the portal shut and *then* unmounts, so the exit animation is
     visible. `setClosing` is the only trigger; the timer below owns the
     unmount. Under reduced motion the animation is 1ms, so the 300ms wait is
     the only thing the user perceives — short enough not to feel stuck. */
  useEffect(() => {
    if (!closing) return;
    const t = window.setTimeout(onCloseRef.current, 300);
    return () => window.clearTimeout(t);
  }, [closing]);

  /* Escape closes the photo first, then the sheet. Re-registering on `zoom`
     keeps the handler honest without reaching for a ref during render. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (zoom) setZoom(null);
      else setClosing(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [zoom]);

  useEffect(() => {
    backRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const loadReviews = useCallback(async () => {
    try {
      setReviews(await getRestaurantReviews(restaurant.id));
    } catch {
      setReviews([]);
    }
  }, [restaurant.id]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const qtyOf = (item: MenuItem) =>
    cart.find((e) => e.key === `${restaurant.id}:${item.id}`)?.qty ?? 0;

  const inCartHere = cart
    .filter((e) => e.key.startsWith(`${restaurant.id}:`))
    .reduce((n, e) => n + e.qty, 0);

  const bannerUrl = imageUrl(restaurant.image);
  const zoomUrl = zoom ? imageUrl(zoom.image) : undefined;
  const listed = restaurant.items;

  /* Geometry, not style: the point the portal opens from. */
  const originStyle = origin
    ? ({ "--pp-ox": `${origin.x}px`, "--pp-oy": `${origin.y}px` } as CSSProperties)
    : undefined;

  return (
    <div className="pp-sheet-layer" style={originStyle}>
      {!closing && <span className="pp-flare" aria-hidden="true" />}

      <div
        className={`pp-sheet${closing ? " is-closing" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${restaurant.name} — menu`}
      >
        <div className="pp-sheet__inner">
          <div className="pp-sheet__bar">
            <div className="pp-shell">
              <button
                ref={backRef}
                type="button"
                className="pp-btn pp-btn--quiet"
                onClick={() => setClosing(true)}
              >
                <Icon name="chevron-down" size={16} className="pp-rot90" />
                Back to the board
              </button>
              <span className="pp-code">{restaurant.dimension}</span>
            </div>
          </div>

          <div className="pp-shell pp-sheet__body">
            <header className="pp-kitchen">
              {bannerUrl ? (
                <img
                  className="pp-kitchen__art"
                  src={bannerUrl}
                  alt=""
                  decoding="async"
                />
              ) : (
                <div className="pp-kitchen__art-blank">
                  <Icon name="utensils" size={40} />
                </div>
              )}
              <div className="pp-kitchen__text">
                <div className="pp-kitchen__tags">
                  <span className="pp-tag">{restaurant.dimension}</span>
                  {restaurant.promoted && (
                    <span className="pp-tag pp-tag--note">Paid placement</span>
                  )}
                </div>
                <h2 className="pp-kitchen__name">{restaurant.name}</h2>
                <p className="pp-kitchen__tagline">{restaurant.tagline}</p>
                <p className="pp-kitchen__meta">
                  <span>
                    <Icon name="star" size={14} />
                    {restaurant.rating > 0
                      ? `${restaurant.rating.toFixed(1)} rated`
                      : "Unrated"}
                  </span>
                  <span>
                    <Icon name="clock" size={14} />
                    {restaurant.time}
                  </span>
                  <span className={restaurant.fee === 0 ? "pp-is-free" : undefined}>
                    {restaurant.fee === 0
                      ? "No toll"
                      : `${restaurant.fee}${CURRENCY} toll`}
                  </span>
                </p>
              </div>
            </header>

            <section className="pp-section">
              <div className="pp-section__head">
                <h3>Available for transit</h3>
                <span className="pp-code">
                  {listed.length} item{listed.length === 1 ? "" : "s"} declared
                </span>
              </div>

              {listed.length === 0 ? (
                <div className="pp-state">
                  <p className="pp-state__title">Between shipments</p>
                  <p className="pp-state__body">
                    This kitchen has nothing cleared for transit right now. Its
                    licence is current; its shelves are not.
                  </p>
                </div>
              ) : (
                <ul className="pp-items">
                  {listed.map((item) => {
                    const qty = qtyOf(item);
                    const tileUrl = imageUrl(item.image);
                    return (
                      <li className="pp-item" key={item.id}>
                        {tileUrl ? (
                          <button
                            type="button"
                            className="pp-item__thumb"
                            onClick={() => setZoom(item)}
                            aria-label={`Enlarge the photo of ${item.name}`}
                          >
                            <img src={tileUrl} alt="" loading="lazy" />
                          </button>
                        ) : (
                          <span className="pp-item__thumb" aria-hidden="true">
                            <Icon name="utensils" size={22} />
                          </span>
                        )}

                        <span className="pp-item__info">
                          <span className="pp-item__name">{item.name}</span>
                          <span className="pp-item__desc">{item.desc}</span>
                          {item.prepMinutes ? (
                            <span className="pp-item__prep">
                              <Icon name="clock" size={12} />~{item.prepMinutes} min
                              prep
                            </span>
                          ) : null}
                        </span>

                        <span className="pp-item__buy">
                          <span className="pp-item__price">
                            {item.price}
                            {CURRENCY}
                          </span>
                          {canOrder &&
                            (qty === 0 ? (
                              <button
                                type="button"
                                className="pp-btn"
                                onClick={() => onAdd(restaurant, item)}
                                aria-label={`Add ${item.name} to the manifest`}
                              >
                                <Icon name="plus" size={14} />
                                Add
                              </button>
                            ) : (
                              <span className="pp-stepper">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onChangeQty(`${restaurant.id}:${item.id}`, -1)
                                  }
                                  aria-label={
                                    qty === 1
                                      ? `Remove ${item.name} from the manifest`
                                      : `One fewer ${item.name}`
                                  }
                                >
                                  <Icon
                                    name={qty === 1 ? "trash" : "minus"}
                                    size={14}
                                  />
                                </button>
                                <span aria-live="polite">{qty}</span>
                                <button
                                  type="button"
                                  onClick={() => onAdd(restaurant, item)}
                                  aria-label={`One more ${item.name}`}
                                >
                                  <Icon name="plus" size={14} />
                                </button>
                              </span>
                            ))}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              <p className="pp-note pp-section__note">
                <Icon name="alert" size={16} />
                Allergen information is accurate in the dimension of origin only.
                Dishes may arrive having been a different dish for part of the
                journey.
              </p>

              {!canOrder && (
                <p className="pp-note pp-section__note">
                  <Icon name="alert" size={16} />
                  You are signed in as a kitchen. Carriers may not order freight
                  from themselves.
                </p>
              )}
            </section>

            <section className="pp-section">
              <div className="pp-section__head">
                <h3>Filed reports</h3>
                <span className="pp-code">
                  {reviews ? `${reviews.length} on record` : "Retrieving…"}
                </span>
              </div>

              {user?.role === "customer" && (
                <ReviewForm
                  restaurantId={restaurant.id}
                  onSubmitted={async () => {
                    await loadReviews();
                    onReviewAdded();
                  }}
                />
              )}

              {reviews && reviews.length > 0 && (
                <ul className="pp-reviews pp-section__note">
                  {reviews.map((r) => (
                    <li className="pp-review" key={r.id}>
                      <div className="pp-review__head">
                        <span className="pp-review__author">
                          <span className="pp-review__avatar" aria-hidden="true">
                            <Icon name="user" size={15} />
                          </span>
                          {r.author}
                        </span>
                        <Stars rating={r.rating} />
                      </div>
                      <p className="pp-review__body">{r.body}</p>
                      {r.reply && (
                        <div className="pp-review__reply">
                          <span className="pp-review__reply-label">
                            {restaurant.name} responded
                          </span>
                          <p>{r.reply}</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {/* One grey line, not two stacked. Whether the list is empty and
                  whether you may file are separate facts, but the reader only
                  needs whichever one is actually blocking them. */}
              {reviews && (reviews.length === 0 || !user) && (
                <p className="pp-fine pp-section__note">
                  {reviews.length === 0
                    ? "Nothing on record. Either it is fine, or nobody came back."
                    : "Only account holders who have taken delivery may file a report."}
                  {!user && reviews.length === 0
                    ? " Sign in to be the first."
                    : null}
                </p>
              )}
            </section>
          </div>

          {canOrder && inCartHere > 0 && (
            <div className="pp-sheet__foot">
              <div className="pp-shell pp-sheet__foot-inner">
                <span className="pp-sheet__foot-count">
                  <strong>{inCartHere}</strong> item
                  {inCartHere === 1 ? "" : "s"} from this kitchen on your manifest
                </span>
                <button type="button" className="pp-btn pp-btn--go" onClick={onOpenCart}>
                  <Icon name="cart" size={16} />
                  Review the manifest
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {zoom && zoomUrl && (
        <div
          className="pp-backdrop pp-backdrop--center"
          onClick={() => setZoom(null)}
        >
          <div
            className="pp-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={zoom.name}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="pp-iconbtn pp-close"
              onClick={() => setZoom(null)}
              aria-label="Close the photo"
            >
              <Icon name="close" size={18} />
            </button>
            <img src={zoomUrl} alt={zoom.name} />
            <div className="pp-lightbox__body">
              <div className="pp-lightbox__head">
                <h3>{zoom.name}</h3>
                <span className="pp-item__price">
                  {zoom.price}
                  {CURRENCY}
                </span>
              </div>
              <p className="pp-item__desc">{zoom.desc}</p>
              {zoom.prepMinutes ? (
                <span className="pp-item__prep">
                  <Icon name="clock" size={12} />~{zoom.prepMinutes} min prep
                </span>
              ) : null}
              {canOrder && (
                <button
                  type="button"
                  className="pp-btn pp-btn--block"
                  onClick={() => {
                    onAdd(restaurant, zoom);
                    setZoom(null);
                  }}
                >
                  <Icon name="plus" size={15} />
                  Add · {zoom.price}
                  {CURRENCY}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
