/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Widget Logic (Render · Toggle)
 * File:     /uid/12-4_support/widgets/render/toggle.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-03
 * Updated:  2025-10-03
 * Version:  1.4.2
 * Changelog:
 *   - v1.4.2  Repo-Polishing: Wrapper mit role="group" + optionalem aria-label (groupLabel),
 *              Cleanup nur bei leerem Wrapper, onChange-Alias, A11y stabilisiert.
 *
 * eAnnotation:
 *   Rendert Header-Toggles im Segmented-Look:
 *   - gruppiert in <div class="wa-seg wa-multi"> (nur im .uidw-header)
 *   - Buttons erhalten .wa-seg-btn + .is-active (parallel zu segmented)
 *   - ARIA via aria-pressed bleibt erhalten
 */

'use strict';

import { mkBtn } from './button.js';

/* ============================================================================
 * 1) Wrapper im Header sicherstellen
 * -------------------------------------------------------------------------- */
function ensureSegWrapper(slot, act){
  // Im Header ist "slot" typischerweise .uidw-actions-dyn
  let wrap = slot.querySelector(':scope > .wa-seg.wa-multi');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'wa-seg wa-multi';
    wrap.setAttribute('role', 'group');
    if (act?.groupLabel) wrap.setAttribute('aria-label', String(act.groupLabel));
    slot.appendChild(wrap);
  } else if (!wrap.hasAttribute('aria-label') && act?.groupLabel){
    // aria-label nur setzen, wenn noch keiner existiert (erste sinnvolle Quelle gewinnt)
    wrap.setAttribute('aria-label', String(act.groupLabel));
  }
  return wrap;
}

/* ============================================================================
 * 2) Public: renderToggle(slot, act)
 * -------------------------------------------------------------------------- */
export function renderToggle(slot, act = {}) {
  // In Nicht-Header-Kontext normal anhängen (selten), sonst als wa-seg-Gruppe
  const inHeader = !!slot.closest?.('.uidw-header');
  const host = inHeader ? ensureSegWrapper(slot, act) : slot;

  const b = mkBtn(act.label, act.icon, act.title);
  // Für Header-Look: gleiche Klassen wie segmented verwenden
  if (inHeader) b.classList.add('wa-seg-btn');

  const get = (typeof act.get === 'function') ? act.get : (() => !!act.value);
  const set = (typeof act.set === 'function') ? act.set : (v => { act.value = !!v; });

  const sync = () => {
    const on = !!get();
    try { b.setAttribute('aria-pressed', String(on)); } catch {}
    // Gleicher Aktivzustand wie segmented
    if (inHeader) b.classList.toggle('is-active', on);
  };
  sync();

  const onClick = () => {
    const next = !get();
    try { set(next); } catch {}
    try { act.onToggle?.(next, act); } catch {}
    try { act.onChange?.(next, act); } catch {} // Alias
    sync();
  };

  b.addEventListener('click', onClick);
  host.appendChild(b);

  return () => {
    try { b.removeEventListener('click', onClick); } catch {}
    try { b.remove(); } catch {}
    // Wrapper aufräumen, wenn keine Segmented-Toggle-Buttons mehr verbleiben
    if (inHeader && host && host.parentNode && !host.querySelector('.wa-seg-btn')) {
      try { host.remove(); } catch {}
    }
  };
}

/* ============================================================================
 * 3) Default-Export (Kompat)
 * -------------------------------------------------------------------------- */
export default { renderToggle };
