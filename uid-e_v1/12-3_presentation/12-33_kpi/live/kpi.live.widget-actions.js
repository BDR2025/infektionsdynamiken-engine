/*!
 * File:      /12-3_presentation/kpi/live/kpi.live.widget-actions.js
 * Project:   UID-Explore · Presentation Layer · KPI Tool — LIVE Deck
 * Role:      Header-Actions für das LIVE-Deck (Ziffern 1–5, Format, Reduced)
 * Type:      Open Educational Resource (OER) · ESM
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-03
 * Version:   3.1.0
 * Changelog:
 *   - v3.1.0  Release-Angleich an KPI Tool 3.1.0; Short-Header vereinheitlicht; keine Funktionsänderung.
 *   - v3.0.0  Port aus /kpi/kpi.widget-actions.js nach /kpi/live/ (ESM-Struktur).
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// 1) Imports
// ─────────────────────────────────────────────────────────────────────────────
import { mountWidgetActions, presets } from '/uid-e_v1/12-4_support/12-42_widgets/index.js';
import * as EBUS from '../../../12-1_base/bus.js';

// ─────────────────────────────────────────────────────────────────────────────
// 2) Public Mount
// ─────────────────────────────────────────────────────────────────────────────
export function mountKPIActions(widgetEl, opts = {}) {
  if (!widgetEl) throw new Error('[kpi.widget-actions] widgetEl missing');
  const bus = opts.bus || EBUS;

  // 2.1) Emit-Helper (source:'wa')
  const emit = (ev, payload) => {
    const p = (payload && typeof payload === 'object' && !Array.isArray(payload) && !payload.source)
      ? { ...payload, source: 'wa' }
      : payload;
    try { bus.emit?.(ev, p); } catch {}
  };

  // 2.2) Kontext & Persistenz
  const html     = document.documentElement;
  const isSchool = (html.dataset.mode || 'university').toLowerCase() === 'school';
  const isDE     = (String(html.lang || 'de').toLowerCase().startsWith('de'));
  const PKEY     = String(opts.persistKey || `uid:kpi:${widgetEl.id || 'widget'}`);

  const load = () => { try { return JSON.parse(localStorage.getItem(PKEY) || '{}'); } catch { return {}; } };
  const save = (obj) => { try { const cur = load(); localStorage.setItem(PKEY, JSON.stringify({ ...cur, ...obj })); } catch {} };

  // 2.3) Initialzustand
  const persisted = load();
  let groups = {
    cur:      typeof persisted.cur      === 'boolean' ? persisted.cur      : true,
    comp:     typeof persisted.comp     === 'boolean' ? persisted.comp     : true,
    tx:       typeof persisted.tx       === 'boolean' ? persisted.tx       : true,
    peaks:    typeof persisted.peaks    === 'boolean' ? persisted.peaks    : !isSchool,
    outcomes: typeof persisted.outcomes === 'boolean' ? persisted.outcomes : false
  };
  let fmtMode = persisted.fmtMode || (isSchool ? 'pct' : 'hybrid'); // 'pct'|'abs'|'hybrid'
  let reduced = typeof persisted.reduced === 'boolean' ? persisted.reduced : false;

  // 2.4) Mapping
  const digitToKey = { '1':'cur', '2':'comp', '3':'tx', '4':'peaks', '5':'outcomes' };
  const keyToBusId = { comp:'comp', tx:'context', peaks:'peaks', outcomes:'outcomes' };

  // 2.5) Apply-Helper
  function applyGroupByDigit(digit, on) {
    const key = digitToKey[String(digit)];
    if (!key) return;
    groups[key] = !!on;
    save({ [key]: groups[key] });
    const busId = keyToBusId[key];
    if (busId) emit('uid:kpi:group:set', { id: busId, on: groups[key] });
  }
  function applyAllGroupsOnce() {
    Object.keys(digitToKey).forEach(d => applyGroupByDigit(d, !!groups[digitToKey[d]]));
  }
  function applyFmt(mode) {
    fmtMode = String(mode || 'pct').toLowerCase();
    save({ fmtMode });
    emit('uid:kpi:view:format', { mode: fmtMode });
  }
  function applyReduced(on) {
    reduced = !!on;
    save({ reduced });
    try { widgetEl.setAttribute('data-kpi-reduced', reduced ? 'true' : 'false'); } catch {}
    emit('uid:kpi:view:reduced', { on: reduced });
  }

  // 2.6) Erstanwendung (Events + Persistenz)
  applyAllGroupsOnce();
  applyFmt(fmtMode);
  applyReduced(reduced);

  // 2.7) Labels (DE/EN)
  const L = isDE
    ? { fmtTitle:'Format', ddRel:'Relativ', ddAbs:'Absolut', ddHybrid:'Hybrid', viewTitle:'Anzeige', reduced:'Reduziert',
        t1:'Kuratiert', t2:'Kompartimente', t3:'Transmission', t4:'Peaks', t5:'Outcomes' }
    : { fmtTitle:'Format', ddRel:'Relative', ddAbs:'Absolute', ddHybrid:'Hybrid', viewTitle:'Display', reduced:'Reduced',
        t1:'Curated', t2:'Compartments', t3:'Transmission', t4:'Peaks', t5:'Outcomes' };

  // 2.8) Actions-Spezifikation + Mount
  let api = null;
  const buildSpec = () => ({
    dyn: [
      presets.toggle({ id:'kpi:g1', label:'1', title:L.t1, get:()=>!!groups.cur,      set:(on)=>applyGroupByDigit('1', !!on) }),
      presets.toggle({ id:'kpi:g2', label:'2', title:L.t2, get:()=>!!groups.comp,     set:(on)=>applyGroupByDigit('2', !!on) }),
      presets.toggle({ id:'kpi:g3', label:'3', title:L.t3, get:()=>!!groups.tx,       set:(on)=>applyGroupByDigit('3', !!on) }),
      presets.toggle({ id:'kpi:g4', label:'4', title:L.t4, get:()=>!!groups.peaks,    set:(on)=>applyGroupByDigit('4', !!on) }),
      presets.toggle({ id:'kpi:g5', label:'5', title:L.t5, get:()=>!!groups.outcomes, set:(on)=>applyGroupByDigit('5', !!on) }),
    ],
    globals: []
  });
  api = mountWidgetActions(widgetEl, buildSpec());

  // 2.9) Burger-Menü Model (für Header-Tools)
  function getBurgerModel(){
    return {
      columns: 2,
      sections: [
        { title: L.fmtTitle, items: [
          { label: L.ddRel,    type:'radio', group:'fmt', selected: fmtMode==='pct',    onSelect: () => { applyFmt('pct');    api?.update?.(buildSpec()); } },
          { label: L.ddAbs,    type:'radio', group:'fmt', selected: fmtMode==='abs',    onSelect: () => { applyFmt('abs');    api?.update?.(buildSpec()); } },
          { label: L.ddHybrid, type:'radio', group:'fmt', selected: fmtMode==='hybrid', onSelect: () => { applyFmt('hybrid'); api?.update?.(buildSpec()); } },
        ]},
        { title: L.viewTitle, items: [
          { label: L.reduced,  type:'checkbox', selected: !!reduced, onSelect: () => { applyReduced(!reduced); api?.update?.(buildSpec()); } },
        ]},
      ]
    };
  }
  try { (widgetEl.__uidWA ||= {}).getBurgerModel = getBurgerModel; } catch {}

  // 2.10) Listener (Backsync)
  const offGroup   = EBUS.on?.('uid:kpi:group:set', e => {
    const inv={comp:'comp',context:'tx',peaks:'peaks',outcomes:'outcomes'};
    const backKey = Object.keys(inv).find(k => inv[k] === e?.id);
    if (!backKey || typeof e?.on!=='boolean') return;
    groups[backKey] = !!e.on; save({ [backKey]: groups[backKey] });
  }) || (()=>{});

  const offFmt     = EBUS.on?.('uid:kpi:view:format',  e => {
    const m=String(e?.mode||'').toLowerCase();
    if (m && m!==fmtMode){ fmtMode=m; save({fmtMode}); }
  }) || (()=>{});

  const offReduced = EBUS.on?.('uid:kpi:view:reduced', e => {
    const v=!!(e&&e.on);
    if (v!==reduced) applyReduced(v);
  }) || (()=>{});

  // 2.11) Dispose
  return {
    dispose(){
      try{ offGroup(); offFmt(); offReduced(); }catch{}
      try{ api?.dispose?.(); }catch{}
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3) Default-Export
// ─────────────────────────────────────────────────────────────────────────────
export default { mountKPIActions };
