/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Widget Logic (Styles)
 * File:     /uid/12-4_support/widgets/styles.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-03
 * Updated:  2025-10-03
 * Version:  1.4.2
 * Changelog:
 *   - v1.4.2  Repo-Polishing: Kopfzeile/Gliederung/Annotation.
 *              [Hub] .wa-menu ohne position:fixed (korrekte Host-Positionierung).
 *              [OFF] Chart: Selektor akzeptiert data-collapse="mini" und data-off-mode="mini".
 *
 * eAnnotation:
 *   Globale Styles für Widgets 2.0 (Header, Buttons, Segmented, Burger, Dropdown).
 *   Einmalige Injektion pro Seite via ensureWidgetStyles().
 */

'use strict';

/* ============================================================================
 * 1) Konstanten
 * -------------------------------------------------------------------------- */
const STYLE_ID = 'uid-widgets-v1';

/* ============================================================================
 * 2) Styles (CSS)
 * -------------------------------------------------------------------------- */
const CSS = `
:root{
  --wa-fg:            var(--uid-fg, #eaeef2);
  --wa-fg-muted:      color-mix(in oklab, var(--wa-fg) 70%, transparent);
  --wa-bg:            var(--uid-panel, rgba(255,255,255,0.04));
  --wa-border:        color-mix(in oklab, var(--wa-fg) 15%, transparent);
  --wa-active:        color-mix(in oklab, var(--wa-fg) 35%, transparent);
  --wa-shadow:        0 4px 14px rgba(0,0,0,.18);
  --wa-radius:        12px;
  --wa-gap:           8px;
  --wa-size:          28px;
  --wa-pad-x:         8px;
}

/* ---------------- Header ---------------- */
.uidw-header{
  display:flex; align-items:center; justify-content:space-between;
  gap:var(--wa-gap); padding:6px 8px; font-variant-numeric: tabular-nums;
  background: var(--wa-bg); border-bottom:1px solid var(--wa-border);
}
.uidw-left, .uidw-right{ display:flex; align-items:center; gap:var(--wa-gap); }
.uidw-title{ display:flex; align-items:baseline; gap:6px; }
.uidw-title .uidw-title-text{ font-weight:600; letter-spacing:.2px; }
.uidw-title small{ opacity:.75; font-weight:500; transform:translateY(.5px); }

.uidw-actions{ display:flex; align-items:center; gap:6px; }

/* ---------------- Buttons (Renderer) ---------------- */
.wa-btn{
  display:inline-flex; align-items:center; justify-content:center;
  min-width:var(--wa-size); height:var(--wa-size); padding:0 var(--wa-pad-x);
  background: transparent; border:1px solid var(--wa-border);
  border-radius: var(--wa-radius); cursor:pointer; color:var(--wa-fg);
}
.wa-btn:focus-visible{ outline:2px solid var(--wa-active); outline-offset:2px; }
.wa-btn[aria-pressed="true"]{ box-shadow: inset 0 0 0 2px var(--wa-active); }

.wa-iconbtn{ padding:0; width:var(--wa-size); }
.wa-ico{ display:inline-block; line-height:1; transform:translateY(-.5px); }
.wa-txt{ display:inline-block; line-height:1; }

/* ---------------- Segmented / Multitoggle ---------------- */
.wa-seg{ display:inline-flex; gap:6px; }
.wa-seg .wa-seg-btn{
  min-width:var(--wa-size); height:var(--wa-size); padding:0 10px;
  background:transparent; color:var(--wa-fg); border:1px solid var(--wa-border);
  border-radius: var(--wa-radius); cursor:pointer;
}
.wa-seg .wa-seg-btn.is-active{
  background:color-mix(in oklab, var(--wa-active) 50%, transparent);
  box-shadow: inset 0 0 0 1px var(--wa-active);
}
.wa-seg .wa-seg-btn:focus-visible{ outline:2px solid var(--wa-active); outline-offset: -2px; }

/* additive Segmente (Multi-Toggle) */
.wa-multi .wa-seg-btn.is-active{
  background:color-mix(in oklab, var(--wa-active) 55%, transparent);
}

/* ---------------- Burger / Power ---------------- */
.uidw-burger, .uidw-power{
  display:inline-flex; align-items:center; justify-content:center;
  width:var(--wa-size); height:var(--wa-size);
  border:1px solid var(--wa-border); border-radius:var(--wa-radius);
  background:transparent; color:var(--wa-fg); cursor:pointer;
}
.uidw-burger{ display:none; } /* wird bei Collapse sichtbar */
.uidw-burger:focus-visible, .uidw-power:focus-visible{ outline:2px solid var(--wa-active); outline-offset:2px; }
.uidw-power .ico{ width:14px; height:14px; border-radius:50%; background:var(--wa-fg); }

/* Collapse-Regeln (icon-only / Burger-Fold) */
.uidw-header[data-collapse-icon-only="true"] .wa-txt{ display:none; }
.uidw-header[data-collapse-actions="true"] .uidw-actions{ display:none; }
.uidw-header[data-collapse-actions="true"] .uidw-burger{ display:inline-flex; }

/* OFF-Mode: nur Power bleibt sichtbar */
.uidw-header[data-enabled="false"] .uidw-actions,
.uidw-header[data-enabled="false"] .uidw-burger,
.uidw-header[data-enabled="false"] .uidw-title small{ display:none !important; }

/* ---------------- Dropdown (Renderer) ---------------- */
.wa-dd{ position:relative; }

/* Wichtig: keine fixed-Positionierung, Overlay-Host bestimmt die Lage */
.wa-menu{
  /* keine position-Angabe → innerhalb des (absolut positionierten) Hub-Hosts */
  min-width:180px; max-width:280px;
  background:var(--wa-bg); border:1px solid var(--wa-border); border-radius:12px;
  box-shadow: var(--wa-shadow); padding:12px; box-sizing:border-box;
}
.wa-item{
  display:flex; align-items:center; gap:8px; padding:4px 10px;
  border-radius:10px; cursor:pointer; color:var(--wa-fg);
}
.wa-item[aria-checked="true"]{ background:color-mix(in oklab, var(--wa-active) 35%, transparent); }
.wa-item:hover{ background:color-mix(in oklab, var(--wa-active) 40%, transparent); }
.wa-check{ margin-left:auto; opacity:.9; }
.wa-item.selected .wa-check{ content:"✓"; }

/* Sections/Grids im Dropdown */
.wa-section{ display:flex; flex-direction:column; gap:6px; min-width:max-content; }
.wa-section-title{ font-weight:700; opacity:.9; margin:2px 0 8px; }
.wa-list{ display:flex; flex-direction:column; gap:4px; }

/* Trenner im Burger-Build (falls verwendet) */
#wa-menu .sep, .wa-menu .sep{ height:1px; background:var(--wa-border); margin:6px 0; }

/* ---------------- OFF-Mode Spezialfälle ---------------- */
/* Chart-Sonderfall: Mini-Mode im OFF-Zustand (kompatibel: data-collapse & historisch data-off-mode) */
#chart-widget[data-collapse="mini"] .uidw-actions,
#chart-widget[data-off-mode="mini"] .uidw-actions,
#chart-widget[data-collapse="mini"] .uidw-burger,
#chart-widget[data-off-mode="mini"] .uidw-burger,
#chart-widget[data-collapse="mini"] .uidw-title small,
#chart-widget[data-off-mode="mini"] .uidw-title small {
  display: none !important;
}
`;

/* ============================================================================
 * 3) Boot: Styles einmalig injizieren
 * -------------------------------------------------------------------------- */
export function ensureWidgetStyles(){
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}

/* ============================================================================
 * 4) Default-Export (Kompatibilität)
 * -------------------------------------------------------------------------- */
export default { ensureWidgetStyles };
