/*!
 * File:    core/index.js  (LEQ v0.10.0 · Plugin Core)
 * Purpose: Mount + Plugin-Manager + Bus-Bridges + rAF-Scheduler
 * License: CC BY 4.0
 */

import * as EBUS from '../../../12-1_base/bus.js';
import { mountView } from '../view.js';

let INSTANCE = null;

export function mountLEQ(rootSel = '#core-equation', { mode='flow', plugins=[], options={} } = {}) {
  if (INSTANCE) return INSTANCE;                      // Singleton-Guard

  // 1) View (v09) weiterverwenden
  const view = mountView(rootSel);

  // 2) Kontext für Plugins
  const ctx = {
    mode, options, view, bus: EBUS,
    state: { model:null, params:null, series:null, idx:null, status:null }
  };

  // 3) Bus-Bridges für Plugin-Updates (mit Replay)
  const off = [];
  const on = (type, fn) => { const o = EBUS?.on?.(type, fn, { replay:true }); off.push(o); };
  on('uid:e:model:update',  payload => { ctx.state.params = payload; ctx.state.model = payload?.model; plugins.forEach(p=>p?.onUpdate?.(ctx)); });
  on('uid:e:engine:status', payload => { ctx.state.status = payload;                                   plugins.forEach(p=>p?.onUpdate?.(ctx)); });
  on('uid:e:sim:data',      payload => { ctx.state.series = payload?.series;                           plugins.forEach(p=>p?.onUpdate?.(ctx)); });
  on('uid:e:sim:pointer',   payload => { ctx.state.idx    = (payload?.idx ?? null);                    plugins.forEach(p=>p?.onUpdate?.(ctx)); });

  // 4) rAF-Scheduler (ein Loop für alle Plugins)
  let raf = 0;
  const tick = (t) => { plugins.forEach(p=>p?.onTick?.(t, ctx)); raf = requestAnimationFrame(tick); };

  // 5) Plugins mounten + Loop starten
  const actives = plugins.filter(Boolean);
  actives.forEach(p=>p?.onMount?.(ctx));
  raf = requestAnimationFrame(tick);

  function setMode(m){ ctx.mode = m; actives.forEach(p=>p?.onMode?.(m, ctx)); }
  function setOptions(o){ ctx.options = { ...ctx.options, ...o }; actives.forEach(p=>p?.onOptions?.(ctx.options, ctx)); }

  function unmount(){
    cancelAnimationFrame(raf);
    while (off.length){ try{ off.pop()?.(); }catch{} }
    actives.forEach(p=>p?.onUnmount?.(ctx));
    INSTANCE = null;
  }

  setMode(mode);
  return (INSTANCE = { ctx, setMode, setOptions, unmount });
}

export default mountLEQ;
export const setMode    = (m)=> INSTANCE?.setMode(m);
export const setOptions = (o)=> INSTANCE?.setOptions(o);
export const unmount    = ()=> INSTANCE?.unmount();
