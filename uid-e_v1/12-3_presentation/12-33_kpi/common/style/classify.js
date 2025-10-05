/*!
 * File:      /12-3_presentation/kpi/common/style/classify.js
 * Project:   UID-Explore · Presentation Layer · KPI Tool — Common · Style
 * Role:      Kartenklassifikation (Comp/Assoc/Metric) + Secondary-Normalisierung + Icon-Bindings
 * Type:      Open Educational Resource (OER) · ESM
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-03
 * Version:   3.1.0
 * Changelog:
 *   - v3.1.0  Short-Header vereinheitlicht; Abschnittsgliederung ergänzt; Verhalten unverändert.
 *   - v3.0.0  Extrahiert: Kartenklassifikation (Comp/Assoc/Metric) + Secondary-Normalisierung + Icon-Bindings.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1) Imports & Version
// ─────────────────────────────────────────────────────────────────────────────
import { svgIcon } from './icons.js';
export const VERSION = '3.1.0';

// ─────────────────────────────────────────────────────────────────────────────
// 2) Konstanten & Regex
// ─────────────────────────────────────────────────────────────────────────────
export const COMP_IDS = new Set([
  'S_t','E_t','I_t','R_t','D_t','V_t',
  'S','E','I','R','D','V',
  'Sperc','Eperc','Iperc','Rperc','Dperc','Vperc'
]);

// Titel/Label-Erkennung
const reCompTitle = /^\s*([SEIRDV])\s*\(\s*t\s*\)/i;
const reReffTitle = /R\s*[_\s]*e?ff/i;
const reTHITTitle = /t\s*[\{_]?HIT/i;
const reTPeak     = /t[^A-Za-z]{0,3}peak/i;
const rePeakI     = /(?:\bI[-\s]?Peak\b)|t[^A-Za-z]{0,3}peak[^A-Z]*\(\s*I\s*\)/i;
const rePeakE     = /(?:\bE[-\s]?Peak\b)|t[^A-Za-z]{0,3}peak[^A-Z]*\(\s*E\s*\)/i;

// ─────────────────────────────────────────────────────────────────────────────
// 3) Secondary-Normalisierung
// ─────────────────────────────────────────────────────────────────────────────
/** Sekundärzeile ausblenden/flaggen, wenn leer/Strich/Geviertstrich. */
export function normalizeSecondary(host){
  host.querySelectorAll('.kpi-card').forEach(card=>{
    const sec = card.querySelector('.kpi-secondary');
    const raw = (sec?.textContent || '').replace(/\s+/g,'');
    card.dataset.secondary = (!raw || raw==='—' || raw==='-' || raw==='–') ? 'empty' : 'present';
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4) Icon-Bindings (abhängig von Metrik)
// ─────────────────────────────────────────────────────────────────────────────
/** Kleiner Helper: Icon erzeugen/binden abhängig von Metrik. */
function ensureIcon(card, kind, ACC){
  const idRaw   = (card.getAttribute('data-id')||'').trim();
  const idNorm  = idRaw.toLowerCase().replace(/[^a-z0-9]/g,'');
  const title   = (card.querySelector('.kpi-title')?.textContent || '').trim();

  let type = null, color = null;

  if (reReffTitle.test(title) || idNorm==='reff' || idNorm==='refft') {
    type = 'arrow';
  } else if (reTHITTitle.test(title) || idNorm==='thit' || idNorm==='t_hit') {
    type = 'bullseye';
  } else if (/Attack/i.test(title) || idNorm==='attack' || idNorm==='attackrate') {
    type = 'heart'; color = ACC.I;
  } else if (reTPeak.test(title) || idNorm.includes('tpeak')) {
    type = 'clock';
  }

  const val = card.querySelector('.kpi-value');
  if (!val) return;

  // Icon entfernen, wenn keines benötigt
  let ico = card.querySelector(':scope .kpi-ico');
  if (!type){ if (ico) ico.remove(); return; }

  // Icon erzeugen (falls fehlt) und vorn einfügen
  if (!ico){ ico = svgIcon(type); if (!ico) return; val.insertBefore(ico, val.firstChild); }

  // Farbe synchronisieren
  const css = getComputedStyle(card);
  const rail = (css.getPropertyValue('--kpi-rail-color') || '').trim();
  const c = (color || rail);
  if (c) ico.style.color = c;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5) Hauptklassifikation (Kind, Rails/Dots/Outline, Icons)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Klassifiziert KPI-Karten (Compartment/Assoc/Metric), setzt Rails/Dots/Outline
 * und bindet passende Icons. Wird vom Style-Controller nach jedem Render aufgerufen.
 */
export function classifyCards(host, ACC){
  const gray  = ACC.railGray;
  const oGray = ACC.outlineGray;

  host.querySelectorAll('.kpi-card').forEach(card=>{
    const id    = card.getAttribute('data-id') || '';
    const title = (card.querySelector('.kpi-title')?.textContent || '').trim();

    let kind   = 'metric';
    let letter = null;

    if (COMP_IDS.has(id)) {
      kind = 'comp'; letter = id[0].toUpperCase();
    } else {
      const m = title.match(reCompTitle);
      if (m && !reReffTitle.test(title)) { kind='comp'; letter=(m[1]||'').toUpperCase(); }
    }
    if (kind !== 'comp') {
      if (rePeakI.test(title)) { kind='assoc'; letter='I'; }
      else if (rePeakE.test(title)) { kind='assoc'; letter='E'; }
    }

    card.dataset.kind = kind;

    if (kind==='comp' || kind==='assoc'){
      const col = (ACC[letter] || gray).trim();
      card.style.setProperty('--kpi-rail-color', col);
      // Basisbreiten; statische Decks überschreiben per CSS-Var (siehe CSS)
      card.style.setProperty('--kpi-rail-w', kind==='comp' ? '8px' : '6px');
      card.style.setProperty('--kpi-outline', col);

      if (kind==='comp'){
        card.style.setProperty('--kpi-dot-color', col);
        card.style.setProperty('--kpi-dot-visible', '1');
      } else {
        card.style.removeProperty('--kpi-dot-color');
        card.style.setProperty('--kpi-dot-visible', '0');
      }
    } else {
      card.style.setProperty('--kpi-rail-color', gray);
      card.style.setProperty('--kpi-rail-w', '4px');
      card.style.setProperty('--kpi-outline', oGray);
      card.style.removeProperty('--kpi-dot-color');
      card.style.setProperty('--kpi-dot-visible', '0');
    }

    ensureIcon(card, kind, ACC);
  });

  normalizeSecondary(host);
}
