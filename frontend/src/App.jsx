import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Logo, { LogoMark } from "./components/Logo";
import Background from "./components/Background";
import Icon from "./components/Icons";
import Reveal from "./components/Reveal";
import HeroVisual from "./components/HeroVisual";
import SegmentDemo from "./components/SegmentDemo";
import CompareGrowth from "./components/CompareGrowth";

const CLASSES = [
  ["Forest land", "var(--lc-forest)", "tree", "Dense tree cover & jungle", false],
  ["Agriculture", "var(--lc-agri)", "wheat", "Cropland & cultivated fields", false],
  ["Rangeland", "var(--lc-range)", "sprout", "Grass, scrub & pasture", false],
  ["Water", "var(--lc-water)", "droplet", "Rivers, lakes & coastline", false],
  ["Urban land", "var(--lc-urban)", "building", "Buildings & infrastructure", false],
  ["Barren land", "var(--lc-barren)", "mountain", "Bare soil, sand & rock", true],
  ["Unknown", "var(--lc-unknown)", "cloud", "Clouds & unclassified", false],
];

const STEPS = [
  ["upload", "Upload a tile", "Drop any satellite or aerial image — your own, or one of the samples."],
  ["scan", "The U-Net reads it", "A 7-class segmentation model classifies every pixel in about a second, on CPU."],
  ["map", "Read the map", "Drag to reveal the land-cover map and see the exact per-class breakdown."],
];

function CountUp({ value, suffix = "", decimals = 0 }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting && !done.current) {
          done.current = true;
          if (reduced) return setN(value);
          let raf, start;
          const step = (t) => {
            if (!start) start = t;
            const k = Math.min((t - start) / 900, 1);
            setN(value * (1 - Math.pow(1 - k, 3)));
            if (k < 1) raf = requestAnimationFrame(step);
          };
          raf = requestAnimationFrame(step);
        }
      });
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return <span ref={ref}>{n.toFixed(decimals)}{suffix}</span>;
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className={`nav ${scrolled ? "scrolled" : ""}`}>
      <div className="container nav-inner">
        <a href="#top" style={{ textDecoration: "none", color: "var(--ink)" }}><Logo /></a>
        <nav className="nav-links">
          <a href="#demo" className="hide-sm">Demo</a>
          <a href="#compare" className="hide-sm">Compare</a>
          <a href="#how" className="hide-sm">How it works</a>
          <a href="#classes" className="hide-sm">Classes</a>
          <a href="https://github.com" className="btn btn-ghost" style={{ padding: "8px 14px" }}>
            <Icon name="github" size={16} /> Source
          </a>
        </nav>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section id="top" className="container hero">
      <div className="hero-grid">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <span className="pill"><span className="dot-cy" /> U-Net · 7-class · real-time inference</span>
          <h1>See the land <span className="gradient-text">from orbit.</span></h1>
          <p className="hero-sub">
            ForestFellow turns any satellite image into a colour-coded land-cover map with a
            deep-learning model — then measures how forest cover changes over time.
          </p>
          <div className="flex flex-wrap gap-3" style={{ marginTop: 28 }}>
            <a href="#demo" className="btn btn-primary">Try the live demo <Icon name="arrowRight" size={17} /></a>
            <a href="#compare" className="btn btn-ghost"><Icon name="compare" size={17} /> Before / after</a>
          </div>
          <div className="flex flex-wrap gap-2.5" style={{ marginTop: 30 }}>
            <span className="pill">PyTorch U-Net</span>
            <span className="pill">~1s on CPU</span>
            <span className="pill">No sign-in</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}>
          <HeroVisual />
        </motion.div>
      </div>
    </section>
  );
}

function SectionHead({ eyebrow, title, sub, center }) {
  return (
    <div className={`section-head ${center ? "center" : ""}`}>
      <span className="eyebrow gradient-text">{eyebrow}</span>
      <h2 className="section-title">{title}</h2>
      {sub && <p className="section-sub">{sub}</p>}
    </div>
  );
}

export default function App() {
  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      <Background />
      <Nav />
      <Hero />

      {/* stats band */}
      <section className="container" style={{ paddingBottom: 20 }}>
        <Reveal>
          <div className="stats">
            <div className="stat"><b className="gradient-text"><CountUp value={7} /></b><small>Land-cover classes</small></div>
            <div className="stat"><b className="gradient-text"><CountUp value={512} suffix="px" /></b><small>Model input</small></div>
            <div className="stat"><b className="gradient-text">~<CountUp value={1} decimals={0} />s</b><small>Per image (CPU)</small></div>
            <div className="stat"><b className="gradient-text">$<CountUp value={0} /></b><small>To run it</small></div>
          </div>
        </Reveal>
      </section>

      {/* live demo */}
      <section id="demo" className="section">
        <div className="container">
          <Reveal><SectionHead eyebrow="Live demo" title="Segment a satellite image" sub="Upload a tile or pick a sample. Drag the handle to wipe between the photo and the AI map." /></Reveal>
          <Reveal delay={0.05}><SegmentDemo /></Reveal>
        </div>
      </section>

      <div className="container"><hr className="divider-soft" /></div>

      {/* before/after compare */}
      <section id="compare" className="section">
        <div className="container">
          <Reveal><SectionHead eyebrow="Forest growth" title="Compare before & after" sub="Two satellite images of the same area, two dates. The model segments both and measures how forest cover changed." /></Reveal>
          <Reveal delay={0.05}><CompareGrowth /></Reveal>
        </div>
      </section>

      <div className="container"><hr className="divider-soft" /></div>

      {/* how it works */}
      <section id="how" className="section">
        <div className="container">
          <Reveal><SectionHead center eyebrow="How it works" title="Three steps, about a second" /></Reveal>
          <div className="steps">
            {STEPS.map(([ic, h, p], i) => (
              <Reveal key={h} delay={i * 0.08}>
                <div className="step">
                  <div className="step-ic"><Icon name={ic} size={22} /></div>
                  <h4>{h}</h4>
                  <p>{p}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* classes */}
      <section id="classes" className="section">
        <div className="container">
          <Reveal><SectionHead eyebrow="What the model sees" title="Seven land-cover classes" sub="Every pixel is assigned to one of these categories, each with its own colour on the map." /></Reveal>
          <div className="class-grid">
            {CLASSES.map(([n, c, ic, d, light], i) => (
              <Reveal key={n} delay={i * 0.05}>
                <div className="class-card">
                  <span className="class-ic" style={{ background: c, color: light ? "var(--ink)" : "#fff" }}>
                    <Icon name={ic} size={20} />
                  </span>
                  <span><b>{n}</b><small>{d}</small></span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="container"><hr className="divider-soft" /></div>

      {/* about / tech */}
      <section className="section">
        <div className="container" style={{ maxWidth: "64ch" }}>
          <Reveal>
            <SectionHead
              eyebrow="Under the hood"
              title="A U-Net trained to read terrain"
              sub="ForestFellow uses a U-Net convolutional network — an encoder that compresses the image and a decoder that rebuilds it as a pixel-perfect land-cover map. It runs live here: a FastAPI service holds the PyTorch model, and this React front-end calls it on every upload."
            />
            <div className="badges">
              {[["layers", "PyTorch"], ["scan", "U-Net"], ["bolt", "FastAPI"], ["gauge", "React"], ["map", "7-class softmax"]].map(([ic, b]) => (
                <span className="badge-chip" key={b} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Icon name={ic} size={15} style={{ color: "var(--brand)" }} /> {b}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* footer */}
      <footer className="footer">
        <div className="container" style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoMark size={22} />
            <span>ForestFellow · Land-Cover Segmentation</span>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <a href="#demo">Demo</a>
            <a href="#compare">Compare</a>
            <a href="https://github.com">Source ↗</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
