import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { CURRENCY } from "../data";

interface CheckoutModalProps {
  total: number;
  onClose: () => void;
  onFinish: () => void;
  onViewOrders?: () => void;
}

const STEPS = [
  "Order beamed to the kitchen",
  "Chef is cooking it in three timelines at once",
  "Warming up the portal (do not taunt the portal)",
  "Courier on standby at the wormhole",
  "Order placed in your timeline!",
];

export default function CheckoutModal({
  total,
  onClose,
  onFinish,
  onViewOrders,
}: CheckoutModalProps) {
  const [step, setStep] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const done = step >= STEPS.length - 1;

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

  useEffect(() => {
    if (step >= STEPS.length - 1) return;
    const t = window.setTimeout(() => setStep(step + 1), 1350);
    return () => window.clearTimeout(t);
  }, [step]);

  return (
    <div className="pp-backdrop" onClick={onClose}>
      <div
        className="pp-modal pp-checkout"
        role="dialog"
        aria-modal="true"
        aria-label="Order status"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          className="pp-iconbtn pp-close"
          onClick={onClose}
          aria-label="Close order status"
        >
          <Icon name="close" size={18} />
        </button>

        <div className="pp-checkout-body">
          {done ? (
            <>
              <span className="pp-delivered-emoji" aria-hidden="true">
                <Icon name="check" size={46} />
              </span>
              <h2 className="pp-checkout-title">Order placed!</h2>
              <p className="pp-checkout-sub">
                {total}
                {CURRENCY} well spent. The kitchen is on it — the portal
                opens the moment your food is ready.
              </p>
              <div className="pp-checkout-actions">
                <button
                  type="button"
                  className="pp-btn pp-btn-primary"
                  onClick={onFinish}
                >
                  Sweet, thanks!
                </button>
                {onViewOrders && (
                  <button
                    type="button"
                    className="pp-btn-link"
                    onClick={onViewOrders}
                  >
                    View order history
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="pp-portal" aria-hidden="true">
                <span className="pp-portal-emoji">
                  <Icon name="utensils" size={40} />
                </span>
              </div>
              <h2 className="pp-checkout-title">Opening portal…</h2>
              <ol className="pp-steps" aria-label="Order progress">
                {STEPS.map((label, i) => (
                  <li
                    key={label}
                    className={
                      i < step ? "done" : i === step ? "current" : undefined
                    }
                  >
                    <span className="pp-step-dot" aria-hidden="true">
                      {i < step ? <Icon name="check" size={12} /> : null}
                    </span>
                    {label}
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
