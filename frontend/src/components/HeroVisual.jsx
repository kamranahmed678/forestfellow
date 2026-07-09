import { useEffect, useRef, useState } from "react";

/**
 * Auto-playing hero visual: continuously sweeps a reveal line across a
 * satellite tile to expose its land-cover map, cycling scenes at the trough
 * (when the map is retracted, so the swap is invisible). Pure eye-candy that
 * shows the product doing its thing without any interaction.
 */
const SCENES = [
  { base: "/samples/farmland.jpg", mask: "/hero/farmland_mask.png", label: "River & forest" },
  { base: "/samples/delta.jpg", mask: "/hero/delta_mask.png", label: "Farmland valley" },
];

export default function HeroVisual() {
  const [idx, setIdx] = useState(0);
  const [pos, setPos] = useState(60);
  const raf = useRef();
  const t0 = useRef(null);
  const trough = useRef(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPos(58);
      return;
    }
    const period = 7200;
    const loop = (t) => {
      if (t0.current === null) t0.current = t;
      const cycles = (t - t0.current) / period;
      const s = (Math.sin(cycles * Math.PI * 2 - Math.PI / 2) + 1) / 2; // 0..1
      const val = 6 + s * 88;
      setPos(val);
      if (val < 10 && !trough.current) {
        trough.current = true;
        setIdx((i) => (i + 1) % SCENES.length);
      }
      if (val > 20) trough.current = false;
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const scene = SCENES[idx];

  return (
    <div className="hero-visual">
      <img className="base" src={scene.base} alt="Satellite tile" />
      <img
        className="mask"
        src={scene.mask}
        alt="Land-cover map"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />
      <div className="sweep" style={{ left: `${pos}%` }} />
      <span className="vtag" style={{ left: 14 }}>Satellite</span>
      <span className="vtag" style={{ right: 14 }}>Land cover</span>
      <div className="badge-live">
        <span className="live-dot" /> live · {scene.label}
      </div>
    </div>
  );
}
