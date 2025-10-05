/*!
 * File:      /12-3_presentation/kpi/common/style/tokens.js
 * Project:   UID-Explore · Presentation Layer · KPI Tool — Common · Style
 * Role:      Token-Auflösung & Defaults (S/E/I/R/D/V-Akzente, Rails/Outline, Radii, Gaps, Icon/Dot-Size)
 * Type:      Open Educational Resource (OER) · ESM
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-03
 * Version:   3.1.0
 * Changelog:
 *   - v3.1.0  Short-Header vereinheitlicht; Abschnittsgliederung ergänzt; Verhalten unverändert.
 *   - v3.0.0  Extrahiert aus kpi.style.js (v1.4.x): Token-Auflösung & Defaults.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1) Version
// ─────────────────────────────────────────────────────────────────────────────
export const VERSION = '3.1.0';

// ─────────────────────────────────────────────────────────────────────────────
// 2) Utility: CSS-Variablen lesen
// ─────────────────────────────────────────────────────────────────────────────
/** Lies eine CSS-Variable (computed) von einem Node. */
export function getVar(node, name){
  if (!node) return '';
  const v = getComputedStyle(node).getPropertyValue(name);
  return v ? v.trim() : '';
}

// ─────────────────────────────────────────────────────────────────────────────
// 3) Defaults anwenden (konservativ, Host-first)
// ─────────────────────────────────────────────────────────────────────────────
/** Setzt konservative Defaults für KPI-Widgets, falls am Host nicht vorhanden. */
export function applyWidgetDefaults(host){
  const root   = document.documentElement;
  const radius = getVar(host,'--radius-lg') || getVar(root,'--radius-lg') || '16px';

  if (!getVar(host,'--kpi-gap'))          host.style.setProperty('--kpi-gap','10px');
  if (!getVar(host,'--kpi-radius'))       host.style.setProperty('--kpi-radius', radius);
  if (!getVar(host,'--kpi-dot-size'))     host.style.setProperty('--kpi-dot-size','8px');
  if (!getVar(host,'--kpi-ico-size'))     host.style.setProperty('--kpi-ico-size','13px');
  if (!getVar(host,'--kpi-rail-gray'))    host.style.setProperty('--kpi-rail-gray','rgba(140,150,165,.55)');
  if (!getVar(host,'--kpi-outline-gray')) host.style.setProperty('--kpi-outline-gray','rgba(170,180,195,.85)');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4) Akzentpalette auflösen (Host → :root → Fallback)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Liefert die Akzentpalette für S/E/I/R sowie D/V und Rail/Outline.
 * Auflösung: Host → :root → Fallback.
 */
export function resolveAccents(host){
  const root = document.documentElement;
  const pick = (name, fb) => getVar(host, name) || getVar(root, name) || fb;

  return {
    S: pick('--c-s', '#22c55e'),
    E: pick('--c-e', '#f59e0b'),
    I: pick('--c-i', '#ef4444'),
    R: pick('--c-r', '#3b82f6'),
    D: pick('--c-d', '#6b7280'),
    V: pick('--c-v', '#7c3aed'),
    railGray:    pick('--kpi-rail-gray',    'rgba(140,150,165,.55)'),
    outlineGray: pick('--kpi-outline-gray', 'rgba(170,180,195,.85)'),
  };
}
