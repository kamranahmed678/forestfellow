// API client for the segmentation backend.
// Dev: Vite proxies /api -> http://localhost:8000 (see vite.config.js).
// Prod (single HF Space): built with VITE_API_BASE="" so it calls /segment on
// the same origin, where FastAPI serves both the site and the API.
// Use ?? (not ||) so an intentional empty-string base is respected.
const BASE = import.meta.env.VITE_API_BASE ?? "/api";

export async function segmentImage(file) {
  const form = new FormData();
  form.append("image", file);

  const res = await fetch(`${BASE}/segment`, { method: "POST", body: form });
  if (!res.ok) {
    let detail = `Server error (${res.status})`;
    try {
      const j = await res.json();
      if (j.detail) detail = j.detail;
    } catch {
      /* keep default */
    }
    throw new Error(detail);
  }
  return res.json();
}

// Load a bundled sample (a URL in /public) as a File so it can be POSTed.
export async function sampleAsFile(url, name) {
  const blob = await (await fetch(url)).blob();
  return new File([blob], name, { type: blob.type || "image/jpeg" });
}
