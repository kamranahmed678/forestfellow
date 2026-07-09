import { useEffect, useRef } from "react";

/**
 * Ambient topographic-contour backdrop. Draws flowing relief lines (like a
 * terrain / elevation map) once onto a fixed full-screen canvas — thematic for
 * a land-cover product and far less flat than a plain grid. Static after draw,
 * so it costs nothing to keep on screen.
 */
export default function Background() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let w, h, dpr;

    const draw = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const gap = 20;
      const lines = Math.ceil(h / gap) + 6;
      const step = 6; // px between sampled points

      for (let i = 0; i < lines; i++) {
        const baseY = i * gap - 20;
        // terrain envelope — some bands ripple more than others
        const amp = 7 + 20 * (0.5 + 0.5 * Math.sin(i * 0.33 + 0.6));
        // fade the texture toward the very top/bottom of the viewport
        const edge = Math.min(1, Math.min(baseY, h - baseY) / 140);
        const brand = i % 5 === 0;
        ctx.beginPath();
        for (let x = -20; x <= w + 20; x += step) {
          const y =
            baseY +
            amp *
              (Math.sin(x * 0.0055 + i * 0.5) +
                0.5 * Math.sin(x * 0.012 + i * 0.9 + 1.3) +
                0.25 * Math.sin(x * 0.02 + i * 0.3));
          x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = brand
          ? `rgba(11, 163, 127, ${0.07 * Math.max(0, edge)})`
          : `rgba(14, 26, 19, ${0.05 * Math.max(0, edge)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    draw();
    let t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(draw, 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }}
    />
  );
}
