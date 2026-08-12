/**
 * Generates the site's illustration set as SVG files in public/img.
 *
 * Everything ships with the repo rather than loading from a CDN: the app must
 * render identically offline, and an academic-integrity product should not leak
 * page views to a third-party image host.
 *
 * Run with: npm run gen:assets
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const OUT = "public/img";

/** Brand ramp, matched to the CSS custom properties in globals.css. */
const C = {
  brand: "#3355e8",
  brandLight: "#7692ff",
  accent: "#7b3fe4",
  accent2: "#14b8c4",
  ink: "#0d1017",
  paper: "#ffffff",
  green: "#12784a",
  amber: "#a56a00",
  red: "#bf2c33",
};

function write(name, svg) {
  const path = join(OUT, name);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, svg.trim().replace(/\n\s{2,}/g, "\n  "));
  console.log(`  ${path}`);
}

const defs = (id) => `
  <defs>
    <linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.brand}"/>
      <stop offset="55%" stop-color="${C.accent}"/>
      <stop offset="100%" stop-color="${C.accent2}"/>
    </linearGradient>
    <linearGradient id="s${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.25"/>
    </linearGradient>
    <filter id="b${id}" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="26"/>
    </filter>
  </defs>`;

// ── 1. Hero: layered document sheets with a similarity heatmap ──────────────
write(
  "hero-analysis.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 560" fill="none" role="img" aria-label="Documents being compared, with matching paragraphs highlighted">
  ${defs("h")}
  <circle cx="180" cy="150" r="150" fill="${C.brand}" opacity="0.30" filter="url(#bh)"/>
  <circle cx="540" cy="380" r="160" fill="${C.accent}" opacity="0.26" filter="url(#bh)"/>

  <!-- back sheet -->
  <g transform="translate(300 60) rotate(7)">
    <rect width="300" height="400" rx="18" fill="${C.paper}" opacity="0.55" stroke="${C.brand}" stroke-opacity="0.2"/>
    ${Array.from({ length: 9 }, (_, i) => `<rect x="28" y="${44 + i * 34}" width="${i % 3 === 2 ? 150 : 244}" height="9" rx="4.5" fill="${C.ink}" opacity="0.10"/>`).join("\n    ")}
  </g>

  <!-- front sheet with flagged paragraphs -->
  <g transform="translate(80 40)">
    <rect width="330" height="440" rx="20" fill="${C.paper}" stroke="${C.brand}" stroke-opacity="0.28" stroke-width="1.5"/>
    <rect x="28" y="34" width="120" height="12" rx="6" fill="url(#gh)"/>
    ${Array.from({ length: 4 }, (_, i) => `<rect x="28" y="${72 + i * 26}" width="${i === 3 ? 170 : 274}" height="9" rx="4.5" fill="${C.ink}" opacity="0.13"/>`).join("\n    ")}
    <rect x="18" y="182" width="294" height="92" rx="12" fill="${C.red}" opacity="0.12"/>
    <rect x="18" y="182" width="3" height="92" rx="1.5" fill="${C.red}"/>
    ${Array.from({ length: 3 }, (_, i) => `<rect x="28" y="${198 + i * 26}" width="${i === 2 ? 190 : 274}" height="9" rx="4.5" fill="${C.red}" opacity="0.42"/>`).join("\n    ")}
    <rect x="18" y="292" width="294" height="66" rx="12" fill="${C.amber}" opacity="0.12"/>
    <rect x="18" y="292" width="3" height="66" rx="1.5" fill="${C.amber}"/>
    ${Array.from({ length: 2 }, (_, i) => `<rect x="28" y="${308 + i * 26}" width="${i === 1 ? 150 : 274}" height="9" rx="4.5" fill="${C.amber}" opacity="0.42"/>`).join("\n    ")}
    ${Array.from({ length: 2 }, (_, i) => `<rect x="28" y="${376 + i * 26}" width="${i === 1 ? 200 : 274}" height="9" rx="4.5" fill="${C.ink}" opacity="0.13"/>`).join("\n    ")}
  </g>

  <!-- score dial -->
  <g transform="translate(468 300)">
    <circle r="74" fill="${C.paper}" stroke="${C.ink}" stroke-opacity="0.08"/>
    <circle r="60" fill="none" stroke="${C.ink}" stroke-opacity="0.08" stroke-width="12"/>
    <circle r="60" fill="none" stroke="url(#gh)" stroke-width="12" stroke-linecap="round"
            stroke-dasharray="377" stroke-dashoffset="216" transform="rotate(-90)"/>
    <text text-anchor="middle" y="4" font-family="system-ui,sans-serif" font-size="30" font-weight="700" fill="${C.ink}">43%</text>
    <text text-anchor="middle" y="26" font-family="system-ui,sans-serif" font-size="12" fill="${C.ink}" opacity="0.55">similarity</text>
  </g>

  <!-- connector between matched paragraphs -->
  <path d="M410 230 C 460 230 470 250 500 250" stroke="${C.red}" stroke-opacity="0.5" stroke-width="2" stroke-dasharray="5 5"/>
</svg>`,
);

// ── 2. Semantic embedding space ─────────────────────────────────────────────
const points = [];
let seed = 7;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
for (let i = 0; i < 46; i++) {
  const cluster = i < 16 ? 0 : i < 32 ? 1 : 2;
  const cx = [150, 330, 250][cluster];
  const cy = [140, 190, 300][cluster];
  points.push({
    x: cx + (rnd() - 0.5) * 130,
    y: cy + (rnd() - 0.5) * 110,
    r: 3 + rnd() * 5,
    c: [C.brand, C.accent, C.accent2][cluster],
  });
}
write(
  "feature-embeddings.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 400" fill="none" role="img" aria-label="Paragraphs plotted as points in semantic space, clustered by meaning">
  ${defs("e")}
  <circle cx="150" cy="140" r="95" fill="${C.brand}" opacity="0.10"/>
  <circle cx="330" cy="190" r="95" fill="${C.accent}" opacity="0.10"/>
  <circle cx="250" cy="300" r="80" fill="${C.accent2}" opacity="0.10"/>
  <line x1="150" y1="140" x2="330" y2="190" stroke="${C.red}" stroke-width="2.5" stroke-dasharray="6 4" opacity="0.8"/>
  <circle cx="240" cy="165" r="17" fill="${C.red}" opacity="0.16"/>
  <text x="240" y="169" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="${C.red}">0.91</text>
  ${points.map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r.toFixed(1)}" fill="${p.c}" opacity="0.72"/>`).join("\n  ")}
</svg>`,
);

// ── 3. Grammar checker ──────────────────────────────────────────────────────
write(
  "feature-grammar.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 400" fill="none" role="img" aria-label="Text with grammar issues underlined and a suggestion card">
  ${defs("gr")}
  <rect x="30" y="40" width="330" height="300" rx="16" fill="${C.paper}" stroke="${C.ink}" stroke-opacity="0.10"/>
  ${Array.from({ length: 3 }, (_, i) => `<rect x="54" y="${72 + i * 26}" width="${i === 2 ? 180 : 282}" height="8" rx="4" fill="${C.ink}" opacity="0.13"/>`).join("\n  ")}
  <rect x="54" y="156" width="120" height="8" rx="4" fill="${C.red}" opacity="0.30"/>
  <path d="M54 170 q6 5 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0" stroke="${C.red}" stroke-width="2.2" fill="none"/>
  <rect x="184" y="156" width="98" height="8" rx="4" fill="${C.ink}" opacity="0.13"/>
  ${Array.from({ length: 2 }, (_, i) => `<rect x="54" y="${192 + i * 26}" width="${i === 1 ? 210 : 282}" height="8" rx="4" fill="${C.ink}" opacity="0.13"/>`).join("\n  ")}
  <rect x="54" y="256" width="150" height="8" rx="4" fill="${C.amber}" opacity="0.30"/>
  <path d="M54 270 q6 5 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0" stroke="${C.amber}" stroke-width="2.2" fill="none"/>
  <rect x="54" y="292" width="240" height="8" rx="4" fill="${C.ink}" opacity="0.13"/>

  <!-- suggestion card -->
  <g transform="translate(238 116)">
    <rect width="212" height="112" rx="14" fill="${C.paper}" stroke="${C.brand}" stroke-opacity="0.3"/>
    <rect x="0" y="0" width="212" height="4" rx="2" fill="url(#ggr)"/>
    <circle cx="24" cy="30" r="7" fill="${C.red}"/>
    <rect x="40" y="24" width="86" height="8" rx="4" fill="${C.ink}" opacity="0.7"/>
    <rect x="20" y="50" width="172" height="7" rx="3.5" fill="${C.ink}" opacity="0.16"/>
    <rect x="20" y="64" width="128" height="7" rx="3.5" fill="${C.ink}" opacity="0.16"/>
    <rect x="20" y="84" width="72" height="18" rx="9" fill="${C.brand}"/>
    <rect x="100" y="84" width="52" height="18" rx="9" fill="${C.ink}" opacity="0.08"/>
  </g>
</svg>`,
);

// ── 4. Peer review ──────────────────────────────────────────────────────────
write(
  "feature-peer-review.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 400" fill="none" role="img" aria-label="Anonymous reviewers exchanging feedback in a ring">
  ${defs("p")}
  <circle cx="240" cy="200" r="120" fill="none" stroke="${C.ink}" stroke-opacity="0.10" stroke-dasharray="6 6"/>
  ${[0, 1, 2, 3].map((i) => {
    const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
    const x = 240 + Math.cos(a) * 120;
    const y = 200 + Math.sin(a) * 120;
    const col = [C.brand, C.accent, C.accent2, C.brandLight][i];
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
    <circle r="34" fill="${C.paper}" stroke="${col}" stroke-width="2"/>
    <circle cy="-8" r="10" fill="${col}" opacity="0.85"/>
    <path d="M-15 18 a15 15 0 0 1 30 0 z" fill="${col}" opacity="0.85"/>
  </g>`;
  }).join("\n  ")}
  ${[0, 1, 2, 3].map((i) => {
    const a1 = (i / 4) * Math.PI * 2 - Math.PI / 2 + 0.42;
    const a2 = ((i + 1) / 4) * Math.PI * 2 - Math.PI / 2 - 0.42;
    return `<path d="M${(240 + Math.cos(a1) * 120).toFixed(1)} ${(200 + Math.sin(a1) * 120).toFixed(1)} A120 120 0 0 1 ${(240 + Math.cos(a2) * 120).toFixed(1)} ${(200 + Math.sin(a2) * 120).toFixed(1)}" stroke="url(#gp)" stroke-width="2.5" fill="none" marker-end="url(#arrow)"/>`;
  }).join("\n  ")}
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M0 0 L10 5 L0 10 z" fill="${C.accent}"/>
    </marker>
  </defs>
  <g transform="translate(240 200)">
    <circle r="46" fill="${C.paper}" stroke="${C.ink}" stroke-opacity="0.10"/>
    <text text-anchor="middle" y="-2" font-family="system-ui,sans-serif" font-size="13" font-weight="700" fill="${C.ink}">Blind</text>
    <text text-anchor="middle" y="16" font-family="system-ui,sans-serif" font-size="11" fill="${C.ink}" opacity="0.55">review</text>
  </g>
</svg>`,
);

// ── 5. Analytics ────────────────────────────────────────────────────────────
const bars = [42, 68, 55, 88, 74, 96, 82];
write(
  "feature-analytics.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 400" fill="none" role="img" aria-label="Dashboard showing similarity trends over a semester">
  ${defs("a")}
  <rect x="30" y="40" width="420" height="300" rx="18" fill="${C.paper}" stroke="${C.ink}" stroke-opacity="0.10"/>
  ${[0, 1, 2, 3].map((i) => `<line x1="60" y1="${100 + i * 55}" x2="420" y2="${100 + i * 55}" stroke="${C.ink}" stroke-opacity="0.07"/>`).join("\n  ")}
  ${bars.map((h, i) => `<rect x="${74 + i * 50}" y="${300 - h * 2}" width="26" height="${h * 2}" rx="7" fill="url(#ga)" opacity="${0.5 + i * 0.07}"/>`).join("\n  ")}
  <polyline points="${bars.map((h, i) => `${87 + i * 50},${300 - h * 2 - 14}`).join(" ")}" fill="none" stroke="${C.accent2}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  ${bars.map((h, i) => `<circle cx="${87 + i * 50}" cy="${300 - h * 2 - 14}" r="4.5" fill="${C.paper}" stroke="${C.accent2}" stroke-width="2.5"/>`).join("\n  ")}
  <rect x="60" y="60" width="110" height="10" rx="5" fill="${C.ink}" opacity="0.14"/>
</svg>`,
);

// ── 6. Humanizer: robotic text becoming natural ─────────────────────────────
write(
  "feature-humanizer.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 400" fill="none" role="img" aria-label="Uniform machine-like text transformed into varied natural prose">
  ${defs("hu")}
  <g transform="translate(24 90)">
    <rect width="180" height="220" rx="14" fill="${C.paper}" stroke="${C.ink}" stroke-opacity="0.10"/>
    <text x="16" y="30" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="${C.ink}" opacity="0.45">BEFORE</text>
    ${Array.from({ length: 7 }, (_, i) => `<rect x="16" y="${48 + i * 22}" width="148" height="8" rx="4" fill="${C.ink}" opacity="0.16"/>`).join("\n    ")}
  </g>
  <g transform="translate(212 180)">
    <circle r="28" fill="url(#ghu)"/>
    <path d="M-9 0 h18 M2 -7 l7 7 l-7 7" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
  <g transform="translate(276 90)">
    <rect width="180" height="220" rx="14" fill="${C.paper}" stroke="${C.accent2}" stroke-opacity="0.45"/>
    <text x="16" y="30" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="${C.accent2}">AFTER</text>
    ${[148, 96, 132, 72, 148, 110, 60].map((w, i) => `<rect x="16" y="${48 + i * 22}" width="${w}" height="8" rx="4" fill="${C.accent2}" opacity="${0.28 + (i % 3) * 0.14}"/>`).join("\n    ")}
  </g>
</svg>`,
);

// ── 7. Empty state ──────────────────────────────────────────────────────────
write(
  "empty-box.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none" role="img" aria-label="An empty tray">
  ${defs("em")}
  <ellipse cx="120" cy="150" rx="72" ry="10" fill="${C.ink}" opacity="0.07"/>
  <path d="M56 78 h128 l-14 60 a8 8 0 0 1 -8 6 h-84 a8 8 0 0 1 -8 -6 z" fill="${C.paper}" stroke="${C.ink}" stroke-opacity="0.18" stroke-width="2"/>
  <path d="M48 62 h144 a6 6 0 0 1 6 6 v10 a6 6 0 0 1 -6 6 h-144 a6 6 0 0 1 -6 -6 v-10 a6 6 0 0 1 6 -6z" fill="url(#gem)" opacity="0.22" stroke="${C.brand}" stroke-opacity="0.3" stroke-width="2"/>
  <circle cx="120" cy="40" r="4" fill="${C.brand}" opacity="0.4"/>
  <circle cx="96" cy="30" r="3" fill="${C.accent}" opacity="0.35"/>
  <circle cx="146" cy="32" r="3" fill="${C.accent2}" opacity="0.35"/>
</svg>`,
);

// ── 8. 404 ──────────────────────────────────────────────────────────────────
write(
  "not-found.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 260" fill="none" role="img" aria-label="A page that could not be found">
  ${defs("nf")}
  <circle cx="210" cy="120" r="96" fill="url(#gnf)" opacity="0.14"/>
  <text x="210" y="152" text-anchor="middle" font-family="system-ui,sans-serif" font-size="96" font-weight="800" fill="url(#gnf)" opacity="0.75">404</text>
  <circle cx="86" cy="66" r="6" fill="${C.brand}" opacity="0.5"/>
  <circle cx="342" cy="192" r="8" fill="${C.accent}" opacity="0.45"/>
  <circle cx="330" cy="60" r="5" fill="${C.accent2}" opacity="0.5"/>
</svg>`,
);

// ── 9. Avatars for testimonials — abstract, not real people ─────────────────
const avatarPalette = [
  [C.brand, C.brandLight],
  [C.accent, "#c39bff"],
  [C.accent2, "#7fe4ea"],
  ["#e0873a", "#f6c48a"],
];
avatarPalette.forEach(([a, b], i) => {
  write(
    `avatar-${i + 1}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="Abstract profile illustration">
  <defs><linearGradient id="av${i}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${a}"/><stop offset="100%" stop-color="${b}"/>
  </linearGradient></defs>
  <rect width="96" height="96" rx="48" fill="url(#av${i})"/>
  <circle cx="48" cy="38" r="15" fill="#fff" opacity="0.92"/>
  <path d="M20 84 a28 28 0 0 1 56 0 z" fill="#fff" opacity="0.92"/>
</svg>`,
  );
});

// ── 10. University crests for the logo strip — fictional institutions ───────
const crests = [
  ["Northgate University", C.brand],
  ["Lakeside Institute", C.accent],
  ["Meridian College", C.accent2],
  ["Ashford Polytechnic", "#e0873a"],
  ["Kingsbridge University", "#12784a"],
];
crests.forEach(([name, colour], i) => {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  write(
    `crest-${i + 1}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 48" role="img" aria-label="${name}">
  <path d="M12 6 h26 a4 4 0 0 1 4 4 v18 c0 8 -8 13 -17 16 c-9 -3 -17 -8 -17 -16 v-18 a4 4 0 0 1 4 -4z" fill="${colour}" opacity="0.16"/>
  <path d="M12 6 h26 a4 4 0 0 1 4 4 v18 c0 8 -8 13 -17 16 c-9 -3 -17 -8 -17 -16 v-18 a4 4 0 0 1 4 -4z" fill="none" stroke="${colour}" stroke-width="1.5" opacity="0.7"/>
  <text x="25" y="28" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" font-weight="700" fill="${colour}">${initials}</text>
  <text x="54" y="29" font-family="system-ui,sans-serif" font-size="14" font-weight="600" fill="currentColor">${name}</text>
</svg>`,
  );
});

// ── 11. Open Graph card ─────────────────────────────────────────────────────
write(
  "og.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" role="img" aria-label="AI-AIMS">
  ${defs("og")}
  <rect width="1200" height="630" fill="${C.ink}"/>
  <circle cx="250" cy="180" r="240" fill="${C.brand}" opacity="0.35" filter="url(#bog)"/>
  <circle cx="950" cy="470" r="240" fill="${C.accent}" opacity="0.30" filter="url(#bog)"/>
  <text x="80" y="300" font-family="system-ui,sans-serif" font-size="78" font-weight="800" fill="#fff">AI-AIMS</text>
  <text x="80" y="368" font-family="system-ui,sans-serif" font-size="32" fill="#fff" opacity="0.72">Academic Integrity &amp; Assignment Management</text>
  <text x="80" y="440" font-family="system-ui,sans-serif" font-size="24" fill="${C.accent2}">Semantic plagiarism detection · Writing feedback · Peer review</text>
</svg>`,
);

console.log("\nAssets generated.");
