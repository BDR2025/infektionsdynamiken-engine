/*!
 * UID-V · Wiring (Bus ↔ View)
 * - Cacht letzte Events (model/update, engine/status, sim/data, sim/pointer)
 * - Rehydriert neue/reaktivierte Views SOFORT (Sticky/Replay)
 * - Nudge (einmalig), falls noch kein sim:data vorhanden
 * - Base-Bus (on/off/emit) und DOM-CustomEvents (Fallback)
 * - v1.2: pause()/resume() für Power-Schalter (Bus-Detache/Attach)
 */

'use strict';

let LAST = {
  model:   null,
  status:  null,
  data:    null,
  pointer: null
};

let NUDGE_SCHEDULED = false;

export function wireBus(view, bus) {
  if (!view) throw new Error('[UID-V Wiring] view missing');

  const useDom = !bus || typeof bus.on !== 'function';
  const add = (type, handler) => {
    if (!useDom) {
      return bus.on(type, (ev) => handler(ev?.detail ?? ev), { replay: true });
    }
    const h = (ev) => handler(ev.detail ?? ev);
    window.addEventListener(type, h);
    // einmalige manuelle Rehydration aus Sticky (falls vorhanden)
    try {
      const last = window?.EBUS?.getLast?.(type);
      if (last !== undefined) setTimeout(() => handler(last), 0);
    } catch {}
    return () => window.removeEventListener(type, h);
  };

  const subs = [];
  function subscribeAll() {
    subs.push(add('uid:e:model:update',  payload => { LAST.model   = payload; if (!paused) safeUpdate(view, { params: payload, model: payload?.model }); }));
    subs.push(add('uid:e:engine:status', payload => { LAST.status  = payload; if (!paused) safeUpdate(view, { model:  payload?.model }); }));
    subs.push(add('uid:e:sim:data',      payload => { LAST.data    = payload; if (!paused) safeUpdate(view, { series: payload?.series }); }));
    subs.push(add('uid:e:sim:pointer',   payload => { LAST.pointer = payload; if (!paused) safeUpdate(view, { idx: (payload?.idx ?? null) }); }));
  }
  function unsubscribeAll() {
    while (subs.length) {
      const off = subs.pop();
      try { off?.(); } catch {}
    }
  }

  // Erstmal abonnieren + sofort rehydrieren
  let paused = false;
  subscribeAll();
  primeFromSticky(bus);
  rehydrate(view);
  if (!LAST.data) nudgeOnce(bus);

  function pause() {
    if (paused) return;
    paused = true;
    unsubscribeAll(); // CPU-schonend: keine Events mehr
  }
  function resume() {
    if (!paused) return;
    paused = false;
    subscribeAll();
    // Replay liefert sofort die letzten Stände; zusätzlich lokal rehydrieren
    rehydrate(view);
    if (!LAST.data) nudgeOnce(bus);
  }
  function off() {
    pause();
  }

  return { off, pause, resume, isPaused: () => paused };
}

/* ---------- Helpers ---------- */

function primeFromSticky(bus) {
  const getLast = (type) => {
    try { if (bus && typeof bus.getLast === 'function') return bus.getLast(type); } catch {}
    try { return window?.EBUS?.getLast?.(type); } catch {}
    return undefined;
  };
  const m = getLast('uid:e:model:update');   if (m !== undefined && m !== null) LAST.model   = m;
  const s = getLast('uid:e:engine:status');  if (s !== undefined && s !== null) LAST.status  = s;
  const d = getLast('uid:e:sim:data');       if (d !== undefined && d !== null) LAST.data    = d;
  const p = getLast('uid:e:sim:pointer');    if (p !== undefined && p !== null) LAST.pointer = p;
}

function rehydrate(view) {
  try {
    if (LAST.model)   safeUpdate(view, { params: LAST.model,  model: LAST.model?.model });
    if (LAST.status)  safeUpdate(view, { model:  LAST.status?.model });
    if (LAST.data)    safeUpdate(view, { series: LAST.data?.series });
    if (LAST.pointer) safeUpdate(view, { idx:    (LAST.pointer?.idx ?? null) });
  } catch {}
}

function safeUpdate(view, obj) {
  try { view.update?.(obj); } catch {}
}

function nudgeOnce(bus) {
  if (NUDGE_SCHEDULED) return;
  NUDGE_SCHEDULED = true;
  const fire = () => {
    try {
      if (bus?.emit) bus.emit('uid:e:params:change', { bulk: {} });
      else {
        const ev = new CustomEvent('uid:e:params:change', { detail: { bulk: {} } });
        window.dispatchEvent(ev);
      }
    } catch {}
    setTimeout(() => { NUDGE_SCHEDULED = false; }, 100);
  };
  requestAnimationFrame(() => requestAnimationFrame(fire));
}
