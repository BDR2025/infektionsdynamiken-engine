/*! 
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Input Layer · Parameter Tool · Formulas
 * File:     /parameters/formulas/config.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-01
 * Updated:  2025-10-01
 * Version:  6.0.0
 * Changelog:
 *   - v6.0.0 Erstes Modul: Flags/Order aus Widget-Dataset & Root-Attr lesen
 *
 * eAnnotation:
 *   Liefert die Anzeige-Flags für das Formeln-Panel (flat/order/showSigma).
 *   Quelle sind Widget-Dataset (data-*) und das Root-Model (data-model am <html>).
 */

function truthy(v){ return v === '' || v === '1' || v === 'true'; }
function parseOrder(str){
  return String(str||'')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Ermittelt die Render-Flags für das Formeln-Panel.
 * @param {HTMLElement} host - Host-Element des Panels (scoped Widget)
 * @returns {{flat:boolean, order:string[]}}
 */
export function getFlags(host){
  const widget = host?.closest?.('.widget');
  const ds = widget?.dataset || {};

  const html   = document.documentElement;
  const model  = (html.getAttribute('data-model') || 'SIR').toUpperCase();

  const flat       = truthy(ds.ptFlat || '0');
  const orderAttr  = parseOrder(ds.ptOrder);
  const showSigma  = ds.ptShowSigma || 'auto';
  const wantSigma  = (showSigma === 'auto') ? (model === 'SEIR') : truthy(showSigma);

  const defaultOrder = [
    'D','R0','beta','gamma',
    ...(model === 'SEIR' && wantSigma ? ['sigma'] : []),
    'beta_eff','R_eff_t','R_eff_0'
  ];

  return {
    flat,
    order: orderAttr.length ? orderAttr : defaultOrder
  };
}
