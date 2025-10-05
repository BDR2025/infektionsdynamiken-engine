/*! 
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Input Layer · Parameter Tool · Formulas
 * File:     /parameters/formulas/math.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-01
 * Updated:  2025-10-01
 * Version:  6.0.0
 * Changelog:
 *   - v6.0.0 Math-Adapter: MathJax typesetPromise mit sicherem Fallback
 *
 * eAnnotation:
 *   Führt das einmalige Typeset der Formelinhalte aus (Panel-scope).
 *   Nutzt MathJax, fällt ansonsten sanft zurück (KaTeX für $...$-Slots oder No-Op).
 */

/**
 * Einmaliges Typeset der übergebenen Knoten.
 * Erwartung: Slots enthalten genau einen TeX-Block als `$...$`.
 * @param {NodeList|HTMLElement[]|null|undefined} nodes
 * @returns {Promise<void>}
 */
export function typesetOnce(nodes){
  const list = toArray(nodes);
  // Bevorzugt: MathJax
  const mj = /** @type {any} */ (window).MathJax;
  if (mj && typeof mj.typesetPromise === 'function'){
    return mj.typesetPromise(list).then(()=>{}).catch(()=>{});
  }
  // Fallback: KaTeX, falls vorhanden und Slot ist genau "$...$"
  const katex = /** @type {any} */ (window).katex;
  if (katex && typeof katex.renderToString === 'function'){
    try{
      list.forEach(el=>{
        const txt = (el && 'textContent' in el) ? String(el.textContent||'') : '';
        const m = txt.match(/^\$(.*)\$$/s);
        if (!m) return;
        // Render in-place (trust/strict wie in MJX-Flow toleranter)
        el.innerHTML = katex.renderToString(m[1], { throwOnError:false, trust:true, strict:'ignore' });
      });
    }catch{ /* noop */ }
  }
  // Immer resolved zurückkehren, Panel bleibt funktionsfähig
  return Promise.resolve();
}

/* ---------------- helpers ---------------- */

function toArray(nodes){
  if (!nodes) return [];
  if (Array.isArray(nodes)) return nodes;
  try { return Array.from(nodes); } catch { return []; }
}
