/*!
 * File:     core/bus.js
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 * Type:     Open Educational Resource (OER)
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-09-21
 * Updated:  2025-09-27
 * Version:  v1.1.0
 * Changelog:
 *   - v1.1.0 Sticky-Events (Replay) + getLast/clearLast/clearAllLast, once()
 *             konfigurierbarer DOM-Mirror, defensives Listener-Handling
 *   - v1.0.1 DOM-Mirror ergänzt, Debug-Logger integriert
 *   - v1.0.0 Initial Tiny Event Bus
 */

/** @typedef {(payload:any)=>void} BusHandler */

/** Standardmäßig „sticky“: letzte Nutzlast wird erinnert und neuen Listenern auf Wunsch (replay) sofort geliefert. */
const DEFAULT_STICKY_TYPES = new Set([
  "uid:e:params:ready",
  "uid:e:model:update",
  "uid:e:engine:status",
  "uid:e:sim:data",
  "uid:e:sim:pointer"
]);

/** Kleiner Helfer für „baldmöglichst“ ohne Reentrancy-Risiko. */
const asap = (fn) => (typeof queueMicrotask === "function" ? queueMicrotask(fn) : Promise.resolve().then(fn));

/** Interner Listener-Speicher: type -> Set<handler> */
const _listeners = new Map();
/** Letzte Nutzlast je Event-Typ (für Sticky/Replay) */
const _lastByType = new Map();

/** Laufzeitkonfiguration des Busses */
export const config = {
  /** Spiegle jedes emit als DOM-CustomEvent auf window (Debug/Inspektoren/externes Mithören) */
  mirror: true,
  /** Welche Eventtypen sind „sticky“ (letzte Nutzlast wird gemerkt) */
  stickyTypes: DEFAULT_STICKY_TYPES,
  /** Konsolen-Logging bei emit (leichtgewichtig) */
  debug: false
};

/** Bus-Version (sichtbar für Tools/Overlays) */
export const version = "v1.1.0";

/**
 * Abonnieren eines Events.
 * @param {string} type
 * @param {BusHandler} handler
 * @param {{replay?: boolean}} [opts]  Wenn true, handler sofort mit letzter Nutzlast (falls vorhanden) aufrufen.
 * @returns {() => void} off-Funktion zum Abbestellen
 */
export function on(type, handler, opts = {}) {
  if (!_listeners.has(type)) _listeners.set(type, new Set());
  _listeners.get(type).add(handler);

  // Optionales Replay (Sticky-Event)
  if (opts.replay && _lastByType.has(type)) {
    const payload = _lastByType.get(type);
    // Nicht synchron aufrufen, um Reentrancy/Side-Effects in Mount-Phasen zu vermeiden
    asap(() => safeCall(handler, payload, type));
  }
  return () => off(type, handler);
}

/**
 * Genau einmal ausführen, dann automatisch off().
 * @param {string} type
 * @param {BusHandler} handler
 * @param {{replay?: boolean}} [opts]
 */
export function once(type, handler, opts = {}) {
  const offFn = on(type, (payload) => {
    try { handler(payload); } finally { offFn(); }
  }, opts);
  return offFn;
}

/**
 * Abbestellen.
 * @param {string} type
 * @param {BusHandler} handler
 */
export function off(type, handler) {
  const set = _listeners.get(type);
  if (set) {
    set.delete(handler);
    if (set.size === 0) _listeners.delete(type);
  }
}

/**
 * Event senden.
 * 1) Benachrichtigt alle Bus-Listener
 * 2) Optional: speichert letzte Nutzlast (Sticky)
 * 3) Optional: spiegelt als DOM-CustomEvent (window.dispatchEvent)
 * @param {string} type
 * @param {any} payload
 */
export function emit(type, payload) {
  // Sticky-Store aktualisieren (nur wenn Typ konfiguriert)
  try {
    if (config.stickyTypes && config.stickyTypes.has(type)) {
      _lastByType.set(type, payload);
    }
  } catch (_) {
    // Konfiguration wurde zur Laufzeit verändert — sicher ignorieren
  }

  // Debug-Log (leicht: Objekt direkt an console übergeben)
  if (config.debug) {
    try { console.log(`[UID-E Bus] Event: ${type}`, payload); }
    catch { console.log(`[UID-E Bus] Event: ${type}`); }
  }

  // Bus-Listener benachrichtigen
  const set = _listeners.get(type);
  if (set && set.size) {
    // Kopie, falls Handler off() während Iteration ruft
    for (const fn of Array.from(set)) safeCall(fn, payload, type);
  }

  // DOM-Mirror
  if (config.mirror && typeof window !== "undefined" && window && typeof window.dispatchEvent === "function") {
    try {
      const ev = new CustomEvent(type, { detail: payload, bubbles: true, composed: true });
      window.dispatchEvent(ev);
    } catch (err) {
      // Ältere Browser / Sonderfälle — Mirror überspringen
    }
  }
}

/**
 * Letzte Nutzlast für Typ abfragen (Sticky/Replay).
 * @param {string} type
 * @returns {any|undefined}
 */
export function getLast(type) {
  return _lastByType.get(type);
}

/** Letzte Nutzlast eines Typs verwerfen. */
export function clearLast(type) {
  _lastByType.delete(type);
}

/** Alle gemerkten Sticky-Nutzlasten verwerfen. */
export function clearAllLast() {
  _lastByType.clear();
}

/** Typ als „sticky“ markieren. */
export function stick(type) {
  config.stickyTypes.add(type);
  // Keine Sofortaktion nötig — Wirkung beim nächsten emit / on(replay)
}

/** Typ nicht länger „sticky“. */
export function unstick(type) {
  config.stickyTypes.delete(type);
  _lastByType.delete(type);
}

/** Sicherer Listener-Call (bricht Bus nicht bei Fehlern). */
function safeCall(fn, payload, type) {
  try { fn(payload); }
  catch (err) {
    try { console.error(`[UID-E Bus] Listener error for "${type}"`, err); }
    catch { /* ignore */ }
  }
}

/**
 * Optional: globale Bus-Instanz für Konsole/Legacy.
 * ESM-Import bleibt parallel möglich:
 *   import { on, emit } from './bus.js'
 */
export const EBUS = {
  version,
  config,
  on, once, off, emit,
  getLast, clearLast, clearAllLast,
  stick, unstick
};

// Globale Referenz bereitstellen (nicht zwingend, aber praktisch für Probes)
if (typeof window !== "undefined") {
  // Nur setzen, wenn nicht bereits extern gebunden
  if (!window.EBUS) window.EBUS = EBUS;
}

/* ------------------------------------------------------------------ */
/*                          Debug-Probe (leicht)                      */
/*   Kann bei Bedarf auf config.debug = true geschaltet werden.      */
/*   Unabhängig davon bleibt der DOM-Mirror aktiv (config.mirror).    */
/* ------------------------------------------------------------------ */

const DEBUG_EVENTS = [
  "uid:e:params:ready",
  "uid:e:params:change",
  "uid:e:model:update",
  "uid:e:sim:data",
  "uid:e:sim:pointer",
  "uid:e:error",
  "uid:e:engine:status"
];

// Standardmäßig KEIN Dauer-Logging. Bei Bedarf:
//   import { config } from './bus.js'; config.debug = true;
if (config.debug) {
  for (const ev of DEBUG_EVENTS) {
    on(ev, (payload) => {
      try { console.log(`[UID-E Bus] Event: ${ev}`, payload); }
      catch { console.log(`[UID-E Bus] Event: ${ev}`); }
    });
  }
}

export default EBUS;
