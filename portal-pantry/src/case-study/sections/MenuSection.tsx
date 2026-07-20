import { useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { dimensionChips, menu, type MenuDish } from "../../data/portalPantry";
import { SectionHead } from "../components/SectionHead";
import { shotUrl, SHOT_HEIGHT, SHOT_WIDTH } from "../shots";

/**
 * MENU — features as a photo menu. The dimension chips are a working replica
 * of the app's real filter: picking one re-themes the section (accent hue)
 * and re-deals the cards with a portal wipe + FLIP reshuffle.
 */
export function MenuSection() {
  const reduce = useReducedMotion();
  const [chipId, setChipId] = useState("all");
  const chip = dimensionChips.find((c) => c.id === chipId) ?? dimensionChips[0];

  const ordered = useMemo(() => {
    const dishes = [...menu.dishes];
    if (chip.id === "all") return dishes;
    // Reshuffle, never hide: the chip's home dishes rise to the top.
    return dishes.sort(
      (a, b) =>
        Number(b.dimension === chip.label) - Number(a.dimension === chip.label),
    );
  }, [chip]);

  return (
    <div className="cs-shell" style={{ ["--accent-h" as string]: chip.hue }}>
      <SectionHead label={menu.label} sub={menu.sub} id="menu-title" />

      <div className="cs-chips" role="group" aria-label="Re-theme by dimension">
        {dimensionChips.map((c) => (
          <button
            key={c.id}
            type="button"
            className="cs-chip"
            aria-pressed={c.id === chipId}
            onClick={() => setChipId(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <p className="cs-chips-hint">{menu.chipsHint}</p>

      <LayoutGroup>
        <ul className="cs-menu-grid" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          <AnimatePresence>
            {!reduce && (
              <motion.span
                key={`wipe-${chip.id}`}
                aria-hidden="true"
                className="cs-grid-wipe"
                initial={{ scale: 0, opacity: 0.5 }}
                animate={{ scale: 30, opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.2, 0.75, 0.3, 1] }}
              />
            )}
          </AnimatePresence>
          {ordered.map((dish) => (
            <DishCard key={dish.id} dish={dish} highlighted={dish.dimension === chip.label} />
          ))}
        </ul>
      </LayoutGroup>
    </div>
  );
}

function DishCard({ dish, highlighted }: { dish: MenuDish; highlighted: boolean }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const detailId = `dish-detail-${dish.id}`;

  return (
    <motion.li
      layout={reduce ? false : true}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="cs-dish"
      data-open={open}
      data-highlight={highlighted}
    >
      <div className="cs-dish-photo">
        <img
          src={shotUrl(dish.shot)}
          alt={dish.shotAlt}
          width={SHOT_WIDTH}
          height={SHOT_HEIGHT}
          loading="lazy"
          decoding="async"
        />
        <span className="cs-dish-stat">{dish.stat}</span>
      </div>
      <div className="cs-dish-body">
        <h3 className="cs-dish-name">
          {dish.name} <em>— {dish.flourish}</em>
        </h3>
        <p className="cs-dish-line">{dish.line}</p>
        <button
          type="button"
          className="cs-dish-toggle"
          aria-expanded={open}
          aria-controls={detailId}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Less" : "Technical detail"}
        </button>
        <motion.div
          id={detailId}
          className="cs-dish-detail"
          initial={false}
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
          transition={
            reduce
              ? { duration: 0.01 }
              : { type: "spring", stiffness: 320, damping: 34 }
          }
          style={{ pointerEvents: open ? undefined : "none" }}
          aria-hidden={!open}
        >
          <p>{dish.detail}</p>
        </motion.div>
      </div>
    </motion.li>
  );
}
