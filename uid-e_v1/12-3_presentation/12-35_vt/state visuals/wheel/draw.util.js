/*!
 * File:      vectors/core/draw.util.js
 * Project:   Understanding Infection Dynamics · Infektionsdynamiken verstehen
 * Type:      Open Educational Resource (OER)
 * Authors:   B. D. Rausch · A. Heinz
 * Contact:   info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:   CC BY 4.0
 *
 * Created:   2025-09-25
 * Updated:   2025-09-26
 * Version:   1.0.0
 * Changelog: - v1.0.0 Snapshot/Helfer (clamp, fmtT, tokens, normalize series/params)
 */

export const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
export const TOK = {
  S:   () => css('--c-s')   || '#22c55e',
  E:   () => css('--c-e')   || '#a855f7',
  I:   () => css('--c-i')   || '#ef4444',
  R:   () => css('--c-r')   || '#3b82f6',
  AUX: () => css('--c-aux') || 'rgba(200,200,200,.92)', // neutral arrows/labels
};

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const cssSize = (px, DPR) => px / (DPR || 1);

export function lastIdx(series) {
  const t = series?.t; return Array.isArray(t) && t.length ? t.length - 1 : 0;
}

export function fmtT(t, lang, mode) {
  const dec = (String(mode).toLowerCase()==='university') ? 2 : 0; // School=0, Uni=2
  const loc = (String(lang).toLowerCase().startsWith('de')) ? 'de-DE' : 'en-US';
  const nf  = new Intl.NumberFormat(loc,{ minimumFractionDigits: dec, maximumFractionDigits: dec });
  const val = Number.isFinite(t) ? nf.format(t) : nf.format(0);
  return `t = ${val} d`;
}

/** norm series value (S/E/I/R): if absolute, normalize by N at index i */
export function fracAt(series, key, i) {
  const arr = series?.[key];
  if (!Array.isArray(arr) || !arr.length) return 0;
  const v = arr[clamp(i,0,arr.length-1)];
  const N = ['S','E','I','R'].reduce((s,k)=>{
    const aa = series?.[k]; return s + (Array.isArray(aa) ? (aa[i]||0) : 0);
  }, 0);
  return (N > 1e-9 && v > 1.000001) ? v/N : clamp(v,0,1);
}

/** robust param extraction: beta/gamma/sigma from direct or R0/D/L */
export function extractParams(p) {
  const out = { beta: undefined, gamma: undefined, sigma: undefined, R0: undefined, measures: 0 };
  if (p && typeof p === 'object') Object.assign(out, p);
  let { beta, gamma, sigma, R0, D, L } = out;
  if (!Number.isFinite(gamma) && Number.isFinite(D) && D > 0) gamma = 1 / Number(D);
  if (!Number.isFinite(sigma) && Number.isFinite(L) && L > 0) sigma = 1 / Number(L);
  if (!Number.isFinite(beta)  && Number.isFinite(R0) && Number.isFinite(gamma) && gamma > 0) beta = Number(R0)*gamma;
  return { beta, gamma, sigma };
}

/** normalize param [0..1] by ranges */
export function normParam(ranges, key, val) {
  const Rg = ranges?.[key], v = Number(val);
  if (!Rg || !Number.isFinite(v) || !Number.isFinite(Rg.min) || !Number.isFinite(Rg.max) || Rg.max <= Rg.min) return 0.5;
  return clamp((v - Rg.min) / (Rg.max - Rg.min), 0, 1);
}

/** build prepared snapshot for all renderers */
export function prepareSnapshot(snap, W, H, opts) {
  const DPR = window.devicePixelRatio || 1;
  const { series, idx, params, model, ranges } = snap || {};
  const { thickness = 14, pad = 10 } = opts || {};
  const cx = W/2, cy = H/2;
  const R  = Math.max(20, Math.min(W,H)/2 - pad);

  const i = Number.isFinite(idx) ? idx : lastIdx(series || {});
  const S = fracAt(series,'S',i);
  const sum = ['S','E','I','R'].map(k=>fracAt(series,k,i)).reduce((a,b)=>a+b,0) || 1;

  const html = document.documentElement;
  const tArr = series?.t;
  const tVal = (Array.isArray(tArr) && tArr.length) ? tArr[clamp(i,0,tArr.length-1)] : i;
  const tStr = fmtT(tVal, html.lang || 'de', html.dataset.mode || 'university');

  // Baseline Hub-Geometrie (Feintuning in draw.hub.js)
  const rOuter = R;
  const rHubBase = Math.max(12, rOuter - thickness*1.25);
  const rInnerBase = Math.max(8, rHubBase - 10);

  // Parameter robust ableiten & normalisieren
  const { beta, gamma, sigma } = extractParams(params || {});
  const n = {
    beta:  normParam(ranges, 'beta',  beta),
    gamma: normParam(ranges, 'gamma', gamma),
    sigma: normParam(ranges, 'sigma', sigma),
  };

  return { DPR, W, H, cx, cy, rOuter, thickness, i, series, S, sum, tStr, rHubBase, rInnerBase, model, ranges, params, beta, gamma, sigma, n };
}
