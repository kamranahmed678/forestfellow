/**
 * ForestFellow logo.
 * Mark: a rounded "orbital" badge — a scan sweep over layered terrain contours
 * with an orbiting satellite dot, in the brand cyan→violet gradient.
 */
export function LogoMark({ size = 28, id = "ff" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#12B5C9" />
          <stop offset="1" stopColor="#6D5EF6" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="31" height="31" rx="9" fill={`url(#${id}-g)`} />
      {/* layered terrain contours */}
      <path
        d="M5 22c3.4-3.6 6-3.6 8 0 2.2 3.4 5.6 3.4 9.5-1"
        stroke="#0a0e1c"
        strokeOpacity="0.85"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M6 26c3-2.6 5.4-2.6 7.4 0 2 2.4 5 2.4 8.6-.6"
        stroke="#0a0e1c"
        strokeOpacity="0.45"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* orbiting satellite dot */}
      <circle cx="23.5" cy="9" r="2.4" fill="#fff" />
      <circle cx="23.5" cy="9" r="5" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.3" fill="none" />
    </svg>
  );
}

export default function Logo({ size = 28 }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <LogoMark size={size} />
      <span
        className="font-display"
        style={{ fontWeight: 700, letterSpacing: "-0.02em", fontSize: size * 0.64 }}
      >
        Forest<span style={{ color: "var(--muted)" }}>Fellow</span>
      </span>
    </span>
  );
}
