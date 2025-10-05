/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Widget Logic (Registry/Presets)
 * File:     /uid/12-4_support/widgets/registry.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-03
 * Updated:  2025-10-03
 * Version:  1.4.2
 * Changelog:
 *   - v1.4.2  Repo-Polishing: Kopfzeile/Gliederung/Annotation; generische multitoggle()-Factory ergänzt.
 *
 * eAnnotation:
 *   Liefert standardisierte Action-Objekte (Bund-Vorgaben) für die Widget-Aktionsleiste.
 *   Output ist reines Daten-Shape (keine DOM/Side-Effects) — konsumiert von mountWidgetActions().
 */

'use strict';

/* ============================================================================
 * 1) Presets: standardisierte Action-Objekte
 * -------------------------------------------------------------------------- */
/**
 * Segmented: exklusiver 1..n Schalter
 * @param {{id:string, options:Array<{label:string,value:string,title?:string}>, get:Function, set:Function}} cfg
 */
export function segmented({ id, options, get, set }){
  return { type:'segmented', id, options, get, set };
}

/**
 * Toggle: einfacher an/aus-Schalter
 * @param {{id:string, label?:string, icon?:string, get:Function, set:Function}} cfg
 */
export function toggle({ id, label, icon, get, set }){
  return { type:'toggle', id, label, icon, get, set };
}

/**
 * Button: einfacher Button mit Handler
 * @param {{id:string, label?:string, icon?:string, onClick?:Function}} cfg
 */
export function button({ id, label, icon, onClick }){
  return { type:'button', id, label, icon, onClick };
}

/**
 * Dropdown: Auswahlliste (Radio/Checkbox über items.type/group steuerbar)
 * @param {{id:string, label?:string, items:Array<{label?:string,value?:any,selected?:boolean,checked?:boolean,isSelected?:Function,onSelect?:Function,group?:string,type?:'radio'|'checkbox'}>}} cfg
 */
export function dropdown({ id, label, items }){
  // items: [{label, value, selected?/checked?/isSelected?, onSelect, group?, type?}]
  return { type:'dropdown', id, label, items };
}

/**
 * Multitoggle (generisch): mehrere unabhängige Toggles in einem Block.
 * Shape absichtlich generisch, da contracts.js keine Felder erzwingt.
 * @param {Object} cfg - wird unverändert durchgereicht (z. B. {id, groups, get, set})
 */
export function multitoggle(cfg = {}){
  return { type:'multitoggle', ...cfg };
}

/* ============================================================================
 * 2) Convenience: vordefinierte Presets
 * -------------------------------------------------------------------------- */
/**
 * Beispiel: % ↔ # Skalenumschaltung.
 * Erwartet get(): 'pct'|'abs' und set(mode:string).
 */
export function scaleToggle({ get, set }){
  return toggle({
    id: 'viz:scale',
    label: '%/#',
    // Toggle-Zustand spiegelt 'abs' als "an" (aria-pressed=true)
    get: () => (get?.() === 'abs'),
    set: (on) => set?.(on ? 'abs' : 'pct')
  });
}

/* ============================================================================
 * 3) Default Export (Kompatibilität als Namespace)
 * -------------------------------------------------------------------------- */
export default { segmented, toggle, button, dropdown, multitoggle, scaleToggle };
