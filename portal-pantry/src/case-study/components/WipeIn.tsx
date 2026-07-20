import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

const VIEWPORT = { once: true, margin: "-14% 0px -14% 0px" } as const;

/**
 * Section entrance: content rises and fades in while a portal ring expands
 * outward — transform/opacity only, so it stays on the compositor.
 * `flavor="app"` uses a springy ease (app-like surfaces); `flavor="tech"`
 * is crisp (receipt, tracker). Reduced motion → plain fade.
 */
export function WipeIn({
  children,
  flavor = "app",
}: {
  children: ReactNode;
  flavor?: "app" | "tech";
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={VIEWPORT}
        transition={{ duration: 0.25 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <motion.span
        aria-hidden="true"
        className="cs-wipe-ring"
        initial={{ scale: 0, opacity: 0.55 }}
        whileInView={{ scale: 26, opacity: 0 }}
        viewport={VIEWPORT}
        transition={{ duration: 1.0, ease: [0.2, 0.75, 0.3, 1] }}
      />
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VIEWPORT}
        transition={
          flavor === "app"
            ? { type: "spring", stiffness: 190, damping: 26, mass: 0.9 }
            : { duration: 0.5, ease: [0.25, 0.8, 0.3, 1] }
        }
      >
        {children}
      </motion.div>
    </div>
  );
}
