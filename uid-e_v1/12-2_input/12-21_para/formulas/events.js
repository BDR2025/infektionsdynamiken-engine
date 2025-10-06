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
 * Updated:  2025-10-06
 * Version:  6.1.0
 * Changelog:
 *   - v6.1.0 Pulse-Gate implementiert: Quelle=classic, TTL≈280ms, rAF-Einzeltrigger auf model:update.
 *            Präzises Token-Mapping gemäß Soll-Matrix (D/R0/β/γ/σ); Reff-Token auf fev-ret/re0 korrigiert.
 *            Abwärtskompatibel: bestehende Mark/Pulse-Bus-Events weiter unterstützt.
 *   - v6.0.0 Bus-/Pointer-Wiring ausgelagert; dispose()-fähige Unloader
 *
 * eAnnotation:
 *   Mark- & Pulse-Orchestrierung fürs Formeln-Panel.
 *   Unterstützt sowohl Bus-getriggerte Mark/Pulse-Events als auch „activeKey“-basiertes Pulsen
 *   nach echten User-Interaktionen (source:'classic') mit sanftem TTL-Timeout.
 */

import * as bus from '../../../12-1_base/bus.js';

/* ---------- helpers ---------- */
function classForVar(v){
  const k = String(v||'').toLowerCase();
  if (k === 'r0')        return 'fe-R0';
  if (k === 'beta')      return 'fe-beta';
  if (k === 'gamma')     return 'fe-gamma';
  if (k === 'd')         return 'fe-D';
  if (k === 'sigma')     return 'fe-sigma';
  if (k === 'beta_eff')  return 'fe-beff';
  if (k === 'reff_t')    return 'fev-ret-val'; // Wert-Token
  if (k === 'reff_0')    return 'fev-re0-val'; // Wert-Token
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

// Selektor-basierter Puls (präzise Term-Stellen; unabhängig von classForVar)
function pulseSelectors(host, selectors, dur=900){
  const bag = [];
  (selectors||[]).forEach(sel=>{
    const list = host?.querySelectorAll?.(sel) || [];
    list.forEach(n=>{ n.classList.add('fe-pulse'); bag.push(n); });
  });
  if (bag.length) setTimeout(()=> bag.forEach(n=> n.classList.remove('fe-pulse')), dur);
}

// Ziele je aktivem Regler gemäß Soll-Matrix
function targetsForActiveKey(key){
  const k = String(key||'').toLowerCase();
  const T = { sel: [] };
  const add = (cardId, ...classes) => { classes.forEach(c => T.sel.push(`${cardId} .${c}`)); };

  switch(k){
    case 'gamma':
      add('#fe-D',    'fe-gamma', 'fev-gamma');  // Nenner γ
      add('#fe-R0',   'fe-gamma', 'fev-gamma');  // Nenner γ
      add('#fe-beta', 'fe-gamma', 'fev-gamma');  // 2. Faktor γ
      add('#fe-g',    'fe-gamma', 'fev-gamma');  // Eigenzeile γ
      break;
    case 'beta':
      add('#fe-R0',   'fe-beta', 'fev-beta');    // Zähler β
      add('#fe-beta', 'fe-beta', 'fev-beta');    // Eigenzeile β
      break;
    case 'r0':
      add('#fe-R0',   'fe-R0', 'fev-R0');        // Eigenzeile R0
      add('#fe-beta', 'fe-R0', 'fev-R0');        // 1. Faktor R0
      break;
    case 'd':
      add('#fe-D',    'fe-D', 'fev-D');          // Eigenzeile D
      add('#fe-g',    'fev-gamma');              // nur Ergebnis γ sichtbar
      break;
    case 'sigma':
      add('#fe-sigma','fe-sigma', 'fev-sigma');  // Eigenzeile σ
      break;
    case 'measures': // optional
    case 'm':
      add('#fe-R0',   'fev-ret-val', 'fev-re0-val');
      add('#fe-beta', 'fev-be-val');
      break;
  }
  return T.sel;
}

/**
 * Verdrahte Bus-Ereignisse (mark/pulse) → Klassenwechsel im Panel.
 * PLUS: Pulse-Gate (activeKey aus params:change classic → Pulse auf model:update)
 * @param {HTMLElement} HOST
 * @returns {Function} unloader
 */
export function wireMarkPulse(HOST){
  // klassische Mark/Pulse-Kompatibilität
  const off1 = bus.on('uid:e:formula:mark',  ({key, keys})=>{
    const ks = keys || (key ? [key] : []);
    markKeys(HOST, ks, true);
  });
  const off2 = bus.on('uid:e:formula:pulse', ({key, keys})=>{
    const ks = keys || (key ? [key] : []);
    pulseKeys(HOST, ks, 900);
    setTimeout(()=> markKeys(HOST, ks, false), 900);
  });

  // Pulse-Gate (nur echte User-Änderungen)
  let activeKey = null;
  let lastUserTs = 0;
  const ttlMs = 280;
  let pending = false;

  const off3 = bus.on('uid:e:params:change', (p)=>{
    try{
      if (!p || p.source !== 'classic') return;
      if (!p.key) return;
      activeKey = String(p.key).toLowerCase();
      lastUserTs = Date.now();
    }catch{}
  });

  const off4 = bus.on('uid:e:model:update', ()=>{
    const now = Date.now();
    if (!activeKey) return;
    if (now - lastUserTs > ttlMs){ activeKey = null; return; }
    if (pending) return;
    pending = true;
    requestAnimationFrame(()=>{
      pending = false;
      const sels = targetsForActiveKey(activeKey);
      if (sels && sels.length) pulseSelectors(HOST, sels, 900);
    });
  });

  return ()=>{ 
    try{off1&&off1(); off2&&off2(); off3&&off3(); off4&&off4();}catch{}
  };
}

/**
 * Verdrahte Pointer-Markierung innerhalb des Panels (Down→mark, Up→pulse+clear)
 * @param {HTMLElement} HOST
 * @returns {Function} unloader
 */
export function wirePointerActive(HOST){
  const ACTIVE = new Set();

  function onDown(ev){
    try{
      const el = ev?.target;
      if (!el) return;
      const cls = [...(el.classList||[])].find(c => /^fe(-v)?-(R0|beta|gamma|sigma|D|beff|ret|re0)/.test(c));
      if (!cls) return;
      const key = cls.replace(/^fe(v)?-/, '').toLowerCase();
      ACTIVE.add(key);
      markKeys(HOST, [key], true);
    }catch{}
  }

  function onUp(){
    if (ACTIVE.size){
      const ks = Array.from(ACTIVE);
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
