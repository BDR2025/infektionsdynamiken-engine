/*!
 * File:      vectors/core/state.js
 * Project:   UID-Explore (Presentation)
 * Module:    Lightweight State Store (series, pointer, params, model, ranges)
 * License:   CC BY 4.0
 */

export function createState() {
  let series = null;                 // { t,S,E,I,R }
  let idx    = null;                 // pointer index or null
  let model  = 'SIR';                // 'SIR' | 'SEIR' …
  let params = { R0:null, beta:null, gamma:null, sigma:null, measures:0 };
  // NEW: Ranges aus makeCatalog(model, mode), z.B. { beta:{min,max}, gamma:{...}, sigma:{...} }
  let ranges = { beta:null, gamma:null, sigma:null };

  return {
    setSeries(s)      { series = s || null; },
    setPointer(i)     { idx = Number.isFinite(i) ? i : null; },
    setModel(m)       { model = String(m||'SIR').toUpperCase(); },
    setParams(p = {}) { params = { ...params, ...p }; },
    setRanges(r = {}) { ranges = { ...ranges, ...r }; },
    snapshot()        { return { series, idx, model, params, ranges }; }
  };
}
