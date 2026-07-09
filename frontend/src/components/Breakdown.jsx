import { motion } from "framer-motion";
import { useEffect, useState } from "react";

function CountUp({ value, suffix = "%", duration = 900 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(value);
      return;
    }
    let raf, start;
    const step = (t) => {
      if (!start) start = t;
      const k = Math.min((t - start) / duration, 1);
      setN(value * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return (
    <span>
      {n.toFixed(1)}
      {suffix}
    </span>
  );
}

export default function Breakdown({ breakdown, timeMs }) {
  const forest = breakdown.find((b) => b.name === "Forest land");

  return (
    <div className="panel p-5 sm:p-6">
      <h3 className="font-display text-sm font-semibold tracking-wide">
        Land-cover breakdown
      </h3>
      <p
        className="font-mono mt-1 mb-5"
        style={{ color: "var(--muted)", fontSize: 11, letterSpacing: "0.06em" }}
      >
        {breakdown.length} CLASSES · CPU {(timeMs / 1000).toFixed(1)}s
      </p>

      <div className="flex flex-col gap-3">
        {breakdown.map((b, i) => (
          <div
            key={b.name}
            className="grid items-center gap-2.5"
            style={{ gridTemplateColumns: "88px 1fr 44px", fontSize: 12.5 }}
          >
            <span className="flex items-center gap-2" style={{ color: "var(--ink-soft)" }}>
              <span
                style={{
                  width: 9, height: 9, borderRadius: 3,
                  background: b.color, boxShadow: `0 0 6px ${b.color}`,
                }}
              />
              {b.name}
            </span>
            <span
              style={{
                height: 7, borderRadius: 4,
                background: "rgba(14,26,19,0.08)", overflow: "hidden",
              }}
            >
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: `${b.pct}%` }}
                transition={{ duration: 1, delay: 0.15 + i * 0.08, ease: [0.3, 0.9, 0.3, 1] }}
                style={{
                  display: "block", height: "100%", borderRadius: 4,
                  background: b.color, boxShadow: `0 0 8px ${b.color}`,
                }}
              />
            </span>
            <span
              className="font-mono text-right"
              style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}
            >
              {b.pct.toFixed(1)}
            </span>
          </div>
        ))}
      </div>

      <div
        className="flex gap-2 mt-5 pt-4"
        style={{ borderTop: "1px solid var(--line)" }}
      >
        {[
          { v: forest ? <CountUp value={forest.pct} /> : "—", l: "Forest" },
          { v: breakdown.length, l: "Classes" },
          { v: `${(timeMs / 1000).toFixed(1)}s`, l: "Inference" },
        ].map((m) => (
          <div key={m.l} className="flex-1 text-center">
            <b className="font-mono gradient-text" style={{ fontSize: 17, display: "block" }}>
              {m.v}
            </b>
            <small
              className="eyebrow"
              style={{ color: "var(--muted)", fontSize: 9.5 }}
            >
              {m.l}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}
