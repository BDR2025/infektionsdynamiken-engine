/*!
 * Project:  Understanding Infection Dynamics · UID-Explore · Presentation / State Visuals
 * File:     /visual tool/state visuals/display.mode.js
 * Type:     OER · ESM
 * License:  CC BY 4.0
 * Version:  1.2.0  (VTSV-kompatibel)
 * Updated:  2025-10-02
 * Role:     Globaler Darstellungs-Toggle (full|simple), Intl-Formatter, Bus-Wiring (auto-init)
 */

import * as _bus from '../../../12-1_base/bus.js';

const STORAGE_KEY = 'uid:sv:display';
const MODES = { FULL: 'full', SIMPLE: 'simple' };
const EV = {
  set: ['uid:sv:display:set', 'vtsv:display:set'],
  pub: ['uid:sv:display',     'vtsv:display']
};

let _booted = false;
let _state = {
  mode: (localStorage.getItem(STORAGE_KEY) || MODES.FULL),
  locale: (document.documentElement?.lang || 'de-DE')
};

// ---------- Bus helpers (robust gegen verschiedene Implementierungen) --------
function _pickBus(){
  const g = (typeof window !== 'undefined') ? window : {};
  const candidates = [_bus, g.EBUS, g.BUS, g.bus, g.uidBus];
  for (const b of candidates) if (b && (b.pub||b.emit||b.publish)) return b;
  return null;
}
function _busPub(ev, payload){
  const b = _pickBus();
  try { (b?.pub || b?.emit || b?.publish)?.call(b, ev, payload); } catch {}
}
function _busOnOnce(ev, handler){
  const b = _pickBus();
  const sub = (b?.on || b?.sub || b?.subscribe);
  if (sub) { try { sub.call(b, ev, handler); return true; } catch {} }
  return false;
}
function _subscribeAll(){
  EV.set.forEach(name=>{
    const ok = _busOnOnce(name, ({ mode }) => setMode(mode));
    if (!ok) {
      // Später erneut versuchen (falls Bus später kommt)
      setTimeout(()=>_busOnOnce(name, ({ mode }) => setMode(mode)), 800);
    }
  });
}

// ---------- core -------------------------------------------------------------
function _applyMode(mode){
  try { document.documentElement.dataset.svDisplay = mode; } catch {}
}
function _publish(){
  EV.pub.forEach(name=>_busPub(name, { mode: _state.mode }));
}

export function getMode(){ return _state.mode; }
export function isSimple(){ return _state.mode === MODES.SIMPLE; }

export function setMode(mode){
  const m = String(mode || '').toLowerCase();
  if (m !== MODES.FULL && m !== MODES.SIMPLE) return _state.mode;
  if (_state.mode === m) return _state.mode;
  _state.mode = m;
  try { localStorage.setItem(STORAGE_KEY, m); } catch {}
  _applyMode(m);
  _publish();
  return _state.mode;
}

export function formatter(locale){
  const lang = locale || _state.locale;
  const nf = (dec=2) => new Intl.NumberFormat(lang, { minimumFractionDigits: dec, maximumFractionDigits: dec });
  return {
    num(v, dec=2){ return nf(dec).format(Number.isFinite(v) ? v : 0); },
    timeDays(t, dec=0){
      const s = nf(dec).format(Number.isFinite(t) ? t : 0);
      return isSimple() ? s : `${s}\u00A0d`;
    },
    deltaPpD(v, dec=2){
      const s = nf(dec).format(Number.isFinite(v) ? v : 0);
      return isSimple() ? s : `${s}\u00A0pp/d`;
    },
    percent(v, dec=1){
      const s = nf(dec).format(Number.isFinite(v) ? v : 0);
      return isSimple() ? s : `${s}\u00A0%`;
    },
    unit(u){ return isSimple() ? '' : u; },
  };
}

export function decimalsForTime(dt){
  if (!Number.isFinite(dt)) return 0;
  if (dt >= 1)   return 0;
  if (dt >= 0.5) return 1;
  return 2;
}

// ---------- auto-init + global Console-API ----------------------------------
export function ensureSVDisplayInitialized(){
  if (_booted) return;
  _booted = true;
  _applyMode(_state.mode);
  _publish();
  _subscribeAll();
  // kleine Console-API, damit du ohne Bus testen kannst
  try {
    window.SVDisplay = {
      get: getMode,
      set: setMode,
      simple(){ return setMode('simple'); },
      full(){ return setMode('full'); }
    };
  } catch {}
}

try {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureSVDisplayInitialized, { once:true });
  } else {
    ensureSVDisplayInitialized();
  }
} catch {}
