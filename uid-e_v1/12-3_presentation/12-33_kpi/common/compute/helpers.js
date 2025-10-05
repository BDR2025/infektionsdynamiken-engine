/*!
 * File:      /12-3_presentation/kpi/common/compute/helpers.js
 * Project:   UID-Explore · Presentation Layer · KPI Tool — Common · Compute
 * Role:      Numerische Helper & Ableitungen (R0, β, γ, σ, m)
 * Type:      Open Educational Resource (OER) · ESM
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-03
 * Version:   3.1.0
 * Changelog:
 *   - v3.1.0  Short-Header vereinheitlicht, Gliederung/Kommentare ergänzt; Verhalten unverändert.
 *   - v3.0.0  Aus compute.js (v2.4.2) extrahiert: numerische Helper & Ableitungen.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1) Version
// ─────────────────────────────────────────────────────────────────────────────
export const VERSION = '3.1.0';

// ─────────────────────────────────────────────────────────────────────────────
// 2) Basis-Getter
// ─────────────────────────────────────────────────────────────────────────────
export const getN  = (p)=> Number(p?.N)  || 0;
export const getI0 = (p)=> Number(p?.I0) || 0;

// ─────────────────────────────────────────────────────────────────────────────
// 3) Guards (Reserve)
// ─────────────────────────────────────────────────────────────────────────────
export const pos  = (x)=> (Number.isFinite(x) && x>0) ? x : null;
export const safe = (x)=> (Number.isFinite(x) ? x : null);

// ─────────────────────────────────────────────────────────────────────────────
// 4) Ableitungen für R0, beta, gamma, sigma (mit Fallbacks)
// ─────────────────────────────────────────────────────────────────────────────
export function getR0(p){
  const R0 = Number(p?.R0);
  if (Number.isFinite(R0)) return R0;
  const b = Number(p?.beta), g = Number(p?.gamma);
  return (Number.isFinite(b) && Number.isFinite(g) && g>0) ? b/g : null;
}

export function getGamma(p){
  const g = Number(p?.gamma);
  if (Number.isFinite(g)) return g;
  const D = Number(p?.D);
  return (Number.isFinite(D) && D>0) ? 1/D : null;
}

export function getSigma(p){
  const s = Number(p?.sigma);
  if (Number.isFinite(s)) return s;
  const L = Number(p?.L);
  return (Number.isFinite(L) && L>0) ? 1/L : null;
}

export function getBeta(p){
  const b = Number(p?.beta);
  if (Number.isFinite(b)) return b;
  const R0 = getR0(p), g = getGamma(p);
  return (Number.isFinite(R0) && Number.isFinite(g)) ? R0*g : null;
}

/** Normalisiert m (0..1 oder 0..100%) auf 0..1 */
export function normM(x){
  let m = Number(x);
  if (!Number.isFinite(m) || m<=0) return 0;
  return (m>1) ? (m/100) : m;
}
