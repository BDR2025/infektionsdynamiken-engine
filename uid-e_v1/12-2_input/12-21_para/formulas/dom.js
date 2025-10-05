/*! 
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Input Layer · Parameter Tool · Formulas
 * File:     /parameters/formulas/dom.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-01
 * Updated:  2025-10-01
 * Version:  6.0.0
 * Changelog:
 *   - v6.0.0 Card-Builder (Chain/Pair) und DOM-Helfer ausgelagert
 *
 * eAnnotation:
 *   Baut die HTML-Skelette der Formelkarten (einzeilige Kette bzw. Paar-Ansicht).
 *   Enthält kleine, host-scoped DOM-Helfer für Zahlentexte und Markierungen.
 */

/**
 * Karte für Slider-Parameter (einzeilige Kette + Slider-Host).
 * @param {string} id - Eindeutige Karten-ID (z. B. "fe-R0")
 * @returns {string} HTML-String
 */
export function makeCardChain(id){
  return `<div class="fe-card" id="${id}">
    <div class="fe-chain" data-build="${id}"></div>
    <div class="fe-ctrl"></div>
  </div>`;
}

/**
 * Karte für abgeleitete Größen (Symbolzeile + Zahlenzeile).
 * @param {string} id - Eindeutige Karten-ID (z. B. "fe-ret")
 * @param {string} symTex - TeX für die Symbolzeile (ohne $-Klammern)
 * @returns {string} HTML-String
 */
export function makeCardPair(id, symTex){
  return `<div class="fe-card" id="${id}">
    <div class="fe-sym">$${symTex}$</div>
    <div class="fe-num" data-build="${id}"></div>
  </div>`;
}

/**
 * Setzt reinen Textinhalt an der ersten Fundstelle der Klasse innerhalb eines Scopes.
 * @param {HTMLElement} scope - Host (Panel oder Karte)
 * @param {string} cls - Klassenname ohne Punkt (z. B. "fev-R0")
 * @param {string} text - Neuer Textinhalt
 */
export function setTextByClass(scope, cls, text){
  const el = scope?.querySelector?.(`.${cls}`);
  if (el) el.textContent = text;
}

/**
 * Schaltet die Markierungs-Klasse (.fe-drag) für alle passenden Knoten im Scope.
 * Greift auf Symbol-, Zahlen- und Kettenbereich, bleibt host-scoped.
 * @param {HTMLElement} scope - Host (Panel oder Karte)
 * @param {string} cls - Klassenname ohne Punkt (z. B. "fe-R0")
 * @param {boolean} on - true = markieren, false = demarkieren
 */
export function toggleMark(scope, cls, on){
  const sel = scope?.querySelectorAll?.(
    `.fe-chain .${cls}, .fe-sym .${cls}, .fe-num .${cls}`
  ) || [];
  sel.forEach(n => n.classList.toggle('fe-drag', !!on));
}
