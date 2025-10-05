/*! 
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Input Layer · Parameter Tool · Formulas
 * File:     /parameters/formulas/events.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-01
 * Updated:  2025-10-01
 * Version:  6.0.0
 * Changelog:
 *   - v6.0.0 Bus-/Pointer-Wiring ausgelagert; dispose()-fähige Unloader
 *
 * eAnnotation:
 *   Verdrahtet Mark/Pulse über den Event-Bus und Pointer-Aktivität am Panel.
 *   Setzt/entfernt nur Klassen (.fe-drag/.fe-pulse); kein Reflow/Typeset.
 */

import * as bus from '../../../12-1_base/bus.js';

/* ---------- helpers ---------- */
function classForVar(v){
  const k = String(v||'').toLowerCase();
  if (k === 'r0')        return 'fe-R0';
  if (k === 'beta')      return 'fe-beta';
  if (k === 'gamma' || k === 'd') return 'fe-gamma';
  if (k === 'sigma')     return 'fe-sigma';
  if (k === 'beta_eff')  return 'fe-beff';
  if (k === 'reff_t')    return 'fe-Reff_t';
  if (k === 'reff_0')    return 'fe-Reff_0';
  return 'fe-var';
}
function findNodes(host, cls){
  return host?.querySelectorAll?.(`.fe-chain .${cls}, .fe-sym .${cls}, .fe-num .${cls}`) || [];
}
function markKeys(host, keys, on){
  (keys||[]).forEach(k=>{
    const cls = classForVar(k);
    findNodes(host, cls).forEach(n=> n.classList.toggle('fe-drag', !!on));
  });
}
function pulseKeys(host, keys, dur=900){
  const bag = [];
  (keys||[]).forEach(k=>{
    const cls = classForVar(k);
    findNodes(host, cls).forEach(n=>{ n.classList.add('fe-pulse'); bag.push(n); });
  });
  setTimeout(()=> bag.forEach(n=> n.classList.remove('fe-pulse')), dur);
}

/**
 * Verdrahtet Bus-Ereignisse (mark/pulse) → Klassenwechsel im Panel.
 * @param {HTMLElement} HOST
 * @returns {Function} unloader
 */
export function wireMarkPulse(HOST){
  const off1 = bus.on('uid:e:formula:mark',  ({key, keys})=>{
    const ks = keys || (key ? [key] : []);
    markKeys(HOST, ks, true);
  });
  const off2 = bus.on('uid:e:formula:pulse', ({key, keys})=>{
    const ks = keys || (key ? [key] : []);
    pulseKeys(HOST, ks, 900);
    // optional: nach dem Puls entmarken (ruhiger Endzustand)
    setTimeout(()=> markKeys(HOST, ks, false), 900);
  });
  return ()=>{ try{off1&&off1(); off2&&off2();}catch{} };
}

/**
 * Markiert die aktuell per Pointer bediente Variable (Mirror-Slider im Panel).
 * @param {HTMLElement} HOST
 * @returns {Function} unloader
 */
export function wirePointerActive(HOST){
  const ACTIVE = new Set();

  function resolveKeyFromInput(el){
    // Mirror-Slider: id="fe-sl-R0" | "fe-sl-gamma" | "fe-sl-beta" | "fe-sl-D" | "fe-sl-sigma"
    const id = el?.id || '';
    if (id.startsWith('fe-sl-')) return id.replace('fe-sl-','');
    if (id.startsWith('sl-'))    return id.replace('sl-',''); // Fallback
    return null;
  }

  function onDown(e){
    const inp = e.target && e.target.closest?.('input[type="range"]');
    if (!inp) return;
    const k = resolveKeyFromInput(inp);
    if (!k) return;
    // D steuert γ (didaktische Kopplung)
    const driver = (k === 'D') ? 'gamma' : k;
    ACTIVE.add(String(driver).toLowerCase());
    markKeys(HOST, [driver], true);
  }
  function onUp(){
    const ks = Array.from(ACTIVE);
    if (ks.length){
      pulseKeys(HOST, ks, 900);
      setTimeout(()=> markKeys(HOST, ks, false), 900);
      ACTIVE.clear();
    }
  }

  HOST.addEventListener('pointerdown', onDown, { capture:true, passive:true });
  window.addEventListener('pointerup', onUp, { passive:true });

  return ()=>{ 
    HOST.removeEventListener('pointerdown', onDown, { capture:true });
    window.removeEventListener('pointerup', onUp);
    ACTIVE.clear();
  };
}
