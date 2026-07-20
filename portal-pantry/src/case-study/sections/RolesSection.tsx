import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { roles, type RolePanel } from "../../data/portalPantry";
import { SectionHead } from "../components/SectionHead";
import { shotUrl, SHOT_HEIGHT, SHOT_WIDTH } from "../shots";

/**
 * SWITCH ACCOUNT — the two roles behind a CUSTOMER ⇄ OWNER switcher.
 * Flipping portal-wipes between real screenshots + feature lists.
 */
export function RolesSection() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<RolePanel["id"]>("customer");
  const index = roles.panels.findIndex((p) => p.id === active);
  const panel = roles.panels[index];

  return (
    <div className="cs-shell">
      <SectionHead label={roles.label} sub={roles.sub} id="roles-title" />

      <div className="cs-switch" role="group" aria-label="Switch account role">
        <motion.span
          className="cs-switch-thumb"
          aria-hidden="true"
          animate={{ x: `${index * 100}%` }}
          transition={
            reduce
              ? { duration: 0.01 }
              : { type: "spring", stiffness: 420, damping: 34 }
          }
        />
        {roles.panels.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={p.id === active}
            onClick={() => setActive(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ position: "relative" }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={panel.id}
            className="cs-role-panel"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.985, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.985, y: -8 }}
            transition={
              reduce
                ? { duration: 0.1 }
                : { type: "spring", stiffness: 260, damping: 28 }
            }
          >
            <div>
              <h3 className="cs-role-headline">{panel.headline}</h3>
              <ul className="cs-role-features">
                {panel.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <p className="cs-role-note">{panel.note}</p>
            </div>
            <div className="cs-role-shots">
              {panel.shots.map((shot) => (
                <figure key={shot.key} className="cs-role-shot" style={{ margin: 0 }}>
                  <img
                    src={shotUrl(shot.key)}
                    alt={shot.alt}
                    width={SHOT_WIDTH}
                    height={SHOT_HEIGHT}
                    loading="lazy"
                    decoding="async"
                  />
                </figure>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
        {!reduce && (
          <AnimatePresence>
            <motion.span
              key={`role-wipe-${panel.id}`}
              aria-hidden="true"
              className="cs-grid-wipe"
              initial={{ scale: 0, opacity: 0.45 }}
              animate={{ scale: 30, opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.2, 0.75, 0.3, 1] }}
            />
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
