/*! 
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Input Layer · Parameter Tool · Controls
 * File:     /parameters/controls/sliders.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-01
 * Updated:  2025-10-01
 * Version:  6.0.0
 * Changelog:
 *   - v6.0.0 Slider-Composer: Rows erzeugen, dyn. Max (I0 ≤ N), Input→Callback
 *
 * eAnnotation:
 *   Rendert die sichtbaren Slider in die passenden Sections und verdrahtet Input.
 *   Achtet auf I₀≤N, ARIA-Aktualisierung und vermeidet Event-Loops (Single-Writer Director).
 */

import { makeSliderRow, setRowValue, labelFor } from './dom.rows.js';
import { pickGroup } from './config.js';

/**
 * Baut alle Slider für die übergebenen visible-Keys und steckt sie in die Sections.
 * @param {{
 *   sections: HTMLElement[],
 *   visible: string[],
 *   catalog: Record<string,{min:number,max:number,step?:number,def?:number}>,
 *   paramsRef: () => Record<string,any>,
 *   onInput: ({key:string,value:number}) => void
 * }} cfg
 */
export function buildSliders(cfg){
  const { sections, visible, catalog, paramsRef, onInput } = cfg;
  if (!Array.isArray(sections)) throw new Error('[controls] sliders: sections missing');
  if (!Array.isArray(visible))  return;

  const accRoot = sections[0]?.closest?.('.pt-accordion') || null;

  for (const key of visible){
    const def = normalizeDef(key, catalog[key]);
    const group = pickGroup(key);
    if (!group) continue;

    const sec = sections.find(s => s?.dataset?.group === group);
    const body = sec?.querySelector?.('.pt-acc-body');
    if (!body) continue;

    const params = safeObj(paramsRef());
    const value  = num(params[key], def.def ?? def.min);
    const { row, input, valEl } = makeSliderRow({
      key,
      def,
      value,
      labelText: labelFor(key),
      fmt: fmt
    });

    // Input → Callback (inkl. dyn. Max für I0)
    input.addEventListener('input', (e) => {
      const current = safeObj(paramsRef());
      let dynMax = def.max;

      if (key === 'I0'){
        const maxByN = safeInt(current.N, catalog?.N?.def ?? 1_000_000);
        if (maxByN !== num(input.max)) {
          input.max = String(maxByN);
          input.setAttribute('aria-valuemax', String(maxByN));
        }
        dynMax = maxByN;
      }

      const raw = Number(e.target.value);
      const clamped = clamp(def.min, dynMax, raw);

      // Spiegel Wertanzeige + ARIA (ruhig, ohne Heavy Reflow)
      if (valEl) valEl.textContent = fmt(clamped);
      input.setAttribute('aria-valuenow', String(clamped));

      // Weiterreichen (Director koppelt atomar; kein Ping-Pong)
      onInput?.({ key, value: clamped });
    }, { passive:true });

    body.appendChild(row);
  }

  // Leere Sections wegräumen (falls Filter nichts gebracht hat)
  sections.forEach(sec => {
    const body = sec.querySelector('.pt-acc-body');
    if (body && body.children.length === 0) sec.remove();
  });
}

/* ---------------- helpers ---------------- */

function normalizeDef(key, d={}){
  const min = num(d.min, defaultMin(key));
  const max = num(d.max, defaultMax(key));
  const step = Number.isFinite(d.step) ? d.step : defaultStep(key);
  const defv = Number.isFinite(d.def) ? d.def : defaultDef(key, {min, max, step});
  return { min, max, step, def: defv };
}

function defaultMin(key){
  switch(key){
    case 'R0': return 0.1;
    case 'beta':
    case 'gamma':
    case 'sigma':
    case 'measures': return 0.0;
    case 'D':  return 1.0;
    case 'N':  return 1;
    case 'I0': return 0;
    case 'T':  return 1;
    case 'dt': return 0.25;
    default:   return 0;
  }
}
function defaultMax(key){
  switch(key){
    case 'R0': return 10;
    case 'beta':
    case 'gamma':
    case 'sigma':
    case 'measures': return 1.0;
    case 'D':  return 60;
    case 'N':  return 1_000_000;
    case 'I0': return 1_000_000; // wird dynamisch auf N gesetzt
    case 'T':  return 365;
    case 'dt': return 2;
    default:   return 1;
  }
}
function defaultStep(key){
  switch(key){
    case 'R0': return 0.1;
    case 'beta':
    case 'gamma':
    case 'sigma':
    case 'measures': return 0.01;
    case 'D':  return 1;
    case 'N':
    case 'I0':
    case 'T':  return 1;
    case 'dt': return 0.25;
    default:   return 0.01;
  }
}
function defaultDef(key, {min, max}){
  switch(key){
    case 'R0': return 3;
    case 'beta': return 0.5;
    case 'gamma': return 0.2;
    case 'sigma': return 0.25;
    case 'D': return 5;
    case 'N': return Math.min(1_000_000, max);
    case 'I0': return 10;
    case 'T': return 180;
    case 'dt': return 0.5;
    case 'measures': return 0.0;
    default: return min;
  }
}

function fmt(x){
  const n = Number(x);
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1_000_000) return (n/1_000_000).toFixed(2)+' M';
  if (Math.abs(n) >= 1_000)     return (n/1_000).toFixed(2)+' k';
  if (n % 1 === 0) return String(n);
  return n.toFixed(4);
}
function clamp(min, max, v){
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}
function num(x, d=0){ const n = Number(x); return Number.isFinite(n) ? n : d; }
function safeObj(o){ return (o && typeof o === 'object') ? o : {}; }
function safeInt(v, d=0){ const n = Number(v); return Number.isFinite(n) ? Math.round(n) : d; }
