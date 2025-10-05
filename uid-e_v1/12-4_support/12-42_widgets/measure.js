/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Widget Logic (Measure)
 * File:     /uid/12-4_support/widgets/measure.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-03
 * Updated:  2025-10-03
 * Version:  1.4.2
 * Changelog:
 *   - v1.4.2  Repo-Polishing: Kopfzeile, rAF-Debounce, Cleanup des window:resize-Handlers.
 *
 * eAnnotation:
 *   Beobachtet die Headerbreite (ResizeObserver + window:resize) und setzt
 *   data-collapse-icon-only / data-collapse-actions bei Platzmangel.
 *   Gibt einen Disposer zurück.
 */

'use strict';

/* ============================================================================
 * 1) Public API
 * -------------------------------------------------------------------------- */
/**
 * Beobachtet den Header und toggelt Collapse-Attribute bei Platzmangel.
 * @param {HTMLElement} headerEl
 * @returns {Function} dispose()
 */
export function watchHeaderCollapse(headerEl){
  if (!headerEl) throw new Error('[widgets/measure] headerEl required');

  let rafId = 0;
  const scheduleMeasure = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => measure(headerEl));
  };

  // ResizeObserver
  const ro = new ResizeObserver(() => scheduleMeasure());
  try { ro.observe(headerEl); } catch {}

  // Fallback: auch auf window reagieren
  const onResize = () => scheduleMeasure();
  window.addEventListener('resize', onResize, { passive:true });

  // Initiale Messung
  scheduleMeasure();

  // Dispose
  return () => {
    try { ro.disconnect(); } catch {}
    try { window.removeEventListener('resize', onResize); } catch {}
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  };
}

/* ============================================================================
 * 2) Internal: Messroutine
 * -------------------------------------------------------------------------- */
function measure(headerEl){
  if (!headerEl) return;

  // Reset
  try {
    headerEl.removeAttribute('data-collapse-icon-only');
    headerEl.removeAttribute('data-collapse-actions');
  } catch {}

  // Sanfte Toleranz gegen Rundungsfehler (+2px)
  const cw = headerEl.clientWidth  || 0;
  const sw = headerEl.scrollWidth  || 0;
  const tooNarrow = sw > cw + 2;

  if (!tooNarrow) return;

  try {
    headerEl.setAttribute('data-collapse-icon-only', 'true');
    // Zweiter Check: Wenn weiterhin zu schmal, auch Actions kollabieren
    if ((headerEl.scrollWidth || 0) > (headerEl.clientWidth || 0) + 2){
      headerEl.setAttribute('data-collapse-actions', 'true');
    }
  } catch {}
}

export default { watchHeaderCollapse };
