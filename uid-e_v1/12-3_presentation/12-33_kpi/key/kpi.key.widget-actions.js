/*!
 * File:      /12-3_presentation/kpi/key/kpi.key.widget-actions.js
 * Project:   UID-Explore · Presentation Layer · KPI Tool — KEY Deck
 * Role:      Header-Actions (Digits 1–4, Format, Reduced) für das Key KPI Widget
 * Type:      Open Educational Resource (OER) · ESM
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-03
 * Version:   3.1.0
 * Changelog:
 *   - v2.0.0  Port aus /kpi/keykpi.widget-actions.js in /kpi/key/ (ESM-Struktur).
 *             Keine Funktionsänderung; nur Dateiname/Import-Pfad angepasst.
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// 1) Imports & Topics
// ─────────────────────────────────────────────────────────────────────────────
import * as EBUS from '../../../12-1_base/bus.js';
import { mountWidgetActions, presets } from '/uid-e_v1/12-4_support/12-42_widgets/index.js';

const NS = 'uid:keykpi';
export const KEYKPI_TOPICS = {
  GROUP_SET:      `${NS}:group:set`,
  VIEW_FORMAT:    `${NS}:view:format`,
  VIEW_REDUCED:   `${NS}:view:reduced`,
  ENABLED:        `${NS}:enabled`,
  FORMAT_VISIBLE: `${NS}:view:format:visible`,
};

// ─────────────────────────────────────────────────────────────────────────────
// 2) Digit-Mapping, LocalStorage & State
// ─────────────────────────────────────────────────────────────────────────────
const DIGITS  = ['1','2','3','4'];
const MAP_D2G = { '1':'goal', '2':'model', '3':'sim', '4':'synth' };
const MAP_G2D = { goal:'1', model:'2', sim:'3', synth:'4' };

const LS = { groups:'uid:keykpi.groups', format:'uid:keykpi.format', reduced:'uid:keykpi.reduced' };
const loadLS = (k,f)=>{ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):f; }catch{ return f; } };
const saveLS = (k,v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} };

// ─────────────────────────────────────────────────────────────────────────────
// 3) Bus-Helpers (stick & emit)
// ─────────────────────────────────────────────────────────────────────────────
const stick  = ()=>{ try{
  EBUS.stick(KEYKPI_TOPICS.GROUP_SET);
  EBUS.stick(KEYKPI_TOPICS.VIEW_FORMAT);
  EBUS.stick(KEYKPI_TOPICS.VIEW_REDUCED);
  EBUS.stick(KEYKPI_TOPICS.ENABLED);
  EBUS.stick(KEYKPI_TOPICS.FORMAT_VISIBLE);
} catch{} };

const emit = (type, payload) => {
  const p = (payload && typeof payload === 'object' && !Array.isArray(payload) && !payload.source)
    ? { ...payload, source: 'wa' } : payload;
  try { EBUS.emit(type, p); } catch {}
};

// ─────────────────────────────────────────────────────────────────────────────
// 4) Public Mount
// ─────────────────────────────────────────────────────────────────────────────
export function mountKeyKPIActions(headerSlot, opts = {}){
  if (!headerSlot) return;
  stick();

  const widgetEl = headerSlot.closest?.('.widget') || headerSlot;
  if (!widgetEl) return;

  const TITLES = Object.assign({
    goal:'Kuratiert',
    model:'Modell-KPI',
    sim:'Simulations-KPI',
    synth:'Synthese/Advanced KPI',
  }, opts.titles || {});

  const initialIds = loadLS(LS.groups, ['goal']).map(id => MAP_G2D[id] || id);
  const groups     = new Set(initialIds.filter(v => DIGITS.includes(v)));
  let   format     = loadLS(LS.format, 'hybrid');
  let   reduced    = !!loadLS(LS.reduced, false);
  const state = { groups, format, reduced };

  const applyGroupDigit = (d, on)=>{
    const v = String(d); if (!DIGITS.includes(v)) return;
    on ? state.groups.add(v) : state.groups.delete(v);
    saveLS(LS.groups, [...state.groups].map(x=>MAP_D2G[x]));
    emit(KEYKPI_TOPICS.GROUP_SET, { id: MAP_D2G[v], on: !!on });
  };
  const setFormat  = (mode)=>{ const m=String(mode||'').toLowerCase(); if (!m||m===state.format) return;
    state.format=m; saveLS(LS.format,m); emit(KEYKPI_TOPICS.VIEW_FORMAT,{mode:m}); };
  const setReduced = (on)=>{ const v=!!on; if (v===state.reduced) return;
    state.reduced=v; saveLS(LS.reduced,v); try{ widgetEl.setAttribute('data-kpi-reduced', v?'true':'false'); }catch{};
    emit(KEYKPI_TOPICS.VIEW_REDUCED,{on:v}); };

  const buildSpec = (s)=>({
    dyn: [
      presets.toggle({ id:'kkpi:g1', label:'1', title:TITLES.goal,  get:()=>s.groups.has('1'), set:(on)=>applyGroupDigit('1',!!on) }),
      presets.toggle({ id:'kkpi:g2', label:'2', title:TITLES.model, get:()=>s.groups.has('2'), set:(on)=>applyGroupDigit('2',!!on) }),
      presets.toggle({ id:'kkpi:g3', label:'3', title:TITLES.sim,   get:()=>s.groups.has('3'), set:(on)=>applyGroupDigit('3',!!on) }),
      presets.toggle({ id:'kkpi:g4', label:'4', title:TITLES.synth, get:()=>s.groups.has('4'), set:(on)=>applyGroupDigit('4',!!on) }),
    ],
    globals: [],
  });

  const api = mountWidgetActions(widgetEl, buildSpec(state));
  widgetEl.__kkpiMounted = { api, state };

  function getBurgerModel(){
    const s = widgetEl.__kkpiMounted?.state || state;
    const isDE = (String(document.documentElement.lang||'de').toLowerCase().startsWith('de'));
    return {
      columns: 2,
      sections: [
        { title: isDE?'Format':'Format', items:[
          { label:isDE?'Relativ':'Relative', type:'radio', group:'fmt', selected:s.format==='pct',    onSelect:()=> setFormat('pct') },
          { label:isDE?'Absolut':'Absolute', type:'radio', group:'fmt', selected:s.format==='abs',    onSelect:()=> setFormat('abs') },
          { label:'Hybrid',                   type:'radio', group:'fmt', selected:s.format==='hybrid', onSelect:()=> setFormat('hybrid') },
        ]},
        { title: isDE?'Anzeige':'Display', items:[
          { label:isDE?'Reduziert':'Reduced', type:'checkbox', selected: !!s.reduced, onSelect:()=> setReduced(!s.reduced) },
        ]},
      ],
    };
  }
  try { (widgetEl.__uidWA ||= {}).getBurgerModel = getBurgerModel; } catch {}

  // Initiale Events (Replay-freundlich)
  [...state.groups].forEach(d => emit(KEYKPI_TOPICS.GROUP_SET, { id: MAP_D2G[d], on:true }));
  emit(KEYKPI_TOPICS.VIEW_FORMAT,  { mode: state.format });
  emit(KEYKPI_TOPICS.VIEW_REDUCED, { on: !!state.reduced });

  // Listener (mit Replay)
  const off1 = EBUS.on(KEYKPI_TOPICS.GROUP_SET, ({id,on})=>{
    const d = MAP_G2D[id]; if (!d) return;
    on ? state.groups.add(d) : state.groups.delete(d);
    saveLS(LS.groups, [...state.groups].map(x=>MAP_D2G[x]));
    api.update(buildSpec(state));
  }, {replay:true});

  const off2 = EBUS.on(KEYKPI_TOPICS.VIEW_FORMAT, ({mode})=>{
    const m = String(mode||''); if (!m || m===state.format) return;
    state.format = m; saveLS(LS.format, m);
    api.update(buildSpec(state));
  }, {replay:true});

  const off3 = EBUS.on(KEYKPI_TOPICS.VIEW_REDUCED, ({on})=>{
    const v = !!on; if (v === state.reduced) return;
    state.reduced = v; saveLS(LS.reduced, v);
    try { widgetEl.setAttribute('data-kpi-reduced', v ? 'true' : 'false'); } catch {}
    api.update(buildSpec(state));
  }, {replay:true});

  const off4 = EBUS.on(KEYKPI_TOPICS.ENABLED, ({ on })=>{
    const want = !!on;
    const cur  = widgetEl.getAttribute('data-widget-enabled') !== 'false';
    if (want !== cur) widgetEl.setAttribute('data-widget-enabled', want ? 'true' : 'false');
  }, { replay:true });

  return {
    dispose(){
      try{ off1?.(); off2?.(); off3?.(); off4?.(); }catch{}
      try{ widgetEl.__kkpiMounted = null; }catch{}
      try{ api?.dispose?.(); }catch{}
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5) Default-Export
// ─────────────────────────────────────────────────────────────────────────────
export default { mountKeyKPIActions, KEYKPI_TOPICS };
