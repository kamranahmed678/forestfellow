import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { segmentImage, sampleAsFile } from "../api";
import RevealCompare from "./RevealCompare";
import Breakdown from "./Breakdown";

const SAMPLES = [
  { url: "/samples/farmland.jpg", label: "River & forest" },
  { url: "/samples/delta.jpg", label: "Farmland valley" },
];

const LEGEND = [
  ["Forest land", "var(--lc-forest)"],
  ["Agriculture", "var(--lc-agri)"],
  ["Rangeland", "var(--lc-range)"],
  ["Water", "var(--lc-water)"],
  ["Urban land", "var(--lc-urban)"],
  ["Barren land", "var(--lc-barren)"],
  ["Unknown", "var(--lc-unknown)"],
];

export default function SegmentDemo() {
  const [original, setOriginal] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [slow, setSlow] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (status !== "loading") return setSlow(false);
    const t = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(t);
  }, [status]);

  async function run(file) {
    if (original) URL.revokeObjectURL(original);
    setOriginal(URL.createObjectURL(file));
    setResult(null);
    setError("");
    setStatus("loading");
    try {
      const r = await segmentImage(file);
      setResult(r);
      setStatus("done");
    } catch (e) {
      setError(e.message || "Something went wrong.");
      setStatus("error");
    }
  }

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) run(f);
  };
  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) run(f);
  };
  const pickSample = async (s) => {
    try {
      run(await sampleAsFile(s.url, s.label));
    } catch {
      setError("Couldn't load that sample.");
      setStatus("error");
    }
  };
  const reset = () => {
    setStatus("idle");
    setResult(null);
    setError("");
  };

  return (
    <div className="demo-grid">
      {/* left: stage */}
      <div>
        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="panel" style={{ padding: 28 }}
              onDrop={onDrop} onDragOver={(e) => e.preventDefault()}
            >
              <div
                onClick={() => inputRef.current?.click()}
                style={{ border: "1.5px dashed var(--line)", borderRadius: 14, padding: "48px 24px", textAlign: "center", cursor: "pointer" }}
              >
                <div className="font-display" style={{ fontSize: 20, fontWeight: 600 }}>
                  Drop a satellite image
                </div>
                <div style={{ color: "var(--muted)", marginTop: 8, fontSize: 14 }}>
                  or click to browse · JPG / PNG · up to 12 MB
                </div>
              </div>
              <input ref={inputRef} type="file" accept="image/*" onChange={onFile} hidden />
              <div className="mt-6">
                <div className="eyebrow mb-3" style={{ color: "var(--muted)" }}>Or try a sample</div>
                <div className="flex flex-wrap gap-3">
                  {SAMPLES.map((s) => (
                    <button key={s.url} onClick={() => pickSample(s)} className="sample-chip">{s.label}</button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {status === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {original ? (
                <div className="reveal">
                  <img className="base" src={original} alt="input" />
                  <div className="scanline" />
                  <span className="reveal-tag" style={{ left: 12 }}>Analyzing…</span>
                </div>
              ) : (
                <div className="panel" style={{ padding: 60, textAlign: "center" }}>Loading…</div>
              )}
            </motion.div>
          )}

          {status === "done" && result && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }}>
              <RevealCompare original={original} mask={result.mask_png} />
            </motion.div>
          )}

          {status === "error" && (
            <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="panel" style={{ padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 15, marginBottom: 6 }}>Couldn’t segment that image.</div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>{error}</div>
              <button className="sample-chip mt-5" onClick={reset}>Try again</button>
            </motion.div>
          )}
        </AnimatePresence>

        {status === "loading" && slow && (
          <p className="font-mono mt-4 text-center" style={{ color: "var(--muted)", fontSize: 12 }}>
            Waking the model on the free tier — the first run can take ~20s.
          </p>
        )}
        {status === "done" && (
          <div className="mt-4 flex items-center justify-between">
            <span className="font-mono" style={{ color: "var(--muted)", fontSize: 12 }}>Drag the ⇄ handle to compare</span>
            <button className="sample-chip" onClick={reset}>New image</button>
          </div>
        )}
      </div>

      {/* right: breakdown / legend */}
      <div>
        {status === "done" && result ? (
          <Breakdown breakdown={result.breakdown} timeMs={result.time_ms} />
        ) : (
          <div className="panel" style={{ padding: 22 }}>
            <h3 className="font-display" style={{ fontSize: 15, fontWeight: 600 }}>7 land-cover classes</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, margin: "8px 0 16px" }}>The model paints each pixel as one of:</p>
            <div className="flex flex-col gap-2.5">
              {LEGEND.map(([n, c]) => (
                <div key={n} className="flex items-center gap-2.5" style={{ fontSize: 13 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: c, border: "1px solid rgba(255,255,255,0.15)" }} />
                  <span style={{ color: "var(--ink-soft)" }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
