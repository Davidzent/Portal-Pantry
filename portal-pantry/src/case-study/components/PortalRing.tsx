import { motion, useReducedMotion } from "motion/react";

/**
 * The case-study logo: a portal ring that irises open around the wordmark.
 * Three concentric arcs draw themselves in, then idle in a slow rotation.
 * Reduced motion: rendered fully open, no idle spin.
 */
export function PortalRing({ size = 116 }: { size?: number }) {
  const reduce = useReducedMotion();

  const arcs = [
    { r: 46, width: 5, opacity: 1, delay: 0.1, dur: 0.9 },
    { r: 34, width: 4, opacity: 0.75, delay: 0.35, dur: 0.8 },
    { r: 22, width: 3.2, opacity: 0.5, delay: 0.55, dur: 0.7 },
  ];

  return (
    <motion.svg
      className="cs-ring"
      width={size}
      height={size}
      viewBox="0 0 104 104"
      role="img"
      aria-label="Portal Pantry logo: a green portal ring"
      initial={reduce ? undefined : { scale: 0.6, opacity: 0 }}
      animate={reduce ? undefined : { scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 210, damping: 20 }}
    >
      <defs>
        <radialGradient id="cs-ring-glow" cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor="hsl(152 96% 62% / 0)" />
          <stop offset="82%" stopColor="hsl(152 96% 62% / 0.28)" />
          <stop offset="100%" stopColor="hsl(152 96% 62% / 0)" />
        </radialGradient>
      </defs>

      <circle cx="52" cy="52" r="50" fill="url(#cs-ring-glow)" />

      <g className={reduce ? undefined : "cs-ring-spin"}>
        {arcs.map((arc) => (
          <motion.circle
            key={arc.r}
            cx="52"
            cy="52"
            r={arc.r}
            fill="none"
            stroke="hsl(var(--accent-h) 96% 62%)"
            strokeWidth={arc.width}
            strokeLinecap="round"
            strokeOpacity={arc.opacity}
            strokeDasharray="1"
            /* draw the arc open like an iris */
            initial={reduce ? { pathLength: 0.86 } : { pathLength: 0 }}
            animate={{ pathLength: 0.86 }}
            transition={{ delay: arc.delay, duration: arc.dur, ease: [0.3, 0.9, 0.3, 1] }}
            style={{ rotate: `${arc.r * 5.2}deg`, transformOrigin: "52px 52px" }}
          />
        ))}
      </g>

      <motion.circle
        cx="52"
        cy="52"
        r="4.5"
        fill="hsl(var(--accent-h) 96% 70%)"
        initial={reduce ? undefined : { scale: 0 }}
        animate={reduce ? undefined : { scale: 1 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 380, damping: 16 }}
        style={{ transformOrigin: "52px 52px" }}
      />
    </motion.svg>
  );
}
