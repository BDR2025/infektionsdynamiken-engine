/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Widget Logic (Tips)
 * File:     /uid/12-4_support/widgets/tips.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * License:  CC BY 4.0
 *
 * Created:  2025-10-03
 * Updated:  2025-10-04
 * Version:  1.5.0
 * Changelog:
 *   - v1.5.0  Scoped Binder statt globaler Delegation:
 *              • ensureTooltips(): erstellt nur den Layer (keine globalen Listener).
 *              • bindHeaderTips(header,{hover,focus}): Header = Titel&Digits Hover+Focus; Burger/Power Focus-only.
 *              • bindCardFocusTips(deck,{selector}): Cards = Focus-Tooltips; Maus bleibt (lokales Blocken nur im Fokus).
 */

'use strict';

let tipLayer = null;
let activeAnchor = null;
let globalsBound = false;

/* ────────────────────────────────────────────────────────────────────────── */
const isEl = el => el && el.nodeType === 1;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const getText = el =>
  el?.getAttribute?.('data-tooltip') ||
  el?.getAttribute?.('data-wa-tip') ||
  el?.getAttribute?.('title') ||
  el?.getAttribute?.('aria-label') || '';

function ensureLayer(){
  if (tipLayer) return tipLayer;
  tipLayer = document.createElement('div');
  tipLayer.className = 'uidw-tooltip';
  tipLayer.setAttribute('role', 'tooltip');
  tipLayer.setAttribute('aria-hidden', 'true');
  tipLayer.style.cssText = `
    position:absolute; z-index:10000; pointer-events:none;
    max-width:280px; background:rgba(15,23,42,.96); color:#fff;
    font-size:12px; line-height:1.3;
    border:1px solid rgba(148,163,184,.35); border-radius:8px; padding:6px 8px;
    box-shadow:0 6px 20px rgba(0,0,0,.35);
    transform:translate(-50%, calc(-100% - 10px));
    opacity:0; transition:opacity .12s ease;
  `;
  const arrow = document.createElement('div');
  arrow.style.cssText = `
    position:absolute; inset:auto 0 -6px 50%; transform:translateX(-50%);
    width:12px; height:12px; background:rgba(15,23,42,.96);
    border-left:1px solid rgba(148,163,184,.35);
    border-bottom:1px solid rgba(148,163,184,.35); rotate:45deg;
  `;
  tipLayer.appendChild(arrow);
  document.body.appendChild(tipLayer);

  if (!globalsBound){
    const hideActive = () => { if (activeAnchor) hide(activeAnchor); };
    window.addEventListener('keydown', e => { if (e.key === 'Escape') hideActive(); }, true);
    window.addEventListener('scroll',  hideActive, { passive:true });
    window.addEventListener('resize',  hideActive, { passive:true });
    globalsBound = true;
  }
  return tipLayer;
}

function positionTo(el){
  const r = el.getBoundingClientRect();
  let left = window.scrollX + r.left + (r.width / 2);
  let top  = window.scrollY + r.top;
  const EDGE = 8;
  const maxLeft = window.scrollX + window.innerWidth - EDGE;
  const minLeft = window.scrollX + EDGE;
  if (left > maxLeft) left = maxLeft;
  if (left < minLeft) left = minLeft;
  tipLayer.style.left = `${left}px`;
  tipLayer.style.top  = `${top}px`;
}

function show(el, text){
  if (!isEl(el) || !text) return;
  ensureLayer();
  if (tipLayer.firstChild && tipLayer.firstChild.nodeType === 3) {
    tipLayer.firstChild.nodeValue = text;
  } else {
    tipLayer.insertBefore(document.createTextNode(text), tipLayer.firstChild || null);
  }
  positionTo(el);
  tipLayer.style.opacity = '1';
  tipLayer.setAttribute('aria-hidden', 'false');
  el.setAttribute('aria-describedby', 'uidw-tooltip');
  activeAnchor = el;
}

function hide(el){
  if (!tipLayer) return;
  tipLayer.style.opacity = '0';
  tipLayer.setAttribute('aria-hidden', 'true');
  if (tipLayer.firstChild && tipLayer.firstChild.nodeType === 3){
    tipLayer.removeChild(tipLayer.firstChild);
  }
  if (isEl(el) && el.getAttribute('aria-describedby') === 'uidw-tooltip'){
    el.removeAttribute('aria-describedby');
  }
  activeAnchor = null;
}

/* ────────────────────────────────────────────────────────────────────────── */
/** Layer-only init (keine globalen Events) */
export function ensureTooltips(root = document){ return ensureLayer(); }

/**
 * Header-Binder: Focus immer; Hover optional (z. B. Titel & Digits).
 * Burger/Power typischerweise nur Focus (Maus-Tooltip bleibt).
 */
export function bindHeaderTips(headerEl, opts = {}){
  if (!isEl(headerEl)) return () => {};
  ensureLayer();

  // Selektorenliste normieren
  const selList = v => (Array.isArray(v) ? v : String(v||'').split(','))
    .map(s=>s.trim()).filter(Boolean);
  const hoverSel = selList(opts.hover || '.uidw-title,.widget-title,[data-title],[role="radiogroup"] [role="radio"],.wa-seg .wa-seg-btn');
  const focusSel = selList(opts.focus || `${hoverSel.join(',')},.uidw-burger,.wa-btn-burger,button[aria-haspopup="menu"],.uidw-power,.wa-btn-power,[data-icon="power"]`);

  // Titel sicher fokussierbar machen
  headerEl.querySelectorAll('.uidw-title, .widget-title, [data-title], h2, h3')
    .forEach(el => { if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex','0'); });

  // Focus (keyboard)
  const onFocus = e => {
    const t = e.target.closest?.(focusSel.join(',')); if (!t) return;
    if (headerEl.dataset?.enabled === 'false') return; // OFF-Gating
    // header: native title → data-tooltip migrieren (Doppelungen vermeiden)
    const tt = t.getAttribute('title'); if (tt && !t.getAttribute('data-tooltip')) {
      t.setAttribute('data-tooltip', tt); t.removeAttribute('title');
    }
    show(t, getText(t));
  };
  const onBlur  = e => {
    const t = e.target.closest?.(focusSel.join(',')); if (!t) return;
    hide(t);
  };
  headerEl.addEventListener('focusin',  onFocus, true);
  headerEl.addEventListener('focusout', onBlur,  true);

  // Hover (nur für Titel & Digits)
  const hoverTargets = headerEl.querySelectorAll(hoverSel.join(','));
  const enterFns = [], leaveFns = [];
  hoverTargets.forEach(el=>{
    const enter = ()=>{ if (headerEl.dataset?.enabled === 'false') return; show(el, getText(el)); };
    const leave = ()=> hide(el);
    el.addEventListener('mouseenter', enter);
    el.addEventListener('mouseleave', leave);
    enterFns.push([el,enter]); leaveFns.push([el,leave]);
  });

  return function dispose(){
    headerEl.removeEventListener('focusin',  onFocus, true);
    headerEl.removeEventListener('focusout', onBlur,  true);
    enterFns.forEach(([el,fn])=> el.removeEventListener('mouseenter', fn));
    leaveFns.forEach(([el,fn])=> el.removeEventListener('mouseleave', fn));
  };
}

/**
 * Cards-Binder: Focus-Tooltips für KPI-Cards (Maus-Tooltips bleiben).
 * Während Fokus werden Maus-Events nur auf der aktiven Card lokal geblockt.
 */
export function bindCardFocusTips(deckEl, opts = {}){
  if (!isEl(deckEl)) return () => {};
  ensureLayer();

  const selector = opts.selector || '.kpi-card, .kpi, .card, [data-kpi]';
  const cards = Array.from(deckEl.querySelectorAll(selector))
    .filter(el => el.offsetWidth || el.offsetHeight || el.getClientRects().length);

  // A11y & Label
  const restores = [];
  cards.forEach(c=>{
    if (c.tabIndex == null || c.tabIndex < 0){ c.setAttribute('tabindex','0'); restores.push(()=>c.removeAttribute('tabindex')); }
    if (!c.getAttribute('aria-label')){
      const t = c.querySelector?.('.kpi-title, .title, [data-title]');
      const v = c.querySelector?.('.kpi-val, .value, .kpi-number, strong');
      const label = t && v ? `${t.textContent.trim()} · ${v.textContent.trim()}`
                  : t ? t.textContent.trim()
                  : v ? `KPI: ${v.textContent.trim()}`
                  : 'Metric';
      c.setAttribute('aria-label', label);
      restores.push(()=>c.removeAttribute('aria-label'));
    }
  });

  // Maus-Doppelungen nur während Fokus der aktiven Card verhindern
  const blockers = new WeakMap();
  const armBlock = el=>{
    const stop = e => { e.stopImmediatePropagation(); };
    el.addEventListener('mousemove',  stop, true);
    el.addEventListener('mouseover',  stop, true);
    el.addEventListener('mouseenter', stop, true);
    blockers.set(el, stop);
  };
  const disBlock = el=>{
    const stop = blockers.get(el); if (!stop) return;
    el.removeEventListener('mousemove',  stop, true);
    el.removeEventListener('mouseover',  stop, true);
    el.removeEventListener('mouseenter', stop, true);
    blockers.delete(el);
  };

  const onFocus = e => {
    const el = e.target.closest?.(selector);
    if (!el) return;
    armBlock(el);
    show(el, getText(el) || el.getAttribute('aria-label') || '');
  };
  const onBlur  = e => {
    const el = e.target.closest?.(selector);
    if (!el) return;
    disBlock(el);
    hide(el);
  };

  deckEl.addEventListener('focusin',  onFocus, true);
  deckEl.addEventListener('focusout', onBlur,  true);

  return function dispose(){
    deckEl.removeEventListener('focusin',  onFocus, true);
    deckEl.removeEventListener('focusout', onBlur,  true);
    cards.forEach(disBlock);
    restores.forEach(fn=>{ try{fn();}catch{} });
  };
}

export default { ensureTooltips, bindHeaderTips, bindCardFocusTips };
