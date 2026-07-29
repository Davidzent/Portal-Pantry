import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { Portal } from "./Portal";
import { CURRENCY } from "../data";
import { getOrders, type Order, type OrderStatus } from "../api/ordersApi";

/* Status is a fact about freight, so it is stated as one. Only `delivered`
   gets the colour — a completed transit is the thing green is for. */
const STATUS: Record<OrderStatus, { label: string; tone: string }> = {
  pending: { label: "In transit", tone: "pp-tag--note" },
  delivered: { label: "Delivered", tone: "pp-tag--go" },
  "wrong-dimension": { label: "Misrouted", tone: "pp-tag--bad" },
  lost: { label: "Lost · refunded", tone: "pp-tag--bad" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderHistoryModal({ onClose }: { onClose: () => void }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    getOrders().then(
      (list) => {
        if (mounted) setOrders(list);
      },
      () => {
        if (mounted) setError(true);
      },
    );
    return () => {
      mounted = false;
    };
  }, []);

  const retry = useCallback(() => {
    setError(false);
    setOrders(null);
    getOrders().then(
      (list) => setOrders(list),
      () => setError(true),
    );
  }, []);

  return (
    <div className="pp-backdrop pp-backdrop--center" onClick={onClose}>
      <div
        className="pp-modal pp-record"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pp-record-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          className="pp-iconbtn pp-close"
          onClick={onClose}
          aria-label="Close the shipment record"
        >
          <Icon name="close" size={18} />
        </button>

        <div className="pp-record__head">
          <h2 className="pp-record__title" id="pp-record-title">
            Shipment record
          </h2>
          <p className="pp-record__sub">
            Every portal opened on this account, in this dimension, on file
            indefinitely.
          </p>
        </div>

        {error ? (
          <div className="pp-state pp-record__state">
            <Portal size={72} state="closed" />
            <p className="pp-state__title">The archive is shut</p>
            <p className="pp-state__body">
              We could not reach the record. Your orders are unaffected — the
              filing cabinet is simply not answering.
            </p>
            <button type="button" className="pp-btn" onClick={retry}>
              Ask the archive again
            </button>
          </div>
        ) : !orders ? (
          <div className="pp-state pp-record__state">
            <Portal size={72} state="charging" label="Loading your orders" />
            <p className="pp-state__title">Retrieving</p>
            <p className="pp-state__body">Pulling your file from the archive.</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="pp-state pp-record__state">
            <Portal size={72} state="closed" />
            <p className="pp-state__title">Nothing on file</p>
            <p className="pp-state__body">
              No portal has been opened on this account yet. The board is the
              place to start one.
            </p>
          </div>
        ) : (
          <ul className="pp-record__list">
            {orders.map((order) => {
              const status = STATUS[order.status];
              return (
                <li className="pp-order" key={order.id}>
                  <div className="pp-order__head">
                    <span className="pp-order__ident">
                      <span className="pp-order__id">{order.id}</span>
                      <span className="pp-order__meta">
                        {formatDate(order.placedAt)} · {order.dimension}
                      </span>
                    </span>
                    <span className={`pp-tag ${status.tone}`}>{status.label}</span>
                  </div>

                  <ul className="pp-order__items">
                    {order.items.map((item, i) => (
                      <li key={`${order.id}-${i}`}>
                        <span>
                          {item.qty}× {item.name}
                        </span>
                        <span>
                          {item.price * item.qty}
                          {CURRENCY}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <p className="pp-order__total">
                    <span>Total, toll included</span>
                    <span
                      className={
                        order.status === "delivered" ? "pp-is-delivered" : undefined
                      }
                    >
                      {order.total}
                      {CURRENCY}
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
