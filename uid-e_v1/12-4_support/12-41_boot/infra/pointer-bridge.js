/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Boot Module (ESM)
 * File:     /uid/12-4_support/app/boot/infra/pointer-bridge.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-04
 * Updated:  2025-10-04
 * Version:  1.0.0
 * Changelog:
 *   - v1.0.0  Pointer-Bridge implementiert (idempotent, normalisiert Timeline/Sim-Events).
 *
 * Role:
 *   Brücke: Timeline/Sim-Events → einheitlicher Pointer-Event.
 *   Normalisiert diverse Eingänge zu: `uid:e:sim:pointer { t, idx, src:'pointer-bridge' }`.
 *   Idempotent: Mehrfachaufrufe verdrahten nicht erneut, Rückgabe ist ein Teardown-Callback.
 *
 * ModuleMap (short)
 *   /app/boot/infra/
 *     pointer-bridge.js      (DIES · Implementierung)
 *     pointer-bridge.boot.js (Boot-Aufrufer; ruft wirePointerBridge(EBUS) 1×)
 */
'use strict';

export function wirePointerBridge(bus, {
  sourceEvents = ['uid:e:timeline:set', 'uid:e:timeline:hover', 'uid:e:sim:step'],
  outEvent     = 'uid:e:sim:pointer'
} = {}) {
  if (!bus || typeof bus.on !== 'function') return () => {};

  // Idempotenz: maximal einmal verdrahten
  if (window.__uidPointerBridgeOnce) return window.__uidPointerBridgeOnce;

  const handlers = [];
  const emit = (p = {}) => {
    const payload = {
      t:   Number.isFinite(p.t) ? p.t : (typeof p.time === 'number' ? p.time : 0),
      idx: (p.idx ?? p.i ?? p.index ?? 0),
      src: p.src || 'pointer-bridge'
    };
    (bus.emit || bus.pub)?.call(bus, outEvent, payload);
  };

  for (const ev of sourceEvents) {
    const h = (payload) => emit(payload || {});
    const off = bus.on?.(ev, h, { replay: true }) || bus.sub?.(ev, h, { replay: true }) || null;
    handlers.push(off);
  }

  const offAll = () => {
    for (const off of handlers) { try { off?.(); } catch {} }
  };

  window.__uidPointerBridgeOnce = offAll;
  console.info('[pointer-bridge] ready');
  return offAll;
}
