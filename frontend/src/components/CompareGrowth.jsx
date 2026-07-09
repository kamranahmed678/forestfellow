import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { segmentImage, sampleAsFile } from "../api";

/**
 * Before / After comparison — the old ForestFellow "View Forest Growth" feature,
 * rebuilt. Segments two satellite images of the same area and reports how the
 * forest-cover percentage changed between them.
 */
function forestPct(result) {
  const f = result.breakdown.find((b) => b.name === "Forest land");
  return f ? f.pct : 0;
}

function Slot({ side, state, onPick }) {
  const inputRef = useRef(null);
  return (
    <div className="compare-slot">
      {state?.mask ? (
        <img src={state.mask} alt={`${side} land cover`} />
      ) : state?.preview ? (
        <img src={state.preview} alt={`${side} input`} />
      ) : (
        <div className="drop" onClick={() => inputRef.current?.click()}>
          <span className="font-display" style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
            {side} image
          </span>
          <span>click to upload a satellite tile</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
      />
      <div className="compare-tag">
        <span>{side}</span>
        <span>{state?.mask ? `${forestPct(state.result).toFixed(1)}% forest` : state?.preview ? "ready" : "empty"}</span>
      </div>
    </div>
  );
}

export default function CompareGrowth() {
  const [before, setBefore] = useState(null); // {file, preview, mask, result}
  const [after, setAfter] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | ready | loading | done | error
  const [error, setError] = useState("");

  const setSide = (side, file) => {
    const slot = { file, preview: URL.createObjectURL(file), mask: null, result: null };
    if (side === "Before") setBefore(slot);
    else setAfter(slot);
    setStatus("ready");
  };

  const loadExample = async () => {
    try {
      const [b, a] = await Promise.all([
        sampleAsFile("/samples/compare_before.jpg", "before"),
        sampleAsFile("/samples/compare_after.jpg", "after"),
      ]);
      setBefore({ file: b, preview: "/samples/compare_before.jpg", mask: null, result: null });
      setAfter({ file: a, preview: "/samples/compare_after.jpg", mask: null, result: null });
      setStatus("ready");
    } catch {
      setError("Couldn't load the example pair.");
      setStatus("error");
    }
  };

  const compare = async () => {
    if (!before?.file || !after?.file) return;
    setStatus("loading");
    setError("");
    try {
      const [rb, ra] = await Promise.all([segmentImage(before.file), segmentImage(after.file)]);
      setBefore((s) => ({ ...s, mask: rb.mask_png, result: rb }));
      setAfter((s) => ({ ...s, mask: ra.mask_png, result: ra }));
      setStatus("done");
    } catch (e) {
      setError(e.message || "Comparison failed.");
      setStatus("error");
    }
  };

  const reset = () => {
    setBefore(null);
    setAfter(null);
    setStatus("idle");
    setError("");
  };

  const delta =
    status === "done" && before?.result && after?.result
      ? forestPct(after.result) - forestPct(before.result)
      : null;

  let verdict = null;
  if (delta !== null) {
    const fb = forestPct(before.result), fa = forestPct(after.result);
    if (delta > 0.5)
      verdict = { icon: "🌱", color: "var(--lc-forest)", head: "Forest cover grew", sub: `${fb.toFixed(1)}% → ${fa.toFixed(1)}%`, big: `+${delta.toFixed(1)}` };
    else if (delta < -0.5)
      verdict = { icon: "🪓", color: "#ff7a6b", head: "Forest cover shrank", sub: `${fb.toFixed(1)}% → ${fa.toFixed(1)}%`, big: `${delta.toFixed(1)}` };
    else
      verdict = { icon: "➖", color: "var(--muted)", head: "Roughly unchanged", sub: `${fb.toFixed(1)}% → ${fa.toFixed(1)}%`, big: `${delta.toFixed(1)}` };
  }

  return (
    <div>
      <div className="compare-grid">
        <Slot side="Before" state={before} onPick={(f) => setSide("Before", f)} />
        <Slot side="After" state={after} onPick={(f) => setSide("After", f)} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          className="btn btn-primary"
          onClick={compare}
          disabled={!before?.file || !after?.file || status === "loading"}
          style={{ opacity: !before?.file || !after?.file || status === "loading" ? 0.5 : 1 }}
        >
          {status === "loading" ? "Analyzing both…" : "Compare forest cover"}
        </button>
        <button className="btn btn-ghost" onClick={loadExample}>Load example pair</button>
        {status !== "idle" && <button className="btn btn-ghost" onClick={reset}>Reset</button>}
        {error && <span style={{ color: "#ff7a6b", fontSize: 13 }}>{error}</span>}
      </div>

      {verdict && (
        <motion.div className="verdict" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <span style={{ fontSize: 30 }}>{verdict.icon}</span>
          <div style={{ flex: 1 }}>
            <div className="font-display" style={{ fontSize: 18, fontWeight: 600 }}>{verdict.head}</div>
            <div className="font-mono" style={{ color: "var(--muted)", fontSize: 13 }}>Forest cover {verdict.sub}</div>
          </div>
          <div className="big" style={{ color: verdict.color }}>
            {verdict.big}<span style={{ fontSize: 16 }}> pts</span>
          </div>
        </motion.div>
      )}
      {status === "done" && (
        <p className="font-mono mt-3" style={{ color: "var(--muted)", fontSize: 12 }}>
          Panels show each date’s land-cover map · forest-cover change measured from the model’s per-class breakdown.
        </p>
      )}
    </div>
  );
}
