/*!
 * File:      /12-3_presentation/kpi/common/compute/extras.js
 * Project:   UID-Explore · Presentation Layer · KPI Tool — Common · Compute
 * Role:      Modell-spezifische Zusatzgrößen (SIS/SIRD/SIRV)
 * Type:      Open Educational Resource (OER) · ESM
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-03
 * Version:   3.1.0
 * Changelog:
 *   - v3.1.0  Short-Header vereinheitlicht; Gliederung/Kommentare ergänzt; Verhalten unverändert.
 *   - v3.0.0  Erstversion (SIS/SIRD/SIRV-Extras).
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1) Version & Utilities
// ─────────────────────────────────────────────────────────────────────────────
export const VERSION = '3.1.0';

function last(arr){ return (arr && arr.length) ? arr[arr.length - 1] : null; }
function firstIdxMeet(arr, pred){
  if (!arr || !arr.length) return -1;
  for (let i=0;i<arr.length;i++){ if (pred(arr[i], i)) return i; }
  return -1;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2) Extras pro Modellfamilie
// ─────────────────────────────────────────────────────────────────────────────
function sisExtras(P, S){
  let i_star = null, t_equilibrium = null;
  if (P && Number.isFinite(P.R0)) i_star = (P.R0 > 1) ? (1 - 1 / P.R0) : 0;

  const N = Number(P?.N) || 0;
  if (S && S.series && Array.isArray(S.series.I) && Array.isArray(S.series.t) && N && i_star != null){
    const eps = 1e-3;
    const idx = firstIdxMeet(S.series.I, (Iv, i) => Math.abs((Iv / N) - i_star) <= eps);
    if (idx >= 0) t_equilibrium = S.series.t[idx];
  }
  return { i_star, t_equilibrium };
}

function sirdExtras(P, S){
  let D_end = null, IFR_model = null, IFR_end = null;

  if (S && S.series && Array.isArray(S.series.D)) D_end = last(S.series.D);

  if (Number.isFinite(P?.mu) && Number.isFinite(P?.gamma) && (P.gamma + P.mu) > 0){
    IFR_model = P.mu / (P.gamma + P.mu);
  }

  if (Number.isFinite(P?.N) && S && S.series && Array.isArray(S.series.S)){
    const S_end = last(S.series.S);
    const denom = P.N - S_end;
    if (denom > 0 && D_end != null) IFR_end = D_end / denom;
  }
  return { D_end, IFR_model, IFR_end };
}

function sirvExtras(P, S){
  let p_c = null, t_to_p_c = null, p_end = null;

  if (Number.isFinite(P?.R0) && P.R0 > 1) p_c = 1 - 1 / P.R0;

  const pSeries = S?.series?.p;
  const tSeries = S?.series?.t;
  if (Array.isArray(pSeries) && Array.isArray(tSeries) && p_c != null){
    const idx = firstIdxMeet(pSeries, (pv) => pv >= p_c);
    if (idx >= 0) t_to_p_c = tSeries[idx];
    p_end = last(pSeries);
  }
  return { p_c, t_to_p_c, p_end };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3) Public API
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Liefert modellabhängige Zusatzgrößen aus Model-/Sim-Daten.
 * @param {'SIS'|'SIRD'|'SIRV'|string} model
 * @param {object} P  Parameter (z. B. {R0,N,gamma,mu})
 * @param {object} S  Simulation ({series:{t,S,E,I,R,D,p,...}})
 * @returns {object}  Extras-Objekt je nach Modellfamilie
 */
export function computeExtras(model, P={}, S={}){
  const M = String(model||'').toUpperCase();
  if (M === 'SIS')  return sisExtras(P, S);
  if (M === 'SIRD') return sirdExtras(P, S);
  if (M === 'SIRV') return sirvExtras(P, S);
  return {};
}

export default computeExtras;
