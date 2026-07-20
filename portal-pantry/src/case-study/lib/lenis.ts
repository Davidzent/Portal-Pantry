import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let lenis: Lenis | null = null;

/**
 * Smooth scrolling for the page, driven by the GSAP ticker so ScrollTrigger
 * (the tracker section) and Lenis share one clock. No-op under
 * prefers-reduced-motion — native scrolling remains.
 */
export function initSmoothScroll(): void {
  if (lenis || prefersReducedMotion()) return;
  gsap.registerPlugin(ScrollTrigger);
  lenis = new Lenis({ autoRaf: false });
  if (import.meta.env.DEV) {
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
  }
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
}

/** Scroll to an element id, honoring reduced motion. */
export function scrollToId(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) {
    lenis.scrollTo(el, { offset: -12 });
  } else {
    el.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  }
}
