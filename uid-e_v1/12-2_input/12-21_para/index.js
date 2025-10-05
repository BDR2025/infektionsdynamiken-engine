/*! 
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Input Layer · Parameter Tool
 * File:     /parameters/index.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-01
 * Updated:  2025-10-01
 * Version:  6.0.0
 * Changelog:
 *   - v6.0.0 Orchestrator refactored: modular Controls/Formulas/Bridge/Widget-Actions + Tabs
 *
 * eAnnotation:
 *   Mountet das Parameter-Tool end-to-end: Controls, Formulas, Bridge, Header-Segmente, Tabs.
 *   Kapselt das Zusammenspiel via Event-Bus; stellt {dispose, view, hasFormula} bereit.
 */

import * as bus from '../../12-1_base/bus.js';
import { mountControls }        from './controls/index.js';
import { mountFormulaRenderer } from './formulas/index.js';
import { initParameterBridge }  from './bridge.js';
import { mountPTClassicActions } from './pt.widget-actions.js';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */
function el(idOrEl){
  return (typeof idOrEl === 'string') ? document.getElementById(idOrEl) : idOrEl;
}
function ensureBridge(){
  try {
    if (!window.__uid_e_formula_bridge_started){
      window.__uid_e_formula_bridge_started = true;
      const stop = initParameterBridge({ quietMs: 550 });
      window.addEventListener('beforeunload', ()=> { try{ stop && stop(); }catch{} }, { once:true });
    }
  } catch {}
}

/* -------------------------------------------------------------------------- */
/* Public Mounts (separate Widgets, keine Tabs, keine Strukturänderung)       */
/* -------------------------------------------------------------------------- */

/**
 * Mountet NUR die klassischen Regler in den gegebenen Host.
 * Erzeugt KEINE zusätzlichen Container, Tabs oder .widget‑Klassen.
 */
export function mountParameterClassic(hostOrId, opts={}){
  const host = el(hostOrId);
  if (!host){ console.warn('[parameters] host missing for Classic:', hostOrId); return { dispose(){}, host:null }; }

  // 1) Controls mounten (nutzt internes Replay auf 'uid:e:model:update')
  const api = mountControls(host, {
    catalog:   opts.catalog || {},
    paramsRef: typeof opts.paramsRef === 'function' ? opts.paramsRef : (()=> ({})),
    idPrefix:  String(opts.idPrefix || '').trim()
  });

  // 2) Widget‑Actions (1/2/3) korrekt an der Widget‑Shell verbinden
  try {
    const widgetEl = host.closest('.widget') || host; // erwartet die Shell
    mountPTClassicActions(widgetEl, {
      onChange: (slot)=> api?.setActive?.(slot),
      storageKey: (opts.idPrefix ? `uid:pt:${opts.idPrefix}:slot` : 'uid:pt:classic:slot')
    });
  } catch (e){ console.warn('[parameters] mountPTClassicActions failed:', e); }

  // 3) Bridge sicherstellen (für Mark/Pulse im Formel‑Panel)
  ensureBridge();

  return {
    dispose(){ try{ api?.dispose?.(); }catch{} },
    host
  };
}

/**
 * Mountet NUR die Formel‑Ansicht in den gegebenen Host.
 * Nutzt Replay auf 'uid:e:model:update' und **'uid:e:sim:data'** (Fix).
 */
export function mountParameterFormulas(hostOrId, opts={}){
  const host = el(hostOrId);
  if (!host){ console.warn('[parameters] host missing for Formulas:', hostOrId); return { dispose(){}, host:null }; }

  const api = mountFormulaRenderer(host);

  // Initial‑Replay (konservativ, keine DOM‑Manipulation)
  try {
    const lastM = bus.getLast && bus.getLast('uid:e:model:update');
    if (lastM) { try{ api?.updateModel?.(lastM); }catch{} }
    const lastS = bus.getLast && bus.getLast('uid:e:sim:data'); // <— Fix
    if (lastS) { try{ api?.updateSim?.(lastS); }catch{} }
  } catch (e){ console.warn('[parameters] formulas replay failed:', e); }

  // Bridge nur sicherstellen (falls Classic zuvor nicht montiert wurde)
  ensureBridge();

  return {
    dispose(){ try{ api?.dispose?.(); }catch{} },
    host
  };
}

/* -------------------------------------------------------------------------- */
/* Optionaler Kombi‑Mount (keine Tabs, nur für Legacy‑Aufrufe)                */
/*   Achtung: Es werden einfach beide Mounts nacheinander auf denselben Host  */
/*   gesetzt, **ohne** DOM‑Umbau. Empfohlen bleibt die getrennte Verwendung.  */
/* -------------------------------------------------------------------------- */
export function mountParameterTool(hostOrId, opts={ view:'sliders' }){
  const view = String(opts.view || 'sliders').toLowerCase();
  if (view === 'formulas') return mountParameterFormulas(hostOrId, opts);
  // 'both' und alles andere werden konservativ als 'sliders' behandelt
  return mountParameterClassic(hostOrId, opts);
}

export default {
  mountParameterClassic,
  mountParameterFormulas,
  mountParameterTool
};
