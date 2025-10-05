/*!
 * File:      /12-3_presentation/kpi/common/compute/format.js
 * Project:   UID-Explore · Presentation Layer · KPI Tool — Common · Compute
 * Role:      Formatter/Context + LIVE-Format-State (Rel/Abs/Hybrid)
 * Type:      Open Educational Resource (OER) · ESM
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-03
 * Version:   3.1.0
 * Changelog:
 *   - v3.1.0  Short-Header vereinheitlicht, Gliederung/Kommentare ergänzt; Verhalten unverändert.
 *   - v3.0.0  Extrahiert aus compute.js (v2.4.2): Formatter/Context + LIVE_FORMAT-State.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1) Version
// ─────────────────────────────────────────────────────────────────────────────
export const VERSION = '3.1.0';

// ─────────────────────────────────────────────────────────────────────────────
// 2) Formatter (Intl.NumberFormat)
// ─────────────────────────────────────────────────────────────────────────────
const NF = (loc) => ({
  int: new Intl.NumberFormat(loc),
  d1:  new Intl.NumberFormat(loc, { minimumFractionDigits:1, maximumFractionDigits:1 }),
  d3:  new Intl.NumberFormat(loc, { minimumFractionDigits:3, maximumFractionDigits:3 }),
});

// ─────────────────────────────────────────────────────────────────────────────
// 3) Kontext & Fallback-Resolver
// ─────────────────────────────────────────────────────────────────────────────
export function makeContext(locale='de') {
  const loc = (String(locale).toLowerCase().startsWith('de')) ? 'de-DE' : 'en-US';
  return { loc, fmt: NF(loc) };
}

/** Back-Compat: akzeptiert {fmt} ODER {ctx:{fmt}} */
export function resolveFmt(arg){
  return arg?.fmt || arg?.ctx?.fmt || NF('de-DE');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4) LIVE-Formatmodus (State + Setter)
// ─────────────────────────────────────────────────────────────────────────────
export let LIVE_FORMAT = 'pct'; // 'pct' | 'abs' | 'hybrid'

export function setLiveFormat(mode='pct'){
  const m = String(mode||'').toLowerCase();
  LIVE_FORMAT = (m==='abs'||m==='hybrid') ? m : 'pct';
}

// ─────────────────────────────────────────────────────────────────────────────
// 5) Zentraler Rel/Abs-Formatter
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Formatiert relative/absolute Werte gemäß LIVE_FORMAT.
 * @param {object} args  beliebiges Objekt; resolveFmt(args) liefert den Formatter
 * @param {object} param { abs:number|null, rel:number|null }
 * @returns {{ value:string, secondary:string, unit:string }}
 */
export function fmtRelAbs(args, { abs, rel }){
  const fmt = resolveFmt(args);
  const vAbs = Number.isFinite(abs) ? Math.round(abs) : null;
  const vRel = Number.isFinite(rel) ? rel : null;

  if (LIVE_FORMAT === 'abs') {
    return { value: (vAbs==null ? '—' : fmt.int.format(vAbs)), secondary:'—', unit:'' };
  }
  if (LIVE_FORMAT === 'hybrid') {
    return {
      value: (vRel==null ? '—' : fmt.d1.format(vRel) + ' %'),
      secondary: (vAbs==null ? '—' : '≈ ' + fmt.int.format(vAbs)),
      unit:''
    };
  }
  // default 'pct'
  return { value: (vRel==null ? '—' : fmt.d1.format(vRel) + ' %'), secondary:'—', unit:'' };
}
