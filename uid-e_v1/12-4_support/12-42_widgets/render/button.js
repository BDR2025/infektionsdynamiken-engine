/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Widget Logic (Render · Button)
 * File:     /uid/12-4_support/widgets/render/button.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-03
 * Updated:  2025-10-03
 * Version:  1.4.2
 * Changelog:
 *   - v1.4.2  Repo-Polishing: Kopfzeile, A11y (type=button, aria-label bei Icon-only),
 *              Header-Rundung via Inline-Styles abgesichert.
 *
 * eAnnotation:
 *   Zentrale Button-Fabrik für Header-Controls (toggle, segmented, dropdown, …).
 *   Erzwingt im Header-Kontext (.uidw-header) echte Kreise (width=height, r=9999px).
 *   Keine externen CSS nötig — Renderer setzt nötige Inline-Styles.
 */

'use strict';

/* ============================================================================
 * 1) Internal: Header-spezifische Rundform erzwingen
 * -------------------------------------------------------------------------- */
function applyHeaderRoundShape(btn){
  try {
    // Nur wenn der Button im Header verbaut ist:
    const header = btn.closest?.('.uidw-header');
    if (!header) return;

    // Einheitliche Rundung (Tokens aus widgets/styles.js: --wa-size)
    // Inline-Styles → übersteuern ggf. Pill-Styling (.wa-btn)
    btn.style.width          = 'var(--wa-size, 28px)';
    btn.style.height         = 'var(--wa-size, 28px)';
    btn.style.minWidth       = 'var(--wa-size, 28px)';
    btn.style.padding        = '0';
    btn.style.borderRadius   = '9999px';
    btn.style.display        = 'inline-flex';
    btn.style.alignItems     = 'center';
    btn.style.justifyContent = 'center';
    btn.style.boxSizing      = 'border-box';
  } catch {}
}

/* ============================================================================
 * 2) Public: mkBtn(label?, icon?, title?)
 * -------------------------------------------------------------------------- */
export function mkBtn(label, icon, title) {
  const b = document.createElement('button');
  b.type = 'button'; // nie submitten
  b.className = icon && !label ? 'wa-btn wa-iconbtn' : 'wa-btn';

  // A11y-Name: bei Icon-only Title als aria-label verwenden
  if (title) {
    b.title = title;
    if (!label) b.setAttribute('aria-label', title);
  }

  if (icon)  {
    const i = document.createElement('span');
    i.className = 'wa-ico';
    i.textContent = icon;
    b.appendChild(i);
  }
  if (label) {
    const s = document.createElement('span');
    s.className = 'wa-txt';
    s.textContent = label;
    b.appendChild(s);
  }

  // Nach dem Einfügen in den DOM (gleicher Tick) Rundung anlegen
  // (renderToggle/renderSegmented hängen b synchron an → Microtask reicht)
  queueMicrotask(() => applyHeaderRoundShape(b));

  return b;
}

/* ============================================================================
 * 3) Public: renderButton(slot, act)
 * --------------------------------------------------------------------------
 * @param {HTMLElement} slot - Zielcontainer (z. B. .uidw-actions-*)
 * @param {{label?:string, icon?:string, title?:string, onClick?:Function}} act
 * @returns {Function} dispose()
 * -------------------------------------------------------------------------- */
export function renderButton(slot, act) {
  const b = mkBtn(act.label, act.icon, act.title);
  b.addEventListener('click', (e) => act.onClick?.(e, act));
  slot.appendChild(b);

  // Sicherheitsnetz: falls Microtask vor dem Append feuert → jetzt nochmal prüfen
  applyHeaderRoundShape(b);

  return () => { try { b.remove(); } catch {} };
}

export default { mkBtn, renderButton };
