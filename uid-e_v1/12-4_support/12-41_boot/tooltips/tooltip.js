/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Boot Module (ESM)
 * File:     /uid/12-4_support/app/boot/tooltips/tooltip.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-04
 * Updated:  2025-10-04
 * Version:  1.0.0
 * Changelog:
 *   - v1.0.0  Cursor-Tooltip (Body) implementiert; ignoriert Header-Bereich (.uidw-header).
 *
 * eAnnotation:
 *   Liest Tooltip-Texte aus data-wa-tip / data-tooltip und zeigt sie am Cursor an.
 *   Bricht sauber ab, wenn kein Layer (#uid-tooltips-root) vorhanden ist. Gibt einen
 *   Dispose-Callback zurück, der Listener entfernt und das Tooltip-Element löscht.
 *
 * ModuleMap (short)
 *   /app/boot/tooltips/tooltip.js  (dieses Modul; Cursor-Tooltip)
 *   /app/boot/tooltips/index.js    (ensureWidgetStyles/ensureTooltips)
 *   /app/boot/tooltips/boot.js     (Boot: ruft ensure* + initCursorTooltip)
 */
'use strict';

export function initCursorTooltip({ root = document.body, ignoreSelector = '.uidw-header' } = {}) {
  const layer = document.getElementById('uid-tooltips-root');
  if (!layer) return () => {};

  const tip = document.createElement('div');
  tip.className = 'uid-tip';
  tip.hidden = true;
  layer.appendChild(tip);

  const getText = (el) =>
    el?.getAttribute?.('data-wa-tip') ||
    el?.getAttribute?.('data-tooltip') ||
    null;

  const onMove = (e) => {
    try {
      const t = e.target;
      if (!t || (t.closest && t.closest(ignoreSelector))) { tip.hidden = true; return; }
      const el = t.closest?.('[data-wa-tip],[data-tooltip]');
      if (!el) { tip.hidden = true; return; }
      const txt = getText(el);
      if (!txt) { tip.hidden = true; return; }
      tip.style.left = e.clientX + 'px';
      tip.style.top  = e.clientY + 'px';
      tip.textContent = txt;
      tip.dataset.variant = 'body';
      tip.hidden = false;
    } catch { tip.hidden = true; }
  };

  const onLeave = () => { tip.hidden = true; };

  root.addEventListener('mousemove', onMove,   { passive: true });
  root.addEventListener('mouseleave', onLeave, { passive: true });

  try { console.info('[tooltips] cursor ready'); } catch {}

  return () => {
    try {
      root.removeEventListener('mousemove', onMove);
      root.removeEventListener('mouseleave', onLeave);
      tip.remove();
    } catch {}
  };
}
