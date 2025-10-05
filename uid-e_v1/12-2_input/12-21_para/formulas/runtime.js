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
 * Updated:  2025-10-01
 * Version:  6.0.0
 * Changelog:
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
 * @param {object|null} M    - Model-Params (R0, beta, gamma, D, sigma, L, N, I0, measures)
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
  const S0f  = N ? ((Math.max(0, (N - num(M.I0, 0))) / N)) : 1;
  const Re0  = R0 * (1 - m) * S0f;

  // -------- Slider-Karten --------
  // D
  const cD = HOST.querySelector('#fe-D');
  if (cD){
    setTextByClass(cD, 'fev-gamma', fmt(gamma,4));
    setTextByClass(cD, 'fev-D',     fmt(D,1));
  }

  // R0
  const cR0 = HOST.querySelector('#fe-R0');
  if (cR0){
    setTextByClass(cR0, 'fev-beta',  fmt(beta,4));
    setTextByClass(cR0, 'fev-gamma', fmt(gamma,4));
    setTextByClass(cR0, 'fev-R0',    fmt(R0,3));
  }

  // beta
  const cB = HOST.querySelector('#fe-beta');
  if (cB){
    setTextByClass(cB, 'fev-R0',    fmt(R0,3));
    setTextByClass(cB, 'fev-gamma', fmt(gamma,4));
    setTextByClass(cB, 'fev-beta',  fmt(beta,4));
  }

  // gamma
  const cG = HOST.querySelector('#fe-g');
  if (cG){
    setTextByClass(cG, 'fev-beta',  fmt(beta,4));
    setTextByClass(cG, 'fev-R0',    fmt(R0,3));
    setTextByClass(cG, 'fev-gamma', fmt(gamma,4));
  }

  // sigma (SEIR)
  const cS = HOST.querySelector('#fe-sigma');
  if (cS && finite(sigma)){
    if (finite(L)) setTextByClass(cS, 'fev-L', fmt(L,1));
    setTextByClass(cS, 'fev-sigma', fmt(sigma,4));
  }

  // -------- Abgeleitete Karten --------
  // beta_eff
  const cBE = HOST.querySelector('#fe-be');
  if (cBE){
    setTextByClass(cBE, 'fev-be-beta', fmt(beta,4));
    setTextByClass(cBE, 'fev-be-m',    fmt(m*100,1));
    setTextByClass(cBE, 'fev-be-val',  fmt(be,4));
  }

  // R_eff(t)
  const cRET = HOST.querySelector('#fe-ret');
  if (cRET){
    setTextByClass(cRET, 'fev-ret-r0',   fmt(R0,3));
    setTextByClass(cRET, 'fev-ret-m',    fmt(m*100,1));
    setTextByClass(cRET, 'fev-ret-frac', fmt(frac,3));
    setTextByClass(cRET, 'fev-ret-val',  fmt(Re_t,3));
  }

  // R_eff(0)
  const cRE0 = HOST.querySelector('#fe-re0');
  if (cRE0){
    setTextByClass(cRE0, 'fev-re0-r0',  fmt(R0,3));
    setTextByClass(cRE0, 'fev-re0-m',   fmt(m*100,1));
    setTextByClass(cRE0, 'fev-re0-s0f', fmt(S0f,3));
    setTextByClass(cRE0, 'fev-re0-val', fmt(Re0,3));
  }
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
