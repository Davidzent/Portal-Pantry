/**
 * The wordmark portal.
 *
 * Flat fills with a hand-inked outline that is deliberately not a true circle —
 * every radius is off by a percent or two. Colour comes from tokens via
 * `currentColor` and CSS custom properties, never from hardcoded hex, so the
 * mark inherits the palette instead of pinning it.
 */
export function PortalMark({
  size = 34,
  title,
}: {
  size?: number;
  title?: string;
}) {
  return (
    <svg
      className="pp-mark"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {/* Outer ring — an ellipse drawn by a slightly unsteady hand. */}
      <path
        d="M24 4.6C34.6 4.2 43.8 13.6 43.4 24.4 43.8 35 34.2 44.2 23.6 43.6 13.2 44 4.4 34.4 4.8 23.8 4.4 13.4 13.6 4.2 24 4.6Z"
        fill="var(--pp-surface-2)"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      {/* The portal itself. The one place green appears in the mark. */}
      <path
        d="M24 12.4C30.6 12.1 36 17.6 35.7 24.2 36 30.7 30.2 36 23.7 35.7 17.4 36 12.2 30.2 12.5 23.9 12.2 17.5 17.6 12.2 24 12.4Z"
        fill="var(--pp-portal)"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Depth: an off-centre inner lip, not a glow. */}
      <path
        d="M25.2 18.6C29 18.4 32 21.4 31.8 25.1"
        fill="none"
        stroke="var(--pp-portal-ink)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}
