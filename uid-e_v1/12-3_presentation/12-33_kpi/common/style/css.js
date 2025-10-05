/*!
 * File:      /12-3_presentation/kpi/common/style/css.js
 * Project:   UID-Explore · Presentation Layer · KPI Tool — Common · Style
 * Role:      CSS-Generator (scoped) für KPI-Decks (Grid, Cards, States)
 * Type:      Open Educational Resource (OER) · ESM
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-03
 * Version:   3.1.0
 * Changelog:
 *   - v3.1.0  Short-Header vereinheitlicht; Abschnittsgliederung; Verhalten unverändert.
 *   - v3.0.0  Aus kpi.style.js extrahiert; Feintuning für statische Decks.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1) Public API: makeCSS(scopeSelector, cols)
// ─────────────────────────────────────────────────────────────────────────────
export function makeCSS(SCOPE, cols){
  const n = Math.max(1, parseInt(cols,10) || 4);
  return `
${SCOPE} .widget-body{
  display:grid !important;
  grid-template-columns:repeat(${n},minmax(0,1fr))!important;
  grid-auto-flow:row dense;
  gap:var(--kpi-gap,10px);
}
${SCOPE} .kpi-deck{ display:contents !important; }

${SCOPE} .kpi-card{
  position:relative; overflow:clip;
  border-radius:var(--kpi-radius,16px);
  background:linear-gradient(180deg,rgba(21,30,40,.72),rgba(21,30,40,.60));
  border:1px solid rgba(255,255,255,.06);
  -webkit-backdrop-filter:saturate(1.1) blur(2px);
  backdrop-filter:saturate(1.1) blur(2px);
  box-shadow:0 6px 18px rgba(0,0,0,.40);
  padding:12px 14px 12px 16px;
  transition:box-shadow .18s ease,border-color .18s ease,transform .18s ease;
  color:#fff;
}
${SCOPE} .kpi-card:is(:hover,:focus-within){
  box-shadow:0 10px 24px rgba(0,0,0,.50), 0 0 0 1px var(--kpi-outline,var(--kpi-outline-gray));
  border-color:color-mix(in srgb,var(--kpi-outline,var(--kpi-outline-gray)) 28%, rgba(255,255,255,.06));
  transform:translateY(-1px);
}

${SCOPE} .kpi-card::before{
  content:""; position:absolute; inset:0 auto 0 0; width:var(--kpi-rail-w,4px);
  background:var(--kpi-rail-color,var(--kpi-rail-gray));
}
${SCOPE} .kpi-card::after{
  content:""; position:absolute; inset:0; pointer-events:none;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.04), inset 0 -1px 0 rgba(0,0,0,.35);
}

/* Titel & Dot */
${SCOPE} .kpi-title{
  position:relative; line-height:1.2; padding-left:calc(var(--kpi-dot-size,8px) + 8px);
  margin:0 0 4px 0; font-size:12px; letter-spacing:.1px; opacity:.9;
}
${SCOPE} .kpi-title::before{
  content:""; position:absolute; left:0; top:.9em; width:var(--kpi-dot-size,8px); height:var(--kpi-dot-size,8px);
  margin-top:calc(-.5 * var(--kpi-dot-size,8px)); border-radius:999px;
  background:var(--kpi-dot-color,transparent);
  box-shadow:0 0 0 3px color-mix(in srgb,var(--kpi-dot-color,transparent) 24%, transparent);
  opacity:var(--kpi-dot-visible,0);
  transition:opacity .18s ease;
}

/* Wert & Sekundär */
${SCOPE} .kpi-value{
  font-variant-numeric:tabular-nums; font-feature-settings:"tnum" 1;
  font-size:clamp(18px,2vw,22px); line-height:1.15; font-weight:600; color:#fff;
  display:inline-flex; align-items:baseline; gap:8px;
}
${SCOPE} .kpi-unit{ opacity:.85; font-size:12px; margin-left:2px; }
${SCOPE} .kpi-secondary{ margin-top:4px; font-size:12px; opacity:.78; font-variant-numeric:tabular-nums; color:color-mix(in srgb,#fff 78%, transparent); }

${SCOPE}[data-format="pct"] .kpi-secondary,
${SCOPE}[data-format="abs"] .kpi-secondary,
${SCOPE} .kpi-card[data-secondary="empty"] .kpi-secondary{ display:none !important; }

${SCOPE}[data-reduced="true"] .kpi-title{
  color:transparent !important; -webkit-text-fill-color:transparent !important; text-shadow:none !important;
  margin:0; min-height:0; padding-left:0;
}
${SCOPE}[data-reduced="true"] .kpi-title::before{ opacity:0; }
${SCOPE}[data-reduced="true"] .kpi-value{ align-items:center; line-height:1; }

${SCOPE} .kpi-ico{ display:none; width:var(--kpi-ico-size,13px); height:var(--kpi-ico-size,13px);
  margin-right:8px; color:var(--kpi-ico-color,currentColor); }
${SCOPE}[data-reduced="true"] .kpi-ico{ display:inline-block; }

${SCOPE}[data-reduced="true"] .kpi-card[data-kind="comp"] .kpi-value::before{
  content:""; display:inline-block; width:var(--kpi-dot-size,8px); height:var(--kpi-dot-size,8px);
  border-radius:999px; background:var(--kpi-dot-color,transparent);
  box-shadow:0 0 0 3px color-mix(in srgb, var(--kpi-dot-color,transparent) 24%, transparent);
  opacity:var(--kpi-dot-visible,0);
}

${SCOPE} .kpi-deck[data-kind="static"]{ --kpi-gap: 8px; --kpi-dot-size: 6px; }
${SCOPE} .kpi-deck[data-kind="static"] .kpi-card{ padding:10px 12px 10px 14px; }
${SCOPE} .kpi-deck[data-kind="static"] .kpi-title{ font-size:11px; opacity:.95; margin:0 0 2px 0; }
${SCOPE} .kpi-deck[data-kind="static"] .kpi-value{ font-size:clamp(16px,1.8vw,18px); font-weight:500; }
${SCOPE} .kpi-deck[data-kind="static"] .kpi-unit{ font-size:11px; }
${SCOPE} .kpi-deck[data-kind="static"] .kpi-secondary{ font-size:11px; margin-top:3px; }
${SCOPE} .kpi-deck[data-kind="static"] .kpi-card[data-kind="comp"]{  --kpi-rail-w: 6px; }
${SCOPE} .kpi-deck[data-kind="static"] .kpi-card[data-kind="assoc"]{ --kpi-rail-w: 4px; }
`;
}
