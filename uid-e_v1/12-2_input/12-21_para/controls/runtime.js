/*! 
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Input Layer · Parameter Tool · Controls
 * File:     /parameters/controls/runtime.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-01
 * Updated:  2025-10-01
 * Version:  6.0.0
 * Changelog:
 *   - v6.0.0 Model-Sync ausgelagert: Werte/Slider/ARIA aktualisieren (I₀ ≤ N)
 *
 * eAnnotation:
 *   Spiegelt model:update in die Classic-Slider: Werte rechts, Range-Position, ARIA.
 *   Beachtet dynamische Maxima (I₀≤N) und clamped Value, ohne Event-Loops zu erzeugen.
 */
/* -------- Scale Helpers (Runde 1) -------- */
function scaleOf(key, catalog){
  const spec = (catalog && catalog[key]) || {};
  return spec.scale || (key==='N' ? 'log' : ((key==='I0'||key==='E0') ? 'log0' : 'lin'));
}
function toSlider(key, physValue, catalog, model){
  const scale = scaleOf(key, catalog);
  const v = Number(physValue);
  if (scale === 'lin') return v;
  const uiMax = 1000;
  if (scale === 'log'){
    const spec = catalog?.[key] || {};
    const min = Number(spec.min ?? 1);
    const maxPhys = Number(spec.max ?? 1);
    const lo = Math.log(Math.max(1e-9, min));
    const hi = Math.log(Math.max(min+1e-9, maxPhys));
    const t = (Math.log(Math.max(1e-9, v)) - lo) / (hi - lo);
    return Math.round(Math.min(uiMax, Math.max(0, t*uiMax)));
  }
  if (scale === 'log0'){
    if (v <= 0) return 0;
    const spec = catalog?.[key] || {};
    const maxPhys = Number(spec.max ?? 1);
    const N = (model && Number.isFinite(Number(model.N))) ? Number(model.N) : maxPhys;
    const cap = Math.max(1, Math.min(N, maxPhys));
    const lo = Math.log(1);
    const hi = Math.log(cap);
    const t = (Math.log(Math.max(1, v)) - lo) / (hi - lo);
    return Math.round(Math.min(uiMax, Math.max(0, t*uiMax)));
  }
  return v;
}


/**
 * Überträgt Modellwerte in das Classic-Panel.
 * - Aktualisiert .val (rechts), Slider-Value, aria-valuenow
 * - Setzt dyn. Max für I0 auf N und clamp’t den Slider-Wert falls nötig
 * @param {HTMLElement} container
 * @param {Record<string, any>} model
 * @param {Record<string, {min:number,max:number,step?:number,def?:number}>} catalog
 */
export function syncFromModel(container, model, catalog={}){
  if (!container || !model) return;

  // Liste der üblichen Keys (falls weitere dazukommen, werden sie unten generisch bedient)
  const keys = ['R0','beta','gamma','D','sigma','N','E0','I0','T','dt','measures'];

  // 1) Dyn. Max für I0 aus N ableiten (falls vorhanden)
  const N = num(model.N, catalog.N?.def ?? 1_000_000);
  const slI0 = qs(container, '#sl-I0');
  if (slI0){
    const ds = slI0.dataset?.scale || 'lin';
    if (ds==='lin'){
      const currentMax = num(slI0.max, N);
      if (currentMax !== N){ slI0.max = String(N); slI0.setAttribute('aria-valuemax', String(N)); }
    }
  }
  const slE0 = qs(container, '#sl-E0');
  if (slE0){
    const ds = slE0.dataset?.scale || 'lin';
    if (ds==='lin'){
      const currentMaxE = num(slE0.max, N);
      if (currentMaxE !== N){ slE0.max = String(N); slE0.setAttribute('aria-valuemax', String(N)); }
    }
  }

  // 2) Alle bekannten Keys spiegeln
  for (const key of keys){
    if (typeof model[key] === 'undefined') continue;

    const value = model[key];
    const valNode = qs(container, `#val-${key}`);
    if (valNode) valNode.textContent = fmt(value);

    const input = qs(container, `#sl-${key}`);
    if (!input) continue;

    // Map phys→UI für N/I0/E0 falls skaliert
    const sc = input?.dataset?.scale || scaleOf(key, catalog);
    if (sc && sc!=='lin'){
      const ui = toSlider(key, value, catalog, model);
      input.value = String(ui);
      input.setAttribute('aria-valuenow', String(ui));
      input.setAttribute('aria-valuetext', fmt(value));
    } else if (key === 'I0' || key === 'E0') {
      const clamped = clamp(num(input.min, 0), N, Number(value));
      input.value = String(clamped);
      input.setAttribute('aria-valuenow', String(clamped));
    } else {
      input.value = String(value);
      input.setAttribute('aria-valuenow', String(value));
    }re Keys im Model (defensiv)
  Object.keys(model).forEach((k)=>{
    // wenn bereits oben behandelt → skip
    if (keys.includes(k)) return;
    const node = qs(container, `#val-${k}`);
    if (node) node.textContent = fmt(model[k]);
    const input = qs(container, `#sl-${k}`);
    if (input) {
      input.value = String(model[k]);
      input.setAttribute('aria-valuenow', String(model[k]));
    }
  });
}

/* ---------------- helpers ---------------- */

function qs(root, sel){ return root?.querySelector?.(sel) || null; }

function fmt(x){
  const n = Number(x);
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1_000_000) return (n/1_000_000).toFixed(2)+' M';
  if (Math.abs(n) >= 1_000)     return (n/1_000).toFixed(2)+' k';
  if (n % 1 === 0) return String(n);
  return n.toFixed(4);
}

function num(x, d=0){ const n = Number(x); return Number.isFinite(n) ? n : d; }

function clamp(min, max, v){
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}
