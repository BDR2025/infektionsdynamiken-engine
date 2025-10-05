/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Widget Logic (Render · Segmented)
 * File:     /uid/12-4_support/widgets/render/segmented.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-03
 * Updated:  2025-10-03
 * Version:  1.4.2
 * Changelog:
 *   - v1.4.2  Repo-Polishing: ARIA (radiogroup/radio + tabindex), Tastatur-Navigation (←/→, Home/End),
 *              onSelect-Alias zu onChange; initiale & defensive Syncs.
 *
 * eAnnotation:
 *   Rendert eine exklusive Segmented-Schaltergruppe:
 *   - Container: .wa-seg (role="radiogroup"), Buttons: .wa-seg-btn (role="radio").
 *   - Auswahl genau eines Wertes aus act.options[].value; act.get()/act.set() unterstützt.
 */

'use strict';

import { mkBtn } from './button.js';

/* ============================================================================
 * 1) Public: renderSegmented(slot, act)
 * ---------------------------------------------------------------------------
 * @param {HTMLElement} slot
 * @param {{
 *   id?:string, label?:string, groupLabel?:string,
 *   options:Array<{label?:string, value:string, title?:string, icon?:string, disabled?:boolean}>,
 *   get?:Function, set?:Function, onChange?:Function, onSelect?:Function
 * }} act
 * @returns {Function} dispose()
 * ------------------------------------------------------------------------- */
export function renderSegmented(slot, act = {}) {
  const root = document.createElement('div');
  root.className = 'wa-seg';
  root.setAttribute('role', 'radiogroup');
  if (act.groupLabel || act.label) root.setAttribute('aria-label', String(act.groupLabel || act.label));

  const get = (typeof act.get === 'function') ? act.get : (() => act.value ?? act.options?.[0]?.value);
  const set = (typeof act.set === 'function') ? act.set : (v => { act.value = v; });

  const btns = [];
  const opts = Array.isArray(act.options) ? act.options : [];

  // Helper: vollständige Synchronisation (is-active, aria, tabindex)
  const fullSync = (currentVal) => {
    const cur = (currentVal !== undefined) ? currentVal : get();
    btns.forEach(({ btn, opt }, i) => {
      const active = String(cur) === String(opt.value);
      btn.classList.toggle('is-active', active);
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(active));
      btn.tabIndex = active ? 0 : -1;
      if (opt.disabled) btn.disabled = true;
    });
  };

  // Buttons bauen
  opts.forEach((opt) => {
    const b = mkBtn(opt.label, opt.icon, opt.title);
    b.classList.add('wa-seg-btn');
    if (opt.disabled) b.disabled = true;

    const click = () => {
      if (opt.disabled) return;
      const next = opt.value;
      try { set(next); } catch {}
      try { act.onChange?.(next, opt); } catch {}
      try { act.onSelect?.(next, opt); } catch {}
      fullSync(next);
    };

    b.addEventListener('click', click);
    root.appendChild(b);
    btns.push({ btn: b, opt, click });
  });

  // Tastatur-Navigation (←/→, Home/End)
  const onKey = (e) => {
    const keys = ['ArrowLeft','ArrowRight','Home','End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();

    const cur = String(get());
    const idx = Math.max(0, btns.findIndex(({ opt }) => String(opt.value) === cur));
    const last = btns.length - 1;

    const nextIdx =
      (e.key === 'ArrowLeft')  ? (idx > 0 ? idx - 1 : last) :
      (e.key === 'ArrowRight') ? (idx < last ? idx + 1 : 0) :
      (e.key === 'Home')       ? 0 :
      (e.key === 'End')        ? last : idx;

    const next = btns[nextIdx];
    if (!next || next.opt.disabled) return;
    try { set(next.opt.value); } catch {}
    try { act.onChange?.(next.opt.value, next.opt); } catch {}
    try { act.onSelect?.(next.opt.value, next.opt); } catch {}
    fullSync(next.opt.value);
    try { next.btn.focus(); } catch {}
  };
  root.addEventListener('keydown', onKey);

  // Einhängen & initial sync
  slot.appendChild(root);
  fullSync();

  // Dispose
  return () => {
    try { root.removeEventListener('keydown', onKey); } catch {}
    try { btns.forEach(({ btn, click }) => btn.removeEventListener('click', click)); } catch {}
    try { root.remove(); } catch {}
  };
}

export default { renderSegmented };
