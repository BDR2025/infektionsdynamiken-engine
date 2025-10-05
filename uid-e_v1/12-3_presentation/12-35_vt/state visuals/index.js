/*!
 * File:      index.js
 * Project:   Understanding Infection Dynamics · Infektionsdynamiken verstehen
 * Module:    UID-V · State Visuals (mountVector) — Wiring + Actions + Play-Button + Square Hooks
 * License:   CC BY 4.0
 *
 * Version:   1.8.0
 * Changelog:
 *   - v1.8.0 Hooks für Square-Mode & Rate-Unit:
 *             • getSquareMode()/setSquareMode('momentum'|'flows'|'delta')
 *             • getRateUnit()/setRateUnit('ppd'|'absd')
 *             Weitergabe an Square-Renderer, Persistenz via localStorage.
 *   - v1.7.x Play-Button (0.5×) im Content, Sticky/Replay-Wiring etc.
 */

'use strict';

import { createWheel }         from './wheel/index.js';
import { createState }         from './wheel/state.js';
import { mountSVActions }      from './sv.widget-actions.js';

function safeClear(el){ try{ while(el.firstChild) el.removeChild(el.firstChild);}catch{} }
const toNum = v => (v===null||v===undefined) ? undefined : Number(v);

function pickParams(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const src = payload.state?.params ?? payload.params ?? payload.bulk ?? payload;
  if (!src || typeof src !== 'object') return null;
  const keys = ['R0','beta','gamma','sigma','measures','D','L','I0','T','N','dt'];
  const out = {}; for (const k of keys) if (k in src) out[k] = src[k];
  return Object.keys(out).length ? out : null;
}
function deriveParams(p, model){
  if (!p) return null;
  const out = { ...p };
  const R0    = toNum(out.R0);
  const gamma = toNum(out.gamma);
  const sigma = toNum(out.sigma);
  const meas  = toNum(out.measures);

  if (out.beta === undefined && Number.isFinite(R0) && Number.isFinite(gamma)) {
    const m = Number.isFinite(meas) ? (1 - Math.max(0, Math.min(1, meas))) : 1;
    out.beta = R0 * gamma * m;
  }
  const mdl = String(out.model || model || '').toUpperCase();
  if (sigma === undefined && mdl && mdl !== 'SEIR') out.sigma = 0;
  return out;
}
async function computeRanges(model, mode){
  try {
    const m = await import('/uid-e_v1/12-1_base/schema.js');
    const cat = m.makeCatalog?.(model, mode);
    const take = k => cat && cat[k] ? { min:cat[k].min, max:cat[k].max } : null;
    return { beta: take('beta'), gamma: take('gamma'), sigma: take('sigma') };
  } catch { return {}; }
}
function busLast(bus, type){ try { return bus?.getLast?.(type) ?? window?.EBUS?.getLast?.(type); } catch { return undefined; } }

/** Overlay-Slot direkt im Host (Content-Overlay oben links). */
function ensureContentSlot(host){
  let ov = host.querySelector(':scope > .sv-overlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.className = 'sv-overlay';
    ov.style.cssText = 'position:absolute;inset:0;z-index:5;pointer-events:none;';
    host.appendChild(ov);
  }
  let slot = ov.querySelector(':scope > .sv-slot-tl');
  if (!slot) {
    slot = document.createElement('div');
    slot.className = 'sv-slot-tl';
    slot.style.cssText = 'position:absolute;left:8px;top:8px;display:flex;gap:6px;align-items:center;pointer-events:auto;';
    ov.appendChild(slot);
  }
  return slot;
}

export async function mountVector(hostOrId, opts = {}) {
  const host = (typeof hostOrId === 'string') ? document.getElementById(hostOrId) : hostOrId;
  if (!host) throw new Error('[State Visuals] host not found');
  if (!host.style.position) host.style.position = 'relative';

  const bus   = opts.bus;
  let   view  = String(opts.view || 'wheel').toLowerCase();
  const mode  = document.documentElement?.dataset?.mode || 'university';

  // NEW: persistente Square-Optionen (für Burger-Hooks)
  let squareMode = readLS('uidv:square:mode','momentum');        // 'momentum'|'flows'|'delta'
  let rateUnit   = readLS('uidv:square:rateunit','ppd');         // 'ppd'|'absd'

  const store = createState();
  let renderer = null;            // aktueller Renderer (Wheel oder Square)
  let squareAPI = null;           // optionale API vom Square (setMode/setRateUnit)
  let wiring = null;

  async function createRenderer(name){
    const v = String(name || 'wheel').toLowerCase();
    safeClear(host);
    squareAPI = null;

    if (v === 'wheel') return createWheel(host, {});

    if (v === 'square') {
      try {
        const mod = await import('./square/index.js');
        if (typeof mod?.createSquare === 'function') {
          const sq = await mod.createSquare(host, {});
          // Hooks an Square weiterreichen (falls vorhanden)
          if (sq?.setMode || sq?.setRateUnit) {
            squareAPI = sq;
            try { sq.setMode?.(squareMode); } catch {}
            try { sq.setRateUnit?.(rateUnit); } catch {}
          }
          return sq;
        }
      } catch {}
      // Placeholder, falls Square nicht verfügbar
      const ph = document.createElement('div');
      ph.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:.7;font-weight:600';
      ph.textContent = 'Square-Ansicht nicht verfügbar';
      host.appendChild(ph);
      return { update(){}, dispose(){ try{ host.contains(ph) && host.removeChild(ph);}catch{} } };
    }

    // default
    return createWheel(host, {});
  }

  function push(){ if (!renderer) return; try { renderer.update?.(store.snapshot()); } catch {} }
  async function mountRenderer(next){ try { renderer?.dispose?.(); } catch {} renderer = await createRenderer(next); push(); }

  // --- Bus-Wiring (Adapter) ---
  const viewAdapter = {
    update({ params, series, idx, model }) {
      try {
        if (params) { const derived = deriveParams(pickParams(params), model || store.snapshot?.()?.model); if (derived) store.setParams(derived); }
        if (model)  store.setModel(model);
        if (series) store.setSeries(series.series ? series.series : series);
        if (idx !== undefined && Number.isFinite(idx)) store.setPointer(idx|0);
      } finally { push(); }
    }
  };

  { 
	  
// gemeinsames Wiring laden (konsolidiert)
let mod = null;
try {
  mod = await import('../wiring/index.js');
} catch (e) {
  console.warn('[SV/GW] wiring not available:', e);
}

    for (const p of candidates) { try { mod = await import(p); if (mod?.wireBus) break; } catch {} }
    if (mod?.wireBus) wiring = mod.wireBus(viewAdapter, bus);
    if (!wiring) {
      // Minimal-Fallback (replay)
      const subs = [];
      const on = (ev, fn) => (bus?.on?.(ev, fn, {replay:true}), subs.push(()=>bus?.off?.(ev, fn)));
      on('uid:e:sim:data',      p => viewAdapter.update({ series: p?.series || p || null }));
      on('uid:e:sim:pointer',   p => viewAdapter.update({ idx: (p && typeof p==='object' && 'idx' in p) ? p.idx : p }));
      on('uid:e:model:update',  p => viewAdapter.update({ params: p, model: p?.model }));
      on('uid:e:engine:status', p => viewAdapter.update({ model:  p?.model }));
      on('uid:e:params:ready',  p => viewAdapter.update({ params: p }));
      on('uid:e:params:change', p => viewAdapter.update({ params: p }));
      wiring = { pause(){ subs.splice(0).forEach(off=>{ try{off();}catch{} }); }, resume(){}, off(){ subs.splice(0).forEach(off=>{ try{off();}catch{} }); } };
    }
  }

  // --- Actions + Power-Gating ---
  const widgetEl = host.closest('.widget') || host;

  async function setView(next){ const v=String(next||'').toLowerCase(); if(v && v!==view){ view=v; await mountRenderer(view);} }
  function getView(){ return view; }

  // NEW: Square-Mode & Rate-Unit Hooks (für Burger)
  function getSquareMode(){ return squareMode; }
  function setSquareMode(m){
    const next = (m==='momentum'||m==='flows'||m==='delta') ? m : 'momentum';
    squareMode = next; writeLS('uidv:square:mode', next);
    try { squareAPI?.setMode?.(next); } catch {}
    push();
  }
  function getRateUnit(){ return rateUnit; }       // 'ppd' (Prozentpunkte/Tag) | 'absd' (#/Tag)
  function setRateUnit(u){
    const next = (u==='ppd'||u==='absd') ? u : 'ppd';
    rateUnit = next; writeLS('uidv:square:rateunit', next);
    try { squareAPI?.setRateUnit?.(next); } catch {}
    push();
  }

  // (Bestehende Dummy-Hooks bleiben für Header-Menüs verfügbar)
  function setLabels(_b){ push(); }  function getLabels(){ return true; }
  function setFormat(_f){ push(); }  function getFormat(){ return 'pct'; }
  function setAnimate(_b){ push(); } function getAnimate(){ return true; }

  const actionsBus = { emit: (ev, data) => { try{ bus?.publish?.(ev, data); }catch{} try{ bus?.emit?.(ev, data); }catch{} } };

  // Header-Actions montieren (Burger etc.) – bekommt jetzt auch Square-Hooks
  const actionsCtl = mountSVActions(widgetEl, {
    setView, getView,
    setLabels, getLabels,
    setFormat, getFormat,
    setAnimate, getAnimate,
    // NEW:
    getSquareMode, setSquareMode,
    getRateUnit,   setRateUnit
  }, { bus: actionsBus });

  // Renderer + Ranges
  await mountRenderer(view);
  try {
    const snap = store.snapshot();
    const ranges = await computeRanges(snap?.model, mode);
    if (ranges) { store.setRanges(ranges); push(); }
  } catch {}

  // Play-Button (Content) – optional, falls Datei vorhanden
  try {
    const slot = ensureContentSlot(host);
    let SimMod = null;
    try { 
      SimMod = await import('/uid-e_v1/12-3_presentation/12-35_vt/state%20visuals/sim-button.play05.js');
    } catch { 
      try { SimMod = await import('./sim-button.play05.js'); } catch {} 
    }
    SimMod?.mountSimButtonPlay05?.({ anchor: slot, size:{ w:28,h:28,bw:2 } });
  } catch {}

  function dispose(){
    try { wiring?.off?.(); } catch {}
    try { actionsCtl?.dispose?.(); } catch {}
    try { renderer?.dispose?.(); } catch {}
  }
  return { dispose, setView, getView, getSquareMode, setSquareMode, getRateUnit, setRateUnit };
}

// util: LS
function readLS(k, def){ try{ return localStorage.getItem(k) ?? def; }catch{ return def; } }
function writeLS(k,v){ try{ localStorage.setItem(k,v); }catch{} }

export default { mountVector };
