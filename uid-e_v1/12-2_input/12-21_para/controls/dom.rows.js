/*! 
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Input Layer · Parameter Tool · Controls
 * File:     /parameters/controls/dom.rows.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-01
 * Updated:  2025-10-01
 * Version:  6.0.0
 * Changelog:
 *   - v6.0.0 Slider-Row-Builder ausgelagert (Label, Value, Range + ARIA)
 *
 * eAnnotation:
 *   Baut eine Slider-Zeile: Label links, Wert rechts, Range darunter – mit sauberem ARIA.
 *   Liefert Utilities zum Setzen/Lesen von Wertknoten, ohne Bus-/Model-Logik.
 */

/**
 * Erzeugt eine Slider-Zeile für einen Parameter.
 * @param {{
 *   key: string,
 *   def: {min:number, max:number, step?:number},
 *   value?: number,
 *   labelText?: string,
 *   fmt?: (x:number)=>string
 * }} cfg
 * @returns {{ row: HTMLElement, input: HTMLInputElement, valEl: HTMLElement, labelEl: HTMLLabelElement }}
 */
export function makeSliderRow(cfg){
  const { key, def } = cfg;
  if (!key || !def) throw new Error('[controls] dom.rows: key/def missing');

  const fmt = typeof cfg.fmt === 'function' ? cfg.fmt : defaultFmt;
  const value = Number.isFinite(cfg.value) ? cfg.value : clamp(def.min, def.max, def.min);
  const labelText = cfg.labelText || labelFor(key);

  const row = document.createElement('div');
  row.className = 'slider-row';
  row.dataset.key = key;

  // IDs
  const labelId = `lbl-${key}`;
  const inputId = `sl-${key}`;
  const valId   = `val-${key}`;

  // Meta: Label + Wert
  const meta = document.createElement('div');
  meta.className = 'meta';

  const labelEl = document.createElement('label');
  labelEl.id = labelId;
  labelEl.htmlFor = inputId;
  labelEl.textContent = labelText;

  const valEl = document.createElement('span');
  valEl.className = 'val';
  valEl.id = valId;
  valEl.textContent = fmt(value);

  meta.appendChild(labelEl);
  meta.appendChild(valEl);

  // Range
  const input = document.createElement('input');
  input.type  = 'range';
  input.id    = inputId;
  input.setAttribute('data-key', key);
  input.min   = String(def.min);
  input.max   = String(def.max);
  input.step  = String(stepOf(key, def));
  input.value = String(clamp(def.min, def.max, value));

  // ARIA
  input.setAttribute('aria-labelledby', labelId);
  input.setAttribute('aria-valuemin', String(def.min));
  input.setAttribute('aria-valuemax', String(def.max));
  input.setAttribute('aria-valuenow', String(value));

  // Compose
  row.appendChild(meta);
  row.appendChild(input);

  return { row, input, valEl, labelEl };
}

/**
 * Aktualisiert die sichtbare Wertedarstellung der Row (rechts neben dem Label).
 * @param {HTMLElement} row
 * @param {number} value
 * @param {(x:number)=>string} [fmt]
 */
export function setRowValue(row, value, fmt = defaultFmt){
  const valEl = row?.querySelector?.('.val');
  if (valEl) valEl.textContent = fmt(value);
  const input = row?.querySelector?.('input[type="range"]');
  if (input) input.setAttribute('aria-valuenow', String(value));
}

/**
 * Gibt den Range-Input der Row zurück (oder null).
 * @param {HTMLElement} row
 * @returns {HTMLInputElement|null}
 */
export function getRowInput(row){
  return row?.querySelector?.('input[type="range"]') || null;
}

/* ---------------- helpers ---------------- */

function defaultFmt(x){
  const n = Number(x);
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1_000_000) return (n/1_000_000).toFixed(2)+' M';
  if (Math.abs(n) >= 1_000)     return (n/1_000).toFixed(2)+' k';
  if (n % 1 === 0) return String(n);
  return n.toFixed(4);
}

function stepOf(key, def){
  if (Number.isFinite(def.step)) return def.step;
  return (key === 'N' || key === 'I0') ? 1 : 0.01;
}

function clamp(min, max, v){
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/**
 * DE-Label für bekannte Keys (Fallback: raw key)
 * @param {string} key
 * @returns {string}
 */
export function labelFor(key){
  const map = {
    R0: 'R₀', beta: 'β', gamma: 'γ', D: 'D',
    N: 'N', E0: 'E₀', I0: 'I₀', T: 'T', dt: 'Δt',
    measures: 'Measures', sigma: 'σ', mu: 'μ', nu: 'ν'
  };
  return map[key] || key;
}
