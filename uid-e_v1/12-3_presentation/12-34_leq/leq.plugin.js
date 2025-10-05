/*!
 * File:    leq.plugins.js  · v0.10.0
 * Purpose: Plugin-Bootstrap (dataset-gesteuert)
 * Notes:   lesson: '1'|'2'|'3' · didaktik: '0'..'3' · visual: 'color'|'mono'|'bold'
 */

let FLOW = null;      // aktuelle Flow-Instanz
let rafId = 0;

const card = () => document.getElementById('core-equation-widget');
const root = () => document.querySelector('#core-equation');

function state(){
  const c = card();
  return {
    lesson:    c?.dataset?.lesson   || '1',
    didaktik:  +(c?.dataset?.didaktik ?? 0),
    visual:    c?.dataset?.visual   || 'color'
  };
}

async function ensureFlow(s){
  // Nur in Lektion 1 und ab didaktik >= 1
  const need = (s.lesson === '1' && s.didaktik >= 1);
  if (!need){
    if (FLOW){ try{ FLOW.dispose?.(); }catch{} FLOW = null; }
    return;
  }
  if (FLOW) return;
  try {
    const mod = await import('./plugins/flow.js');
    FLOW = mod.default?.(root(), card()) || null;
  } catch (e) { console.warn('[LEQ] flow plugin load failed', e); }
}

function redraw(){
  try { FLOW?.redraw?.(); } catch {}
}

function loop(){
  try { FLOW?.tick?.(performance.now()); } catch {}
  rafId = requestAnimationFrame(loop);
}

function attachObservers(){
  // Dataset-Änderungen am Card-Widget
  const c = card(); if (!c) return;
  const moAttrs = new MutationObserver(() => { ensureFlow(state()); redraw(); });
  moAttrs.observe(c, { attributes:true, attributeFilter:['data-lesson','data-didaktik','data-visual'] });

  // Layout-Änderungen
  const r = root();
  const moDom = new MutationObserver(redraw);
  moDom.observe(r, { subtree:true, childList:true, attributes:true });

  window.addEventListener('resize', redraw, { passive:true });
  window.addEventListener('scroll', redraw, { passive:true });
}

function init(){
  ensureFlow(state());               // evtl. sofort aktivieren
  attachObservers();
  rafId = requestAnimationFrame(loop);
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
