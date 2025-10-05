/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Widget Logic (Render · MultiToggle)
 * File:     /uid/12-4_support/widgets/render/multitoggle.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-03
 * Updated:  2025-10-03
 * Version:  1.4.2
 * Changelog:
 *   - v1.4.2  Repo-Polishing: ARIA (role="group", aria-pressed), groupLabel,
 *              mkBtn-Nutzung (runde Header-Buttons), sauberes Cleanup.
 *
 * eAnnotation:
 *   RENDERER für additive Segment-Toggles (1..n) im Segmented-Look.
 *   - Container: .wa-multi.wa-seg  (role="group")
 *   - Buttons:   .wa-seg-btn (+ .is-active bei ON) mit aria-pressed
 *   - API:       act.get() → string[]; act.onChange(value:string, isOn:boolean)
 */

'use strict';

/* ============================================================================
 * 1) Imports
 * -------------------------------------------------------------------------- */
import { mkBtn } from './button.js';

/* ============================================================================
 * 2) Helpers
 * -------------------------------------------------------------------------- */
function setPressed(btn, on) {
  const isOn = !!on;
  btn.classList.toggle('is-active', isOn);
  btn.setAttribute('aria-pressed', String(isOn));
}

/* ============================================================================
 * 3) Public: renderMultiToggle(slotEl, act)
 * ---------------------------------------------------------------------------
 * @param {HTMLElement} slotEl
 * @param {{
 *   options: Array<{ value:string|number, label?:string, icon?:string, title?:string, disabled?:boolean }>,
 *   get?: ()=>string[], onChange?: (value:string, isOn:boolean)=>void,
 *   groupLabel?: string
 * }} act
 * @returns {Function} dispose()
 * ------------------------------------------------------------------------- */
export function renderMultiToggle(slotEl, act = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'wa-multi wa-seg';
  wrap.setAttribute('role', 'group');
  if (act.groupLabel) wrap.setAttribute('aria-label', String(act.groupLabel));

  // Auswahl initial aus act.get()
  const initial = Array.isArray(act?.get?.()) ? act.get().map(String) : [];
  const selected = new Set(initial);

  const buttons = [];

  (act?.options || []).forEach(opt => {
    const val     = String(opt.value ?? opt.label ?? '');
    const label   = opt.label ?? val;
    const icon    = opt.icon;
    const title   = opt.title || '';

    const btn = mkBtn(label, icon, title);
    btn.type = 'button';
    btn.classList.add('wa-seg-btn');
    if (opt.disabled) btn.disabled = true;

    // Initialer Zustand
    setPressed(btn, selected.has(val));

    const onClick = () => {
      if (btn.disabled) return;
      const now = !(btn.getAttribute('aria-pressed') === 'true');
      setPressed(btn, now);
      if (now) selected.add(val); else selected.delete(val);
      try { act.onChange?.(val, now); } catch (e) { /* noop */ }
    };

    btn.addEventListener('click', onClick);
    wrap.appendChild(btn);
    buttons.push({ btn, onClick });
  });

  slotEl.appendChild(wrap);

  // Dispose
  return () => {
    try {
      buttons.forEach(({ btn, onClick }) => btn.removeEventListener('click', onClick));
      wrap.remove();
    } catch {}
  };
}

/* ============================================================================
 * 4) Default-Export (Kompat)
 * -------------------------------------------------------------------------- */
export default { renderMultiToggle };
