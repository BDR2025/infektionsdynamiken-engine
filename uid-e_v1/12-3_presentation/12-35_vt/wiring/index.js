/*!
 * File:      visual tool/wiring/index.js
 * Module:    Common Wiring for State Visuals & GridWave
 * License:   CC BY 4.0
 * Version:   1.0.5
 * Updated:   2025-10-06
 * Notes:     • Sticky Rehydrate mit Fallback: sim:data ODER data:series
 *            • Erster Frame garantiert: wenn kein Pointer → timeline:set(t0) (t0 = first(t) oder 0)
 *            • Falls keine Serie vorhanden: nudge() + timeline:set(0) → Playback/Engine anstoßen
 *            • NEU (v1.0.5): Rehydrate pusht auch uid:e:model:params; Resume triggert IMMER frischen timeline:set
 * Changelog:
 *   - v1.0.5  Entkopplung SV/GW weiter gehärtet: Rehydrate übernimmt letzte uid:e:model:params
 *             (und fallweise params:ready/change), Resume sendet stets timeline:set(t_last|0),
 *             Abos um uid:e:model:params ergänzt. Damit rendert jedes Widget unabhängig.
 *   - v1.0.4  Pointer-Garantie: Bei fehlendem sim:pointer wird IMMER timeline:set(t0) gesendet.
 *             t0 = first(series.t) wenn verfügbar, sonst 0. Zusätzlich nudge() falls keine Serie.
 *   - v1.0.3  Offline-First: nutzt data:series als Ersatz für sim:data; lokaler idx=0 Fallback.
 *   - v1.0.2  Aggregiertes Rehydrate; kein params aus model:update; Tippfehlerbereinigung.
 */

function resolveBus(maybeBus){
  if (maybeBus && (maybeBus.on || maybeBus.subscribe)) return maybeBus;
  if (typeof window !== 'undefined' && window.EBUS) return window.EBUS;
  return null;
}

function addListener(bus, type, handler){
  if (bus && typeof bus.subscribe === 'function' && typeof bus.unsubscribe === 'function') {
    bus.subscribe(type, handler);
    return () => { try{ bus.unsubscribe(type, handler);}catch{} };
  }
  if (bus && typeof bus.on === 'function' && typeof bus.off === 'function') {
    bus.on(type, handler, { replay:false });
    return () => { try{ bus.off(type, handler);}catch{} };
  }
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    const domHandler = (ev) => handler(ev && (ev.detail ?? ev));
    window.addEventListener(type, domHandler);
    return () => { try{ window.removeEventListener(type, domHandler);}catch{} };
  }
  return () => {};
}

function getLast(bus, type){
  try {
    if (bus && typeof bus.getLast === 'function') return bus.getLast(type);
    if (typeof window !== 'undefined' && window.EBUS?.getLast) return window.EBUS.getLast(type);
  } catch {}
  return undefined;
}

function nudge(bus){
  try { if (bus?.emit) return bus.emit('uid:e:params:change', { bulk:{} }); } catch {}
  try {
    if (typeof window !== 'undefined')
      window.dispatchEvent(new CustomEvent('uid:e:params:change', { detail:{ bulk:{} } }));
  } catch {}
}

function emit(bus, type, payload = {}) {
  const p = (payload && typeof payload === 'object') ? { ...payload } : {};
  if (!('source' in p)) p.source = 'wa';
  try { return bus?.emit?.(type, p); } catch {}
  try {
    if (typeof window !== 'undefined')
      window.dispatchEvent(new CustomEvent(type, { detail:p }));
  } catch {}
}

/**
 * Schließt target.update({ params, series, idx, model }) an den Bus an.
 * @param {{update: Function}} target
 * @param {any} [maybeBus]
 * @returns {{pause:Function,resume:Function,off:Function}}
 */
export function wireBus(target, maybeBus){
  const bus = resolveBus(maybeBus);
  if (!target || typeof target.update !== 'function') throw new Error('[wiring] target.update fehlt');
  if (!bus) throw new Error('[wiring] Kein Event-Bus gefunden');

  let disposed=false, attached=false;
  const offs=[];

  function registerAll(){
    if (attached || disposed) return;
    attached = true;

    // Datenfluss
    offs.push(addListener(bus, 'uid:e:sim:data', (p) => {
      try { target.update({ series: (p && p.series) ? p.series : p }); } catch {}
    }));

    // model:update → NUR model/idx spiegeln (KEIN params)
    offs.push(addListener(bus, 'uid:e:model:update', (p) => {
      try { if (p?.model) target.update({ model:p.model }); } catch {}
      try { if (p && typeof p==='object' && Number.isFinite(p.idx)) target.update({ idx:p.idx|0 }); } catch {}
    }));

    // params-Events wie gehabt (+ ergänzt um model:params)
    offs.push(addListener(bus, 'uid:e:params:ready',  (p) => { try{ target.update({ params:p }); }catch{} }));
    offs.push(addListener(bus, 'uid:e:params:change', (p) => { try{ target.update({ params:p }); }catch{} }));
    offs.push(addListener(bus, 'uid:e:model:params',  (p) => { try{ target.update({ params:p }); }catch{} }));

    // engine:status kann das Model präzisieren (optional, falls geführt)
    offs.push(addListener(bus, 'uid:e:engine:status',(p) => { try{ if (p?.model) target.update({ model:p.model }); }catch{} }));

    // Playback-Pointer
    offs.push(addListener(bus, 'uid:e:sim:pointer',  (p) => {
      try {
        const idx = (p && typeof p==='object') ? p.idx : p;
        if (Number.isFinite(idx)) target.update({ idx: idx|0 });
      } catch {}
    }));
  }

  function unregisterAll(){
    while (offs.length) { const off=offs.pop(); try{ off(); }catch{} }
    attached=false;
  }

  function rehydrate(){
    try {
      // Stickies
      const m   = getLast(bus,'uid:e:model:update');
      const es  = getLast(bus,'uid:e:engine:status');
      const mp  = getLast(bus,'uid:e:model:params') ||
                  getLast(bus,'uid:e:params:change') ||
                  getLast(bus,'uid:e:params:ready');
      const sd  = getLast(bus,'uid:e:sim:data');
      const ds  = getLast(bus,'uid:e:data:series'); // Fallback (Seed/Offline)
      const p   = getLast(bus,'uid:e:sim:pointer');

      // series-Objekt (sim:data bevorzugt)
      const seriesObj =
        (sd && (sd.series || sd)) ||
        (ds && (ds.series || ds)) ||
        null;

      const agg = {};
      if (mp)       agg.params = mp;
      if (m?.model) agg.model  = m.model;
      if (es?.model) agg.model = es.model;                // engine-Status gewinnt
      if (seriesObj) agg.series = seriesObj;
      if (Number.isFinite(p?.idx)) agg.idx = p.idx|0;

      // Wenn Serie vorhanden, aber kein echter Pointer → lokaler idx=0 als Sofortbild
      const tArr = seriesObj?.t || [];
      if (!Number.isFinite(p?.idx) && tArr.length) agg.idx = 0;

      if (Object.keys(agg).length) { try { target.update(agg); } catch {} }

      // **Pointer-Garantie**: falls kein Pointer → Timeline anfordern (t0 = first t oder 0)
      if (!Number.isFinite(p?.idx)) {
        const t0 = (Array.isArray(tArr) && tArr.length) ? (tArr[0] ?? 0) : 0;
        emit(bus, 'uid:e:timeline:set', { t: t0, source: 'vt:wiring:rehydrate' });
        if (!seriesObj) nudge(bus); // Engine anstupsen, falls noch gar keine Serie da ist
      }
    } catch {}
  }

  registerAll();
  rehydrate();

  return {
    pause(){ if(!disposed) unregisterAll(); },
    resume(){
      if(disposed) return;
      registerAll();
      rehydrate();
      // NEU: IMMER ein frischer Frame nach Resume, damit Ziel-Adapter sicher rendert
      try {
        const lastPtr = getLast(bus,'uid:e:sim:pointer');
        const t = (lastPtr && Number.isFinite(lastPtr.idx)) ? (lastPtr.idx|0) : 0;
        emit(bus, 'uid:e:timeline:set', { t, source: 'vt:wiring:resume' });
      } catch {}
    },
    off(){ if(!disposed){ unregisterAll(); disposed=true; } }
  };
}

export default { wireBus };
