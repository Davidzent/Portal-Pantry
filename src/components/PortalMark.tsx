/** Swirling green portal — the Portal Pantry brand mark. */
export function PortalMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Portal Pantry logo"
    >
      <circle cx="24" cy="24" r="24" fill="#10200a" />
      <circle
        cx="24"
        cy="24"
        r="17"
        fill="none"
        stroke="#a8f25e"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeDasharray="90 16.8"
        transform="rotate(-50 24 24)"
      />
      <circle
        cx="24"
        cy="24"
        r="11"
        fill="none"
        stroke="#57c433"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="55 14.1"
        transform="rotate(120 24 24)"
      />
      <circle
        cx="24"
        cy="24"
        r="5.5"
        fill="none"
        stroke="#d3ff9e"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeDasharray="26 8.6"
        transform="rotate(260 24 24)"
      />
      <circle cx="24" cy="24" r="1.8" fill="#eaffd0" />
    </svg>
  );
}
