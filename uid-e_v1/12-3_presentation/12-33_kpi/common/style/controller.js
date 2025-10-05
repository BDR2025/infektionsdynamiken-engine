/*!
 * File:      /12-3_presentation/kpi/common/style/controller.js
 * Project:   UID-Explore · Presentation Layer · KPI Tool — Common · Style
 * Role:      Style-Controller (Host-Scoped CSS, Columns, Klassifikation)
 * Type:      Open Educational Resource (OER) · ESM
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-03
 * Version:   3.1.0
 * Changelog:
 *   - v3.1.0  Short-Header vereinheitlicht; Abschnittsgliederung; Verhalten unverändert.
 *   - v3.0.0  Single-Attach-Guard, host-scoped Styles (data-kpi-style), forceCols, Static-Feintuning.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1) Imports & Version
// ─────────────────────────────────────────────────────────────────────────────
import { makeCSS } from './css.js';
import { applyWidgetDefaults, resolveAccents } from './tokens.js';
import { classifyCards, normalizeSecondary } from './classify.js';

export const KPI_STYLE_VERSION = '3.1.0';

// ─────────────────────────────────────────────────────────────────────────────
// 2) Utilities
// ─────────────────────────────────────────────────────────────────────────────
function uid(prefix='kps'){ return `${prefix}-${Math.random().toString(36).slice(2,8)}`; }

// ─────────────────────────────────────────────────────────────────────────────
// 3) Public API: attachKPIStyle(host, {forceCols})
// ─────────────────────────────────────────────────────────────────────────────
export default function attachKPIStyle(host, { forceCols=4 } = {}){
  host = host || document.querySelector('.widget.widget-kpi');
  if (!host) throw new Error('[kpi.style] Host not found (.widget.widget-kpi)');

  // 3.1) Single-Attach-Guard (scoped via data-kpi-style)
  let scopeId = host.getAttribute('data-kpi-style');
  if (!scopeId){ scopeId = uid(); host.setAttribute('data-kpi-style', scopeId); }

  // 3.2) Defaults & Accent-Palette
  applyWidgetDefaults(host);
  let ACCENT = resolveAccents(host);

  // 3.3) Alte Fremd-Scopes säubern
  Array.from(host.querySelectorAll(':scope > style[data-kpi-style-id]')).forEach(s=>{
    const sid = s.getAttribute('data-kpi-style-id');
    if (sid && sid !== scopeId) { try{ s.remove(); }catch{} }
  });

  // 3.4) Scoped <style> erzeugen/aktualisieren
  let styleEl = host.querySelector(`:scope > style[data-kpi-style-id="${scopeId}"]`);
  const scopeSel    = `.widget.widget-kpi[data-kpi-style="${scopeId}"]`;
  const desiredCols = Math.max(1, parseInt(forceCols,10) || 4);

  if (!styleEl){
    styleEl = document.createElement('style');
    styleEl.setAttribute('data-kpi-style-id', scopeId);
    styleEl.textContent = makeCSS(scopeSel, desiredCols);
    host.prepend(styleEl);
  } else {
    const m = styleEl.textContent.match(/grid-template-columns\s*:\s*repeat\(\s*(\d+)/i);
    const current = m ? parseInt(m[1],10) : NaN;
    if (!Number.isFinite(current) || current !== desiredCols){
      styleEl.textContent = makeCSS(scopeSel, desiredCols);
    }
  }

  // 3.5) Host-Metadaten und Erstklassifikation
  const body = host.querySelector('.widget-body') || host;
  body.setAttribute('data-cols', String(desiredCols));
  classifyCards(host, ACCENT);

  // 3.6) Live-Klassifikation via MutationObserver
  const mo = new MutationObserver(()=> { classifyCards(host, ACCENT); });
  mo.observe(host, { subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['data-id','class'] });

  // 3.7) Controller-Objekt
  return {
    version: KPI_STYLE_VERSION,
    host,
    setTokens(partial={}){ for (const [k,v] of Object.entries(partial)) host.style.setProperty(`--${k}`, String(v)); classifyCards(host, ACCENT); return this; },
    setAccents(partial={}){ ACCENT = { ...ACCENT, ...partial }; classifyCards(host, ACCENT); return this; },
    classify(){ classifyCards(host, ACCENT); return this; },
    normalizeSecondary(){ normalizeSecondary(host); return this; },
    destroy(){ mo.disconnect(); if (styleEl && styleEl.parentNode===host) styleEl.remove(); }
  };
}
