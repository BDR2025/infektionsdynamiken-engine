/*!
 * File:   index.js  · SAFE v0.9.99+ (rAF-coalesced)
 * Goal:   Statisches Triple + Re-Coupling + flackerfreie Slot-Updates (Pointer)
 * License: CC BY 4.0
 */

// Actions defensiv laden (falls Datei fehlt, kein Crash)
try { import('./leq.widget-actions.js'); } catch {}

/* Core-Imports */
import * as EBUS from '../../12-1_base/bus.js';
import { mountView } from './view.js';
import { schedule }  from './scheduler.js';
import { texLeft, texMidSymbolic, texDerivLine } from './tex-symbolic.js';
import { getSpec }   from './model-specs/index.js';

/* ---------- lokales Wiring (Bus ODER DOM-CustomEvents) ---------- */
function wireSafe({ onEvent }) {
  const useBus = !!(EBUS && typeof EBUS.on === 'function');
  const subs = [];
  const add = (type, handler, { replay = true } = {}) => {
    if (useBus) {
      try {
        const off = EBUS.on(type, (ev) => handler(ev?.detail ?? ev), { replay });
        subs.push(() => { try { off?.(); } catch {} });
      } catch {}
      return;
    }
    // DOM-Fallback
    const h = (ev) => handler(ev?.detail ?? ev);
    window.addEventListener(type, h);
    subs.push(() => window.removeEventListener(type, h));
    // Optional: einfacher Replay
    try {
      const last = window?.EBUS?.getLast?.(type);
      if (last !== undefined) setTimeout(() => handler(last), 0);
    } catch {}
  };
  add('uid:e:sim:data',     (payload) => onEvent('data',   payload));
  add('uid:e:model:update', (payload) => onEvent('params', payload));
  add('uid:e:sim:pointer',  (payload) => onEvent('ptr',    payload), { replay:false });
  return () => { while (subs.length) { try { subs.pop()(); } catch {} } };
}

/* ---------- Visual aus Dataset anwenden (ohne Re-Typeset) ---------- */
function applyVisualFromDataset(viewRoot){
  try{
    const card   = document.getElementById('core-equation-widget');
    const visual = card?.dataset?.visual || 'color';          // 'color' | 'mono' | 'bold'
    const isMono = (visual === 'mono' || visual === 'bold');
    viewRoot?.classList.toggle('is-white', isMono);
    viewRoot?.classList.toggle('is-bold',  visual === 'bold');

    const did = card?.dataset?.didaktik ?? '1';               // '0'|'1'|'2'|'3'
    ['did-0','did-1','did-2','did-3'].forEach(k => viewRoot?.classList.remove(k));
    viewRoot?.classList.add(`did-${did}`);
  }catch{}
}

/* ---------- kleine Helfer ---------- */
function deriveCoefs(p){
  const gamma = (p?.gamma!=null) ? +p.gamma : (p?.D ? 1/Number(p.D) : 0);
  const beta  = (p?.beta !=null) ? +p.beta  : ((p?.R0!=null && gamma) ? p.R0*gamma : 0);
  const sigma = (p?.sigma!=null) ? +p.sigma : (p?.L ? 1/Number(p.L) : 0);
  const mu    = +p?.mu || 0;
  const nu    = +p?.nu || 0;
  const N     = +p?.N  || 0;
  return { beta, gamma, sigma, mu, nu, N };
}
const clamp = (i, n) => (i==null ? null : Math.max(0, Math.min(n-1, Math.round(i))));
const pick  = (arr, i) => (Array.isArray(arr) && i!=null ? arr[i] : null);

/* ---------- Mount ---------- */
export async function mountCoreEquation(){
  // 1) View mounten
  const view = mountView('#core-equation');

  // 2) Statisches Triple rendern
  const model = document.documentElement?.dataset?.model || 'SEIR';
  const spec  = getSpec(model);
  await view?.renderStatic?.({
    left:  texLeft(spec.states),
    mid:   texMidSymbolic(spec),
    deriv: texDerivLine(spec)
  });

  // 3) Visual aus Datasets übernehmen
  applyVisualFromDataset(view?.root);

  // 4) Live-Kopplung (calibrate/freeze) – gedrosselt (nicht pro Frame)
  let series = null, params = null, simLen = 0;
  let calibrated=false, frozen=false;

  const pumpFreeze = schedule(() => {
    if (!series || !params) return;
    try {
      if (!calibrated){ view?.calibrate?.(spec, series, params); calibrated = true; }
      if (!frozen){     view?.enableFreeze?.(spec, series, params); frozen = true; }
      else { /* Slots-Update macht der rAF-Loop */ }
    } catch {}
  }, 120);

  // 5) rAF-Coalescing für Slots (Pointer/Live)
  let ptrIdx = null;           // letzter gemeldeter Index
  let needSlots = false;       // Flag: in diesem Frame updaten
  let lastApplied = -1;        // zuletzt angewendeter Index

  function requestSlotsUpdate(){ needSlots = true; }

  function computeValsAt(i){
    if (!series || !params) return null;
    const n = Math.max(series.S?.length||0, series.E?.length||0, series.I?.length||0, series.R?.length||0);
    const k = clamp(i!=null? i : (n-1), n);
    const { beta, gamma, sigma, mu, nu, N } = deriveCoefs(params);
    return { beta, gamma, sigma, mu, nu, N,
      S: pick(series.S, k),
      E: pick(series.E, k),
      I: pick(series.I, k)
    };
  }

  function frame(){
    if (needSlots){
      const k = ptrIdx;
      // nur neu schreiben, wenn sich der Index wirklich geändert hat
      if (k !== lastApplied){
        const vals = computeValsAt(k);
        if (vals) { try { view?.updateSlots?.(vals); } catch {} }
        lastApplied = k;
      }
      needSlots = false;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // 6) Wiring
  const off = wireSafe({
    onEvent: (kind, payload) => {
      try {
        if (kind === 'data'){
          series  = payload?.series ?? payload;
          simLen  = Math.max(series?.S?.length||0, series?.E?.length||0, series?.I?.length||0);
          pumpFreeze();           // (re)calibrate & freeze
          requestSlotsUpdate();   // neue Daten → einmal Slots schreiben
        }
        if (kind === 'params'){
          params = payload;
          pumpFreeze();
          requestSlotsUpdate();
        }
        if (kind === 'ptr'){
          ptrIdx = (payload?.idx ?? null);
          // coalesce: nur Flag setzen, rAF schreibt maximal 1× pro Frame
          requestSlotsUpdate();
        }
      } catch {}
    }
  });

  // 7) Default: farbig (sicherheitshalber)
  try { view?.root?.classList?.remove('is-white'); } catch {}

  // 8) Sanfter Nudge (Bus oder DOM) – initialen Stand holen
  requestAnimationFrame(() => requestAnimationFrame(() => {
    try {
      if (EBUS?.emit) EBUS.emit('uid:e:params:change', { bulk:{} });
      else window.dispatchEvent(new CustomEvent('uid:e:params:change', { detail:{ bulk:{} } }));
    } catch {}
  }));

  return { dispose(){ try { off?.(); } catch{} } };
}

/* ---------- Auto-Mount ---------- */
if (!window.UID_LEQ_NOMOUNT && document.currentScript?.dataset?.nomount !== 'true') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { try { mountCoreEquation(); } catch {} });
  } else {
    try { mountCoreEquation(); } catch {}
  }
}

export default mountCoreEquation;
