/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Widget Logic (Tooltip)
 * File:     /uid/12-4_support/widgets/tooltip.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-03
 * Updated:  2025-10-03
 * Version:  1.4.2
 * Changelog:
 *   - v1.4.2  Repo-Polishing: Kopfzeile/Gliederung, Viewport-Clamp, optionales title-Suppress,
 *              Hide bei scroll/resize/orientationchange; Trigger/Verhalten unverändert.
 *
 * eAnnotation:
 *   Lightweight-Tooltip für Widgets 2.0. Zeigt Text aus data-wa-tip oder title an der Maus.
 *   Verhindert Überlaufen am Bildschirmrand und blendet bei Scroll/Resize/Escape aus.
 */

'use strict';

/* ============================================================================
 * 1) State & Helpers
 * -------------------------------------------------------------------------- */
let tip;
let currentEl = null;   // Element, das den Tooltip aktuell triggert (für title-Restore)
let savedTitle = null;  // Temporär abgelegter title-Inhalt (falls wir ihn unterdrücken)

const OFFSET = 12;      // Abstand Cursor → Tooltip
const EDGE   = 8;       // Innenabstand zum Viewportrand

function ensure(){
  if (tip) return tip;
  tip = document.createElement('div');
  tip.id = 'wa-tip';
  tip.setAttribute('role','tooltip');
  tip.style.position = 'fixed';
  tip.style.zIndex = '99998';
  tip.style.pointerEvents = 'none';
  tip.style.padding = '6px 8px';
  tip.style.background = 'rgba(0,0,0,.75)'; // kann via CSS-Var überschrieben werden
  tip.style.color = '#fff';
  tip.style.borderRadius = '8px';
  tip.style.fontSize = '12px';
  tip.style.lineHeight = '1.25';
  tip.style.whiteSpace = 'nowrap';
  tip.style.maxWidth = '360px';
  tip.style.display = 'none';
  document.body.appendChild(tip);
  return tip;
}

function showAt(x, y, text){
  const t = ensure();
  t.textContent = text;
  t.style.display = 'block';

  // Messen nach Anzeige
  const w = t.offsetWidth || 0;
  const h = t.offsetHeight || 0;

  // Clamping an Viewportränder
  const X = Math.max(EDGE, Math.min(x, window.innerWidth  - w - EDGE));
  const Y = Math.max(EDGE, Math.min(y, window.innerHeight - h - EDGE));

  t.style.left = X + 'px';
  t.style.top  = Y + 'px';
}

function hide(){
  if (tip) tip.style.display = 'none';

  // title wiederherstellen (falls wir ihn temporär entfernt haben)
  if (currentEl && savedTitle != null){
    try { currentEl.setAttribute('title', savedTitle); } catch {}
  }
  currentEl = null;
  savedTitle = null;
}

/* ============================================================================
 * 2) Event Delegation (global)
 * -------------------------------------------------------------------------- */
document.addEventListener('mouseover', (e)=>{
  const el = e.target?.closest?.('[data-wa-tip],[title]');
  if (!el) return;

  // Text ermitteln (data-wa-tip hat Priorität)
  const txt = el.getAttribute('data-wa-tip') || el.getAttribute('title');
  if (!txt) return;

  // Optional: nativen title-Tooltip temporär unterdrücken
  if (!el.getAttribute('data-wa-tip') && el.hasAttribute('title')){
    currentEl = el;
    savedTitle = el.getAttribute('title');
    try { el.setAttribute('title', ''); } catch {}
  } else {
    currentEl = el;
    savedTitle = null;
  }

  // Erst bei der nächsten Mausbewegung anzeigen (wie Original: once)
  el.addEventListener('mousemove', ev => {
    // Position neben dem Cursor
    const x = ev.clientX + OFFSET;
    const y = ev.clientY + OFFSET;
    showAt(x, y, txt);
  }, { once:true });
});

document.addEventListener('mouseout', hide, true);
document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') hide(); }, true);

// Zusätzliche Robustheit: bei Scroll/Resize/Orientation ausblenden
window.addEventListener('scroll', hide, { passive:true });
window.addEventListener('resize', hide, { passive:true });
window.addEventListener('orientationchange', hide);
