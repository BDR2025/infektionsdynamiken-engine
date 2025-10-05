/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Widget Logic (Rehydrate)
 * File:     /uid/12-4_support/widgets/rehydrate.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-03
 * Updated:  2025-10-03
 * Version:  1.4.2
 * Changelog:
 *   - v1.4.2  Repo-Polishing: Kopfzeile/Gliederung, Guards, kommentierte Defaults; API unverändert.
 *
 * eAnnotation:
 *   Replays der letzten Bus-Events (getLast → emit). Falls kein letzter Wert
 *   vorhanden ist und ein Fallback definiert wurde, wird dieser einmalig emittiert.
 *   attachAutoRehydrate() hängt Rehydrate an Power-ON und data-enabled/data-widget-enabled.
 */

'use strict';

/* ============================================================================
 * 1) Public API: rehydrateWidget(bus, events)
 * ---------------------------------------------------------------------------
 * @param {object} bus  - EBUS-kompatibel: getLast(ev), emit(ev, payload)
 * @param {Array<{ev:string, fallback?:any}>} events
 * @returns {void}
 * ------------------------------------------------------------------------- */
export function rehydrateWidget(bus, events = []) {
  if (!bus || !Array.isArray(events) || events.length === 0) return;

  for (const item of events) {
    if (!item || typeof item.ev !== 'string' || !item.ev) continue;

    const { ev, fallback } = item;
    let did = false;

    try {
      const last = bus.getLast?.(ev);
      if (last != null) { bus.emit?.(ev, last); did = true; }
    } catch {}

    if (!did && fallback !== undefined) {
      try { bus.emit?.(ev, fallback); } catch {}
    }
  }
}

/* ============================================================================
 * 2) Public API: attachAutoRehydrate(host, bus, events, headerEl?)
 * ---------------------------------------------------------------------------
 * - Triggert rehydrateWidget() bei:
 *   a) Wechsel von data-enabled (Header) auf "true"
 *   b) Wechsel von data-widget-enabled (Host) auf "true"
 *   c) CustomEvent 'uid:widget:power:on'
 * @returns {Function} dispose()
 * ------------------------------------------------------------------------- */
/**
 * Attaches auto-rehydrate when a widget turns ON (data-enabled="true")
 * or when it receives a custom "uid:widget:power:on" event.
 *
 * @param {HTMLElement} host
 * @param {object}      bus
 * @param {Array<{ev:string, fallback?:any}>} events
 * @param {HTMLElement} [headerEl] - optional, falls der Header getrennt liegt
 * @returns {Function} dispose
 */
export function attachAutoRehydrate(host, bus, events, headerEl) {
  if (!host) return () => {};
  const hdr = headerEl || host.querySelector(':scope > .uidw-header');
  const run = () => rehydrateWidget(bus, events);

  // 1) MutationObserver auf data-enabled (Header) & data-widget-enabled (Host)
  const mo = new MutationObserver(list => {
    for (const m of list) {
      if (m.type !== 'attributes') continue;
      if (m.attributeName === 'data-enabled' && m.target === hdr) {
        if (hdr && hdr.getAttribute('data-enabled') !== 'false') run();
      }
      if (m.attributeName === 'data-widget-enabled' && m.target === host) {
        if ((host.dataset.widgetEnabled ?? 'true') !== 'false') run();
      }
    }
  });
  try { if (hdr) mo.observe(hdr,  { attributes:true, attributeFilter:['data-enabled'] }); } catch {}
  try { mo.observe(host, { attributes:true, attributeFilter:['data-widget-enabled'] }); } catch {}

  // 2) CustomEvent-Hook (Power-on Signal)
  const onPowerOn  = () => run();
  try { host.addEventListener('uid:widget:power:on', onPowerOn); } catch {}

  // 3) Dispose
  return () => {
    try { mo.disconnect(); } catch {}
    try { host.removeEventListener('uid:widget:power:on', onPowerOn); } catch {}
  };
}

/* ============================================================================
 * 3) Defaults: Standard-Eventliste für Explore-Widgets
 * ---------------------------------------------------------------------------
 * Hinweise:
 *  - 'uid:e:model:params' dient als samle-Topic für Parameter (falls vorhanden).
 *  - scale:changed wird oft vom Header-Tool getriggert; hier nur Replay.
 * ------------------------------------------------------------------------- */
export const DEFAULT_EXPLORE_EVENTS = [
  { ev: 'uid:e:model:params',  fallback: { R0:3, gamma:0.2, N:1_000_000, I0:10, T:180, dt:0.5 } },
  { ev: 'uid:e:data:series' },        // letzte Serie
  { ev: 'uid:e:sim:pointer' },        // aktueller Index/Playhead
  { ev: 'uid:e:sim:status' },         // running/speed/idx
  { ev: 'uid:e:viz:scale:changed' },  // 'pct' | 'abs'
];

/* ============================================================================
 * 4) Default-Export (Kompatibilität)
 * ------------------------------------------------------------------------- */
export default { rehydrateWidget, attachAutoRehydrate, DEFAULT_EXPLORE_EVENTS };
