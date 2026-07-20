import { useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { tracker } from "../../data/portalPantry";
import { SectionHead } from "../components/SectionHead";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

/** Index (in `tracker.stops`) after which the alternate-route card renders. */
const DETOUR_AFTER = 1;

/**
 * TRACK YOUR ORDER — the request lifecycle as a delivery tracker.
 * A dot travels the route as you scroll (GSAP MotionPath, scrubbed);
 * each stop lights up as the dot arrives. Reduced motion: everything
 * rendered lit, no dot.
 */
export function TrackerSection() {
  const reduce = useReducedMotion();
  const railRef = useRef<SVGSVGElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const progressRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const [rebuild, setRebuild] = useState(0);

  useLayoutEffect(() => {
    const list = listRef.current;
    const rail = railRef.current;
    const path = pathRef.current;
    const progress = progressRef.current;
    const dot = dotRef.current;
    if (!list || !rail || !path || !progress || !dot) return;

    const stops = Array.from(
      list.querySelectorAll<HTMLLIElement>("li[data-stop]"),
    );

    // Route geometry: one waypoint per stop, with a gentle side-to-side drift.
    const railWidth = rail.clientWidth || 64;
    const points = stops.map((el, i) => ({
      x: railWidth / 2 + (i % 2 === 0 ? -8 : 8),
      y: el.offsetTop + 16,
    }));
    const height = list.scrollHeight;
    rail.setAttribute("width", String(railWidth));
    rail.setAttribute("height", String(height));
    rail.setAttribute("viewBox", `0 0 ${railWidth} ${height}`);

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i += 1) {
      const prev = points[i - 1];
      const next = points[i];
      const midY = (prev.y + next.y) / 2;
      d += ` C ${prev.x} ${midY} ${next.x} ${midY} ${next.x} ${next.y}`;
    }
    path.setAttribute("d", d);
    progress.setAttribute("d", d);

    if (reduce) {
      stops.forEach((el) => {
        el.dataset.active = "true";
      });
      gsap.set(dot, { attr: { cx: points.at(-1)!.x, cy: points.at(-1)!.y } });
      return;
    }

    const length = path.getTotalLength();
    const ctx = gsap.context(() => {
      gsap.set(progress, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(progress, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: list,
          start: "top 62%",
          end: "bottom 62%",
          scrub: 0.5,
        },
      });
      gsap.to(dot, {
        motionPath: { path, alignOrigin: [0.5, 0.5] },
        ease: "none",
        scrollTrigger: {
          trigger: list,
          start: "top 62%",
          end: "bottom 62%",
          scrub: 0.5,
        },
      });
      stops.forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top 64%",
          onEnter: () => {
            el.dataset.active = "true";
          },
          onLeaveBack: () => {
            el.dataset.active = "false";
          },
        });
      });
    }, list);

    const ro = new ResizeObserver(() => {
      setRebuild((n) => n + 1);
      ScrollTrigger.refresh();
    });
    ro.observe(list);

    return () => {
      ro.disconnect();
      ctx.revert();
    };
  }, [reduce, rebuild]);

  return (
    <div className="cs-shell">
      <SectionHead label={tracker.label} sub={tracker.sub} id="tracker-title" />

      <div className="cs-tracker">
        <div className="cs-tracker-rail" aria-hidden="true">
          <svg ref={railRef}>
            <path ref={pathRef} className="cs-track-path" />
            <path ref={progressRef} className="cs-track-progress" />
            <circle ref={dotRef} className="cs-track-dot" r="6" cx="-20" cy="-20" />
          </svg>
        </div>

        <ol className="cs-stops" ref={listRef}>
          {tracker.stops.map((stop, i) => (
            <StopAndMaybeDetour key={stop.id} index={i} />
          ))}
        </ol>
      </div>
    </div>
  );
}

function StopAndMaybeDetour({ index }: { index: number }) {
  const stop = tracker.stops[index];
  return (
    <>
      <li className="cs-stop" data-stop data-active="false">
        <p className="cs-stop-status">
          {stop.status}
          <span className="cs-stop-place">{stop.place}</span>
        </p>
        <p className="cs-stop-note">{stop.note}</p>
      </li>
      {index === DETOUR_AFTER && (
        <li className="cs-detour" aria-label="Alternate route">
          <span className="cs-detour-badge">{tracker.detour.badge}</span>
          <strong>{tracker.detour.status}</strong>
          <p>{tracker.detour.note}</p>
        </li>
      )}
    </>
  );
}
