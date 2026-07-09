import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Drag-to-reveal comparison between the original satellite image and the
 * AI land-cover mask. The mask is clipped from the right by `pos`%.
 */
export default function RevealCompare({ original, mask, analyzing }) {
  const [pos, setPos] = useState(55);
  const boxRef = useRef(null);
  const dragging = useRef(false);

  const moveTo = useCallback((clientX) => {
    const el = boxRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pct = ((clientX - r.left) / r.width) * 100;
    setPos(Math.max(3, Math.min(97, pct)));
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      moveTo((e.touches ? e.touches[0] : e).clientX);
      e.preventDefault();
    };
    const onUp = () => (dragging.current = false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [moveTo]);

  const start = (e) => {
    dragging.current = true;
    moveTo((e.touches ? e.touches[0] : e).clientX);
  };

  return (
    <div className="reveal" ref={boxRef} onMouseDown={start} onTouchStart={start}>
      <img className="base" src={original} alt="Satellite input" />
      <img
        className="mask"
        src={mask}
        alt="Land-cover map"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />
      <span className="reveal-tag" style={{ left: 12 }}>Satellite</span>
      <span className="reveal-tag" style={{ right: 12 }}>Land cover</span>
      {analyzing && <div className="scanline" />}
      <div
        className="reveal-handle"
        style={{ left: `${pos}%` }}
        role="slider"
        aria-label="Reveal land-cover map"
        aria-valuenow={Math.round(pos)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setPos((p) => Math.max(3, p - 4));
          if (e.key === "ArrowRight") setPos((p) => Math.min(97, p + 4));
        }}
      />
    </div>
  );
}
