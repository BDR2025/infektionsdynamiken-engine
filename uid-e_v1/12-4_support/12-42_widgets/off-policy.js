/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Widget Logic (Off-Policy)
 * File:     /uid/12-4_support/widgets/off-policy.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-03
 * Updated:  2025-10-03
 * Version:  1.4.2
 * Changelog:
 *   - v1.4.2  Repo-Polishing: Kopfzeile/Gliederung, Guards & try/catch ergänzt. Keine Logikänderung.
 *
 * eAnnotation:
 *   OFF-Policy steuert Sichtbarkeit im ausgeschalteten Zustand:
 *   - Standard: Nur Power-Button sichtbar (Header blendet Actions/Burger aus).
 *   - Sonderfall Chart: OFF → Mini-Modus (data-collapse="mini").
 *   - Beim Einschalten sendet die Policy ein 'uid:widget:power:on' (Auto-Rehydrate).
 */

'use strict';

/* ============================================================================
 * 1) Public API
 * -------------------------------------------------------------------------- */
/**
 * OFF-Policy: steuert, was sichtbar bleibt, wenn ein Widget ausgeschaltet wird.
 * @param {HTMLElement} headerEl - die .uidw-header des Widgets
 * @param {boolean} off          - true → OFF, false → ON
 */
export function applyOffState(headerEl, off) {
  if (!headerEl) return;
  const host = headerEl.closest?.('.widget');

  // Enabled-Flag am Header
  try { headerEl.setAttribute('data-enabled', off ? 'false' : 'true'); } catch {}

  // Sonderfall Chart: Mini-Mode im OFF
  try {
    if (off && host?.id === 'chart-widget') {
      host.setAttribute('data-collapse', 'mini');
    } else {
      host?.removeAttribute?.('data-collapse');
    }
  } catch {}

  // Beim Einschalten → zentrales Power-ON Signal (für Auto-Rehydrate)
  if (!off && host) {
    try {
      host.dispatchEvent(new CustomEvent('uid:widget:power:on', { bubbles: true }));
    } catch {}
  }
}

/* ============================================================================
 * 2) Default Export (Kompat)
 * -------------------------------------------------------------------------- */
export default { applyOffState };
