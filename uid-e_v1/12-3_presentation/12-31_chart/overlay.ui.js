/*!
 * File:      overlay.ui.js
 * Folder:    /12-3_presentation/chart
 * Project:   Understanding Infection Dynamics · Infektionsdynamiken verstehen
 * Type:      Open Educational Resource (OER)
 * License:   CC BY 4.0
 *
 * Created:   2025-09-27
 * Updated:   2025-09-28
 * Version:   1.2.0
 * Changelog: - Integrator-UI: ein Button mit aktuellem Wert (z.B. "RK4 ▾"), kein Doppel-Label
 *            - Popover an Button-Gruppe verankert (kein Layout-Sprung)
 */

'use strict';

const I18N = {
  de: { play:"Play", pause:"Pause", reset:"Reset", euler:"Euler", heun:"Heun", rk4:"RK4" },
  en: { play:"Play", pause:"Pause", reset:"Reset", euler:"Euler", heun:"Heun", rk4:"RK4" }
};

function pickLang(lang) {
  const L = (lang || document.documentElement.lang || 'de').toLowerCase();
  return L.startsWith('en') ? I18N.en : I18N.de;
}

/**
 * Overlay-Leiste fürs Chart (Play/Pause/Reset + Integrator-Dropdown).
 *
 * @param {HTMLElement} host
 * @param {Object} api    optional: { lang?, bus?, getPlaying?, setPlaying?, play?, pause?, reset?, getIntegrator?, setIntegrator? }
 */
export function attachChartOverlay(host, api = {}) {
  if (!host) throw new Error('[Chart Overlay] host missing');
  if (!host.style.position) host.style.position = 'relative';

  const T = pickLang(api.lang);

  // Scoped ID & Styles
  if (!host.dataset.cId) {
    const rid = Math.random().toString(36).slice(2, 8);
    host.dataset.cId = `uidc-${rid}`;
  }
  const scope = `[data-c-id="${host.dataset.cId}"]`;

  const style = document.createElement('style');
  style.setAttribute('data-uidc-overlay', host.dataset.cId);
  style.textContent = `
    ${scope} .uidg-overlay{
      position:absolute; top:8px; left:8px; right:8px; z-index:10;
      display:flex; align-items:center; justify-content:space-between; gap:12px;
      pointer-events:none;
    }
    ${scope} .uidg-left, ${scope} .uidg-right{
      display:flex; align-items:center; gap:8px; pointer-events:auto;
    }
    /* Popover-Anker direkt an der rechten Button-Gruppe */
    ${scope} .uidg-right{ position:relative; }

    ${scope} .uidg-btn{
      background:rgba(0,0,0,.35);
      border:1px solid rgba(255,255,255,.20);
      color:#fff; border-radius:9999px; padding:6px 12px; font-size:12px; cursor:pointer;
      backdrop-filter:saturate(120%) blur(4px);
    }
    ${scope} .uidg-btn:hover{ border-color:rgba(255,255,255,.35); }
    ${scope} .uidg-btn[aria-pressed="true"]{
      border-color:rgba(255,255,255,.55); background:rgba(255,255,255,.08);
    }

    /* Popover-Menü */
    ${scope} .uidg-menu{
      position:absolute; top:100%; right:0; margin-top:6px;
      background:rgba(0,0,0,.65); border:1px solid rgba(255,255,255,.15);
      border-radius:10px; padding:8px; min-width:180px; color:#e5e7eb;
      box-shadow:0 6px 30px rgba(0,0,0,.35); backdrop-filter:saturate(120%) blur(6px);
    }
    ${scope} .uidg-menu[hidden]{ display:none; }
    ${scope} .uidg-item{
      display:block; width:100%; text-align:left;
      background:transparent; border:1px solid rgba(255,255,255,.14);
      color:#fff; border-radius:8px; padding:6px 10px; font-size:12px; cursor:pointer;
      margin:4px 0;
    }
    ${scope} .uidg-item[aria-checked="true"]{
      border-color:rgba(255,255,255,.55); background:rgba(255,255,255,.08);
    }
  `;
  host.appendChild(style);

  // Bus-Helpers
  const bus = api.bus || null;
  const pub = (type, payload) => {
    try { bus?.emit?.(type, payload); } catch {}
    try { bus?.publish?.(type, payload); } catch {}
    try { window.dispatchEvent(new CustomEvent(type, { detail: payload })); } catch {}
  };
  const sub = (type, fn) => {
    let off = () => {};
    if (bus?.on) { bus.on(type, fn, { replay:true }); off = () => bus.off?.(type, fn); }
    else if (bus?.subscribe) { bus.subscribe(type, fn, { replay:true }); off = () => bus.unsubscribe?.(type, fn); }
    else { const h = (e)=>fn(e.detail||e); window.addEventListener(type,h); off=()=>window.removeEventListener(type,h); }
    return off;
  };

  // Persist (nur UI-Markierung)
  const KEY_INT = 'uidc:integrator';
  const read = (k, d) => { try { const v = localStorage.getItem(k); return v ?? d; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

  // State & Bridges
  let _playing = !!(api.getPlaying?.() ?? false);
  let _integrator = (api.getIntegrator?.() ?? read(KEY_INT,'rk4'));

  const setPlaying = (val) => {
    const v = !!val;
    _playing = v;
    try { api.setPlaying?.(v); } catch {}
    if (v) { try { api.play?.(); } catch {}  pub('uid:e:sim:play', {}); }
    else   { try { api.pause?.(); } catch {} pub('uid:e:sim:pause', {}); }
    syncButtons();
  };
  const doReset = () => { try { api.reset?.(); } catch {}; pub('uid:e:sim:reset', {}); };

  const setIntegrator = (method) => {
    const m = (method || '').toLowerCase();
    if (!m || !['euler','heun','rk4'].includes(m)) return;
    _integrator = m;
    try { api.setIntegrator?.(m); } catch {}
    pub('uid:e:integrator:set', { method:m });
    write(KEY_INT, m);
    syncMenu(); setBtn();
  };

  const labelOf = (m) => ({ euler:T.euler, heun:T.heun, rk4:T.rk4 }[m] || T.rk4);

  // UI
  const wrap  = document.createElement('div'); wrap.className = 'uidg-overlay';
  const left  = document.createElement('div'); left.className = 'uidg-left';
  const right = document.createElement('div'); right.className = 'uidg-right';
  wrap.append(left, right);

  // Left: Play/Pause/Reset
  const bPlay  = document.createElement('button'); bPlay.className='uidg-btn'; bPlay.textContent=T.play;
  const bPause = document.createElement('button'); bPause.className='uidg-btn'; bPause.textContent=T.pause;
  const bReset = document.createElement('button'); bReset.className='uidg-btn'; bReset.textContent=T.reset;
  bPlay.addEventListener('click',  () => setPlaying(true));
  bPause.addEventListener('click', () => setPlaying(false));
  bReset.addEventListener('click', doReset);
  left.append(bPlay, bPause, bReset);

  // Right: Integrator-Button + Popover
  const bInt = document.createElement('button'); bInt.className='uidg-btn';
  bInt.setAttribute('aria-haspopup','true'); bInt.setAttribute('aria-expanded','false');

  const menu = document.createElement('div'); menu.className='uidg-menu'; menu.hidden = true; menu.setAttribute('role','menu');

  const makeOpt = (key, label) => {
    const it = document.createElement('button');
    it.className = 'uidg-item';
    it.setAttribute('role','menuitemradio');
    it.setAttribute('aria-checked', String(_integrator===key));
    it.dataset.method = key;
    it.textContent = label;
    it.addEventListener('click', () => { closeMenu(); setIntegrator(key); });
    return it;
  };
  const optEuler = makeOpt('euler', T.euler);
  const optHeun  = makeOpt('heun',  T.heun);
  const optRK4   = makeOpt('rk4',   T.rk4);
  menu.append(optEuler, optHeun, optRK4);

  const setBtn = () => { bInt.textContent = `${labelOf(_integrator)} ▾`; };

  const openMenu = () => {
    menu.hidden = false; bInt.setAttribute('aria-expanded','true');
    ({ euler:optEuler, heun:optHeun, rk4:optRK4 }[_integrator] || optRK4).focus();
  };
  const closeMenu = () => { if (menu.hidden) return; menu.hidden = true; bInt.setAttribute('aria-expanded','false'); bInt.focus(); };

  bInt.addEventListener('click', (e)=>{ e.stopPropagation(); menu.hidden ? openMenu() : closeMenu(); });

  // Keyboard in Menü
  menu.addEventListener('keydown', (e)=>{
    const items = [optEuler, optHeun, optRK4];
    const idx = items.indexOf(document.activeElement);
    if (e.key === 'Escape'){ e.preventDefault(); closeMenu(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight'){ e.preventDefault(); items[(idx+1+items.length)%items.length].focus(); return; }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft'){ e.preventDefault(); items[(idx-1+items.length)%items.length].focus(); return; }
    if (e.key === 'Enter' || e.key === ' '){
      e.preventDefault(); const m = document.activeElement?.dataset?.method; if (m) { closeMenu(); setIntegrator(m); }
    }
  });

  // Outside close
  const closeOnOutside = (e) => { if (!menu.hidden && !menu.contains(e.target) && !bInt.contains(e.target)) closeMenu(); };
  document.addEventListener('click', closeOnOutside, { capture:true });

  right.append(bInt);        // Button sichtbar
  right.append(menu);        // Popover *unter* dem Button
  host.appendChild(wrap);    // Overlay in den Host

  // Sync UI
  function syncButtons(){ bPlay.setAttribute('aria-pressed', String(_playing)); bPause.setAttribute('aria-pressed', String(!_playing)); }
  function syncMenu(){
    optEuler.setAttribute('aria-checked', String(_integrator==='euler'));
    optHeun .setAttribute('aria-checked', String(_integrator==='heun'));
    optRK4  .setAttribute('aria-checked', String(_integrator==='rk4'));
  }
  syncButtons(); syncMenu(); setBtn();

  // Bus-Status spiegeln (Sticky/Live)
  const offStatus = sub('uid:e:engine:status', (st) => {
    const m = (st?.detail?.method || st?.method || '').toLowerCase();
    if (m && m !== _integrator) { _integrator = m; write(KEY_INT, m); syncMenu(); setBtn(); }
  });

  return {
    dispose(){
      offStatus?.();
      document.removeEventListener('click', closeOnOutside, { capture:true });
      try { host.querySelector(`style[data-uidc-overlay="${host.dataset.cId}"]`)?.remove(); } catch {}
    }
  };
}

export default { attachChartOverlay };
