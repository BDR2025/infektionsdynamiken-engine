/*!
 * File:      /12-3_presentation/kpi/common/style/icons.js
 * Project:   UID-Explore · Presentation Layer · KPI Tool — Common · Style
 * Role:      SVG-Icon-Fabrik für KPI-Karten (arrow, bullseye, heart, clock)
 * Type:      Open Educational Resource (OER) · ESM
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-03
 * Version:   3.1.0
 * Changelog:
 *   - v3.1.0  Short-Header vereinheitlicht; Abschnittsgliederung ergänzt; Verhalten unverändert.
 *   - v3.0.0  Extrahiert: SVG-Icon-Fabrik für KPI-Karten.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1) Version
// ─────────────────────────────────────────────────────────────────────────────
export const VERSION = '3.1.0';

// ─────────────────────────────────────────────────────────────────────────────
// 2) Icon-Factory
// ─────────────────────────────────────────────────────────────────────────────
export function svgIcon(type){
  const ns  = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox','0 0 24 24');
  svg.setAttribute('fill','none');
  svg.setAttribute('stroke','currentColor');
  svg.setAttribute('stroke-width','2.2');
  svg.setAttribute('stroke-linecap','round');
  svg.setAttribute('stroke-linejoin','round');

  if (type === 'arrow'){
    svg.innerHTML = '<path d="M12 18V7"/><path d="M9.3 9.7 L12 7 L14.7 9.7"/>';
  } else if (type === 'bullseye'){
    svg.innerHTML = '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>';
  } else if (type === 'heart'){
    svg.innerHTML = '<path d="M12 20 C 9.2 17.6, 6.8 15.7, 5.6 14.0 C 3.8 11.5, 4.3 8.6, 6.2 7.2 C 7.8 6.0, 10.0 6.2, 11.5 7.6 C 11.8 7.9, 12.2 7.9, 12.5 7.6 C 14.0 6.2, 16.2 6.0, 17.8 7.2 C 19.7 8.6, 20.2 11.5, 18.4 14.0 C 17.2 15.7, 14.8 17.6, 12 20 Z"/>';
  } else if (type === 'clock'){
    svg.innerHTML = '<circle cx="12" cy="12" r="7"/><path d="M12 9v4l3 2"/>';
  } else {
    return null;
  }

  svg.classList.add('kpi-ico');
  return svg;
}
