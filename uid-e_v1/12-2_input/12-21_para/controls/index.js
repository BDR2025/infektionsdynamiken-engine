/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Input Layer · Parameter Tool · Controls (flat)
 * File:     /parameters/controls/index.js
 * Type:     Open Educational Resource (OER) · ESM
 * License:  CC BY 4.0
 *
 * Created:  2025-10-02
 * Updated:  2025-10-03
 * Version:  3.4.1
 * Changelog:
 *   - v3.4.1  Inline-Editor Styles im Modul injiziert (abgerundet, „farblos“, weiße Schrift).
 *   - v3.4.0  Runde 4: Direkteingabe (Klick auf Wert → Inline-Input, Enter/Blur commit, Esc cancel).
 *   - v3.3.2  measures step 0.05 → 0.01 (1%-Schritte).
 *   - v3.3.1  D step 0.5 → 0.1.
 *   - v3.3.0  R3: L (1–10 d) im Learning + Kopplung L↔σ (σ=1/L), Replay spiegelt L aus σ.
 *   - v3.2.1  R0 ohne Snap (frei bis 15), γ/σ log.
 *   - v3.1.0  R1: N log, I0/E0 log0, dt 0.001–1.0, E0 neu.
 */

'use strict';

import * as bus from '../../../12-1_base/bus.js';
import { ensurePTStyles } from './styles.js';

/* ---------------------------------- Spec ---------------------------------- */
const SPEC = {
  // Lernziel
  D:        { min: 1,     max: 14,          step: 0.1,    def: 5 },
  L:        { min: 1,     max: 10,          step: 0.1,    def: 4 },
  measures: { min: 0,     max: 1,           step: 0.01,   def: 0 }, // 1%-Schritte

  // Modell
  R0:       { min: 0.5,   max: 15,          step: 0.01,   def: 3 },
  beta:     { min: 0,     max: 2,           step: 0.0001, def: 0.6 },
  gamma:    { min: 0.001, max: 1,           step: 0.0001, def: 0.2 },
  sigma:    { min: 0.001, max: 1,           step: 0.0001, def: 0.25 },

  // Simulation
  N:        { min: 1_000,     max: 100_000_000, step: 1_000, def: 1_000_000 },
  E0:       { min: 0,         max: 100_000,    step: 1,     def: 1 },
  I0:       { min: 0,         max: 100_000,    step: 1,     def: 10 },
  T:        { min: 30,        max: 720,        step: 1,     def: 180 },
  dt:       { min: 0.001,     max: 1.0,        step: 0.001, def: 0.5 },
};

const GROUPS = {
  learning:   ['D','L','measures'],
  model:      ['R0','beta','gamma','sigma'],
  simulation: ['N','E0','I0','T','dt'],
};

/* ----------------------------- Format Helpers ----------------------------- */
const num     = (x)=> { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const clamp   = (v,min,max)=> Math.max(min, Math.min(max, v));
const fix     = (x,n=4)=> Number.isFinite(x) ? Number(x).toFixed(n) : String(x);
const fmtInt  = (x)=> Number.isFinite(x) ? Number(x).toLocaleString('de-DE') : String(x);

function renderValue(key, v){
  if (key==='D')        return `${fix(v,1)} d`;
  if (key==='L')        return `${fix(v,1)} d`;
  if (key==='measures') return `${(v*100).toFixed(0)} %`;
  if (['beta','gamma','sigma'].includes(key)) return `${fix(v,4)} d⁻¹`;
  if (key==='R0')       return fix(v,3);
  if (['N','I0','E0','T'].includes(key)) return fmtInt(v);
  if (key==='dt')       return fix(v,3); // 3 NKS
  return String(v);
}

/* -------- Locale Number Parsing (DE/EN tolerant: "1.234,56" / "1234.56") --- */
function parseLocaleNumber(input){
  if (typeof input !== 'string') return Number(input);
  let s = input.trim();
  s = s.replace(/\s|\u00A0/g,'');
  const hasDot = s.includes('.');
  const hasComma = s.includes(',');
  if (hasDot && hasComma){
    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    if (lastComma > lastDot) s = s.replace(/\./g,'').replace(',', '.');
    else                     s = s.replace(/,/g,'');
  } else if (hasComma && !hasDot){
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/* ------------------------------ Scale Helpers ----------------------------- */
const UI_STEPS = 1000;

function scaleOf(key){
  if (key === 'N') return 'log';
  if (key === 'I0' || key === 'E0') return 'log0';       // 0 erlaubt
  if (key === 'gamma' || key === 'sigma') return 'log';  // Raten log
  return 'linear';                                       // D, L, R0, beta, T, dt
}

function logLerp(t, min, max){ return Math.exp(Math.log(min) + t*(Math.log(max) - Math.log(min))); }
function invLogLerp(v, min, max){ return (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min)); }

function currentNPhys(host){
  const inN = host.querySelector('.pt-row[data-key="N"] input.pt-range');
  if (!inN) return SPEC.N.def;
  const ui  = Number(inN.value);
  const t   = clamp(ui / UI_STEPS, 0, 1);
  return logLerp(t, SPEC.N.min, SPEC.N.max);
}

function toPhys(host, key, ui, specForKey){
  const scale = scaleOf(key);
  if (scale === 'linear') return ui;
  if (scale === 'log'){
    const t = clamp(ui / UI_STEPS, 0, 1);
    return logLerp(t, specForKey.min, specForKey.max);
  }
  if (scale === 'log0'){
    if (ui <= 0) return 0;
    const Nmax = Math.max(1, Math.floor(currentNPhys(host)));
    const t = clamp(ui / UI_STEPS, 0, 1);
    const phys = logLerp(t, 1, Nmax);
    return clamp(Math.round(phys), 0, Nmax);
  }
  return ui;
}

function toSlider(host, key, phys, specForKey){
  const scale = scaleOf(key);
  if (scale === 'linear') return phys;
  if (scale === 'log'){
    const t = invLogLerp(clamp(phys, specForKey.min, specForKey.max), specForKey.min, specForKey.max);
    return Math.round(clamp(t, 0, 1) * UI_STEPS);
  }
  if (scale === 'log0'){
    if (phys <= 0) return 0;
    const Nmax = Math.max(1, Math.floor(currentNPhys(host)));
    const v    = clamp(phys, 1, Nmax);
    const t    = invLogLerp(v, 1, Nmax);
    return Math.round(clamp(t, 0, 1) * UI_STEPS);
  }
  return phys;
}

/* ------------------------------ Row Builder ------------------------------- */
function makeRow(host, key, spec, idPrefix=''){
  const row = document.createElement('div');
  row.className = 'pt-row';
  row.setAttribute('data-key', key);

  const label = document.createElement('div');
  label.className = 'pt-label';
  label.textContent =
    (key==='I0') ? 'I₀' :
    (key==='E0') ? 'E₀' :
    (key==='L')  ? 'L'  : key;
  if (idPrefix) label.id = `${idPrefix}label-${key}`;

  const value = document.createElement('div');
  value.className = 'pt-value';
  value.id = `val-${key}`;
  value.textContent = renderValue(key, spec.def);

  const input = document.createElement('input');
  input.type = 'range';
  input.className = 'pt-range';
  input.id = `sl-${key}`;
  input.setAttribute('aria-label', key==='L' ? 'Latenzzeit L' : key);

  const sc = scaleOf(key);
  if (sc === 'linear'){
    input.min   = String(spec.min);
    input.max   = String(spec.max);
    input.step  = String(spec.step);
    input.value = String(spec.def);
    input.setAttribute('aria-valuemin', input.min);
    input.setAttribute('aria-valuemax', input.max);
    input.setAttribute('aria-valuenow',  input.value);
    input.setAttribute('aria-valuetext', renderValue(key, spec.def));
  } else {
    input.min   = '0';
    input.max   = String(UI_STEPS);
    input.step  = '1';
    input.value = String(toSlider(host, key, spec.def, spec));
    input.setAttribute('aria-valuemin', '0');
    input.setAttribute('aria-valuemax', input.max);
    input.setAttribute('aria-valuenow',  input.value);
    input.setAttribute('aria-valuetext', renderValue(key, spec.def));
  }

  // Slider-Input → Emit
  input.addEventListener('input', ()=>{
    const ui = num(input.value);
    let vPhys = toPhys(host, key, ui, spec);

    if (key === 'L'){ // Kopplung L → σ
      let sigmaVal = (vPhys > 0) ? (1 / vPhys) : SPEC.sigma.max;
      sigmaVal = clamp(sigmaVal, SPEC.sigma.min, SPEC.sigma.max);
      value.textContent = renderValue(key, vPhys);
      input.setAttribute('aria-valuenow',  String((sc==='linear') ? input.value : ui));
      input.setAttribute('aria-valuetext', renderValue(key, vPhys));
      bus.emit('uid:e:params:change', { key: 'sigma', value: sigmaVal, source: 'classic' });
      return;
    }

    // Clamp gegen N für I0/E0
    const Nmax = Math.max(1, Math.floor(currentNPhys(host)));
    const v = (key==='I0' || key==='E0') ? clamp(Math.round(vPhys), 0, Nmax) : vPhys;

    value.textContent = renderValue(key, v);
    input.setAttribute('aria-valuenow',  String((sc==='linear') ? input.value : ui));
    input.setAttribute('aria-valuetext', renderValue(key, v));
    bus.emit('uid:e:params:change', { key, value: v, source: 'classic' });
  });

  // Inline-Eingabe (Klick auf Wert)
  value.tabIndex = 0;
  value.title = 'Klicken zum Eingeben (Enter/Blur = Übernehmen, Esc = Abbrechen)';
  value.addEventListener('click', ()=> startInlineEdit(host, row, key, spec));
  value.addEventListener('keydown', (ev)=>{
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); startInlineEdit(host, row, key, spec); }
  });

  const head = document.createElement('div');
  head.className = 'pt-row-head';
  head.appendChild(label);
  head.appendChild(value);

  row.appendChild(head);
  row.appendChild(input);
  return row;
}

/* -------------------------- Inline Input Controller ------------------------ */
function getCurrentPhys(host, key, spec){
  const inEl = host.querySelector(`.pt-row[data-key="${key}"] input.pt-range`);
  if (!inEl) return SPEC[key]?.def ?? 0;
  const sc = scaleOf(key);
  const ui = Number(inEl.value);
  return toPhys(host, key, (sc==='linear' ? Number(inEl.value) : ui), spec);
}

function startInlineEdit(host, row, key, spec){
  const valueEl = row.querySelector('.pt-value');
  const inEl    = row.querySelector('input.pt-range');
  if (!valueEl || !inEl) return;
  if (row.querySelector('.pt-edit')) return; // bereits offen

  const current = getCurrentPhys(host, key, spec);
  const edit = document.createElement('input');
  edit.type = 'text';
  edit.className = 'pt-edit';
  edit.value = (key==='measures') ? (current*100).toFixed(0) : String(current);
  edit.setAttribute('inputmode','decimal');
  edit.setAttribute('aria-label', `Wert für ${key}`);
  edit.style.width = Math.max(60, valueEl.clientWidth) + 'px';

  const oldText = valueEl.textContent;
  valueEl.textContent = '';
  valueEl.appendChild(edit);
  edit.focus(); edit.select();

  const cancel = ()=> { valueEl.textContent = oldText; };

  const commit = ()=>{
    if (key==='measures') {
      const perc = parseLocaleNumber(edit.value);
      if (!Number.isFinite(perc)) return cancel();
      const v = clamp(perc/100, SPEC.measures.min, SPEC.measures.max);
      valueEl.textContent = renderValue('measures', v);
      inEl.value = String(v); // linear
      inEl.setAttribute('aria-valuenow', inEl.value);
      inEl.setAttribute('aria-valuetext', renderValue('measures', v));
      bus.emit('uid:e:params:change', { key:'measures', value:v, source:'classic' });
      return;
    }

    const phys = parseLocaleNumber(edit.value);
    if (!Number.isFinite(phys)) return cancel();
    let v = SPEC[key] ? clamp(phys, SPEC[key].min, SPEC[key].max) : phys;

    if (key === 'L'){ // Eingabe L → σ
      let sigmaVal = (v > 0) ? (1 / v) : SPEC.sigma.max;
      sigmaVal = clamp(sigmaVal, SPEC.sigma.min, SPEC.sigma.max);
      valueEl.textContent = renderValue('L', v);
      inEl.value = String(v); // linear
      inEl.setAttribute('aria-valuenow', inEl.value);
      inEl.setAttribute('aria-valuetext', renderValue('L', v));
      bus.emit('uid:e:params:change', { key:'sigma', value:sigmaVal, source:'classic' });
      return;
    }

    if (key==='I0' || key==='E0'){
      const Nmax = Math.max(1, Math.floor(currentNPhys(host)));
      v = clamp(Math.round(v), 0, Nmax);
    }

    const sc = scaleOf(key);
    inEl.value = (sc==='linear') ? String(v) : String(toSlider(host, key, v, SPEC[key]));
    inEl.setAttribute('aria-valuenow', inEl.value);
    inEl.setAttribute('aria-valuetext', renderValue(key, v));
    valueEl.textContent = renderValue(key, v);
    bus.emit('uid:e:params:change', { key, value: v, source:'classic' });
  };

  edit.addEventListener('keydown', (ev)=>{
    if (ev.key === 'Escape'){ ev.preventDefault(); cancel(); }
    if (ev.key === 'Enter'){ ev.preventDefault(); commit(); }
  });
  edit.addEventListener('blur', ()=> commit());
}

/* ------------------------------ Group Builder ----------------------------- */
function buildGroup(host, name, keys, spec, idPrefix=''){
  const sec = document.createElement('section');
  sec.className = `pt-group pt-group-${name}`;
  sec.setAttribute('data-group', name);

  const h = document.createElement('h3');
  h.className = 'sr-only';
  h.id = `${idPrefix}h-${name}`;
  h.textContent =
    name==='learning'   ? 'Lernzielparameter' :
    name==='model'      ? 'Modellparameter' :
    name==='simulation' ? 'Simulationsparameter' : name;
  sec.appendChild(h);

  keys.forEach(k => sec.appendChild(makeRow(host, k, spec[k] || SPEC[k] || {}, idPrefix)));
  return sec;
}

/* --------------------------- Inline-Styles injizieren ---------------------- */
function ensureInlineEditStyles(){
  if (document.getElementById('pt-inline-edit-css')) return;
  const style = document.createElement('style');
  style.id = 'pt-inline-edit-css';
  style.textContent = `
    :root{
      --pt-edit-radius: 10px;
      --pt-edit-bg: rgba(255,255,255,.06);
      --pt-edit-border: rgba(255,255,255,.22);
      --pt-edit-color: #fff;
      --pt-edit-color-muted: rgba(255,255,255,.7);
      --pt-edit-focus: rgba(255,255,255,.55);
    }
    .widget .pt-row .pt-value{
      color: var(--pt-edit-color);
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .widget .pt-row .pt-edit{
      all: unset;
      display: inline-block;
      box-sizing: border-box;
      min-width: 3ch;
      padding: .2rem .5rem;
      text-align: right;
      border-radius: var(--pt-edit-radius);
      background: var(--pt-edit-bg);
      border: 1px solid var(--pt-edit-border);
      color: var(--pt-edit-color);
      font: inherit; line-height: 1.2;
      caret-color: var(--pt-edit-color);
    }
    .widget .pt-row .pt-edit:focus{
      outline: 2px solid var(--pt-edit-focus);
      outline-offset: 2px;
    }
    .widget .pt-row .pt-edit::placeholder{
      color: var(--pt-edit-color-muted);
    }
    .widget .pt-row .pt-edit::-webkit-contacts-auto-fill-button,
    .widget .pt-row .pt-edit::-webkit-credentials-auto-fill-button{
      visibility: hidden; display:none;
    }
  `;
  document.head.appendChild(style);
}

/* --------------------------------- Mount ---------------------------------- */
export function mountControls(host, opts={}){
  const widgetEl = host?.closest?.('.widget') || host;

  ensurePTStyles(widgetEl);     // bestehende Styles
  ensureInlineEditStyles();     // neue Inline-Editor Styles

  const spec = { ...SPEC, ...(opts.catalog || {}) };
  const idPrefix = (opts.idPrefix || '').trim();

  host.innerHTML = '';
  let body = host.querySelector('.pt-groups');
  if (!body){
    body = document.createElement('div');
    body.className = 'pt-groups';
    host.appendChild(body);
  }

  const groups = {};
  ['learning','model','simulation'].forEach(name=>{
    const g = buildGroup(host, name, GROUPS[name], spec, idPrefix);
    groups[name] = g;
    body.appendChild(g);
  });

  // Mirror model:update → rows (replay-safe)
  const offModel = bus.on('uid:e:model:update', (p)=>{
    const getP = (k)=>{
      if (!p || typeof p!=='object') return undefined;
      if (p[k] !== undefined) return p[k];
      if (p.params && p.params[k] !== undefined) return p.params[k];
      if (p.model  && p.model[k]  !== undefined) return p.model[k];
      if (p.state && p.state.params && p.state.params[k] !== undefined) return p.state.params[k];
      return undefined;
    };

    const Nval = getP('N');
    const sigmaVal = getP('sigma');

    ['D','L','measures','R0','beta','gamma','sigma','N','E0','I0','T','dt'].forEach(k=>{
      const v = (k==='L')
        ? ((sigmaVal && sigmaVal > 0) ? (1 / sigmaVal) : SPEC.L.def)
        : getP(k);
      if (v === undefined) return;

      const row   = host.querySelector(`.pt-row[data-key="${k}"]`);
      if (!row) return;
      const valEl = row.querySelector('.pt-value');
      const inEl  = row.querySelector('input.pt-range');

      if (inEl){
        const sc = scaleOf(k);
        if (sc === 'linear'){
          const vSet =
            (k==='R0') ? clamp(v, SPEC.R0.min, SPEC.R0.max) :
            (k==='L')  ? clamp(v, SPEC.L.min, SPEC.L.max)   : v;
          inEl.value = String(vSet);
          if ((k==='I0' || k==='E0') && Number.isFinite(Nval)){
            inEl.max = String(Math.max(1, Math.floor(Nval)));
            if (Number(inEl.value) > Nval) inEl.value = String(Math.max(0, Math.floor(Nval)));
          }
        } else {
          inEl.value = String(toSlider(host, k, v, spec[k] || SPEC[k]));
        }
        inEl.setAttribute('aria-valuenow',  inEl.value);
        inEl.setAttribute('aria-valuetext', renderValue(k, v));
      }
      if (valEl) valEl.textContent = renderValue(k, v);
    });
  }, { replay:true });

  function setActive(slot){ try{ (widgetEl||host).setAttribute('data-pt-slot', slot); }catch{} }
  function updateModel(payload){ try { offModel?.handler?.(payload); } catch {} }
  function dispose(){ try{ offModel?.(); } catch{} }

  return { setActive, updateModel, dispose };
}

export default { mountControls };
