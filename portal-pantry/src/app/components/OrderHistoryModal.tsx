import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { CURRENCY, PORTAL_TOLL } from "../data";
import { getOrders, type Order, type OrderStatus } from "../api/ordersApi";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Cooking",
  delivered: "Delivered",
  "wrong-dimension": "Wrong dimension",
  lost: "Lost in wormhole · refunded",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderHistoryModal({ onClose }: { onClose: () => void }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState(false);
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

  useEffect(() => {
    let mounted = true;
    getOrders()
      .then((list) => {
        if (mounted) setOrders(list);
      })
      .catch(() => {
        if (mounted) setError(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="pp-backdrop" onClick={onClose}>
      <div
        className="pp-modal pp-orders"
        role="dialog"
        aria-modal="true"
        aria-label="Order history"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          className="pp-iconbtn pp-close"
          onClick={onClose}
          aria-label="Close order history"
        >
          <Icon name="close" size={18} />
        </button>

        <div className="pp-orders-body">
          <h2 className="pp-checkout-title">Order history</h2>
          <p className="pp-orders-sub">
            Every portal we've opened for you — across all timelines.
          </p>

          {error && (
            <p className="pp-login-error" role="alert">
              The archive is refusing visitors right now. Try again later.
            </p>
          )}

          {!error && !orders && (
            <p className="pp-orders-loading">
              <span className="pp-spin pp-spin-green" aria-hidden="true" />
              Fetching orders from the archive…
            </p>
          )}

          {orders && (
            <ul className="pp-order-list">
              {orders.map((order) => (
                <li className="pp-order" key={order.id}>
                  <div className="pp-order-head">
                    <span className="pp-order-id">Order {order.id}</span>
                    <span className={`pp-status pp-status-${order.status}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                  </div>
                  <p className="pp-order-meta">
                    {formatDate(order.placedAt)} · {order.dimension}
                  </p>
                  <ul className="pp-order-items">
                    {order.items.map((item, i) => (
                      <li key={`${order.id}-${i}`}>
                        <span className="pp-order-item-name">
                          {item.qty}× {item.name}
                        </span>
                        <span className="pp-order-item-price">
                          {item.price * item.qty}
                          {CURRENCY}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="pp-order-total">
                    <span>
                      Total (incl. {PORTAL_TOLL}
                      {CURRENCY} toll)
                    </span>
                    <span>
                      {order.total}
                      {CURRENCY}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
