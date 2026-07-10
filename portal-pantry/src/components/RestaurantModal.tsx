import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Icon } from "./Icon";
import { CURRENCY, type MenuItem, type Restaurant } from "../data";
import { addReview, getRestaurantReviews, type Review } from "../api/storeApi";
import { ApiError, type User } from "../api/authApi";
import { imageUrl } from "../images";
import type { CartEntry } from "../PantryApp";

interface RestaurantModalProps {
  restaurant: Restaurant;
  cart: CartEntry[];
  canOrder: boolean;
  user: User | null;
  onAdd: (restaurant: Restaurant, item: MenuItem) => void;
  onChangeQty: (key: string, delta: number) => void;
  onClose: () => void;
  onOpenCart: () => void;
  onReviewAdded: () => void;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="pp-stars" aria-label={`${rating} out of 5 stars`}>
      {"★★★★★".slice(0, rating)}
      <span className="pp-stars-empty">{"★★★★★".slice(rating)}</span>
    </span>
  );
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
      setError("Pick a rating and write a few words.");
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
      setError(err instanceof ApiError ? err.message : "Couldn't post — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pp-review-form">
      <div className="pp-star-picker" role="radiogroup" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`pp-star-btn${(hover || rating) >= n ? " on" : ""}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            aria-pressed={rating === n}
            disabled={busy}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        className="pp-review-input"
        rows={2}
        placeholder="How was it? (Be honest — it's the multiverse.)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        disabled={busy}
        aria-label="Your review"
      />
      {error && (
        <p className="pp-edit-error" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        className="pp-btn pp-btn-primary pp-btn-sm"
        onClick={submit}
        disabled={busy}
      >
        {busy ? "Posting…" : "Post review"}
      </button>
    </div>
  );
}

export default function RestaurantModal({
  restaurant,
  cart,
  canOrder,
  user,
  onAdd,
  onChangeQty,
  onClose,
  onOpenCart,
  onReviewAdded,
}: RestaurantModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [zoom, setZoom] = useState<MenuItem | null>(null);
  const zoomRef = useRef<MenuItem | null>(null);
  zoomRef.current = zoom;

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (zoomRef.current) setZoom(null);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

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

  return (
    <div className="pp-backdrop" onClick={onClose}>
      <div
        className="pp-modal"
        role="dialog"
        aria-modal="true"
        aria-label={restaurant.name}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          className="pp-iconbtn pp-close"
          onClick={onClose}
          aria-label="Close menu"
        >
          <Icon name="close" size={18} />
        </button>

        <div
          className={`pp-modal-cover${bannerUrl ? " pp-has-img" : ""}`}
          style={{ "--hue": restaurant.hue } as CSSProperties}
        >
          {bannerUrl ? (
            <img className="pp-banner-img" src={bannerUrl} alt={restaurant.name} />
          ) : (
            <span className="pp-modal-emoji">
              <Icon name="utensils" size={60} />
            </span>
          )}
        </div>

        <div className="pp-modal-body">
          <h2 className="pp-modal-title">{restaurant.name}</h2>
          <p className="pp-modal-tagline">{restaurant.tagline}</p>
          <p className="pp-modal-meta">
            <span className="pp-rating">
              <Icon name="star" size={13} />
              {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : "New"}
            </span>
            <span className="pp-meta-item">
              <Icon name="clock" size={13} />
              {restaurant.time}
            </span>
            <span className="pp-meta-item">{restaurant.dimension}</span>
            <span className="pp-meta-item pp-fee">
              {restaurant.fee === 0
                ? "Free portal"
                : `${restaurant.fee}${CURRENCY} toll`}
            </span>
          </p>

          <h3 className="pp-menu-heading">Menu</h3>
          {restaurant.items.length === 0 && (
            <p className="pp-hint">
              This kitchen is restocking across dimensions — check back soon.
            </p>
          )}
          <ul className="pp-menu">
            {restaurant.items.map((item) => {
              const qty = qtyOf(item);
              const tileUrl = imageUrl(item.image);
              return (
                <li className="pp-menu-item" key={item.id}>
                  {tileUrl ? (
                    <button
                      type="button"
                      className="pp-item-tile pp-item-tile-btn"
                      style={{ "--hue": restaurant.hue } as CSSProperties}
                      onClick={() => setZoom(item)}
                      aria-label={`View ${item.name} photo`}
                    >
                      <img
                        className="pp-item-tile-img"
                        src={tileUrl}
                        alt=""
                        loading="lazy"
                      />
                    </button>
                  ) : (
                    <span
                      className="pp-item-tile"
                      style={{ "--hue": restaurant.hue } as CSSProperties}
                      aria-hidden="true"
                    >
                      <Icon name="utensils" size={22} />
                    </span>
                  )}
                  <span className="pp-item-info">
                    <span className="pp-item-name">{item.name}</span>
                    <span className="pp-item-desc">{item.desc}</span>
                    {item.prepMinutes ? (
                      <span className="pp-item-prep">
                        <Icon name="clock" size={12} />~{item.prepMinutes} min prep
                      </span>
                    ) : null}
                  </span>
                  <span className="pp-item-buy">
                    <span className="pp-item-price">
                      {item.price}
                      {CURRENCY}
                    </span>
                    {canOrder &&
                      (qty === 0 ? (
                        <button
                          type="button"
                          className="pp-btn pp-btn-primary pp-btn-sm"
                          onClick={() => onAdd(restaurant, item)}
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
                            aria-label={`Remove one ${item.name}`}
                          >
                            <Icon name="minus" size={14} />
                          </button>
                          <span aria-live="polite">{qty}</span>
                          <button
                            type="button"
                            onClick={() => onAdd(restaurant, item)}
                            aria-label={`Add one more ${item.name}`}
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

          {!canOrder && (
            <p className="pp-owner-note">
              You're signed in as a store owner — ordering is disabled.
            </p>
          )}

          {canOrder && inCartHere > 0 && (
            <button
              type="button"
              className="pp-btn pp-btn-primary pp-btn-block"
              onClick={onOpenCart}
            >
              <Icon name="cart" size={16} />
              View cart · {inCartHere} item{inCartHere === 1 ? "" : "s"} from here
            </button>
          )}

          {reviews && (
            <section className="pp-cust-reviews">
              <h3 className="pp-menu-heading">Reviews</h3>

              {user?.role === "customer" ? (
                <ReviewForm
                  restaurantId={restaurant.id}
                  onSubmitted={async () => {
                    await loadReviews();
                    onReviewAdded();
                  }}
                />
              ) : !user ? (
                <p className="pp-review-signin">
                  Sign in as a customer to leave a review.
                </p>
              ) : null}

              {reviews.length === 0 ? (
                <p className="pp-review-empty">No reviews yet — be the first!</p>
              ) : (
                <ul className="pp-cust-review-list">
                  {reviews.map((r) => (
                    <li className="pp-cust-review" key={r.id}>
                      <div className="pp-cust-review-head">
                        <span className="pp-review-author">
                          <span className="pp-review-avatar" aria-hidden="true">
                            <Icon name="user" size={15} />
                          </span>
                          {r.author}
                        </span>
                        <Stars rating={r.rating} />
                      </div>
                      <p className="pp-cust-review-body">{r.body}</p>
                      {r.reply && (
                        <div className="pp-cust-review-reply">
                          <span className="pp-review-reply-label">
                            {restaurant.name} replied
                          </span>
                          <p>{r.reply}</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </div>

      {zoom && zoomUrl && (
        <div
          className="pp-lightbox-backdrop"
          onClick={(e) => {
            e.stopPropagation();
            setZoom(null);
          }}
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
              aria-label="Close photo"
            >
              <Icon name="close" size={18} />
            </button>
            <img className="pp-lightbox-img" src={zoomUrl} alt={zoom.name} />
            <div className="pp-lightbox-body">
              <div className="pp-lightbox-head">
                <h3>{zoom.name}</h3>
                <span className="pp-item-price">
                  {zoom.price}
                  {CURRENCY}
                </span>
              </div>
              <p className="pp-lightbox-desc">{zoom.desc}</p>
              {zoom.prepMinutes ? (
                <span className="pp-item-prep">
                  <Icon name="clock" size={12} />~{zoom.prepMinutes} min prep
                </span>
              ) : null}
              {canOrder && (
                <button
                  type="button"
                  className="pp-btn pp-btn-primary pp-btn-block"
                  onClick={() => {
                    onAdd(restaurant, zoom);
                    setZoom(null);
                  }}
                >
                  <Icon name="plus" size={15} />
                  Add to cart · {zoom.price}
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
