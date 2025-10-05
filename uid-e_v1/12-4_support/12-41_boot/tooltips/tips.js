/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Boot Module (ESM)
 * File:     /uid/12-4_support/app/boot/tooltips/tips.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-04
 * Updated:  2025-10-04
 * Version:  1.0.0
 * Changelog:
 *   - v1.0.0  Header/Card-Binders: sichere Layer-Erzeugung, Fokus-/Hover-Tips, dispose()-fähig.
 *
 * eAnnotation:
 *   Bindet kontextsensitive Tooltips an Header-Controls (hover/focus) und KPI-Karten (focus).
 *   Erwartet, dass Styles/Layer i. d. R. über tooltips/index.js vorhanden sind; erzeugt bei Bedarf
 *   einen minimalen Layer (#uid-tooltips-root) selbst, ohne zu crashen (DOM-Guards).
 */

'use strict';

function ensureLayer() {
  try {
    let layer = document.getElementById('uid-tooltips-root');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'uid-tooltips-root';
      layer.className = 'uid-tooltips-layer';
      (document.body || document.documentElement).appendChild(layer);
      // Falls noch kein <body> existiert, später sauber verschieben
      if (!document.body) {
        document.addEventListener('DOMContentLoaded', () => {
          try { if (layer.parentNode !== document.body) document.body.appendChild(layer); } catch {}
        }, { once: true });
      }
    }
    return layer;
  } catch {
    return null;
  }
}

function resolveTargets(container, list) {
  const arr = Array.isArray(list) ? list : (list ? [list] : []);
  const out = [];
  for (const item of arr) {
    if (!item) continue;
    if (typeof item === 'string')      out.push(...(container.querySelectorAll?.(item) || []));
    else if (item?.nodeType === 1)     out.push(item);
  }
  return Array.from(new Set(out));
}

export function bindHeaderTips(headerEl, opts = {}) {
  if (!headerEl) return () => {};
  const layer = ensureLayer();
  if (!layer) return () => {};

  const tip = document.createElement('div');
  layer.appendChild(tip);
  tip.className = 'uid-tip';
  tip.dataset.variant = 'header';
  tip.hidden = true;

  const hoverTargets = resolveTargets(headerEl, opts.hover || []);
  const focusTargets = resolveTargets(headerEl, opts.focus || []);

  const getText = (el) =>
    el?.getAttribute?.('data-tooltip') ||
    el?.getAttribute?.('data-wa-tip') ||
    el?.getAttribute?.('aria-label') ||
    (el?.dataset?.role === 'title' ? (el.textContent?.trim() || '') : '');

  const hide = () => { tip.hidden = true; };
  const showAt = (el) => {
    const txt = getText(el);
    if (!txt) return hide();
    const r = el.getBoundingClientRect();
    tip.style.left = (r.left + r.width / 2) + 'px';
    tip.style.top  = (r.top - 8) + 'px';
    tip.textContent = txt;
    tip.hidden = false;
  };

  const hovIn  = (e) => showAt(e.currentTarget);
  const hovOut = ()  => hide();
  const focIn  = (e) => showAt(e.target);
  const focOut = ()  => hide();

  for (const el of hoverTargets) {
    el.addEventListener('mouseenter', hovIn);
    el.addEventListener('mouseleave', hovOut);
  }
  for (const el of focusTargets) {
    el.setAttribute?.('tabindex', el.getAttribute('tabindex') || '0');
    el.addEventListener('focus',  focIn,  true);
    el.addEventListener('blur',   focOut, true);
    el.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') hide(); }, true);
  }

  return () => {
    try {
      for (const el of hoverTargets) {
        el.removeEventListener('mouseenter', hovIn);
        el.removeEventListener('mouseleave', hovOut);
      }
      for (const el of focusTargets) {
        el.removeEventListener('focus',  focIn,  true);
        el.removeEventListener('blur',   focOut, true);
      }
      tip.remove();
    } catch {}
  };
}

export function bindCardFocusTips(deckEl, opts = { selector: '.kpi-card' }) {
  if (!deckEl) return () => {};
  const layer = ensureLayer();
  if (!layer) return () => {};

  const sel = opts.selector || '.kpi-card';
  let active = null, blockMouse = null;

  const tip = document.createElement('div');
  layer.appendChild(tip);
  tip.className = 'uid-tip';
  tip.hidden = true;

  const getText   = (el) => el?.getAttribute?.('data-tooltip') || el?.getAttribute?.('data-wa-tip') || '';
  const onFocusIn = (e) => {
    const t = e.target?.closest?.(sel);
    if (!t) return;
    active = t;
    const txt = getText(t);
    if (!txt) return;
    const r = t.getBoundingClientRect();
    tip.style.left = (r.left + r.width / 2) + 'px';
    tip.style.top  = (r.top - 8) + 'px';
    tip.textContent = txt;
    tip.hidden = false;

    blockMouse = (ev) => { if (active && t.contains(ev.target)) ev.stopPropagation(); };
    t.addEventListener('mousemove',  blockMouse, true);
    t.addEventListener('mouseenter', blockMouse, true);
    t.addEventListener('mouseleave', blockMouse, true);
  };

  const onFocusOut = () => {
    if (!active) return;
    tip.hidden = true;
    try {
      active.removeEventListener('mousemove',  blockMouse, true);
      active.removeEventListener('mouseenter', blockMouse, true);
      active.removeEventListener('mouseleave', blockMouse, true);
    } catch {}
    active = null; blockMouse = null;
  };

  deckEl.addEventListener('focusin',  onFocusIn);
  deckEl.addEventListener('focusout', onFocusOut);
  deckEl.addEventListener('keydown',  (ev) => { if (ev.key === 'Escape') tip.hidden = true; }, true);

  return () => {
    try {
      deckEl.removeEventListener('focusin',  onFocusIn);
      deckEl.removeEventListener('focusout', onFocusOut);
      tip.remove();
    } catch {}
  };
}
