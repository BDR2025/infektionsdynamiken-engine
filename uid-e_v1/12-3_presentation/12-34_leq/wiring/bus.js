/*!
 * File:      vectors/wiring/bus.js
 * Project:   UID-Explore (Presentation)
 * Module:    UID Event Bus wiring → State updates → repaint()
 * License:   CC BY 4.0
 */

import { on } from '../../../12-1_base/bus.js';
import { makeCatalog } from '/uid-e_v1/12-1_base/schema.js';

function makeRanges(model, mode){
  const cat = makeCatalog(model, mode);
  const pick = k => (cat && cat[k]) ? { min: cat[k].min, max: cat[k].max } : null;
  return { beta: pick('beta'), gamma: pick('gamma'), sigma: pick('sigma') };
}

function normalizeDetail(detail = {}) {
  const out = { params: null, model: undefined, mode: undefined };
  if (detail.model) out.model = String(detail.model).toUpperCase();
  if (detail.mode)  out.mode  = String(detail.mode).toLowerCase();

  if (detail.params && typeof detail.params === 'object') {
    out.params = detail.params;
  } else {
    const KNOWN = ['R0','beta','gamma','sigma','measures','nu','omega','delta','D','L','N','I0','T','dt'];
    const flat = {};
    for (const k of KNOWN) if (k in detail) flat[k] = detail[k];
    out.params = Object.keys(flat).length ? flat : null;
  }
  return out;
}

export function wireBus(state, repaint) {
  const html  = document.documentElement;
  let model   = String(html.dataset.model || 'SIR').toUpperCase();
  let mode    = String(html.dataset.mode  || 'university').toLowerCase();

  state.setModel?.(model);
  state.setRanges?.(makeRanges(model, mode));

  const apply = (d={}) => {
    const norm = normalizeDetail(d);
    if (norm.params) state.setParams?.(norm.params);
    let need = false;
    if (norm.model) { model = norm.model; state.setModel?.(model); need = true; }
    if (norm.mode)  { mode  = norm.mode;  need = true; }
    if (need) state.setRanges?.(makeRanges(model, mode));
    repaint();
  };

  // Startzustand
  const offParamsReady  = on('uid:e:params:ready',   ({ state: st }={}) => apply(st || {}));
  const offEngineStatus = on('uid:e:engine:status',  ({ model: m, mode: mo }={}) => apply({ model:m, mode:mo }));

  // Modell-/Parameter-Änderungen (breit gefasst)
  const offModelUpdate  = on('uid:e:model:update',   d => apply(d));
  const offParamSet     = on('uid:e:params:set',     d => apply(d));
  const offParamUpdate  = on('uid:e:params:update',  d => apply(d));
  const offParamChange  = on('uid:e:params:change',  d => apply(d));
  const offParamCommit  = on('uid:e:params:commit',  d => apply(d));
  const offParamApply   = on('uid:e:params:apply',   d => apply(d));
  const offParamValue   = on('uid:e:params:value',   d => apply(d));
  const offParamChanged = on('uid:e:params:changed', d => apply(d));

  // Daten & Playhead
  const offData = on('uid:e:sim:data',   ({ series }) => { state.setSeries?.(series); repaint(); });
  const offPtr  = on('uid:e:sim:pointer',({ idx })    => { state.setPointer?.(idx);  repaint(); });

  return () => {
    try{ offParamsReady&&offParamsReady(); }catch{}
    try{ offEngineStatus&&offEngineStatus(); }catch{}
    try{ offModelUpdate&&offModelUpdate(); }catch{}
    try{ offParamSet&&offParamSet(); }catch{}
    try{ offParamUpdate&&offParamUpdate(); }catch{}
    try{ offParamChange&&offParamChange(); }catch{}
    try{ offParamCommit&&offParamCommit(); }catch{}
    try{ offParamApply&&offParamApply(); }catch{}
    try{ offParamValue&&offParamValue(); }catch{}
    try{ offParamChanged&&offParamChanged(); }catch{}
    try{ offData&&offData(); }catch{}
    try{ offPtr&&offPtr(); }catch{}
  };
}
