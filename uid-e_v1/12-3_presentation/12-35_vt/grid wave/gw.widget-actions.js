/*!
 * File:      gw.widget-actions.js
 * Project:   UID-Explore · Visual Tool · GridWave
 * Role:      Widget-Actions (Segmented 1–4 + Burger Crisp/Dichte/Dots)
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-03
 * Version:   1.6.0
 * Changelog:
 *   - v1.6.0  Rehydrate/Power vollständig entkoppelt: keine Seeds, kein timeline:set,
 *             keine internen power:on/rehydrate-Listener. Widget-Actions senden NUR
 *             `${NS}:mode` und `${NS}:opts` und rufen API-Setter. Rehydrate läuft über wiring v1.0.2.
 *   - v1.5.3  Spec v4.4 Single-Source: Entfernt Seeds für uid:e:sim:status / uid:e:sim:pointer.
 *             Stattdessen Initialisierung via uid:e:timeline:set { t:0 }. Keine weiteren Änderungen.
 *   - v1.5.2  ARIA-Fix: lokaler Segmented-State + Event-Sync (keine stale getMode()-Werte).
 *             Initial- & Replay-Sync auf `${NS}:mode` (mode|value) → zuverlässige Markierung.
 *   - v1.5.1  Auto-Tagging source:'wa' in emit(); Listener-Cleanup in dispose().
 *   - v1.5.0  V4.4-Seeds (uid:e:params:change{bulk,source:'seed'} + data:series, sim:*).
 *             Bus-Injection (bus-first, EBUS-Fallback), Rehydrate-Flow, WA/Presets.
 */

'use strict';

import * as EBUS from '../../../12-1_base/bus.js';
import { mountWidgetActions, presets } from '/uid-e_v1/12-4_support/12-42_widgets/index.js';

// Namespace für GridWave (minimal-invasiv beibehalten)
const NS = 'uid:e:gridwave';

// Dichten & Dots wie bisher
const DENSITIES = [16,24,32,40,48,64,80,96,112,128,144,160,176,192];
const RATIOS    = [0.22,0.28,0.33,0.38,0.44];

/**
 * Mountet die GridWave-Actions.
 * @param {HTMLElement} host   – Widget-Root oder Kindelement innerhalb der Karte
 * @param {object}      api    – optionale API (getMode/getDensity/getCrisp/getDotRatio · set*)
 * @param {{bus?:object}} ctx  – optional injizierter Bus (emit/on/getLast)
 */
export function mountGWWidgetActions(host, api = {}, { bus } = {}) {
  const widgetEl = host?.closest?.('.widget') || host;

  // ---- Bus-Helfer: injizierten Bus bevorzugen, EBUS als Fallback ----
  const emit = (ev, payload) => {
    // default source:'wa' injizieren (nicht überschreiben; Seeds behalten source:'seed')
    const p = (payload && typeof payload === 'object' && !Array.isArray(payload) && !payload.source)
      ? { ...payload, source: 'wa' }
      : payload;
    try { bus?.emit?.(ev, p); } catch {}
    try { EBUS.emit(ev, p); } catch {}
  };
  const on   = (ev, h, opt) => (bus?.on?.(ev, h, opt) || EBUS.on?.(ev, h, opt) || (()=>{}));

  // ---- API-Brücken (lesen bevorzugt aus api) ----
  const getMode     = () => (api.getMode?.()     ?? 'proportional');         // 'proportional'|'wave'|'hybrid'|'cluster'
  const setMode     = (v) => { try { api.setMode?.(v); } catch {} emit(`${NS}:mode`, { mode: v }); };

  const getDensity  = () => (api.getDensity?.()  ?? 128);
  const setDensity  = (g) => { try { api.setDensity?.(g); } catch {} emit(`${NS}:opts`, { density: g }); };

  const getCrisp    = () => !!(api.getCrisp?.()  ?? true);
  const setCrisp    = (on)=> { try { api.setCrisp?.(!!on); } catch {} emit(`${NS}:opts`, { crisp: !!on }); };

  const getDotRatio = () => (api.getDotRatio?.() ?? 0.33);
  const setDotRatio = (r) => { try { api.setDotRatio?.(r); } catch {} emit(`${NS}:opts`, { dotRatio: r }); };

  // ---- Mapping Segmented <-> Mode ----
  const M2D = { proportional:'1', wave:'2', hybrid:'3', cluster:'4' };
  const D2M = { '1':'proportional', '2':'wave', '3':'hybrid', '4':'cluster' };

  // ---- Lokaler Segmented-Status (robust gg. stale getMode) ----
  let segState = M2D[getMode()] || '1';

  function buildSpec(){
    return {
      dyn: [
        presets.segmented({
          id: `${NS}:seg`,
          options: [
            { label:'1', value:'1', title:'Proportional' },
            { label:'2', value:'2', title:'Wave'         },
            { label:'3', value:'3', title:'Hybrid'       },
            { label:'4', value:'4', title:'Cluster'      }
          ],
          get: () => segState,
          set: (v) => {
            segState = String(v);                               // 1) lokalen State setzen
            const mode = D2M[segState] || 'proportional';
            setMode(mode);                                      // 2) API/Bus
            emit(`${NS}:mode`, { value: segState, __via:'bridge' }); // optionaler Index für Listener/Tests
            ctrl?.update?.(buildSpec());
          }
        })
      ],
      globals: [] // (Power + Burger kommen global; hier keine Extra-Globals)
    };
  }

  // ---- Burger: Crisp / Dichte / Dots (3 Spalten) ----
  function getBurgerModel(){
    return {
      columns: 3,
      sections: [
        { title:'Crisp',
          items:[{
            label:'Crisp', type:'checkbox', selected:getCrisp(),
            onSelect:()=>{ setCrisp(!getCrisp()); ctrl?.update?.(buildSpec()); }
          }]}
        ,
        { title:'Dichte',
          items:DENSITIES.map(g=>({
            label:`${g}×${g}`, type:'radio', group:'dens',
            selected:getDensity()===g,
            onSelect:()=>{ setDensity(g); ctrl?.update?.(buildSpec()); }
          })) }
        ,
        { title:'Dots',
          items:RATIOS.map(r=>({
            label:`${Math.round(r*100)} %`, type:'radio', group:'dots',
            selected:Math.abs(getDotRatio()-r) < 1e-6,
            onSelect:()=>{ setDotRatio(r); ctrl?.update?.(buildSpec()); }
          })) }
      ]
    };
  }

  // ---- Mount ----
  let ctrl = mountWidgetActions(widgetEl, buildSpec(), { debug:false });
  try { (widgetEl.__uidWA ||= {}).getBurgerModel = getBurgerModel; } catch {}

  // ---- Mode-Event → lokalen Segmented-State synchron halten ----
  const offMode = on(`${NS}:mode`, (e) => {
    if (typeof e?.value === 'string') segState = e.value;
    else if (e?.mode) segState = M2D[e.mode] || segState;
    ctrl?.update?.(buildSpec());
  }, { replay:true });

  // ---- Initiale API-Werte (falls vorhanden) non-invasiv spiegeln ----
  queueMicrotask(()=> {
    try {
      segState = M2D[getMode()] || segState;                     // init-Sync
      emit(`${NS}:mode`, { value: segState, __via:'init' });     // optionaler Index
      const m = D2M[segState] || getMode(); emit(`${NS}:mode`, { mode: m, __via:'init' });
      emit(`${NS}:opts`, { crisp: getCrisp(), density: getDensity(), dotRatio: getDotRatio(), __via:'init' });
    } catch {}
  });

  // ---- Public API ----
  return {
    update(){ try { ctrl?.update?.(buildSpec()); } catch {} },
    dispose(){
      try { offMode?.(); } catch {}
      try { ctrl?.dispose?.(); } catch {}
    }
  };
}

// Kompat-Export (falls extern verwendet)
export const mountGridWaveActions = mountGWWidgetActions;
export default { mountGWWidgetActions, mountGridWaveActions };
