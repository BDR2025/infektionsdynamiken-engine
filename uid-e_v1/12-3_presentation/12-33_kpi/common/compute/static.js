/*!
 * File:      /12-3_presentation/kpi/common/compute/static.js
 * Project:   UID-Explore · Presentation Layer · KPI Tool — Common · Compute
 * Role:      STATIC-Map (model:update) → KPI-Werte (Parameter, Reff0, HIT, β_eff, T₂)
 * Type:      Open Educational Resource (OER) · ESM
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-03
 * Version:   3.1.0
 * Changelog:
 *   - v3.1.0  Short-Header vereinheitlicht; Gliederung/Kommentare ergänzt; Verhalten unverändert.
 *   - v3.0.0  Extrahiert aus compute.js (v2.4.2): STATIC-Map (model:update).
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1) Imports & Version
// ─────────────────────────────────────────────────────────────────────────────
import { resolveFmt } from './format.js';
import { getN, getI0, getBeta, getGamma, getSigma, getR0, normM } from './helpers.js';

export const VERSION = '3.1.0';

// ─────────────────────────────────────────────────────────────────────────────
// 2) STATIC-Map (model:update)
// ─────────────────────────────────────────────────────────────────────────────
export const STATIC = {
  N:     (arg) => { const fmt=resolveFmt(arg); return { value: fmt.int.format(getN(arg.p)), unit:'' }; },
  I0:    (arg) => { const fmt=resolveFmt(arg); return { value: fmt.int.format(getI0(arg.p)), unit:'' }; },

  R0:    (arg) => { const fmt=resolveFmt(arg); const v=getR0(arg.p); return { value: fmt.d3.format(v??0), unit:'' }; },
  beta:  (arg) => { const fmt=resolveFmt(arg); const v=getBeta(arg.p); return { value: fmt.d3.format(v||0), unit:'/d' }; },
  gamma: (arg) => { const fmt=resolveFmt(arg); const v=getGamma(arg.p);return { value: fmt.d3.format(v||0), unit:'/d' }; },
  D:     (arg) => {
    const fmt=resolveFmt(arg);
    let D = Number(arg.p?.D);
    if (!Number.isFinite(D)) { const g=getGamma(arg.p); if (g) D=1/g; }
    return { value: fmt.d1.format(D ?? 0), unit:'d' };
  },

  // SEIR-spezifisch
  sigma: (arg) => { const fmt=resolveFmt(arg); const v=getSigma(arg.p); return { value: fmt.d3.format(v||0), unit:'/d' }; },
  L:     (arg) => {
    const fmt=resolveFmt(arg);
    let L = Number(arg.p?.L);
    if (!Number.isFinite(L)) { const s=getSigma(arg.p); if (s) L=1/s; }
    return { value: fmt.d1.format(L ?? 0), unit:'d' };
  },

  m:     (arg) => { const fmt=resolveFmt(arg); const v=(normM(arg.p?.measures)||0)*100; return { value: fmt.d1.format(v), unit:'%' }; },
  dt:    (arg) => { const fmt=resolveFmt(arg); return { value: fmt.d3.format(Number(arg.p?.dt)||0), unit:'d' }; },
  T:     (arg) => { const fmt=resolveFmt(arg); return { value: fmt.d1.format(Number(arg.p?.T)||0),  unit:'d' }; },

  Reff0: (arg) => {
    const fmt=resolveFmt(arg);
    const p=arg.p, N=getN(p), I0=getI0(p), R0=getR0(p), m=normM(p?.measures);
    const s0 = (N>0) ? Math.max(0, N-I0)/N : 1;
    const v  = (Number.isFinite(R0) ? R0*(1-m)*s0 : null);
    return { value: (v==null?'—':fmt.d3.format(v)), unit:'' };
  },

  HIT:   (arg) => {
    const fmt=resolveFmt(arg); const R0=getR0(arg.p);
    const val = (Number.isFinite(R0) && R0>1) ? (1 - 1/R0)*100 : null;
    return { value: (val==null ? '—' : fmt.d1.format(val)), unit:'%' };
  },

  betaEff: (arg) => {
    const fmt=resolveFmt(arg); const b=getBeta(arg.p)||0; const m=normM(arg.p?.measures)||0;
    return { value: fmt.d3.format(b*(1-m)), unit:'/d' };
  },

  T2:    (arg) => {
    const fmt=resolveFmt(arg);
    const b=getBeta(arg.p)||0, g=getGamma(arg.p)||0, m=normM(arg.p?.measures)||0;
    const r = b*(1-m) - g;
    const val = (r>0) ? Math.log(2)/r : null;
    return { value: (val==null?'—':fmt.d1.format(val)), unit:'d' };
  }
};
