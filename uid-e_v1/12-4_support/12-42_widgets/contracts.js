/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Widget Logic (Contracts)
 * File:     /uid/12-4_support/widgets/contracts.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-03
 * Updated:  2025-10-03
 * Version:  1.4.2
 * Changelog:
 *   - v1.4.2  Repository-Polishing: Kopfzeile, Gliederung, Annotation. Keine Verhaltensänderung.
 *
 * eAnnotation:
 *   Validiert die Actions-Spezifikation für Widget-Header (dyn/globals).
 *   Prüft Typen & Minimalfelder (segmented/toggle/button/dropdown/multitoggle).
 */

/* ============================================================================
 * 1) Purpose & API
 * ---------------------------------------------------------------------------
 * validateSpec(spec, { debug=false }) → boolean
 *  - Prüft Form von spec.dyn/spec.globals und deren Items.
 *  - Bei debug=true werden Probleme als console.warn geloggt.
 * Expected shape (Kurzform):
 *  {
 *    dyn:     Array<Action>,
 *    globals: Array<Action>
 *  }
 *  Action:
 *    - {type:'segmented', options:Array}
 *    - {type:'toggle',    get:Function, set?:Function, label?:string}
 *    - {type:'button',    onClick?:Function, label?:string}
 *    - {type:'dropdown',  items:Array<{label?,value?,selected?,onSelect?}>}
 *    - {type:'multitoggle', ...}
 * ========================================================================== */

/* ============================================================================
 * 2) Validator (Implementierung)
 * ------------------------------------------------------------------------- */
export function validateSpec(spec, { debug=false } = {}){
  const problems = [];
  const ALLOWED = ['segmented','toggle','button','dropdown','multitoggle'];

  const checkAction = (a, where) => {
    if (!a || typeof a !== 'object') { problems.push(`${where}: action is not object`); return; }
    if (!a.type) problems.push(`${where}: missing 'type'`);
    if (!ALLOWED.includes(a.type)) problems.push(`${where}: invalid 'type' ${a.type}`);

    // Light checks je nach Typ (Minimalanforderungen)
    if (a.type === 'segmented' && !Array.isArray(a.options))
      problems.push(`${where}: segmented.options missing`);
    if (a.type === 'toggle' && typeof a.get !== 'function')
      problems.push(`${where}: toggle.get missing`);
    if (a.type === 'dropdown' && !Array.isArray(a.items))
      problems.push(`${where}: dropdown.items missing`);
  };

  for (const side of ['dyn','globals']){
    const arr = spec?.[side];
    if (!arr) continue;
    if (!Array.isArray(arr)) problems.push(`spec.${side} not array`);
    else arr.forEach((a,i)=>checkAction(a, `${side}[${i}]`));
  }

  if (debug && problems.length) console.warn('[widgets/contracts] issues:', problems);
  return problems.length === 0;
}
