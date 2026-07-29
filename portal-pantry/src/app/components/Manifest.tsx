import { Icon } from "./Icon";
import { Portal } from "./Portal";
import { CURRENCY, PORTAL_TOLL } from "../data";
import type { CartEntry } from "../PantryApp";
import type { PortalOrigin } from "./RestaurantModal";

interface ManifestProps {
  cart: CartEntry[];
  subtotal: number;
  dimension: string;
  onChangeQty: (key: string, delta: number) => void;
  onCheckout: (origin: PortalOrigin) => void;
  /** Stable per-session so the manifest number does not churn on every render. */
  manifestId: string;
  busy?: boolean;
}

/**
 * The shipping manifest — the cart, dressed as the paperwork it is.
 *
 * Shared by the sticky rail (>=1024px) and the drawer (below that), so the two
 * can never drift apart. This is the one place the portal green is allowed to
 * do work: the total, and the button that opens the portal.
 */
export default function Manifest({
  cart,
  subtotal,
  dimension,
  onChangeQty,
  onCheckout,
  manifestId,
  busy = false,
}: ManifestProps) {
  /* Must match what the server charges: subtotal + the flat toll, and nothing
     else. The 8% reality tax is a deduction from the KITCHEN's payout, not a
     charge on the customer — showing it here quoted a total that was never
     taken, so the button promised one number and the receipt showed another. */
  const toll = cart.length > 0 ? PORTAL_TOLL : 0;
  const total = subtotal + toll;
  const empty = cart.length === 0;

  return (
    <div className="pp-manifest">
      <div className="pp-manifest__head">
        <h2 className="pp-manifest__title">Manifest</h2>
        <span className="pp-manifest__id">{manifestId}</span>
      </div>
      <hr className="pp-rule" />

      {empty ? (
        <div className="pp-state pp-state--rail">
          <Portal size={72} state="closed" />
          <p className="pp-state__title">Nothing declared</p>
          <p className="pp-state__body">
            Add something from a kitchen and it gets listed here for customs.
            Undeclared cargo is still delivered, just less politely.
          </p>
        </div>
      ) : (
        <>
          <ul className="pp-manifest__list">
            {cart.map((entry) => (
              <li className="pp-line" key={entry.key}>
                <span className="pp-line__name">{entry.name}</span>
                <span className="pp-line__from">from {entry.restaurant}</span>
                <span className="pp-line__controls">
                  <span className="pp-stepper">
                    <button
                      type="button"
                      onClick={() => onChangeQty(entry.key, -1)}
                      aria-label={
                        entry.qty === 1
                          ? `Remove ${entry.name} from the manifest`
                          : `One fewer ${entry.name}`
                      }
                    >
                      <Icon name={entry.qty === 1 ? "trash" : "minus"} size={14} />
                    </button>
                    <span aria-live="polite">{entry.qty}</span>
                    <button
                      type="button"
                      onClick={() => onChangeQty(entry.key, 1)}
                      aria-label={`One more ${entry.name}`}
                    >
                      <Icon name="plus" size={14} />
                    </button>
                  </span>
                  <span className="pp-line__price">
                    {entry.price * entry.qty}
                    {CURRENCY}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <hr className="pp-rule pp-rule--tear" />

          <div className="pp-ledger">
            <p className="pp-ledger__row">
              <span>Declared value</span>
              <span>
                {subtotal}
                {CURRENCY}
              </span>
            </p>
            <p className="pp-ledger__row">
              <span>Wormhole toll</span>
              <span>
                {toll}
                {CURRENCY}
              </span>
            </p>
          </div>

          <p className="pp-total">
            <span>Total</span>
            <span>
              {total}
              {CURRENCY}
            </span>
          </p>

          <button
            type="button"
            className="pp-btn pp-btn--go pp-btn--block"
            onClick={(e) => {
              /* The checkout portal opens from this button — the control that
                 actually sends the order is where the portal should appear. */
              const r = e.currentTarget.getBoundingClientRect();
              onCheckout({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
            }}
            disabled={busy}
          >
            {busy ? (
              <>
                <Portal size={20} state="charging" />
                Opening portal…
              </>
            ) : (
              <>
                Open portal · {total}
                {CURRENCY}
              </>
            )}
          </button>

          <p className="pp-fine pp-manifest__terms">
            § 4.1 — Arrival within ~20 minutes, your local causality. Cargo is
            insured in this dimension only. Signing means you accept delivery to
            <strong> {dimension}</strong> and to no other version of yourself.
          </p>
        </>
      )}
    </div>
  );
}
