/*!
 * Project:  Understanding Infection Dynamics · UID-Explore
 * Layer:    Input · Parameter Tool · Formulas (compat runtime implant)
 * File:     /parameters/formulas/compat.runtime.js
 * License:  CC BY 4.0
 *
 * Purpose:  Vorsichtige, additive Runtime-Implantation (ohne Strukturänderungen).
 *           Versorgt vorhandene Formel-Elemente (fe-*) mit Live-Werten aus dem Bus,
 *           inkl. abgeleiteter Größen (beta_eff, R_eff(t), R_eff(0)).
 *
 * How to use (optionale Einbindung):
 *   1) Datei in /12-1_input/parameters/formulas/ ablegen
 *   2) (a) Temporär via Konsole laden:
 *        import('/increments/uid/12-1_input/parameters/formulas/compat.runtime.js');
 *      oder
 *      (b) Script-Tag ergänzen:
 *        <script type="module" src="/increments/uid/12-1_input/parameters/formulas/compat.runtime.js"></script>
 *   3) Auto-Start ist aktiv; stopbar via: window.PT_FORMULA_COMPAT?.stop()
 */

import * as bus from '../../../12-1_base/bus.js';

/* ------------------------------ Utilities --------------------------------- */
const DEC = (x, d=4) => (Number.isFinite(x) ? x.toLocaleString('de-DE',{minimumFractionDigits:d, maximumFractionDigits:d}) : '–');
const clamp = (v,min,max) => Math.max(min, Math.min(max, v));

function nearestIndex(arr, x){
  if (!Array.isArray(arr) || arr.length === 0 || !Number.isFinite(x)) return 0;
  let lo = 0, hi = arr.length - 1;
  // binary search for closest
  while (hi - lo > 1){
    const mid = (lo + hi) >> 1;
    if (arr[mid] === x) return mid;
    if (arr[mid] < x) lo = mid; else hi = mid;
  }
  return (Math.abs(arr[lo]-x) <= Math.abs(arr[hi]-x)) ? lo : hi;
}

function pick(obj, k){
  if (!obj) return undefined;
  if (obj[k] !== undefined) return obj[k];
  if (obj.params && obj.params[k] !== undefined) return obj.params[k];
  if (obj.model  && obj.model[k]  !== undefined) return obj.model[k];
  if (obj.state && obj.state.params && obj.state.params[k] !== undefined) return obj.state.params[k];
  return undefined;
}

function normalizeKey(raw){
  // normalize classes like: beta_eff, beta-eff, BetaEff, R_eff(t), Reff_t, rEff0 etc.
  let k = String(raw || '').trim();
  if (!k) return k;
  k = k.replace(/[()]/g, '');     // remove parentheses
  k = k.replace(/-+/g, '_');      // - to _
  k = k.replace(/\s+/g, '');
  k = k.replace(/^fe_/i, '');     // drop fe_ prefix if present
  k = k.toLowerCase();

  // canonicalize R_eff keys
  if (k === 'reff') k = 'reff_t';
  if (k === 'r_eff') k = 'reff_t';
  if (k === 'r_eff_t') k = 'reff_t';
  if (k === 'r_eff_0' || k === 'reff0' || k === 'r_eff0') k = 'reff_0';
  if (k === 'r0' || k === 'r_0') k = 'R0'; // maintain case for display keys

  // return canonical
  return k;
}

/* -------------------------- Target collection ----------------------------- */
function collectTargets(root=document){
  const map = Object.create(null);
  const nodes = root.querySelectorAll('[class*="fe-"], [class*="fe_"]');
  nodes.forEach(node => {
    node.classList.forEach(cls => {
      if (!/^fe[-_]/i.test(cls)) return;
      const key = normalizeKey(cls.replace(/^fe[-_]/i, ''));
      if (!key) return;
      const target = node.matches('.fe-val') ? node : (node.querySelector('.fe-val') || node);
      (map[key] ||= []).push(target);
    });
  });
  return map;
}

function setTargets(targets, key, value, digits=4){
  const arr = targets[key];
  if (!arr || !arr.length) return;
  const txt = DEC(value, digits);
  for (const el of arr){
    try { el.textContent = txt; } catch {}
  }
}

/* --------------------------- Live computation ----------------------------- */
function computeAndPaint(targets){
  const M = bus.getLast?.('uid:e:model:update') || {};
  const S = bus.getLast?.('uid:e:sim:data')     || {};

  // base params
  const R0    = +pick(M, 'R0');
  const gamma = +pick(M, 'gamma');
  const beta  = Number.isFinite(+pick(M, 'beta')) ? +pick(M, 'beta')
               : (Number.isFinite(R0) && Number.isFinite(gamma)) ? R0*gamma : NaN;
  const D     = (Number.isFinite(gamma) && gamma > 0) ? (1/gamma) : NaN;
  const sigma = +pick(M, 'sigma');
  const L     = (Number.isFinite(sigma) && sigma > 0) ? (1/sigma) : +pick(M, 'L');
  const m     = +pick(M, 'measures'); // 0..1
  const N     = +pick(M, 'N');

  setTargets(targets, 'R0', R0);
  setTargets(targets, 'gamma', gamma);
  setTargets(targets, 'beta', beta);
  setTargets(targets, 'D', D);
  setTargets(targets, 'sigma', sigma);
  setTargets(targets, 'L', L);

  // derived: beta_eff
  const betaEff = (Number.isFinite(beta) && Number.isFinite(m)) ? beta*(1-m) : NaN;
  setTargets(targets, 'beta_eff', betaEff);

  // derived: R_eff(0)
  const reff0 = (Number.isFinite(R0) && Number.isFinite(m)) ? R0 * (1 - m) : NaN;
  setTargets(targets, 'reff_0', reff0, 3);

  // derived: R_eff(t)
  let reff_t = NaN;
  try {
    const Tarr = S?.series?.t, Sarr = S?.series?.S;
    if (Array.isArray(Tarr) && Array.isArray(Sarr) && Tarr.length === Sarr.length && Tarr.length > 0 && Number.isFinite(N) && N > 0){
      let idx = 0;
      const P = bus.getLast?.('uid:e:sim:pointer');
      if (P){
        const ti = P.idx ?? P.i ?? P.index ?? P.tIdx ?? P.tIndex;
        if (Number.isInteger(ti)) idx = clamp(ti, 0, Sarr.length-1);
        else if (Number.isFinite(P.t)) idx = nearestIndex(Tarr, P.t);
      }
      const Sfrac = Sarr[idx] / N;
      if (Number.isFinite(R0) && Number.isFinite(m) && Number.isFinite(Sfrac)) {
        reff_t = R0 * (1 - m) * Sfrac;
      }
    }
  } catch {}
  setTargets(targets, 'reff_t', reff_t, 3);

  try { window.MathJax && window.MathJax.typeset && window.MathJax.typeset(); } catch {}
}

/* ------------------------------ Lifecycle --------------------------------- */
function start(){
  if (start._running) return start._stop;
  const targets = collectTargets(document);
  computeAndPaint(targets);

  const offM = bus.on?.('uid:e:model:update', () => computeAndPaint(targets), { replay:false });
  const offS = bus.on?.('uid:e:sim:data',     () => computeAndPaint(targets), { replay:false });
  const offP = bus.on?.('uid:e:sim:pointer',  () => computeAndPaint(targets), { replay:false });

  start._running = true;
  start._stop = () => {
    try{ offM && offM(); }catch{}
    try{ offS && offS(); }catch{}
    try{ offP && offP(); }catch{}
    start._running = false;
  };
  return start._stop;
}

export function stop(){ if (start._running) { try{ start._stop(); }catch{} } }
export function run(){ return start(); }

// Auto-start (vorsichtig): nur einmal pro Seite
if (!window.__PT_FORMULA_COMPAT_STARTED__){
  window.__PT_FORMULA_COMPAT_STARTED__ = true;
  try { start(); } catch {}
}

// Exponieren für manuelles Stoppen/Restart
window.PT_FORMULA_COMPAT = {
  stop,
  start: run,
  get running(){ return !!start._running; }
};
