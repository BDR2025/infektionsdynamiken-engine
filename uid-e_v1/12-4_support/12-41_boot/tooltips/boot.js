/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Boot Module (ESM)
 * File:     /uid/12-4_support/app/boot/tooltips/boot.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-04
 * Updated:  2025-10-04
 * Version:  1.0.0
 * Changelog:
 *   - v1.0.0  Boot: ensureWidgetStyles → ensureTooltips → initCursorTooltip (idempotent).
 *
 * Role:
 *   Boot-Einstieg für Tooltips. Sichert Styles & Layer und startet den Cursor-Tooltip.
 *   Idempotent via Fenster-Guard, damit mehrfaches Laden keinen Effekt hat.
 */
'use strict';

import { ensureWidgetStyles, ensureTooltips } from './index.js';
import { initCursorTooltip } from './tooltip.js';

(() => {
  if (window.__uidTooltipsBootOnce) return;

  try { ensureWidgetStyles(); } catch {}
  try { ensureTooltips(); } catch {}

  let dispose = null;
  try {
    dispose = initCursorTooltip({ root: document.body, ignoreSelector: '.uidw-header' });
  } catch {}

  window.__uidTooltipsBootOnce = () => {
    try { dispose?.(); } catch {}
  };
})();
