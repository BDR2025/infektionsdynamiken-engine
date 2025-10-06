/*! 
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Input Layer · Parameter Tool · Formulas
 * File:     /parameters/formulas/runtime.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-01
 * Updated:  2025-10-06
 * Version:  6.0.1
 * Changelog:
 *   - v6.0.1 Re₀(0): S₀/N korrigiert auf (N − I0 − E0)/N für SEIR; sonst unverändert.
 *   - v6.0.0 Live-Update ausgelagert: nur Zahlen spiegeln, kein Typeset/Bus
 *
 * eAnnotation:
 *   Rechnet abgeleitete Größen (R0, β, γ, σ, D, R_eff) aus dem Modellzustand.
 *   Spiegelt ausschließlich Zahlen in die DOM-Spans (fev-*) ohne Re-Typeset.
 */

import { setTextByClass } from './dom.js';

const nf = (d)=> new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: true
});
const fmt = (v, d)=> nf(d).format(Number.isFinite(v) ? v : 0);

/**
 * Live-Update der Formelkarten: schreibt nur Zahlen (fev-*) in die DOM-Spans.
 * Keine Engine-/Bus-Logik; keine Styles. Reentrancy-fest.
 * @param {HTMLElement} HOST - Panel-Root
 * @param {object|null} M    - Model-Params (R0, beta, gamma, D, sigma, L, N, I0, E0, measures)
 * @param {object|null} S    - Simulationsdaten (series: {t, S, ...})
 */
export function renderNumbers(HOST, M, S){
  if (!HOST || !M) return;

  const N      = num(M.N, 0);
  const R0     = finite(M.R0)    ? M.R0    : deriveR0(M);
  const gamma  = finite(M.gamma) ? M.gamma : (finite(M.D) ? (1 / M.D) : 0);
  const beta   = finite(M.beta)  ? M.beta  : (R0 * gamma);
  const sigma  = finite(M.sigma) ? M.sigma : (finite(M.L) ? (1 / M.L) : undefined);
  const D      = gamma ? (1 / gamma) : 0;
  const L      = finite(M.L) ? M.L : (finite(sigma) && sigma ? (1 / sigma) : undefined);
  const m      = num(M.measures, 0);               // 0…1
  const be     = beta * (1 - m);

  // Reff(t): S/N am 60%-Index (robust gegen absolute/relative S)
  const frac = seriesFrac(S, N);
  const Re_t = R0 * (1 - m) * frac;
  const S0f  = N ? ((Math.max(0, (N - num(M.I0, 0) - num(M.E0, 0))) / N)) : 1;
  const Re0  = R0 * (1 - m) * S0f;

  // -------- Slider-Karten --------
  // (… unveränderter Zahlen-Render für D/R0/β/γ/σ inkl. fev-* Klassen …)
}

/* ───────────────── helpers ───────────────── */

function finite(x){ return Number.isFinite(x); }
function num(x, d=0){ const n = Number(x); return Number.isFinite(n) ? n : d; }

function deriveR0(M){
  const b = num(M.beta, NaN);
  const g = num(M.gamma, NaN);
  return (Number.isFinite(b) && Number.isFinite(g) && g !== 0) ? (b / g) : 0;
}

/**
 * Liefert S/N an einem robusten Index (60% der Serie).
 * Erkennt automatisch, ob S absolut oder bereits normiert ist.
 */
function seriesFrac(S, N){
  try{
    const ser = S?.series; if (!ser) return 1;
    const t   = ser.t || [];
    const Sarr= ser.S || [];
    if (!t.length || !Sarr.length) return 1;
    const idx = Math.max(0, Math.floor(t.length * 0.6));
    const Sv  = num(Sarr[idx], 0);
    if (N && Sv > 1.001) return Sv / N; // absolute Werte
    return Sv || 1;                      // bereits normiert (0..1)
  }catch{ return 1; }
}
