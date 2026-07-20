import { motion, useReducedMotion } from "motion/react";
import { cartBadge } from "../../data/portalPantry";
import { scrollToId } from "../lib/lenis";

const SEGMENTS = cartBadge.sections.length;

function segmentPath(index: number): string {
  const r = 16;
  const c = 20;
  const gapDeg = 14;
  const arc = 360 / SEGMENTS - gapDeg;
  const start = (index * 360) / SEGMENTS - 90 + gapDeg / 2;
  const end = start + arc;
  const rad = (d: number) => (d * Math.PI) / 180;
  const x1 = c + r * Math.cos(rad(start));
  const y1 = c + r * Math.sin(rad(start));
  const x2 = c + r * Math.cos(rad(end));
  const y2 = c + r * Math.sin(rad(end));
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/**
 * The floating order badge: one segment fills per section viewed.
 * The page itself is an order being assembled; at 7/7 it pulses and
 * nudges toward checkout.
 */
export function CartBadge({
  visited,
  lastAdded,
}: {
  visited: ReadonlySet<string>;
  lastAdded: string | null;
}) {
  const reduce = useReducedMotion();
  const count = visited.size;
  const full = count >= SEGMENTS;
  // Derived, not stored: changes whenever a new section is added, which is
  // exactly when the aria-live region should announce.
  const announcement = lastAdded
    ? cartBadge.announce.replace("{section}", lastAdded)
    : "";

  return (
    <>
      <motion.button
        type="button"
        className="cs-cart"
        data-full={full}
        onClick={() => scrollToId("checkout")}
        aria-label={`${cartBadge.label}: ${count} of ${SEGMENTS} sections viewed. ${cartBadge.fullHint}.`}
        initial={reduce ? undefined : { y: 90, opacity: 0 }}
        animate={reduce ? undefined : { y: 0, opacity: 1 }}
        transition={{ delay: 0.9, type: "spring", stiffness: 240, damping: 22 }}
        whileHover={reduce ? undefined : { scale: 1.04 }}
        whileTap={reduce ? undefined : { scale: 0.96 }}
      >
        <span className="cs-cart-pulse" aria-hidden="true" />
        <svg className="cs-cart-ring" viewBox="0 0 40 40" aria-hidden="true">
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <path
              key={i}
              className="seg"
              data-on={i < count}
              d={segmentPath(i)}
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ))}
          <text x="20" y="24" textAnchor="middle">
            {count}
          </text>
        </svg>
        <span className="cs-cart-copy">
          <span className="t">{full ? cartBadge.fullLabel : cartBadge.label}</span>
          <span className="h">
            {full ? cartBadge.fullHint : `${count}/${SEGMENTS} sections`}
          </span>
        </span>
      </motion.button>
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </>
  );
}
