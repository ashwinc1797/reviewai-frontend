import { useState, useEffect } from "react";

// ── Gemini API helper ──────────────────────────────────────────────────────
// Routes through your backend proxy (/api/gemini) to avoid browser CORS blocks.
// Falls back to a direct call in local development when proxy is not running.

const API_BASE = ""; // empty = same domain as frontend; works after VPS deployment

async function callGemini(apiKey, prompt) {
  // 1. Try backend proxy (production — key stored server-side in .env)
  try {
    const proxyRes = await fetch(API_BASE + "/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.error) throw new Error(data.error);
      return data.text || "";
    }
  } catch (proxyErr) {
    // Proxy not reachable — fall through to direct call below
  }

  // 2. Direct call fallback (local dev only — will fail in browser if CORS blocked)
  if (!apiKey) throw new Error("Proxy unreachable and no API key set. Add your Gemini key in Settings.");
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}


// ── Seed data ─────────────────────────────────────────────────────────────
const SEED_BUSINESSES = [{
  id: "b1",
  name: "SpeedUp Infotech",
  type: "IT Training Institute",
  gmb: "https://search.google.com/local/writereview?placeid=ChIJUcP4Q3YvwjcR5RmZj4cCrEA",
  city: "Pune",
  rating: 4.8,
  totalReviews: 127,
  scansToday: 0,
  scansWeek: 0,
  whatsapp: "919876543210",
}];

const SEED_REVIEWS = [
  { id: "r1", biz: "b1", author: "Rahul D.",  rating: 5, text: "Excellent MERN stack training! The faculty is highly experienced and the curriculum is very industry-relevant. Got placed within 2 months.", date: "2025-05-10", replied: false, aiReply: "" },
  { id: "r2", biz: "b1", author: "Priya M.",  rating: 5, text: "Best IT training institute in Pune. Hands-on projects and real-world exposure made all the difference. Highly recommend SpeedUp!", date: "2025-05-08", replied: true,  aiReply: "Thank you Priya! We're thrilled to hear about your experience. Wishing you all the best in your career!" },
  { id: "r3", biz: "b1", author: "Amit K.",   rating: 4, text: "Good training overall. The React and Node JS modules were very detailed. Would have loved more doubt-solving sessions.", date: "2025-05-06", replied: false, aiReply: "" },
  { id: "r4", biz: "b1", author: "Sneha P.",  rating: 5, text: "SpeedUp Infotech completely transformed my career. The placement support is outstanding and trainers are always available to help.", date: "2025-05-04", replied: false, aiReply: "" },
];

const SEED_FEEDBACK = [
  { id: "f1", rating: 2, issue: "Long waiting time",  details: "Had to wait a long time before the batch started. Communication could be better.", contact: "9823456789",        date: "2025-05-11", resolved: false },
  { id: "f2", rating: 1, issue: "Staff behaviour",    details: "The front desk staff was not very helpful when I had queries about the course.",  contact: "",                   date: "2025-05-09", resolved: true  },
  { id: "f3", rating: 3, issue: "Service quality",    details: "Expected more in-depth coverage of Data Analytics. The module felt rushed.",       contact: "meera.k@gmail.com", date: "2025-05-07", resolved: false },
];

const SCAN_DATA = [
  { day: "Mon", scans: 12 }, { day: "Tue", scans: 19 }, { day: "Wed", scans: 8 },
  { day: "Thu", scans: 24 }, { day: "Fri", scans: 31 }, { day: "Sat", scans: 28 }, { day: "Sun", scans: 14 },
];

const ISSUE_OPTIONS = ["Trainer quality", "Curriculum depth", "Batch timing", "Placement support", "Infrastructure", "Fee / value", "Staff behaviour", "Other"];

// ── SVG Icons ─────────────────────────────────────────────────────────────
const Icon = {
  logo: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
    </svg>
  ),
  overview: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  qr: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/>
      <rect x="3" y="15" width="6" height="6" rx="1"/>
      <path d="M15 15h2v2h-2zM19 15v2M15 19h2M19 19v2M21 17h-2v2"/>
    </svg>
  ),
  inbox: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  lock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  ),
  settings: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  star: (filled) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "#F59E0B" : "none"} stroke={filled ? "#F59E0B" : "#3a3848"} strokeWidth="1.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  copy: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
    </svg>
  ),
  check: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  external: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  send: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  refresh: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
    </svg>
  ),
  warning: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  sparkle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 3l.75 2.25L22 6l-2.25.75L19 9l-.75-2.25L16 6l2.25-.75z"/>
    </svg>
  ),
  phone: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .99h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
    </svg>
  ),
  mail: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  download: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  chevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  whatsapp: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  eye: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  key: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  ),
  building: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
    </svg>
  ),
  shield: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  arrowLeft: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  smile: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>
  ),
  meh: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>
  ),
  heartHandshake: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="m12 13-1-1 2-2-3-3 2-2"/><path d="m14 13 1-1-2-2 3-3-2-2"/>
    </svg>
  ),
  clipboardCheck: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
      <path d="m9 14 2 2 4-4"/>
    </svg>
  ),
  trendUp: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  scanLine: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/>
    </svg>
  ),
  msgSquare: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  flag: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  ),
  google: () => (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ),
};

// ── Design System ─────────────────────────────────────────────────────────
const tokens = {
  bg:        "#080B14",
  surface:   "#0E1220",
  surfaceEl: "#141928",
  border:    "#1E2740",
  borderHov: "#2D3D5E",
  accent:    "#3B7EF6",
  accentLow: "rgba(59,126,246,0.12)",
  accentMid: "rgba(59,126,246,0.22)",
  text:      "#E2E8F5",
  textSub:   "#7A8BAD",
  textMuted: "#3D4F72",
  green:     "#22C55E",
  greenLow:  "rgba(34,197,94,0.1)",
  amber:     "#F59E0B",
  amberLow:  "rgba(245,158,11,0.1)",
  red:       "#EF4444",
  redLow:    "rgba(239,68,68,0.1)",
};

const S = {
  app:      { fontFamily:"'Instrument Sans', 'DM Sans', system-ui, sans-serif", minHeight:"100vh", background:tokens.bg, color:tokens.text },
  sidebar:  { width:224, background:tokens.surface, borderRight:`1px solid ${tokens.border}`, display:"flex", flexDirection:"column", padding:"0", position:"fixed", top:0, left:0, bottom:0, zIndex:100 },
  main:     { marginLeft:224, padding:"36px 40px", minHeight:"100vh" },
  logo:     { padding:"22px 20px 20px", fontSize:15, fontWeight:700, letterSpacing:"-0.2px", color:tokens.text, display:"flex", alignItems:"center", gap:10, borderBottom:`1px solid ${tokens.border}` },
  logoMark: { width:34, height:34, background:"linear-gradient(135deg,#3B7EF6,#60A5FA)", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", flexShrink:0 },
  navSection:{ padding:"8px 12px 4px", fontSize:10, fontWeight:700, color:tokens.textMuted, textTransform:"uppercase", letterSpacing:"1.2px", marginTop:8 },
  navItem:  (a) => ({ display:"flex", alignItems:"center", gap:10, padding:"9px 14px", margin:"1px 8px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:a?600:400, color:a?tokens.text:tokens.textSub, background:a?tokens.accentLow:"transparent", transition:"all 0.12s", userSelect:"none" }),
  card:     { background:tokens.surface, border:`1px solid ${tokens.border}`, borderRadius:14, padding:"22px 24px" },
  statCard: { background:tokens.surface, border:`1px solid ${tokens.border}`, borderRadius:14, padding:"20px 22px", flex:1, minWidth:0 },
  btn: (v="primary") => ({
    display:"inline-flex", alignItems:"center", gap:7, padding:"8px 16px", borderRadius:8,
    fontSize:13, fontWeight:600, cursor:"pointer", border:"none", transition:"all 0.12s", textDecoration:"none",
    ...(v==="primary" ? { background:tokens.accent, color:"#fff" } :
        v==="ghost"   ? { background:"transparent", color:tokens.textSub, border:`1px solid ${tokens.border}` } :
        v==="success" ? { background:tokens.greenLow, color:tokens.green, border:`1px solid rgba(34,197,94,0.25)` } :
        v==="danger"  ? { background:tokens.redLow, color:tokens.red, border:`1px solid rgba(239,68,68,0.25)` } :
        v==="red"     ? { background:tokens.red, color:"#fff" } :
                        { background:tokens.accentLow, color:"#93C5FD", border:`1px solid ${tokens.accentMid}` })
  }),
  input:    { background:tokens.surfaceEl, border:`1px solid ${tokens.border}`, borderRadius:8, padding:"10px 14px", color:tokens.text, fontSize:13, width:"100%", outline:"none", boxSizing:"border-box", transition:"border-color 0.15s" },
  badge:    (c) => ({ display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600,
    ...(c==="green" ? {background:tokens.greenLow, color:tokens.green} :
        c==="amber" ? {background:tokens.amberLow, color:tokens.amber} :
        c==="red"   ? {background:tokens.redLow, color:tokens.red} :
                      {background:tokens.accentLow, color:"#93C5FD"}) }),
  h1:       { fontSize:22, fontWeight:700, color:tokens.text, margin:"0 0 4px", letterSpacing:"-0.4px" },
  h2:       { fontSize:16, fontWeight:600, color:tokens.text, margin:"0 0 18px", letterSpacing:"-0.2px" },
  muted:    { fontSize:13, color:tokens.textSub },
  label:    { fontSize:11, fontWeight:600, color:tokens.textSub, display:"block", marginBottom:7, textTransform:"uppercase", letterSpacing:"0.6px" },
};

// ── Utility Components ─────────────────────────────────────────────────────
function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.scans));
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:5, height:72 }}>
      {data.map(d => (
        <div key={d.day} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
          <div style={{ width:"100%", background:tokens.surfaceEl, borderRadius:5, overflow:"hidden", height:56, display:"flex", alignItems:"flex-end" }}>
            <div style={{ width:"100%", height:`${(d.scans/max)*100}%`, background:`linear-gradient(to top,${tokens.accent},#60A5FA)`, borderRadius:5, transition:"height 0.5s ease" }} />
          </div>
          <span style={{ fontSize:9, color:tokens.textMuted, fontWeight:600, letterSpacing:"0.5px" }}>{d.day}</span>
        </div>
      ))}
    </div>
  );
}

function Stars({ rating, size=14 }) {
  return (
    <span style={{ display:"inline-flex", gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i}>
          <svg width={size} height={size} viewBox="0 0 24 24"
            fill={i <= rating ? "#F59E0B" : "none"}
            stroke={i <= rating ? "#F59E0B" : "#3a3848"}
            strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </span>
      ))}
    </span>
  );
}

function RatingPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const labels = ["","Poor","Fair","Good","Great","Excellent"];
  const colors = ["","#EF4444","#F97316","#F59E0B","#22C55E","#22C55E"];
  const active = hover || value;
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ display:"flex", gap:10, justifyContent:"center", marginBottom:12 }}>
        {[1,2,3,4,5].map(i=>(
          <button key={i} onClick={()=>onChange(i)} onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(0)}
            style={{ background:"none", border:"none", cursor:"pointer", padding:4, transition:"transform 0.1s", transform:i<=(hover||value)?"scale(1.15)":"scale(1)" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill={i<=active?colors[active]:"none"} stroke={i<=active?colors[active]:tokens.border} strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>
        ))}
      </div>
      <div style={{ height:20 }}>
        {active>0 && (
          <span style={{ fontSize:13, fontWeight:600, color:colors[active], letterSpacing:"-0.1px" }}>
            {labels[active]}
          </span>
        )}
      </div>
    </div>
  );
}

function Divider({ style }) {
  return <div style={{ height:1, background:tokens.border, margin:"18px 0", ...style }} />;
}

// ══════════════════════════════════════════════════════════════════════════
// CUSTOMER PAGE — redesigned, no gating language
// ══════════════════════════════════════════════════════════════════════════
function CustomerReviewPage({ biz, apiKey, onBack, onFeedbackSubmit }) {
  const [step,       setStep]       = useState("rate");
  const [rating,     setRating]     = useState(0);
  const [suggestions,setSuggestions]= useState([]);
  const [chosen,     setChosen]     = useState("");
  const [loading,    setLoading]    = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [confirmed,  setConfirmed]  = useState(null);
  const [issue,      setIssue]      = useState("");
  const [details,    setDetails]    = useState("");
  const [contact,    setContact]    = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isHappy = rating >= 4;

  async function handleContinue() {
    if (!rating) return;
    if (isHappy) {
      setLoading(true);
      try {
        const prompt = `You are a review writing assistant for an IT training institute called "${biz.name}" in ${biz.city}.
The student wants to leave a ${rating}-star Google review about their training experience.
Generate exactly 3 short, natural, authentic-sounding review suggestions (2-3 sentences each). 
Mention aspects like trainers, curriculum, placement support, hands-on projects, or learning environment naturally.
Format as JSON array: ["review1","review2","review3"]
Only return the JSON array, nothing else.`;
        const text = await callGemini(apiKey, prompt);
        const clean = text.replace(/```json|```/g,"").trim();
        setSuggestions(JSON.parse(clean));
      } catch { setSuggestions([]); }
      setLoading(false);
      setStep("suggest");
    } else {
      setStep("feedback");
    }
  }

  async function handleSelectReview(text) {
    setChosen(text);
    try { await navigator.clipboard.writeText(text); setCopied(true); }
    catch { setCopied(false); }
    setStep("redirect");
  }

  function openGoogle() { window.open(biz.gmb,"_blank"); setStep("confirm"); }

  function submitFeedback() {
    if (!issue) return;
    setSubmitting(true);
    const entry = { id:`f${Date.now()}`, rating, issue, details, contact, date: new Date().toISOString().slice(0,10), resolved:false };
    onFeedbackSubmit?.(entry);
    setTimeout(() => { setSubmitting(false); setStep("feedbackDone"); }, 700);
  }

  const happySteps   = ["rate","suggest","redirect","confirm","done"];
  const unhappySteps = ["rate","feedback","feedbackDone"];
  const allSteps = (step==="feedback"||step==="feedbackDone") ? unhappySteps : happySteps;
  const stepIdx  = allSteps.indexOf(step);

  const pageStyle = {
    minHeight:"100vh",
    background: tokens.bg,
    display:"flex",
    flexDirection:"column",
    alignItems:"center",
    justifyContent:"center",
    padding:"24px 20px",
    fontFamily: "'Instrument Sans', 'DM Sans', system-ui, sans-serif",
  };

  return (
    <div style={pageStyle}>
      {/* Subtle grid background */}
      <div style={{ position:"fixed", inset:0, backgroundImage:`linear-gradient(${tokens.border} 1px, transparent 1px), linear-gradient(90deg, ${tokens.border} 1px, transparent 1px)`, backgroundSize:"40px 40px", opacity:0.3, pointerEvents:"none" }} />

      <div style={{ maxWidth:440, width:"100%", position:"relative", zIndex:1 }}>

        {/* Brand header */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:tokens.surface, border:`1px solid ${tokens.border}`, borderRadius:40, padding:"8px 16px 8px 10px", marginBottom:20 }}>
            <div style={{ width:26, height:26, background:"linear-gradient(135deg,#3B7EF6,#60A5FA)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}>
              <Icon.logo />
            </div>
            <span style={{ fontSize:13, fontWeight:600, color:tokens.text }}>ReviewAI</span>
          </div>

          <h1 style={{ fontSize:24, fontWeight:700, color:tokens.text, margin:"0 0 8px", letterSpacing:"-0.5px", lineHeight:1.2 }}>
            {step==="feedback"     ? "Share your experience" :
             step==="feedbackDone" ? "Thank you for your feedback" :
             step==="done" && confirmed ? "Thank you!" :
             "How was your experience?"}
          </h1>
          <p style={{ color:tokens.textSub, fontSize:14, margin:0 }}>{biz.name} · {biz.city} — IT Training</p>
        </div>

        {/* Progress bar */}
        <div style={{ display:"flex", gap:4, marginBottom:24 }}>
          {allSteps.map((s,i) => (
            <div key={s} style={{ flex:1, height:3, borderRadius:3,
              background: i<=stepIdx ? tokens.accent : tokens.border,
              transition:"background 0.3s" }} />
          ))}
        </div>

        {/* Card */}
        <div style={{ background:tokens.surface, border:`1px solid ${tokens.border}`, borderRadius:18, padding:"28px 28px", boxShadow:"0 8px 40px rgba(0,0,0,0.4)" }}>

          {/* RATE */}
          {step==="rate" && (
            <div>
              <p style={{ color:tokens.textSub, fontSize:14, marginBottom:24, textAlign:"center" }}>
                Tap a star to rate your visit
              </p>
              <RatingPicker value={rating} onChange={setRating} />
              <div style={{ height:16 }} />
              <button
                style={{ ...S.btn("primary"), width:"100%", justifyContent:"center", padding:"13px", fontSize:14,
                  opacity:rating ? 1 : 0.4, background: (rating && !isHappy) ? "#3B82F6" : tokens.accent }}
                onClick={handleContinue} disabled={!rating || loading}>
                {loading ? (
                  <><span style={{ display:"inline-flex" }}><Icon.sparkle /></span> Generating suggestions…</>
                ) : (
                  <><span>Continue</span><Icon.chevronRight /></>
                )}
              </button>
            </div>
          )}

          {/* SUGGEST */}
          {step==="suggest" && (
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                <div>
                  <p style={{ color:tokens.text, fontWeight:600, fontSize:15, margin:"0 0 3px" }}>Choose a review</p>
                  <p style={{ color:tokens.textSub, fontSize:12, margin:0 }}>Select one to use as your Google review</p>
                </div>
                <Stars rating={rating} size={14} />
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
                {suggestions.length > 0 ? suggestions.map((s,i) => (
                  <button key={i} onClick={() => handleSelectReview(s)}
                    style={{ background:tokens.surfaceEl, border:`1px solid ${tokens.border}`, borderRadius:11, padding:"14px 16px", cursor:"pointer", fontSize:13, color:tokens.text, lineHeight:1.65, textAlign:"left", transition:"all 0.12s", display:"block", width:"100%" }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor=tokens.accent; e.currentTarget.style.background="#141C33"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor=tokens.border; e.currentTarget.style.background=tokens.surfaceEl; }}>
                    <span style={{ color:tokens.textMuted, fontSize:10, fontWeight:700, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.8px" }}>Option {i+1}</span>
                    {s}
                  </button>
                )) : (
                  <div>
                    <textarea placeholder="Write your own review…" rows={4} style={{ ...S.input, resize:"vertical" }} onChange={e=>setChosen(e.target.value)} />
                    <button style={{ ...S.btn("primary"), width:"100%", justifyContent:"center", marginTop:10 }} onClick={()=>handleSelectReview(chosen)}>
                      Use this review <Icon.chevronRight />
                    </button>
                  </div>
                )}
              </div>
              <button style={{ ...S.btn("ghost"), fontSize:12 }} onClick={()=>setStep("rate")}>
                <Icon.arrowLeft /> Change rating
              </button>
            </div>
          )}

          {/* REDIRECT */}
          {step==="redirect" && (
            <div>
              {/* Copy status */}
              <div style={{ background:copied?tokens.greenLow:tokens.amberLow, border:`1px solid ${copied?"rgba(34,197,94,0.25)":"rgba(245,158,11,0.25)"}`, borderRadius:11, padding:"13px 16px", marginBottom:20, display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:copied?"rgba(34,197,94,0.2)":"rgba(245,158,11,0.2)", display:"flex", alignItems:"center", justifyContent:"center", color:copied?tokens.green:tokens.amber, flexShrink:0 }}>
                  {copied ? <Icon.check /> : <Icon.copy />}
                </div>
                <div>
                  <p style={{ margin:0, fontWeight:600, fontSize:13, color:copied?tokens.green:tokens.amber }}>
                    {copied ? "Review copied to clipboard" : "Copy your review text below"}
                  </p>
                  <p style={{ margin:"2px 0 0", fontSize:11, color:tokens.textSub }}>
                    {copied ? "Ready to paste on Google" : "Clipboard access was blocked — copy manually"}
                  </p>
                </div>
              </div>

              {/* Review text */}
              <div style={{ background:tokens.surfaceEl, border:`1px solid ${tokens.border}`, borderRadius:11, padding:"14px 16px", marginBottom:16 }}>
                <p style={{ color:tokens.textMuted, fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.8px", margin:"0 0 8px" }}>Your review</p>
                <p style={{ fontSize:13, color:tokens.text, lineHeight:1.7, margin:0 }}>{chosen}</p>
              </div>

              {!copied && (
                <button style={{ ...S.btn(), width:"100%", justifyContent:"center", marginBottom:14 }}
                  onClick={()=>navigator.clipboard.writeText(chosen).then(()=>setCopied(true))}>
                  <Icon.copy /> Copy review text
                </button>
              )}

              <Divider />

              {/* How-to steps */}
              <p style={{ color:tokens.textSub, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"1px", marginBottom:14 }}>How to post on Google</p>
              {[
                { n:1, text:"Tap the button below to open Google Reviews" },
                { n:2, text:"Select your star rating on Google" },
                { n:3, text:"Tap the text box and paste your review" },
                { n:4, text:"Tap 'Post' to publish your review" },
              ].map(s=>(
                <div key={s.n} style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:10 }}>
                  <div style={{ width:22, height:22, borderRadius:6, background:tokens.accentLow, border:`1px solid ${tokens.accentMid}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#93C5FD", flexShrink:0, fontWeight:700 }}>{s.n}</div>
                  <span style={{ fontSize:13, color:tokens.textSub, lineHeight:1.55, paddingTop:3 }}>{s.text}</span>
                </div>
              ))}

              <button style={{ ...S.btn("primary"), width:"100%", justifyContent:"center", padding:"13px", fontSize:14, marginTop:16 }} onClick={openGoogle}>
                <Icon.google /> Open Google Reviews <Icon.external />
              </button>
            </div>
          )}

          {/* CONFIRM */}
          {step==="confirm" && (
            <div style={{ textAlign:"center" }}>
              <div style={{ width:64, height:64, borderRadius:16, background:tokens.accentLow, border:`1px solid ${tokens.accentMid}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 18px", color:tokens.accent }}>
                <Icon.clipboardCheck />
              </div>
              <h2 style={{ ...S.h2, margin:"0 0 8px", fontSize:18 }}>Did you post the review?</h2>
              <p style={{ color:tokens.textSub, fontSize:14, marginBottom:24, lineHeight:1.6 }}>
                Google Reviews opened in a new tab. Let us know if you submitted it!
              </p>
              <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                <button style={{ ...S.btn("success"), padding:"12px 22px", fontSize:14 }} onClick={()=>{ setConfirmed(true); setStep("done"); }}>
                  <Icon.check /> Yes, I posted it!
                </button>
                <button style={{ ...S.btn("ghost"), padding:"12px 18px", fontSize:14 }} onClick={()=>{ setConfirmed(false); setStep("done"); }}>
                  Not yet
                </button>
              </div>
            </div>
          )}

          {/* DONE */}
          {step==="done" && (
            <div style={{ textAlign:"center", padding:"10px 0" }}>
              <div style={{ width:64, height:64, borderRadius:16, background:confirmed?tokens.greenLow:tokens.amberLow, border:`1px solid ${confirmed?"rgba(34,197,94,0.25)":"rgba(245,158,11,0.25)"}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 18px", color:confirmed?tokens.green:tokens.amber }}>
                {confirmed ? <Icon.check /> : <Icon.smile />}
              </div>
              <h2 style={{ ...S.h2, margin:"0 0 10px", fontSize:20 }}>
                {confirmed ? "Thank you so much!" : "No problem at all!"}
              </h2>
              <p style={{ color:tokens.textSub, fontSize:14, lineHeight:1.65, marginBottom:20 }}>
                {confirmed
                  ? `Your review means a lot to the team at ${biz.name}. We'll keep raising the bar for every student!`
                  : "You can always post it later. Search for us on Google Maps anytime!"}
              </p>
              {!confirmed && (
                <button style={{ ...S.btn("primary"), justifyContent:"center" }} onClick={openGoogle}>
                  <Icon.google /> Try again
                </button>
              )}
              <div style={{ marginTop:18, padding:"11px 14px", background:tokens.surfaceEl, borderRadius:10, fontSize:12, color:tokens.textSub }}>
                {confirmed ? "Reviews may take a few minutes to appear on Google." : "We appreciate you taking the time today!"}
              </div>
            </div>
          )}

          {/* PRIVATE FEEDBACK FORM */}
          {step==="feedback" && (
            <div>
              {/* Warm heading — no mention of Google */}
              <div style={{ background:tokens.surfaceEl, border:`1px solid ${tokens.border}`, borderRadius:11, padding:"14px 16px", marginBottom:20, display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ color:tokens.textSub, flexShrink:0, paddingTop:2 }}><Icon.heartHandshake /></div>
                <div>
                  <p style={{ margin:0, fontWeight:600, fontSize:14, color:tokens.text }}>We appreciate your honesty</p>
                  <p style={{ margin:"4px 0 0", fontSize:12, color:tokens.textSub, lineHeight:1.55 }}>
                    Your feedback goes directly to the owner and helps us improve. Thank you for taking a moment to share.
                  </p>
                </div>
              </div>

              {/* Rating row */}
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, padding:"10px 14px", background:tokens.surfaceEl, borderRadius:9, border:`1px solid ${tokens.border}` }}>
                <Stars rating={rating} size={14} />
                <span style={{ fontSize:13, color:tokens.textSub }}>{rating} star{rating!==1?"s":""} — Experience rating</span>
                <button style={{ marginLeft:"auto", background:"none", border:"none", color:tokens.accent, fontSize:12, cursor:"pointer", fontWeight:600 }} onClick={()=>setStep("rate")}>Change</button>
              </div>

              {/* Issue chips */}
              <div style={{ marginBottom:18 }}>
                <label style={S.label}>What could we improve? <span style={{ color:tokens.red }}>*</span></label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                  {ISSUE_OPTIONS.map(opt=>(
                    <button key={opt} onClick={()=>setIssue(opt)}
                      style={{ padding:"7px 14px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer",
                        border:`1px solid ${issue===opt?tokens.accent:tokens.border}`,
                        background:issue===opt?tokens.accentLow:tokens.surfaceEl,
                        color:issue===opt?tokens.accent:tokens.textSub, transition:"all 0.12s" }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div style={{ marginBottom:18 }}>
                <label style={S.label}>Tell us more <span style={{ color:tokens.textMuted, fontWeight:400, textTransform:"none", letterSpacing:0 }}>(optional)</span></label>
                <textarea rows={3} placeholder="The more you share, the better we can improve…" value={details} onChange={e=>setDetails(e.target.value)} style={{ ...S.input, resize:"vertical" }} />
              </div>

              {/* Contact */}
              <div style={{ marginBottom:22 }}>
                <label style={S.label}>Your contact <span style={{ color:tokens.textMuted, fontWeight:400, textTransform:"none", letterSpacing:0 }}>(optional — we'll reach out to make it right)</span></label>
                <input style={S.input} placeholder="Phone or email" value={contact} onChange={e=>setContact(e.target.value)} />
              </div>

              <button style={{ ...S.btn("primary"), width:"100%", justifyContent:"center", padding:"13px", fontSize:14, opacity:issue?1:0.4 }}
                onClick={submitFeedback} disabled={!issue||submitting}>
                {submitting ? "Sending…" : <><Icon.send /> Send feedback</>}
              </button>
            </div>
          )}

          {/* FEEDBACK DONE */}
          {step==="feedbackDone" && (
            <div style={{ textAlign:"center", padding:"10px 0" }}>
              <div style={{ width:64, height:64, borderRadius:16, background:tokens.accentLow, border:`1px solid ${tokens.accentMid}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 18px", color:tokens.accent }}>
                <Icon.heartHandshake />
              </div>
              <h2 style={{ ...S.h2, margin:"0 0 10px", fontSize:20 }}>We hear you.</h2>
              <p style={{ color:tokens.textSub, fontSize:14, lineHeight:1.65, marginBottom:20 }}>
                Your feedback has been shared with the owner. We're committed to making things better — thank you for helping us improve.
              </p>
              {contact && (
                <div style={{ background:tokens.greenLow, border:"1px solid rgba(34,197,94,0.25)", borderRadius:10, padding:"12px 16px", marginBottom:16, fontSize:13, color:tokens.green, display:"flex", alignItems:"center", gap:8 }}>
                  <Icon.check /> We'll follow up with you soon.
                </div>
              )}
              {biz.whatsapp && (
                <a href={`https://wa.me/${biz.whatsapp}?text=${encodeURIComponent(`Hi, I recently visited ${biz.name} and shared some feedback. I'd like to discuss my experience.`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ ...S.btn("success"), textDecoration:"none", justifyContent:"center", display:"inline-flex", gap:8 }}>
                  <Icon.whatsapp /> Chat on WhatsApp
                </a>
              )}
            </div>
          )}
        </div>

        {/* Back link */}
        <div style={{ textAlign:"center", marginTop:18 }}>
          <button style={{ background:"none", border:"none", color:tokens.textMuted, fontSize:12, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:5 }} onClick={onBack}>
            <Icon.arrowLeft /> Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════
function Overview({ businesses, reviews, feedback, onPreviewPage }) {
  const biz = businesses[0];
  const avgRating   = (reviews.reduce((a,r)=>a+r.rating,0)/reviews.length).toFixed(1);
  const unreplied   = reviews.filter(r=>!r.replied).length;
  const newFeedback = feedback.filter(f=>!f.resolved).length;

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={S.h1}>Overview</h1>
        <p style={S.muted}>Here's how {biz.name} is performing on Google.</p>
      </div>

      <div style={{ display:"flex", gap:14, marginBottom:24, flexWrap:"wrap" }}>
        {[
          { label:"Total Reviews",    value:reviews.length, sub:"All time",           icon:<Icon.star filled/>, iconColor:tokens.amber },
          { label:"Avg Rating",       value:avgRating,       sub:"Google average",     icon:<Icon.trendUp />,    iconColor:tokens.green },
          { label:"Scans Today",      value:biz.scansToday,  sub:"+22% vs yesterday",  icon:<Icon.scanLine />,   iconColor:"#93C5FD" },
          { label:"Pending Replies",  value:unreplied,       sub:"Need attention",     icon:<Icon.msgSquare />,  iconColor:tokens.amber },
          { label:"Private Feedback", value:newFeedback,     sub:"Unresolved",         icon:<Icon.flag />,       iconColor:newFeedback>0?tokens.red:tokens.green },
        ].map(s=>(
          <div key={s.label} style={S.statCard}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <p style={{ ...S.muted, margin:"0 0 8px", fontSize:12 }}>{s.label}</p>
                <p style={{ fontSize:26, fontWeight:700, color:s.label==="Private Feedback"&&newFeedback>0?tokens.red:tokens.text, margin:"0 0 4px", letterSpacing:"-0.5px" }}>{s.value}</p>
                <p style={{ fontSize:11, color:tokens.textMuted, margin:0 }}>{s.sub}</p>
              </div>
              <div style={{ color:s.iconColor, opacity:0.85 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {newFeedback > 0 && (
        <div style={{ background:tokens.redLow, border:"1px solid rgba(239,68,68,0.25)", borderRadius:12, padding:"14px 18px", marginBottom:22, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ color:tokens.red, flexShrink:0 }}><Icon.warning /></div>
          <div>
            <p style={{ margin:0, fontWeight:600, fontSize:14, color:tokens.red }}>{newFeedback} customer{newFeedback>1?"s":""} left feedback that needs attention</p>
            <p style={{ margin:"3px 0 0", fontSize:12, color:tokens.textSub }}>Resolve private feedback before it escalates.</p>
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        <div style={S.card}>
          <h2 style={{ ...S.h2, fontSize:14, marginBottom:16 }}>QR Scans this week</h2>
          <BarChart data={SCAN_DATA} />
          <p style={{ ...S.muted, marginTop:14, textAlign:"right", fontSize:12 }}>Total: {SCAN_DATA.reduce((a,d)=>a+d.scans,0)} scans</p>
        </div>
        <div style={S.card}>
          <h2 style={{ ...S.h2, fontSize:14, marginBottom:16 }}>Rating breakdown</h2>
          {[5,4,3,2,1].map(star=>{
            const count = reviews.filter(r=>r.rating===star).length;
            const pct   = Math.round((count/reviews.length)*100);
            return (
              <div key={star} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
                <span style={{ fontSize:11, color:tokens.amber, width:18, fontWeight:600 }}>{star}</span>
                <div style={{ flex:1, height:5, background:tokens.surfaceEl, borderRadius:4, overflow:"hidden" }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:star>=4?tokens.green:star===3?tokens.amber:tokens.red, borderRadius:4, transition:"width 0.5s" }} />
                </div>
                <span style={{ fontSize:11, color:tokens.textMuted, width:24, textAlign:"right" }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ ...S.card, marginTop:18, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
        <div>
          <p style={{ color:tokens.text, fontWeight:600, margin:"0 0 4px", fontSize:14 }}>Preview the customer scan page</p>
          <p style={{ ...S.muted, margin:0, fontSize:12 }}>See exactly what your customers experience after scanning.</p>
        </div>
        <button style={{ ...S.btn("primary"), whiteSpace:"nowrap" }} onClick={onPreviewPage}>
          <Icon.eye /> Preview page
        </button>
      </div>
    </div>
  );
}

function QRManager({ businesses }) {
  const biz = businesses[0];
  const DEFAULT_URL = "https://search.google.com/local/writereview?placeid=ChIJUcP4Q3YvwjcR5RmZj4cCrEA";

  const [size,      setSize]      = useState(200);
  const [bgColor,   setBgColor]   = useState("#ffffff");
  const [reviewUrl, setReviewUrl] = useState(DEFAULT_URL);
  const [bizName,   setBizName]   = useState(biz.name); // auto-extracted from URL
  const [label,     setLabel]     = useState(`Rate your experience at ${biz.name}`);
  const [labelEdited, setLabelEdited] = useState(false); // track if user manually edited label
  const [copied,    setCopied]    = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrStatus,  setQrStatus]  = useState("idle"); // idle | loading | ok | error
  const [fetching,  setFetching]  = useState(false);   // fetching business name

  // Debounce so QR only regenerates 800ms after user stops typing
  const [activeUrl,  setActiveUrl]  = useState(DEFAULT_URL);
  const [activeSize, setActiveSize] = useState(size);

  // Extract business name from Google Maps / review URL
  // Extract business name from Google Maps / review URL
  function fetchBizName(url) {
    if (!url.trim()) { setBizName(""); setFetching(false); return; }
    setFetching(true);

    let extracted = "";

    try {
      // Pattern 1: /maps/place/SpeedUp+Infotech/@...
      const mapsPlace = url.match(/maps\/place\/([^/@?#]+)/);
      if (mapsPlace) {
        extracted = decodeURIComponent(mapsPlace[1])
          .replace(/\+/g, " ").replace(/_/g, " ").trim();
      }

      // Pattern 2: g.page/r/SLUG/review or g.page/SLUG
      if (!extracted) {
        const gpage = url.match(/g\.page\/(?:r\/)?([^/?#\s]+)/);
        if (gpage) extracted = decodeURIComponent(gpage[1]).replace(/-/g, " ").trim();
      }

      // Pattern 3: ?q=Business+Name query param
      if (!extracted) {
        try {
          const u = new URL(url);
          const q = u.searchParams.get("q");
          if (q) extracted = q.trim();
        } catch {}
      }

      // Proper title case
      if (extracted) {
        extracted = extracted
          .toLowerCase()
          .split(" ")
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        setBizName(extracted);
        if (!labelEdited) setLabel("Rate your experience at " + extracted);
      }
    } catch {}

    setFetching(false);
  }

  useEffect(() => {
    const t = setTimeout(() => {
      setActiveUrl(reviewUrl.trim());
      setActiveSize(size);
      fetchBizName(reviewUrl);
    }, 800);
    return () => clearTimeout(t);
  }, [reviewUrl, size]);

  // Generate QR whenever activeUrl or activeSize changes
  useEffect(() => {
    if (!activeUrl) { setQrDataUrl(""); setQrStatus("idle"); return; }
    setQrStatus("loading");
    setQrDataUrl("");

    function doGenerate() {
      try {
        if (window.QRCode) {
          const div = document.createElement("div");
          div.style.cssText = "position:fixed;left:-9999px;visibility:hidden;";
          document.body.appendChild(div);
          new window.QRCode(div, {
            text: activeUrl,
            width: 300,
            height: 300,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: window.QRCode.CorrectLevel?.H || 3,
          });
          setTimeout(() => {
            const canvas = div.querySelector("canvas");
            const img    = div.querySelector("img");
            const result = canvas ? canvas.toDataURL("image/png") : (img ? img.src : "");
            try { document.body.removeChild(div); } catch {}
            if (result) { setQrDataUrl(result); setQrStatus("ok"); }
            else setQrStatus("error");
          }, 200);
        } else {
          setQrStatus("error");
        }
      } catch(e) {
        console.error("QR gen error", e);
        setQrStatus("error");
      }
    }

    if (window.QRCode) {
      doGenerate();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      script.onload = () => doGenerate();
      script.onerror = () => setQrStatus("error");
      document.head.appendChild(script);
    }
  }, [activeUrl, activeSize]);

  function copyUrl() {
    navigator.clipboard?.writeText(reviewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const displaySize = 220;

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={S.h1}>QR Code Manager</h1>
        <p style={S.muted}>Generate and customize your review QR code.</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:22 }}>
        {/* Left: Controls */}
        <div style={S.card}>
          <h2 style={{ ...S.h2, fontSize:14 }}>Customize</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            <div>
              <label style={S.label}>Google Review URL <span style={{ color:tokens.red }}>*</span></label>
              <input
                style={S.input}
                value={reviewUrl}
                onChange={e => setReviewUrl(e.target.value)}
                placeholder="https://search.google.com/local/writereview?placeid=..."
              />
              {reviewUrl.trim() && (
                <p style={{ fontSize:11, marginTop:6, display:"flex", alignItems:"center", gap:5,
                  color: fetching ? tokens.textSub : bizName ? tokens.green : tokens.textMuted }}>
                  {fetching
                    ? <><span style={{ display:"inline-block", width:10, height:10, border:`2px solid ${tokens.border}`, borderTopColor:tokens.accent, borderRadius:"50%", animation:"spin 0.7s linear infinite", marginRight:4 }} /> Detecting business name…</>
                    : bizName
                      ? <><Icon.check /> <strong>{bizName}</strong> review URL is set</>
                      : <><Icon.warning /> Paste your Google Maps or Review URL above</>
                  }
                </p>
              )}
            </div>

            <div>
              <label style={S.label}>
                Label text
                {!labelEdited && bizName && (
                  <span style={{ color:tokens.accent, fontWeight:400, textTransform:"none", letterSpacing:0, fontSize:10, marginLeft:6 }}>
                    auto-filled from URL
                  </span>
                )}
              </label>
              <input
                style={S.input}
                value={label}
                onChange={e => { setLabel(e.target.value); setLabelEdited(true); }}
                placeholder="e.g. Scan to review us on Google"
              />
            </div>

            <div>
              <label style={S.label}>Size: {size}×{size}px</label>
              <input type="range" min={100} max={400} step={50} value={size}
                onChange={e => setSize(+e.target.value)}
                style={{ width:"100%", accentColor:tokens.accent }} />
            </div>

            <div style={{ display:"flex", gap:10 }}>
              {qrStatus === "ok" && qrDataUrl ? (
                <a href={qrDataUrl} download={`${bizName ? bizName.replace(/\s+/g,"-").toLowerCase() : "review"}-qr.png`}
                  style={{ ...S.btn("primary"), textDecoration:"none", flex:1, justifyContent:"center" }}>
                  <Icon.download /> Download PNG
                </a>
              ) : (
                <button style={{ ...S.btn("primary"), flex:1, justifyContent:"center", opacity:0.4 }} disabled>
                  <Icon.download /> Download PNG
                </button>
              )}
              <button style={{ ...S.btn(), flex:1, justifyContent:"center" }} onClick={copyUrl}>
                {copied ? <><Icon.check /> Copied!</> : <><Icon.copy /> Copy URL</>}
              </button>
            </div>
          </div>
        </div>

        {/* Right: QR Preview */}
        <div style={{ ...S.card, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, minHeight:320 }}>

          <div style={{ background:bgColor, padding:16, borderRadius:14, border:`1px solid ${tokens.border}`,
            width:displaySize+32, height:displaySize+32,
            display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>

            {(qrStatus === "idle" || !activeUrl) && (
              <div style={{ textAlign:"center" }}>
                <div style={{ color:tokens.textMuted, marginBottom:8, display:"flex", justifyContent:"center" }}><Icon.qr /></div>
                <p style={{ fontSize:12, color:tokens.textMuted, margin:0 }}>QR will appear here</p>
              </div>
            )}

            {qrStatus === "loading" && (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
                <div style={{ width:36, height:36, border:`3px solid ${tokens.border}`, borderTopColor:tokens.accent, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
                <span style={{ fontSize:11, color:tokens.textMuted }}>Generating…</span>
              </div>
            )}

            {qrStatus === "error" && (
              <div style={{ textAlign:"center", padding:8 }}>
                <div style={{ color:tokens.red, marginBottom:8, display:"flex", justifyContent:"center" }}><Icon.warning /></div>
                <p style={{ fontSize:12, color:tokens.red, margin:"0 0 4px", fontWeight:600 }}>Generation failed</p>
                <p style={{ fontSize:11, color:tokens.textMuted, margin:"0 0 10px", lineHeight:1.5 }}>
                  The QR library could not load.<br/>Check your internet connection.
                </p>
                <button style={{ ...S.btn(), fontSize:11 }} onClick={() => {
                  setQrStatus("loading");
                  setActiveUrl(u => u + " ");
                  setTimeout(() => setActiveUrl(u => u.trim()), 50);
                }}>
                  <Icon.refresh /> Retry
                </button>
              </div>
            )}

            {qrStatus === "ok" && qrDataUrl && (
              <img src={qrDataUrl} alt="QR Code" style={{ width:displaySize, height:displaySize, display:"block", borderRadius:4 }} />
            )}
          </div>

          {label && <p style={{ color:tokens.text, fontWeight:600, fontSize:14, margin:0, textAlign:"center", maxWidth:240 }}>{label}</p>}
          <p style={{ ...S.muted, fontSize:12 }}>Scan to review {bizName || "us"} on Google</p>

          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ fontSize:11, color:tokens.textMuted }}>Background:</span>
            {["#ffffff","#0E1220","#1a2744"].map(c=>(
              <button key={c} onClick={()=>setBgColor(c)}
                style={{ width:26, height:26, borderRadius:8, background:c,
                  border:bgColor===c?`2px solid ${tokens.accent}`:`2px solid ${tokens.border}`, cursor:"pointer" }} />
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ ...S.card, marginTop:20 }}>
        <h2 style={{ ...S.h2, fontSize:14 }}>Performance</h2>
        <div style={{ display:"flex", gap:32 }}>
          {[
            { label:"Total scans",  value: biz.scansWeek + 189 },
            { label:"This week",    value: biz.scansWeek },
            { label:"Today",        value: biz.scansToday },
            { label:"Conversion",   value: "34%" }
          ].map(s=>(
            <div key={s.label}>
              <p style={{ ...S.muted, margin:"0 0 4px", fontSize:12 }}>{s.label}</p>
              <p style={{ fontSize:22, fontWeight:700, color:tokens.text, margin:0, letterSpacing:"-0.5px" }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewInbox({ reviews, setReviews, apiKey }) {
  const [filter,     setFilter]     = useState("all");
  const [generating, setGenerating] = useState({});
  const [replying,   setReplying]   = useState({});
  const [editTexts,  setEditTexts]  = useState({});

  const filtered = reviews.filter(r=>filter==="all"?true:filter==="unreplied"?!r.replied:r.replied);

  async function generateReply(review) {
    setGenerating(g=>({...g,[review.id]:true}));
    try {
      const prompt = `You are the owner of "${SEED_BUSINESSES[0].name}", an ${SEED_BUSINESSES[0].type} in Pune.
Write a warm, professional, concise reply (2-3 sentences) to this ${review.rating}-star Google review:
"${review.text}"
Reply directly as the institute director. Be genuine and encouraging. No hashtags.`;
      const reply = await callGemini(apiKey, prompt);
      setEditTexts(t=>({...t,[review.id]:reply.trim()}));
      setReplying(r=>({...r,[review.id]:true}));
    } catch {
      setEditTexts(t=>({...t,[review.id]:"Unable to generate. Please write manually."}));
      setReplying(r=>({...r,[review.id]:true}));
    }
    setGenerating(g=>({...g,[review.id]:false}));
  }

  function postReply(review) {
    setReviews(prev=>prev.map(r=>r.id===review.id?{...r,replied:true,aiReply:editTexts[review.id]||""}:r));
    setReplying(r=>({...r,[review.id]:false}));
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <h1 style={S.h1}>Review Inbox</h1>
          <p style={S.muted}>Manage and reply to your Google reviews.</p>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {["all","unreplied","replied"].map(f=>(
            <button key={f} style={{ ...S.btn(filter===f?"primary":"ghost"), textTransform:"capitalize", fontSize:12 }} onClick={()=>setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {filtered.map(review=>(
          <div key={review.id} style={{ ...S.card, borderLeft:`3px solid ${review.rating>=4?tokens.green:review.rating===3?tokens.amber:tokens.red}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                <div style={{ width:36, height:36, borderRadius:10, background:tokens.accentLow, border:`1px solid ${tokens.accentMid}`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:14, color:"#93C5FD" }}>
                  {review.author[0]}
                </div>
                <div>
                  <p style={{ margin:0, fontWeight:600, fontSize:14, color:tokens.text }}>{review.author}</p>
                  <p style={{ margin:"2px 0 0", fontSize:11, color:tokens.textMuted }}>{review.date}</p>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <Stars rating={review.rating} size={13} />
                <span style={S.badge(review.replied?"green":"amber")}>{review.replied?"Replied":"Pending"}</span>
              </div>
            </div>

            <p style={{ fontSize:13, color:tokens.textSub, lineHeight:1.7, margin:"0 0 14px" }}>{review.text}</p>

            {review.replied && review.aiReply && (
              <div style={{ background:tokens.surfaceEl, borderRadius:9, padding:"10px 14px", fontSize:13, color:tokens.textSub, borderLeft:`2px solid ${tokens.accent}` }}>
                <span style={{ color:tokens.accent, fontSize:10, fontWeight:700, display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.8px" }}>Your reply</span>
                {review.aiReply}
              </div>
            )}

            {!review.replied && (
              !replying[review.id] ? (
                <button style={S.btn()} onClick={()=>generateReply(review)} disabled={generating[review.id]}>
                  <Icon.sparkle /> {generating[review.id] ? "Generating…" : "Generate AI reply"}
                </button>
              ) : (
                <div style={{ marginTop:8 }}>
                  <textarea rows={3} value={editTexts[review.id]||""} onChange={e=>setEditTexts(t=>({...t,[review.id]:e.target.value}))} style={{ ...S.input, resize:"vertical", marginBottom:8 }} />
                  <div style={{ display:"flex", gap:8 }}>
                    <button style={S.btn("success")} onClick={()=>postReply(review)}><Icon.check /> Post reply</button>
                    <button style={S.btn("ghost")} onClick={()=>generateReply(review)} disabled={generating[review.id]}><Icon.refresh /> Regenerate</button>
                    <button style={S.btn("ghost")} onClick={()=>setReplying(r=>({...r,[review.id]:false}))}>Cancel</button>
                  </div>
                </div>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedbackInbox({ feedback, setFeedback, businesses }) {
  const biz = businesses[0];
  const [filter, setFilter] = useState("all");
  const filtered = feedback.filter(f=>filter==="all"?true:filter==="unresolved"?!f.resolved:f.resolved);

  function resolve(id) { setFeedback(prev=>prev.map(f=>f.id===id?{...f,resolved:true}:f)); }

  const issueColor = {
    "Long waiting time":tokens.amber, "Staff behaviour":tokens.red, "Service quality":"#F97316",
    "Pricing / value":"#A78BFA", "Cleanliness":"#60A5FA", "Product quality":tokens.green, "Other":tokens.textSub
  };
  const waMsg   = (f) => encodeURIComponent(`Hi, we saw your feedback about "${f.issue}" on ${f.date}. We're sorry and would love to make it right. Can we help?`);
  const emailSub= (f) => encodeURIComponent(`Your recent visit to ${biz.name}`);
  const emailBod= (f) => encodeURIComponent(`Hi,\n\nWe saw your feedback about "${f.issue}" and we're truly sorry. We'd love to make it right.\n\nBest,\n${biz.name}`);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <h1 style={S.h1}>Private Feedback</h1>
          <p style={S.muted}>Customer feedback captured privately via the scan page.</p>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {["all","unresolved","resolved"].map(f=>(
            <button key={f} style={{ ...S.btn(filter===f?"primary":"ghost"), textTransform:"capitalize", fontSize:12 }} onClick={()=>setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:14, marginBottom:22 }}>
        {[
          { label:"Total caught",  value:feedback.length,                       color:tokens.accent },
          { label:"Unresolved",    value:feedback.filter(f=>!f.resolved).length, color:tokens.red },
          { label:"Resolved",      value:feedback.filter(f=>f.resolved).length,  color:tokens.green },
          { label:"Responses sent",value:feedback.filter(f=>f.contact).length,   color:tokens.amber },
        ].map(s=>(
          <div key={s.label} style={S.statCard}>
            <p style={{ ...S.muted, margin:"0 0 6px", fontSize:12 }}>{s.label}</p>
            <p style={{ fontSize:24, fontWeight:700, color:s.color, margin:0, letterSpacing:"-0.5px" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {filtered.length===0 && (
        <div style={{ ...S.card, textAlign:"center", padding:"52px 24px" }}>
          <div style={{ color:tokens.green, display:"flex", justifyContent:"center", marginBottom:14 }}><Icon.check /></div>
          <p style={{ color:tokens.text, fontWeight:600, margin:"0 0 6px" }}>No {filter==="unresolved"?"unresolved ":""}feedback</p>
          <p style={{ ...S.muted, margin:0, fontSize:12 }}>All clear!</p>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {filtered.map(f=>(
          <div key={f.id} style={{ ...S.card, borderLeft:`3px solid ${f.resolved?tokens.green:tokens.red}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <Stars rating={f.rating} size={13} />
                <span style={{ display:"inline-flex", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, background:`${issueColor[f.issue]||tokens.textSub}18`, color:issueColor[f.issue]||tokens.textSub }}>
                  {f.issue}
                </span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:11, color:tokens.textMuted }}>{f.date}</span>
                <span style={S.badge(f.resolved?"green":"red")}>{f.resolved?"Resolved":"Needs action"}</span>
              </div>
            </div>

            {f.details && (
              <p style={{ fontSize:13, color:tokens.textSub, lineHeight:1.7, margin:"0 0 14px", padding:"11px 14px", background:tokens.surfaceEl, borderRadius:8, fontStyle:"italic" }}>
                "{f.details}"
              </p>
            )}

            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                {f.contact ? (
                  <>
                    <span style={{ fontSize:12, color:tokens.textSub, display:"flex", alignItems:"center", gap:5 }}>
                      <Icon.phone /> {f.contact}
                    </span>
                    {biz.whatsapp && (
                      <a href={`https://wa.me/${biz.whatsapp}?text=${waMsg(f)}`} target="_blank" rel="noopener noreferrer"
                        style={{ ...S.btn("success"), textDecoration:"none", fontSize:12, padding:"5px 12px" }}>
                        <Icon.whatsapp /> WhatsApp
                      </a>
                    )}
                    {f.contact.includes("@") && (
                      <a href={`mailto:${f.contact}?subject=${emailSub(f)}&body=${emailBod(f)}`}
                        style={{ ...S.btn("ghost"), textDecoration:"none", fontSize:12, padding:"5px 12px" }}>
                        <Icon.mail /> Email
                      </a>
                    )}
                  </>
                ) : (
                  <span style={{ fontSize:12, color:tokens.textMuted }}>No contact provided</span>
                )}
              </div>
              {!f.resolved && (
                <button style={{ ...S.btn("success"), fontSize:12, padding:"6px 14px" }} onClick={()=>resolve(f.id)}>
                  <Icon.check /> Mark resolved
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Settings({ apiKey, setApiKey, businesses, setBusinesses }) {
  const [localKey,   setLocalKey]   = useState(apiKey);
  const [saved,      setSaved]      = useState(false);
  const [testing,    setTesting]    = useState(false);
  const [testResult, setTestResult] = useState("");
  const [localBiz,   setLocalBiz]   = useState({...businesses[0]});

  function save() {
    setApiKey(localKey);
    setBusinesses(prev=>[{...prev[0],...localBiz}]);
    setSaved(true);
    setTimeout(()=>setSaved(false), 2200);
  }

  async function testApi() {
    setTesting(true); setTestResult("");
    try {
      const r = await callGemini(localKey,"Say 'API connected!' and nothing else.");
      setTestResult("connected:" + r.trim());
    } catch(e) { setTestResult("error:" + e.message); }
    setTesting(false);
  }

  const isConnected = testResult.startsWith("connected:");
  const isError     = testResult.startsWith("error:");

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={S.h1}>Settings</h1>
        <p style={S.muted}>Configure your AI integration and business profile.</p>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:18, maxWidth:560 }}>
        {/* API Key */}
        <div style={S.card}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
            <div style={{ color:tokens.accent }}><Icon.key /></div>
            <h2 style={{ ...S.h2, margin:0, fontSize:15 }}>Gemini API Key</h2>
          </div>
          <p style={{ ...S.muted, marginBottom:14, fontSize:12 }}>
            Get your free key at{" "}
            <a href="https://aistudio.google.com/apikey" target="_blank" style={{ color:tokens.accent, textDecoration:"none" }}>aistudio.google.com/apikey</a>
          </p>
          <input type="password" style={{ ...S.input, marginBottom:10 }} value={localKey} onChange={e=>setLocalKey(e.target.value)} placeholder="AIza..." />
          <button style={S.btn("primary")} onClick={testApi} disabled={testing||!localKey}>
            {testing ? "Testing…" : "Test connection"}
          </button>
          {testResult && (
            <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:8, fontSize:12, color:isConnected?tokens.green:tokens.red }}>
              {isConnected ? <Icon.check /> : <Icon.warning />}
              {isConnected ? "Connected successfully" : testResult.replace("error:","Error: ")}
            </div>
          )}
        </div>

        {/* Business Profile */}
        <div style={S.card}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
            <div style={{ color:tokens.accent }}><Icon.building /></div>
            <h2 style={{ ...S.h2, margin:0, fontSize:15 }}>Business Profile</h2>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {[
              { label:"Business name",      key:"name" },
              { label:"Business type",      key:"type" },
              { label:"City",               key:"city" },
              { label:"Google Review URL",  key:"gmb" },
              { label:"WhatsApp number (with country code, e.g. 919876543210)", key:"whatsapp" },
            ].map(f=>(
              <div key={f.key}>
                <label style={S.label}>{f.label}</label>
                <input style={S.input} value={localBiz[f.key]||""} onChange={e=>setLocalBiz(b=>({...b,[f.key]:e.target.value}))} />
              </div>
            ))}
          </div>
        </div>

        {/* Review Routing info */}
        <div style={{ ...S.card, border:`1px solid ${tokens.accentMid}`, background:tokens.accentLow }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <div style={{ color:tokens.accent }}><Icon.shield /></div>
            <h2 style={{ ...S.h2, margin:0, fontSize:15 }}>Smart Review Routing</h2>
          </div>
          <p style={{ ...S.muted, marginBottom:16, lineHeight:1.65, fontSize:13 }}>
            Customers rating 4–5 stars are guided to Google Reviews. Lower-rated responses are collected privately so you can follow up and improve.
          </p>
          <div style={{ display:"flex", gap:10 }}>
            <div style={{ flex:1, background:tokens.surface, borderRadius:9, padding:"13px 14px", textAlign:"center", border:`1px solid ${tokens.border}` }}>
              <p style={{ margin:0, fontSize:18, fontWeight:700, color:tokens.green }}>4–5 ★</p>
              <p style={{ margin:"5px 0 0", fontSize:11, color:tokens.textSub }}>→ Google Review</p>
            </div>
            <div style={{ flex:1, background:tokens.surface, borderRadius:9, padding:"13px 14px", textAlign:"center", border:`1px solid ${tokens.border}` }}>
              <p style={{ margin:0, fontSize:18, fontWeight:700, color:tokens.amber }}>1–3 ★</p>
              <p style={{ margin:"5px 0 0", fontSize:11, color:tokens.textSub }}>→ Private Feedback</p>
            </div>
          </div>
        </div>

        <button style={{ ...S.btn(saved?"success":"primary"), alignSelf:"flex-start", padding:"11px 26px", fontSize:14 }} onClick={save}>
          {saved ? <><Icon.check /> Saved!</> : "Save settings"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [tab,              setTab]             = useState("overview");
  const [apiKey,           setApiKey]          = useState("");
  const [businesses,       setBusinesses]      = useState(SEED_BUSINESSES);
  const [reviews,          setReviews]         = useState(SEED_REVIEWS);
  const [feedback,         setFeedback]        = useState(SEED_FEEDBACK);
  const [showCustomerPage, setShowCustomerPage]= useState(false);

  useEffect(()=>{
    const link = document.createElement("link");
    link.rel   = "stylesheet";
    link.href  = "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  },[]);

  if (showCustomerPage) {
    return <CustomerReviewPage biz={businesses[0]} apiKey={apiKey}
      onBack={()=>setShowCustomerPage(false)}
      onFeedbackSubmit={entry=>setFeedback(prev=>[entry,...prev])} />;
  }

  const unresolved = feedback.filter(f=>!f.resolved).length;

  const nav = [
    { id:"overview", label:"Overview",         icon:<Icon.overview /> },
    { id:"qr",       label:"QR Manager",       icon:<Icon.qr /> },
    { id:"reviews",  label:"Review Inbox",     icon:<Icon.inbox /> },
    { id:"feedback", label:"Private Feedback", icon:<Icon.lock />, badge:unresolved },
    { id:"settings", label:"Settings",         icon:<Icon.settings /> },
  ];

  return (
    <div style={S.app}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={S.logo}>
          <div style={S.logoMark}><Icon.logo /></div>
          ReviewAI — SpeedUp
        </div>

        <nav style={{ padding:"12px 0", flex:1 }}>
          {nav.map(n=>(
            <div key={n.id} style={S.navItem(tab===n.id)} onClick={()=>setTab(n.id)}>
              <span style={{ color:tab===n.id?tokens.accent:tokens.textMuted, display:"flex" }}>{n.icon}</span>
              <span style={{ flex:1 }}>{n.label}</span>
              {n.badge>0 && (
                <span style={{ background:tokens.red, color:"#fff", fontSize:10, fontWeight:700, borderRadius:20, padding:"2px 7px", minWidth:18, textAlign:"center" }}>
                  {n.badge}
                </span>
              )}
            </div>
          ))}
        </nav>

        {/* API status footer */}
        <div style={{ padding:"16px 16px 20px", borderTop:`1px solid ${tokens.border}` }}>
          <div style={{ background:tokens.surfaceEl, borderRadius:10, padding:"12px 14px" }}>
            <p style={{ fontSize:10, color:tokens.textMuted, margin:"0 0 6px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.8px" }}>Gemini API</p>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:apiKey?tokens.green:tokens.red, boxShadow:apiKey?`0 0 6px ${tokens.green}`:"none" }} />
              <span style={{ fontSize:12, color:apiKey?tokens.green:tokens.red, fontWeight:600 }}>{apiKey?"Connected":"Not configured"}</span>
            </div>
            {!apiKey && <p style={{ fontSize:11, color:tokens.textMuted, marginTop:7, lineHeight:1.5, marginBottom:0 }}>Add your key in Settings to enable AI features.</p>}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={S.main}>
        {tab==="overview" && <Overview  businesses={businesses} reviews={reviews} feedback={feedback} onPreviewPage={()=>setShowCustomerPage(true)} />}
        {tab==="qr"       && <QRManager businesses={businesses} />}
        {tab==="reviews"  && <ReviewInbox reviews={reviews} setReviews={setReviews} apiKey={apiKey} />}
        {tab==="feedback" && <FeedbackInbox feedback={feedback} setFeedback={setFeedback} businesses={businesses} />}
        {tab==="settings" && <Settings apiKey={apiKey} setApiKey={setApiKey} businesses={businesses} setBusinesses={setBusinesses} />}
      </main>
    </div>
  );
}
