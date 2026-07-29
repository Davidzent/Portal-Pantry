import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Icon } from "./Icon";
import { Portal } from "./Portal";
import { CURRENCY } from "../data";
import type { PortalOrigin } from "./RestaurantModal";

interface CheckoutModalProps {
  total: number;
  docket: string;
  dimension: string;
  origin: PortalOrigin | null;
  onClose: () => void;
  onFinish: () => void;
  onViewOrders?: () => void;
}

/* The transit log. Deadpan, over-specific, and every line is something a
   freight operator would plausibly record. */
const STEPS = [
  "Manifest lodged with the kitchen",
  "Contents cooked in three timelines, best one retained",
  "Portal warming — do not taunt the portal",
  "Courier accepted the run",
  "Cleared for transit",
];

const STEP_MS = 900;

function clockTime(): string {
  return new Date().toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Placing an order, and the confirmation.
 *
 * The payoff screen, so it takes the whole viewport and arrives through the
 * same portal reveal the menu uses — the order is going through a portal, so
 * the transition is literal rather than decorative. This is also where green is
 * most earned: it confirms, and it transacts.
 */
export default function CheckoutModal({
  total,
  docket,
  dimension,
  origin,
  onClose,
  onFinish,
  onViewOrders,
}: CheckoutModalProps) {
  const [step, setStep] = useState(0);
  const [stamps, setStamps] = useState<string[]>([]);
  const doneRef = useRef<HTMLButtonElement>(null);
  const done = step >= STEPS.length;

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
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

  /* Each step stamps itself as it clears. The log is the animation budget for
     this screen; nothing else on it moves. */
  useEffect(() => {
    if (step >= STEPS.length) return;
    const t = window.setTimeout(() => {
      setStamps((prev) => [...prev, clockTime()]);
      setStep((s) => s + 1);
    }, STEP_MS);
    return () => window.clearTimeout(t);
  }, [step]);

  /* Move focus onto the confirmation once there is something to act on. */
  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  const originStyle = origin
    ? ({ "--pp-ox": `${origin.x}px`, "--pp-oy": `${origin.y}px` } as CSSProperties)
    : undefined;

  return (
    <div className="pp-sheet-layer" style={originStyle}>
      <span className="pp-flare" aria-hidden="true" />

      <div
        className="pp-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={done ? "Order confirmed" : "Placing your order"}
      >
        <div className="pp-sheet__inner pp-sheet__inner--full">
          <div className="pp-transit">
            {done ? (
              <>
                <Portal size={104} state="open" animateIn label="Portal open" />
                <h2 className="pp-transit__title">Portal open</h2>
                <p className="pp-transit__sub">
                  {total}
                  {CURRENCY} cleared. Arrival in roughly twenty minutes, your
                  local causality. The courier has your dimension and, barring
                  incident, only yours.
                </p>

                <p className="pp-docket">
                  <span>Docket</span>
                  {docket}
                </p>

                <p className="pp-fine">
                  Delivering to <strong>{dimension}</strong>. Keep the docket
                  number — it is the only thing the couriers recognise.
                </p>

                <div className="pp-transit__actions">
                  <button
                    ref={doneRef}
                    type="button"
                    className="pp-btn pp-btn--go"
                    onClick={onFinish}
                  >
                    Done
                  </button>
                  {onViewOrders && (
                    <button type="button" className="pp-btn" onClick={onViewOrders}>
                      Track this shipment
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <Portal size={104} state="charging" label="Opening the portal" />
                <h2 className="pp-transit__title">Opening the portal</h2>

                <ol className="pp-log" aria-label="Transit log">
                  {STEPS.map((label, i) => (
                    <li
                      key={label}
                      className={
                        i < step ? "is-done" : i === step ? "is-current" : undefined
                      }
                    >
                      <span className="pp-log__dot" aria-hidden="true">
                        {i < step ? <Icon name="check" size={13} /> : null}
                      </span>
                      <span>{label}</span>
                      <span className="pp-log__at">{stamps[i] ?? "—"}</span>
                    </li>
                  ))}
                </ol>

                <p className="pp-fine">
                  Do not close this window. It will make no difference, but do
                  not.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
