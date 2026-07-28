/**
 * The portal ellipse — the app's one signature shape.
 *
 * Deliberately a single primitive with several appearances rather than several
 * effects: it is the loading indicator, the empty-state placeholder, and (once
 * the menu screen lands) the shared element the restaurant→menu transition
 * travels through. One idea, reused, so it reads as a language and not as
 * decoration sprinkled about.
 *
 * The ring is a hand-inked path, not `border-radius: 50%`. It animates with
 * `transform`/`opacity` only, and `prefers-reduced-motion` stops it dead
 * without removing it — a static open portal is still the right picture.
 */

/**
 * `closed`   nothing is being moved — paper and ink, no green.
 * `charging` a request is in flight — the arc sweeps.
 * `open`     something is actually going through — this is the green one.
 *
 * The state names are the rationing rule made literal: green only appears when
 * the portal is open, and the portal is only open when something transports.
 */
export type PortalState = "closed" | "charging" | "open";

interface PortalProps {
  size?: number;
  state?: PortalState;
  /** Announced to assistive tech when the portal is standing in for a status. */
  label?: string;
  /** Play the one-shot opening animation. Reserved for the payoff moment. */
  animateIn?: boolean;
  className?: string;
}

export function Portal({
  size = 96,
  state = "closed",
  label,
  animateIn = false,
  className,
}: PortalProps) {
  const cls = [
    "pp-portal",
    `is-${state}`,
    animateIn ? "pp-portal--enter" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={cls} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        role={label ? "img" : "presentation"}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        focusable="false"
      >
        {/* Mouth. Flat fill, unsteady outline. */}
        <path
          className="pp-portal__mouth"
          d="M50 8.4C72.6 7.8 92.4 27.8 91.6 50.6 92.2 72.8 71.8 92.6 49.4 91.8 27.4 92.4 7.6 72.2 8.4 49.8 7.8 27.6 27.8 7.8 50 8.4Z"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {/* Inner lip — gives the ring depth without a gradient or a glow. */}
        <path
          className="pp-portal__lip"
          d="M50 22.6C64.8 22.2 77.8 35.4 77.4 50.2 77.8 64.8 64.4 77.8 49.7 77.4 35.2 77.8 22.2 64.6 22.6 50 22.2 35.2 35.4 22.2 50 22.6Z"
          fill="none"
          strokeWidth="1.4"
          strokeLinejoin="round"
          opacity="0.5"
        />
        {/* The charge arc. Sweeps once per cycle while a request is in flight. */}
        <circle
          className="pp-portal__arc"
          cx="50"
          cy="50"
          r="37"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          pathLength="100"
        />
      </svg>
    </span>
  );
}
