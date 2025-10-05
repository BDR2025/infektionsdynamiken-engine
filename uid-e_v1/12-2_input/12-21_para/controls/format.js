/*! 
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Input Layer · Parameter Tool · Controls
 * File:     /parameters/controls/format.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-01
 * Updated:  2025-10-01
 * Version:  6.0.0
 * Changelog:
 *   - v6.0.0 Utility-Funktionen zentralisiert (fmt, clamp, num, safeInt, stepOf)
 *
 * eAnnotation:
 *   Stellt kompakte Helfer für Zahlformatierung und Bounds bereit.
 *   Dient der Duplikatsvermeidung in rows/sliders/runtime; keine Seiteneffekte.
 */

/** DE-Format mit fixen Nachkommastellen */
export function fmtFixed(x, digits=4){
  const n = Number(x);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: true
  }).format(n);
}

/** UI-Format (k/M, Ganzzahl-Erkennung) */
export function fmtUI(x){
  const n = Number(x);
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1_000_000) return (n/1_000_000).toFixed(2)+' M';
  if (Math.abs(n) >= 1_000)     return (n/1_000).toFixed(2)+' k';
  if (n % 1 === 0) return String(n);
  return n.toFixed(4);
}

export function num(x, d=0){ const n = Number(x); return Number.isFinite(n) ? n : d; }
export function safeInt(v, d=0){ const n = Number(v); return Number.isFinite(n) ? Math.round(n) : d; }

export function clamp(min, max, v){
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/** Default-Schrittweite, wenn keine im Katalog definiert ist */
export function stepOf(key, def){
  if (Number.isFinite(def?.step)) return def.step;
  switch(key){
    case 'R0': return 0.1;
    case 'beta':
    case 'gamma':
    case 'sigma':
    case 'measures': return 0.01;
    case 'D':  return 1;
    case 'N':
    case 'I0':
    case 'T':  return 1;
    case 'dt': return 0.25;
    default:   return 0.01;
  }
}
