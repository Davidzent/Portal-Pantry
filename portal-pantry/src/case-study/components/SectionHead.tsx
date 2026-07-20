import type { SectionLabel } from "../../data/portalPantry";

/**
 * Every section leads with a plain-language eyebrow ("MENU — FEATURES")
 * plus the in-fiction heading, so the metaphor never hides information.
 */
export function SectionHead({
  label,
  sub,
  id,
}: {
  label: SectionLabel;
  sub?: string;
  id: string;
}) {
  return (
    <header className="cs-head">
      <p className="cs-eyebrow">{label.eyebrow}</p>
      <h2 className="cs-h2" id={id} tabIndex={-1}>
        {label.title}
      </h2>
      {sub && <p className="cs-sub">{sub}</p>}
    </header>
  );
}
