/*! 
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Input Layer · Parameter Tool · Controls
 * File:     /parameters/controls/events.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-01
 * Updated:  2025-10-06
 * Version:  6.0.1
 * Changelog:
 *   - v6.0.1 Emit-Guard: Werte robust in Number konvertiert und invalids verworfen;
 *             Pulse-Gating vorbereitet: Payload ergänzt um at:Date.now(), source default 'classic'.
 *   - v6.0.0 Bus-Wiring extrahiert: model:update mit Replay, emitParamChange()
 *
 * eAnnotation:
 *   Kapselt das Event-Bus-Wiring fürs Classic-Panel (model→Sync, input→emit).
 *   Stellt einen dispose()-fähigen Unloader bereit; keine DOM-Bau- oder Rechenlogik.
 */

import * as bus from '../../../12-1_base/bus.js';
import { syncFromModel } from './runtime.js';

/**
 * Abonniert uid:e:model:update und spiegelt Werte/Slider ins Panel (mit Replay).
 * @param {HTMLElement} container
 * @param {Record<string,{min:number,max:number,step?:number,def?:number,scale?:string}>} catalog
 * @returns {() => void} Unloader
 */
export function wireModelUpdate(container, catalog = {}){
  const off = bus.on('uid:e:model:update', (m) => {
    try { syncFromModel(container, m, catalog); } catch {}
  }, { replay: true });
  return () => { try { off && off(); } catch {} };
}

/**
 * Sendet eine Parameteränderung in den Bus (Quelle: Classic).
 * - Konvertiert value → Number; verwirft Non-Finite.
 * - Ergänzt at: Date.now() zur späteren Pulse-TTL-Gating-Logik.
 * @param {string} key
 * @param {number|string} value
 * @param {('classic'|'formulas'|'external')} [source='classic']
 */
export function emitParamChange(key, value, source='classic'){
  const v = Number(value);
  if (!Number.isFinite(v)) return;
  bus.emit('uid:e:params:change', {
    key: String(key),
    value: v,
    source: source || 'classic',
    at: Date.now()
  });
}
