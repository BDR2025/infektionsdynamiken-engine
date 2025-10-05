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
 * Updated:  2025-10-01
 * Version:  6.0.0
 * Changelog:
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
 * @param {Record<string,{min:number,max:number,step?:number,def?:number}>} catalog
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
 * @param {string} key
 * @param {number} value
 * @param {('classic'|'formulas'|'external')} [source='classic']
 */
export function emitParamChange(key, value, source='classic'){
  bus.emit('uid:e:params:change', { key, value, source });
}
