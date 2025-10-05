/*!
 * File:      /12-3_presentation/kpi/common/compute/live.js
 * Project:   UID-Explore · Presentation Layer · KPI Tool — Common · Compute
 * Role:      LIVE-Map (sim:data + pointer) → KPI-Werte (Kompartimente, Peaks, Rₑff(t), Attack, tHIT)
 * Type:      Open Educational Resource (OER) · ESM
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-03
 * Version:   3.1.0
 * Changelog:
 *   - v3.1.0  Short-Header vereinheitlicht; Gliederung/Kommentare ergänzt; Verhalten unverändert.
 *   - v3.0.0  Extrahiert aus compute.js (v2.4.2): LIVE-Map (sim:data [+pointer]).
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1) Imports & Version
// ─────────────────────────────────────────────────────────────────────────────
import { resolveFmt, fmtRelAbs } from './format.js';
import { getN, getR0, normM }    from './helpers.js';

export const VERSION = '3.1.0';

// ─────────────────────────────────────────────────────────────────────────────
// 2) Helper (Pointer-Kompartiment & Peaks)
// ─────────────────────────────────────────────────────────────────────────────
function pointComp(key, arg){
  const fmt = resolveFmt(arg);
  const arr = arg.s?.[key] || [];
  const N   = getN(arg.p);
  if (!arr.length) return { value:'—', secondary:'—', unit:'' };

  const idx = (arg.ptr?.idx ?? arr.length-1);
  let v = arr[idx] ?? 0;

  // abs/rel bestimmen
  let abs = v, rel = null;
  if (v <= 1.001 && N) { abs = v*N; rel = v*100; }
  else if (N)          { rel = (abs/N)*100; }

  // Format anwenden
  return fmtRelAbs({ fmt }, { abs, rel });
}

function peakValue(key, arg){
  const arr = arg.s?.[key] || [];
  if (!arr.length) return { value:'—', secondary:'—', unit:'' };
  let imax=0, vmax=arr[0];
  for (let i=1;i<arr.length;i++) if (arr[i]>vmax){ vmax=arr[i]; imax=i; }
  const N = getN(arg.p);
  let abs = vmax, rel = null;
  if (vmax<=1.001 && N){ abs = vmax*N; rel = vmax*100; }
  else if (N){ rel = (abs/N)*100; }
  return fmtRelAbs(arg, { abs, rel });
}

function peakTime(key, arg){
  const fmt=resolveFmt(arg);
  const arr = arg.s?.[key] || [], t=arg.s?.t||[];
  if (!arr.length) return { value:'—', unit:'' };
  let imax=0, vmax=arr[0];
  for (let i=1;i<arr.length;i++) if (arr[i]>vmax){ vmax=arr[i]; imax=i; }
  return { value: fmt.d1.format(t[imax] || 0), unit:'d' };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3) LIVE-Map (sim:data [+pointer])
// ─────────────────────────────────────────────────────────────────────────────
export const LIVE = {

  t: (arg) => {
    const fmt=resolveFmt(arg); const tarr = arg.s?.t||[];
    const idx  = (arg.ptr?.idx ?? (tarr.length ? tarr.length-1 : 0));
    return { value: fmt.d1.format(tarr[idx] || 0), unit:'d' };
  },

  // Kompartimente (S/E/I/R) am aktuellen Pointer
  S_t: (arg) => pointComp('S', arg),
  E_t: (arg) => pointComp('E', arg),   // SEIR
  I_t: (arg) => pointComp('I', arg),
  R_t: (arg) => pointComp('R', arg),

  // Peaks (Wert rel/abs/hybrid; Zeitpunkte separat)
  Ipeak: (arg) => peakValue('I', arg),
  Epeak: (arg) => peakValue('E', arg),         // SEIR
  tpeak: (arg) => peakTime('I', arg),
  tEpeak:(arg) => peakTime('E', arg),          // SEIR

  // Rₑff(t) am Pointer
  Reff_t: (arg) => {
    const fmt=resolveFmt(arg);
    const tarr = arg.s?.t||[], S=arg.s?.S||[];
    if (!tarr.length || !S.length) return { value:'—', unit:'' };
    const idx = (arg.ptr?.idx ?? tarr.length-1);
    const N   = getN(arg.p); if (!N) return { value:'—', unit:'' };

    let Sabs = S[idx] ?? 0; if (Sabs<=1.001) Sabs *= N;
    const Sfrac = Sabs/N;
    const R0 = getR0(arg.p); const m = normM(arg.p?.measures);
    const val = (Number.isFinite(R0) ? R0*(1-m)*Sfrac : null);
    return { value: (val==null ? '—' : fmt.d3.format(val)), unit:'' };
  },

  // Outcomes (live-basiert, Prozent)
  Attack: (arg) => {
    const fmt=resolveFmt(arg); const S=arg.s?.S||[]; const N=getN(arg.p);
    if (!S.length || !N) return { value:'—', unit:'' };
    let Sabs=S[S.length-1]; if (Sabs<=1.001) Sabs*=N;
    const val=(1 - Sabs/N)*100;
    return { value: fmt.d1.format(val), unit:'%' };
  },

  // Schwellenzeitpunkt: erstes t mit Rₑff(t) ≤ 1
  tHIT: (arg) => {
    const fmt=resolveFmt(arg);
    const tarr = arg.s?.t||[], S=arg.s?.S||[]; if (!tarr.length || !S.length) return { value:'—', unit:'' };
    const N=getN(arg.p), R0=getR0(arg.p), m=normM(arg.p?.measures);
    if (!N || !Number.isFinite(R0) || R0<=0) return { value:'—', unit:'' };

    for (let i=0;i<S.length;i++){
      let Sabs = S[i]; if (Sabs<=1.001) Sabs *= N;
      const Sfrac = Sabs/N;
      const Reff = R0*(1-m)*Sfrac;
      if (Reff <= 1) return { value: resolveFmt(arg).d1.format(arg.s.t[i]||0), unit:'d' };
    }
    return { value:'—', unit:'' };
  }
};
