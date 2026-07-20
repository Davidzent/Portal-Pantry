import { motion, useReducedMotion } from "motion/react";
import { storefront } from "../../data/portalPantry";
import { PortalRing } from "../components/PortalRing";
import { PortalCanvas } from "../components/PortalCanvas";

/** STOREFRONT — the hero, laid out like a restaurant header in a delivery app. */
export function Storefront() {
  const reduce = useReducedMotion();
  const words = storefront.label.title.split(" ");

  return (
    <div className="cs-hero">
      <PortalCanvas />
      <div className="cs-shell">
        <p className="cs-eyebrow">{storefront.label.eyebrow}</p>

        <div className="cs-hero-brand">
          <PortalRing />
          <div>
            <h1 className="cs-wordmark" aria-label={storefront.label.title}>
              {words.map((word, w) => (
                <span
                  key={word}
                  aria-hidden="true"
                  style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom" }}
                >
                  <motion.span
                    style={{ display: "inline-block" }}
                    className={w === 1 ? "accent" : undefined}
                    initial={reduce ? undefined : { y: "112%" }}
                    animate={reduce ? undefined : { y: 0 }}
                    transition={{ delay: 0.35 + w * 0.09, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    {word}
                  </motion.span>
                  {w < words.length - 1 ? " " : null}
                </span>
              ))}
            </h1>
            <p className="cs-hero-tag">{storefront.sub}</p>
          </div>
        </div>

        <p className="cs-hero-meta">
          <span className="stars" aria-label={`Rated ${storefront.rating.stars} stars`}>
            ★ {storefront.rating.stars}
          </span>
          <span className="note">{storefront.rating.note}</span>
          <span className="status">{storefront.statusLine}</span>
        </p>

        <ul className="cs-meta-chips">
          {storefront.metaChips.map((chip) => (
            <li key={chip}>{chip}</li>
          ))}
        </ul>

        <p className="cs-hero-blurb">{storefront.blurb}</p>

        <div className="cs-hero-ctas">
          <a className="cs-btn cs-btn-primary" href={storefront.ctas.primary.href}>
            {storefront.ctas.primary.label}
            <small>{storefront.ctas.primary.note}</small>
          </a>
          <a
            className="cs-btn cs-btn-ghost"
            href={storefront.ctas.secondary.href}
            target="_blank"
            rel="noreferrer"
          >
            {storefront.ctas.secondary.label}
            <small>{storefront.ctas.secondary.note}</small>
          </a>
        </div>

        <p className="cs-fineprint">{storefront.finePrint}</p>
      </div>
    </div>
  );
}
