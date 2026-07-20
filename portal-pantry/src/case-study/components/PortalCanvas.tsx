import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

interface Mote {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  hue: number;
  alpha: number;
}

/**
 * Subtle portal swirl behind the hero: orbiting motes drawn as short arc
 * streaks with additive blending. Pauses when offscreen or the tab is
 * hidden; capped DPR; skipped entirely under prefers-reduced-motion
 * (a static gradient renders instead).
 */
export function PortalCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let width = 0;
    let height = 0;
    let motes: Mote[] = [];
    let raf = 0;
    let running = false;
    let visible = true;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = width < 700 ? 60 : 110;
      motes = Array.from({ length: count }, () => ({
        angle: Math.random() * Math.PI * 2,
        radius: 60 + Math.random() ** 1.6 * Math.min(width, 900) * 0.42,
        speed: 0.0016 + Math.random() * 0.0028,
        size: 0.7 + Math.random() * 1.8,
        hue: 145 + Math.random() * 50,
        alpha: 0.05 + Math.random() * 0.4,
      }));
    };

    const center = () => ({ x: width * 0.72, y: height * 0.34 });

    const frame = () => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      const { x: cx, y: cy } = center();
      for (const m of motes) {
        m.angle += m.speed * (140 / m.radius) * 3.2;
        const x = cx + Math.cos(m.angle) * m.radius * 1.28;
        const y = cy + Math.sin(m.angle) * m.radius * 0.55;
        const streak = 0.10 + (60 / m.radius) * 0.25;
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${m.hue}, 95%, 62%, ${m.alpha})`;
        ctx.lineWidth = m.size;
        ctx.lineCap = "round";
        ctx.ellipse(cx, cy, m.radius * 1.28, m.radius * 0.55, 0, m.angle, m.angle + streak);
        ctx.stroke();
        void x;
        void y;
      }
      raf = requestAnimationFrame(frame);
    };

    const setRunning = (next: boolean) => {
      if (next === running) return;
      running = next;
      if (running) raf = requestAnimationFrame(frame);
      else cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        setRunning(visible && !document.hidden);
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const onVis = () => setRunning(visible && !document.hidden);
    document.addEventListener("visibilitychange", onVis);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    return () => {
      setRunning(false);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reduce]);

  if (reduce) return <div className="cs-hero-fallback" aria-hidden="true" />;
  return <canvas ref={canvasRef} className="cs-hero-canvas" aria-hidden="true" />;
}
