/*! 
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Input Layer · Parameter Tool · Bridge
 * File:     /parameters/bridge.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-01
 * Updated:  2025-10-03
 * Version:  6.0.1
 * Changelog:
 *   - v6.0.1  Latenzzeit-Kopplung: mapKeys() erweitert → σ pulst/markiert auch L, und L pulst/markiert σ.
 *   - v6.0.0  Modulare Bridge (params→mark/pulse) mit Debounce & Key-Mapping.
 *
 * eAnnotation:
 *   Vermittelt Parameteränderungen zum Formeln-Panel: sofort „mark“, dann debounced „pulse“.
 *   Dokumentiert die Modul-Landkarte und die Rolle von pt.widget-actions in der Widget-Shell.
 */

/* 
 * ModuleMap:
 * parameters/
 * ├─ controls/
 * │  ├─ index.js           (Facade: mountControls → Styles, Sections, Sliders, Bus)
 * │  ├─ styles.js          (Accordion/Slider Styles – scoped)
 * │  ├─ config.js          (sichtbare Keys, Gruppen, Titel)
 * │  ├─ dom.sections.js    (Accordion: Head/Body, ARIA, Strict-One-Open)
 * │  ├─ dom.rows.js        (Slider-Row: Label, Value, Range + ARIA)
 * │  ├─ sliders.js         (Compose & Input→Callback, I₀≤N)
 * │  ├─ runtime.js         (model→UI Sync: .val, #sl-*, ARIA)
 * │  ├─ events.js          (Bus-Wiring Classic: model:update, emitParamChange)
 * │  └─ format.js          (fmt, clamp, num, safeInt, stepOf)
 * ├─ formulas/
 * │  ├─ index.js           (Facade: mountFormulaRenderer)
 * │  ├─ config.js          (flat/order/showSigma)
 * │  ├─ styles.js          (ein Stil wie Bruchschreibweise)
 * │  ├─ templates.js       (rowSym/rowNum, chain_* TeX)
 * │  ├─ dom.js             (Card-Builder + setTextByClass/toggleMark)
 * │  ├─ initial.js         (Chains/Derived initial in Slots)
 * │  ├─ runtime.js         (model/sim → Zahlen-Spans, kein Typeset)
 * │  ├─ events.js          (mark/pulse Klassenwechsel, Pointer-Active)
 * │  └─ math.js            (typesetOnce via MathJax/KaTeX)
 * ├─ pt.widget-actions.js  (Widget-Header-Segmente 1/2/3; koppelt Controls mit der globalen Widget-Shell)
 * └─ bridge.js             (DIES: params:change → formula:mark/pulse, debounced)
 *
 * DataFlow (vereinfacht):
 *   Controls.input → bus:uid:e:params:change → Bridge(mark) → Formulas.events
 *                                  ↳ (debounce) → Bridge(pulse) → Formulas.events
 *   Director.model → bus:uid:e:model:update → Controls.runtime + Formulas.runtime
 *   Director.sim   → bus:uid:e:sim/update   → Formulas.runtime
 *   Widget-Shell (Header 1/2/3) → pt.widget-actions → steuert sichtbare Controls-Sections
 */

import * as bus from '../../12-1_base/bus.js';

/* --------------------------------- Bridge --------------------------------- */
export function initParameterBridge({ quietMs=550 }={}){
  let timer = null;
  const QUIET = Math.max(50, quietMs|0);

  const off = bus.on('uid:e:params:change', (p)=>{
    const keys = mapKeys(String(p?.key || ''));
    try { bus.emit('uid:e:formula:mark',  { keys, source:'classic' }); } catch {}
    if (timer) { clearTimeout(timer); timer = null; }
    timer = setTimeout(()=> { try { bus.emit('uid:e:formula:pulse', { keys, source:'classic' }); } catch {} }, QUIET);
  });

  return ()=> { try{ off && off(); }catch{} if (timer){ clearTimeout(timer); timer=null; } };
}

/* ---------------------------- Mapping der Variablen ------------------------ */
function mapKeys(k){
  const key = k.toLowerCase();
  switch (key){
    case 'd':        return ['D','gamma'];     // D = 1/γ
    case 'gamma':    return ['gamma','D'];     // γ ↔ D
    case 'r0':       return ['R0','beta'];     // β = R0·γ
    case 'beta':     return ['beta','R0'];     // β ↔ R0
    case 'sigma':    return ['sigma','L'];     // σ ↔ L (SEIR)
    case 'l':        return ['L','sigma'];
    case 'measures': return ['beta_eff','reff_t','reff_0'];
    default:         return [normalizeKey(key)];
  }
}

function normalizeKey(s){
  if (/^r0$/i.test(s))       return 'R0';
  if (/^d$/i.test(s))        return 'D';
  if (/^l$/i.test(s))        return 'L';
  if (/^beta$/i.test(s))     return 'beta';
  if (/^gamma$/i.test(s))    return 'gamma';
  if (/^sigma$/i.test(s))    return 'sigma';
  if (/^measures$/i.test(s)) return 'measures';
  if (/^reff_t$/i.test(s))   return 'reff_t';
  if (/^reff_0$/i.test(s))   return 'reff_0';
  if (/^beta_eff$/i.test(s)) return 'beta_eff';
  return s;
}
