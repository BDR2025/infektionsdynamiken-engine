/*!
 * File:      sv.widget-actions.js
 * Project:   UID-Explore · Visual Tool · State Visuals
 * Role:      Widget-Actions (Segmented 1–2 + Burger Darstellung/Animation/Reset)
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-05
 * Version:   1.5.4
 * Changelog:
 *   - v1.5.4  Pfadfix: Cross-Package EBUS-Import absolut (/uid-e_v1/12-1_base/bus.js).
 *   - v1.5.3  Spec v4.4 Single-Source: Entfernt Seeds für uid:e:sim:status / uid:e:sim:pointer.
 *             Stattdessen Initialisierung via uid:e:timeline:set { t:0 }. Keine weiteren Änderungen.
 *   - v1.5.2  Exklusiv-Segmented mit lokalem State + Event-Sync (fix gegen hängende ARIA).
 *             Auto-Tagging source:'wa' (Seeds behalten source:'seed'); Init-Mirror; Listener-Cleanup.
 *             LEGACY_BRIDGE-Schalter (jetzt true, später false); Payload: view + optional value.
 */

'use strict';

import * as EBUS from '/uid-e_v1/12-1_base/bus.js';
import { mountWidgetActions, presets } from '/uid-e_v1/12-4_support/12-42_widgets/index.js';

const NS_E   = 'uid:e:sv';   // neuer, normativer Präfix
const NS_OLD = 'uid:sv';     // Legacy-Prefix
const LEGACY_BRIDGE = true;  // ← später auf false drehen

/* ---------------------------- Bus-Helpers ---------------------------- */
function makeEmit(bus){
  // Auto-Tagging source:'wa' (vorhandene 'source' bleibt unberührt)
  const emitRaw = (ev, payload) => {
    const p = (payload && typeof payload === 'object' && !Array.isArray(payload) && !payload.source)
      ? { ...payload, source: 'wa' } : payload;
    try { bus?.emit?.(ev, p); } catch {}
    try { EBUS.emit(ev, p); } catch {}
  };
  return {
    raw: emitRaw,
    view: (payload) => { emitRaw(`${NS_E}:view`, payload); if (LEGACY_BRIDGE) emitRaw(`${NS_OLD}:view`, payload); },
    opts: (payload) => { emitRaw(`${NS_E}:opts`, payload); if (LEGACY_BRIDGE) emitRaw(`${NS_OLD}:opts`, payload); }
  };
}
function hasLast(bus, ev){
  try { if (bus?.getLast?.(ev) !== undefined) return true; } catch {}
  try { if (EBUS.getLast?.(ev) !== undefined) return true; } catch {}
  return false;
}

/* ---------------------------- Main Mount ---------------------------- */
export function mountSVWidgetActions(host, api = {}, { bus } = {}){
  const widgetEl = host?.closest?.('.widget') || host;
  if (!widgetEl) throw new Error('[sv.widget-actions] host missing');

  const EMIT = makeEmit(bus);

  // -------- API-Brücken (lesend bevorzugt aus api) --------
  const apiGetView    = () => (api.getView?.()    ?? null);        // 'wheel' | 'square' | null
  const apiSetView    = (v) => { try{ api.setView?.(v); }catch{} };
  const apiGetLabels  = () => !!(api.getLabels?.() ?? true);
  const apiSetLabels  = (b) => { try{ api.setLabels?.(!!b); }catch{} };
  const apiGetFormat  = () => (api.getFormat?.()  ?? 'units');      // 'units' | 'none'
  const apiSetFormat  = (f) => { try{ api.setFormat?.(f); }catch{} };
  const apiGetAnimate = () => !!(api.getAnimate?.() ?? true);
  const apiSetAnimate = (b) => { try{ api.setAnimate?.(!!b); }catch{} };

  // -------- Lokaler Segmented-Status (robust gg. stale Getter) --------
  // Mapping: '1' → wheel, '2' → square
  const D2V = { '1':'wheel', '2':'square' };
  const V2D = { wheel:'1', square:'2' };
  let seg = V2D[apiGetView() || 'wheel'] || '1';

  // -------- WA: dyn (Segmented 1/2) --------
  function buildSpec(){
    return {
      dyn: [presets.segmented({
        id: `${NS_E}:seg`,
        options: [
          { label:'1', value:'1', title:'Wheel (Compartments)' },
          { label:'2', value:'2', title:'Square (Potential)'  }
        ],
        get: () => seg, // ← lokaler State steuert ARIA
        set: (v) => {
          seg = String(v || '1');
          const view = D2V[seg] || 'wheel';
          apiSetView(view);
          // Primär: view, optional index value (für Tests/Logs)
          EMIT.view({ view, value: seg });
          ctrl?.update?.(buildSpec());
        }
      })],
      globals: []
    };
  }

  // -------- Burger-Modell --------
  function getBurgerModel(){
    const isVoll    =  apiGetLabels() && apiGetFormat() !== 'none';
    const isEinfach = !apiGetLabels() && apiGetFormat() === 'none';
    return {
      columns: 3,
      sections: [
        {
          title: 'Darstellung',
          items: [
            {
              label: 'Voll (mit Einheiten)',
              type: 'radio', group: 'sv-display',
              selected: isVoll,
              onSelect: () => { apiSetLabels(true); apiSetFormat('units'); EMIT.opts({ labels:true, format:'units' }); ctrl?.update?.(buildSpec()); }
            },
            {
              label: 'Einfach (ohne Einheiten)',
              type: 'radio', group: 'sv-display',
              selected: isEinfach,
              onSelect: () => { apiSetLabels(false); apiSetFormat('none');  EMIT.opts({ labels:false, format:'none'  }); ctrl?.update?.(buildSpec()); }
            }
          ]
        },
        {
          title: 'Animation',
          items: [{
            label: apiGetAnimate() ? 'Animation: Ein' : 'Animation: Aus',
            type: 'checkbox',
            selected: apiGetAnimate(),
            onSelect: () => { const nxt=!apiGetAnimate(); apiSetAnimate(nxt); EMIT.opts({ animate:nxt }); ctrl?.update?.(buildSpec()); }
          }]
        },
        {
          title: 'Reset',
          items: [{
            label: 'Zurücksetzen',
            type: 'radio', group: 'sv-reset',
            selected: false,
            onSelect: () => {
              seg = '1';
              apiSetView('wheel'); apiSetLabels(true); apiSetFormat('units'); apiSetAnimate(true);
              EMIT.view({ view:'wheel', value:'1' });
              EMIT.opts({ labels:true, format:'units', animate:true });
              ctrl?.update?.(buildSpec());
            }
          }]
        }
      ]
    };
  }

  // -------- Mount --------
  let ctrl = mountWidgetActions(widgetEl, buildSpec(), { debug:false });
  try { (widgetEl.__uidWA ||= {}).getBurgerModel = getBurgerModel; } catch {}

  // -------- Seeds / Rehydrate (v4.4) --------
  function seedIfNeeded(){
    const P = { R0:3, gamma:0.2, N:1_000_000, I0:10, T:180, dt:0.5 };
    if (!hasLast(bus, 'uid:e:model:update') && !hasLast(bus, 'uid:e:params:change'))
      EMIT.raw('uid:e:params:change', { bulk: P, source: 'seed' });
    if (!hasLast(bus, 'uid:e:data:series')){
      const t = [0, P.dt, P.dt*2];
      EMIT.raw('uid:e:data:series', { t, S:[P.N,P.N-1,P.N-2], I:[P.I0,P.I0+1,P.I0+2], R:[0,0,1], N:P.N, kind:'seed' });
    }
    // v4.4 Single-Source: sim:status & sim:pointer kommen ausschließlich von Playback.
    // Initialen Zeitzeiger nur anfordern, wenn noch kein Pointer existiert:
    if (!hasLast(bus, 'uid:e:sim:pointer')) EMIT.raw('uid:e:timeline:set', { t: 0 });
    if (!hasLast(bus, 'uid:e:viz:scale:changed')) EMIT.raw('uid:e:viz:scale:changed', { mode:'absolute' }); // 'percent'|'absolute'
  }

  function pushSV(tag='init'){
    const view = D2V[seg] || 'wheel';
    EMIT.view({ view, value: seg, __via: tag });
    EMIT.opts({ labels: apiGetLabels(), format: apiGetFormat(), animate: apiGetAnimate(), __via: tag });
    ctrl?.update?.(buildSpec());
  }

  function rehydrate(){
    try { widgetEl.setAttribute('data-sv-enabled','true'); } catch {}
    EMIT.raw(`${NS_E}:enabled`, { enabled:true }); // angleichen an GW; falls nicht gewünscht, entferne diese Zeile
    seedIfNeeded();
    pushSV('rehydrate');
  }

  // Listener-Referenzen für sauberes Cleanup
  const onPower = () => rehydrate();
  const onRehyd = () => rehydrate();
  try {
    widgetEl.addEventListener('uid:widget:power:on', onPower);
    widgetEl.addEventListener('uid:widget:rehydrate', onRehyd);
  } catch {}

  // View-Events → lokalen Segmented-State synchron halten
  const offView = (bus?.on?.(`${NS_E}:view`, onView, { replay:true }) || EBUS.on?.(`${NS_E}:view`, onView, { replay:true }) || (()=>{}));
  function onView(e){
    if (typeof e?.value === 'string') seg = e.value;
    else if (e?.view) seg = V2D[e.view] || seg;
    ctrl?.update?.(buildSpec());
  }

  // Initiale API-Werte spiegeln (queueMicrotask)
  queueMicrotask(()=> {
    try {
      const v = apiGetView();
      if (typeof v === 'string'){ const d = V2D[v]; if (d) seg = d; }
      pushSV('api-mirror');
    } catch {}
  });

  return {
    update(){ try{ ctrl?.update?.(buildSpec()); }catch{} },
    dispose(){
      try { widgetEl.removeEventListener('uid:widget:power:on', onPower); } catch {}
      try { widgetEl.removeEventListener('uid:widget:rehydrate', onRehyd); } catch {}
      try { offView?.(); } catch {}
      try { ctrl?.dispose?.(); } catch {}
    }
  };
}

/* ==== Kompat-Exports, damit mount-widgets.js zufrieden ist ==== */
export function mountSVActions(host, api = {}, ctx = {}) { return mountSVWidgetActions(host, api, ctx); }
export { mountSVWidgetActions as mountStateVisualsActions };
export default { mountSVWidgetActions, mountSVActions, mountStateVisualsActions: mountSVWidgetActions };
