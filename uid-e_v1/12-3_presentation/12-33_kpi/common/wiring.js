/*!
 * File:      /12-3_presentation/kpi/common/wiring.js
 * Project:   UID-Explore · Presentation Layer · KPI Tool — Common
 * Role:      Wiring (Topics, Aliases, Lightweight Mount)
 * Type:      Open Educational Resource (OER) · ESM
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-03
 * Version:   3.1.0
 * Changelog:
 *   - v3.1.0  Short-Header vereinheitlicht; Gliederung/Kommentare ergänzt; Verhalten unverändert.
 *   - v3.0.0  Port & Ausbau des KPI-Wirings (Topics, Alias-Bridge, Sticky-Replay, UI-Enable).
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1) Topics / Contracts
// ─────────────────────────────────────────────────────────────────────────────
export const KPI_TOPICS = Object.freeze({
  VIEW_FORMAT:  'uid:kpi:view:format',   // { mode:'pct'|'abs'|'hybrid' }
  VIEW_REDUCED: 'uid:kpi:view:reduced',  // { on:true|false }
  ENABLED:      'uid:kpi:enabled',       // { on:true|false }
  GROUP_SET:    'uid:kpi:group:set',     // { id:'comp'|'context'|'peaks'|'outcomes', on:true|false }
  DECK_TOGGLE:  'uid:kpi:deck:toggle'    // kompatibler Alias (optional)
});

export const KEYKPI_TOPICS = Object.freeze({
  VIEW_FORMAT:  'uid:keykpi:view:format',
  VIEW_REDUCED: 'uid:keykpi:view:reduced',
  ENABLED:      'uid:keykpi:enabled'
});

// ─────────────────────────────────────────────────────────────────────────────
// 2) Helpers: publish / getLast / on
// ─────────────────────────────────────────────────────────────────────────────
function publish(bus, type, payload){
  try { bus?.emit?.(type, payload); } catch {}
  try { bus?.publish?.(type, payload); } catch {}
  try { window?.dispatchEvent?.(new CustomEvent(type, { detail: payload })); } catch {}
}

function getLast(bus, type){
  try { return bus?.getLast?.(type) ?? null; } catch { return null; }
}

function on(bus, type, handler){
  if (bus?.on) return bus.on(type, handler);
  const fn = (e)=> handler(e.detail);
  window.addEventListener(type, fn);
  return ()=> window.removeEventListener(type, fn);
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Spiegelt View-Events zwischen 'uid:kpi:*' und 'uid:keykpi:*' in beide Richtungen.
 * Loop-Schutz via Payload.__alias.
 */
export function wireKPIAliases(bus, { replay = true } = {}){
  const guard = (from, to) => (payload = {}) => {
    if (payload?.__alias === to || payload?.__alias === from) return;
    publish(bus, to, { ...payload, __alias: to });
  };

  // keykpi → kpi
  const off1 = on(bus, KEYKPI_TOPICS.VIEW_FORMAT,  guard(KEYKPI_TOPICS.VIEW_FORMAT,  KPI_TOPICS.VIEW_FORMAT));
  const off2 = on(bus, KEYKPI_TOPICS.VIEW_REDUCED, guard(KEYKPI_TOPICS.VIEW_REDUCED, KPI_TOPICS.VIEW_REDUCED));
  const off3 = on(bus, KEYKPI_TOPICS.ENABLED,      guard(KEYKPI_TOPICS.ENABLED,      KPI_TOPICS.ENABLED));

  // kpi → keykpi
  const off4 = on(bus, KPI_TOPICS.VIEW_FORMAT,     guard(KPI_TOPICS.VIEW_FORMAT,     KEYKPI_TOPICS.VIEW_FORMAT));
  const off5 = on(bus, KPI_TOPICS.VIEW_REDUCED,    guard(KPI_TOPICS.VIEW_REDUCED,    KEYKPI_TOPICS.VIEW_REDUCED));
  const off6 = on(bus, KPI_TOPICS.ENABLED,         guard(KPI_TOPICS.ENABLED,         KEYKPI_TOPICS.ENABLED));

  // Optionales Replay (Sticky-Events anstoßen)
  if (replay){
    [
      KPI_TOPICS.VIEW_FORMAT, KPI_TOPICS.VIEW_REDUCED, KPI_TOPICS.ENABLED,
      KEYKPI_TOPICS.VIEW_FORMAT, KEYKPI_TOPICS.VIEW_REDUCED, KEYKPI_TOPICS.ENABLED
    ].forEach(t => { const last = getLast(bus, t); if (last) publish(bus, t, last); });
  }

  return () => {
    try{ off1?.(); off2?.(); off3?.(); off4?.(); off5?.(); off6?.(); }catch{}
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4) Lightweight Mount Wiring (Decks mounten, Sticky-Replay, UI-Flag)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * KPI-Wiring (leichtgewichtig):
 *  - mountDecks() sofort bei Init
 *  - Sticky-Replay nach Init (sofort Werte sichtbar)
 *  - setEnabled(): nur UI-State; Decks/Bus bleiben verbunden
 */
export function mountKPIWiring({ widgetEl, bus, mountDecks, unmountDecks } = {}){
  if (!widgetEl) throw new Error('[KPI Wiring] widgetEl missing');
  if (typeof mountDecks !== 'function') throw new Error('[KPI Wiring] mountDecks required');

  const replayOrNudge = () => {
    const lastModel = getLast(bus, 'uid:e:model:update');
    const lastData  = getLast(bus, 'uid:e:sim:data');
    if (lastModel) publish(bus, 'uid:e:model:update', lastModel);
    if (lastData)  publish(bus, 'uid:e:sim:data', lastData);
    if (!lastData) publish(bus, 'uid:e:params:change', { bulk: {} });
  };

  // Init: Decks mounten + Sticky liefern; UI-Flag auf "Ein"
  mountDecks();
  requestAnimationFrame(replayOrNudge);
  widgetEl.dataset.kEnabled = 'true';

  // UI-API
  const getEnabled = () => widgetEl.dataset.kEnabled !== 'false';
  const setEnabled = (v) => { widgetEl.dataset.kEnabled = v ? 'true' : 'false'; };

  const dispose = () => { /* Decks bewusst nicht abkoppeln */ };
  return { getEnabled, setEnabled, dispose };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5) Default-Export
// ─────────────────────────────────────────────────────────────────────────────
export default {
  KPI_TOPICS,
  KEYKPI_TOPICS,
  wireKPIAliases,
  mountKPIWiring
};
