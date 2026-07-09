import { useEffect, useRef } from "react";
import { Icon } from "./Icon";
import { CURRENCY, PORTAL_TOLL } from "../data";
import type { CartEntry } from "../PantryApp";

interface CartDrawerProps {
  cart: CartEntry[];
  subtotal: number;
  onChangeQty: (key: string, delta: number) => void;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({
  cart,
  subtotal,
  onChangeQty,
  onClose,
  onCheckout,
}: CartDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const toll = cart.length > 0 ? PORTAL_TOLL : 0;
  const total = subtotal + toll;

  return (
    <div className="pp-backdrop pp-backdrop-right" onClick={onClose}>
      <aside
        className="pp-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pp-drawer-head">
          <h2>Your haul</h2>
          <button
            ref={closeRef}
            type="button"
            className="pp-iconbtn"
            onClick={onClose}
            aria-label="Close cart"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="pp-cart-empty">
            <span className="pp-empty-emoji">
              <Icon name="cart" size={40} />
            </span>
            <p>
              Nothing here yet. The multiverse is <em>full</em> of snacks —
              go grab some.
            </p>
          </div>
        ) : (
          <>
            <ul className="pp-cart-list">
              {cart.map((entry) => (
                <li className="pp-cart-item" key={entry.key}>
                  <span className="pp-cart-emoji" aria-hidden="true">
                    <Icon name="utensils" size={18} />
                  </span>
                  <span className="pp-cart-info">
                    <span className="pp-cart-name">{entry.name}</span>
                    <span className="pp-cart-rest">{entry.restaurant}</span>
                  </span>
                  <span className="pp-cart-controls">
                    <span className="pp-stepper">
                      <button
                        type="button"
                        onClick={() => onChangeQty(entry.key, -1)}
                        aria-label={`Remove one ${entry.name}`}
                      >
                        <Icon
                          name={entry.qty === 1 ? "trash" : "minus"}
                          size={13}
                        />
                      </button>
                      <span>{entry.qty}</span>
                      <button
                        type="button"
                        onClick={() => onChangeQty(entry.key, 1)}
                        aria-label={`Add one more ${entry.name}`}
                      >
                        <Icon name="plus" size={13} />
                      </button>
                    </span>
                    <span className="pp-cart-price">
                      {entry.price * entry.qty}
                      {CURRENCY}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="pp-cart-totals">
              <p>
                <span>Subtotal</span>
                <span>
                  {subtotal}
                  {CURRENCY}
                </span>
              </p>
              <p>
                <span>Wormhole toll</span>
                <span>
                  {toll}
                  {CURRENCY}
                </span>
              </p>
              <p>
                <span>Reality tax (0.0%)</span>
                <span>0{CURRENCY}</span>
              </p>
              <p className="pp-cart-total">
                <span>Total</span>
                <span>
                  {total}
                  {CURRENCY}
                </span>
              </p>
            </div>

            <button
              type="button"
              className="pp-btn pp-btn-primary pp-btn-block"
              onClick={onCheckout}
            >
              Open portal &amp; pay {total}
              {CURRENCY}
            </button>
            <p className="pp-cart-note">
              Delivery in ~20 min, your local causality permitting.
            </p>
          </>
        )}
      </aside>
    </div>
  );
}
