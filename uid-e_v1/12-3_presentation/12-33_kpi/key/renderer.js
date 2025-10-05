/*!
 * File:      /12-3_presentation/kpi/key/renderer.js
 * Project:   UID-Explore · Presentation Layer · KPI Tool — KEY Deck
 * Role:      Renderer für das Key KPI Widget (statisches 2-Spalten-Deck) inkl. Tooltips/A11y
 * Type:      Open Educational Resource (OER) · ESM
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-03
 * Version:   3.1.0
 * Changelog:
 *   - v3.1.0  Port + Anbindung an common/compute (STATIC/LIVE/extras) und common/registry; Events/Replay, A11y.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1) Imports
// ─────────────────────────────────────────────────────────────────────────────
import * as bus from '../../../12-1_base/bus.js';
import { makeContext, STATIC, LIVE }          from '../common/compute/index.js';
import { computeExtras }                      from '../common/compute/extras.js';
import { kpiTooltip }                         from '../common/tooltips.js';
import { getRegistry as getKeyRegistry, kpiLabel as keyKpiLabel } from '../common/registry.js';
import { KEYKPI_TOPICS } from './kpi.key.widget-actions.js';

// ─────────────────────────────────────────────────────────────────────────────
// 2) LS & Helper-Funktionen
// ─────────────────────────────────────────────────────────────────────────────
const LS = { groups:'uid:keykpi.groups' };
const getLS = (k,fb)=>{ try{ const v=localStorage.getItem(k); return v? JSON.parse(v):fb; }catch{ return fb; } };
const setLS = (k,v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} };

function labelFor(id, locale, fallbackLabel){
  const t = keyKpiLabel?.(id, locale);
  return t || fallbackLabel || id;
}

function makeCardNode({ id, title, value, secondary, unit }, locale, mode){
  const div = document.createElement('div');
  div.className = 'kpi-card';
  div.setAttribute('data-id', id);
  const tip = kpiTooltip(id, locale, mode);
  if (tip) div.setAttribute('title', tip);
  div.setAttribute('role','group');
  div.setAttribute('tabindex','0');
  div.setAttribute('aria-label', `${title}: ${value}${unit ? ' ' + unit : ''}`);
  div.innerHTML = `
    <div class="kpi-title">${title}</div>
    <div class="kpi-value">${value}${unit ? ` <span class="kpi-unit">${unit}</span>` : ''}</div>
    ${secondary ? `<div class="kpi-secondary">${secondary}</div>` : ''}
  `;
  return div;
}

function renderInto(deck, nodes){
  deck.innerHTML = '';
  const frag = document.createDocumentFragment();
  nodes.forEach(n => frag.appendChild(n));
  deck.appendChild(frag);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3) KPI-Berechnung (STATIC/LIVE/Extras)
// ─────────────────────────────────────────────────────────────────────────────
function computeKPI(id, { p, s, ctx, ptr, extras }){
  if (typeof STATIC?.[id] === 'function') return STATIC[id]({ p, fmt: ctx.fmt });
  if (typeof LIVE?.[id]   === 'function') return LIVE[id]({ p, s: s?.series || {}, ptr, fmt: ctx.fmt });
  if (extras && Object.prototype.hasOwnProperty.call(extras, id)){
    const v = extras[id];
    if (v == null) return { value: '—', unit:'' };
    if (typeof v === 'number'){
      if (v >= 0 && v <= 1 && /(^i_|^p_|IFR|rate|attack|share|frac|_perc)/i.test(id)) {
        return { value: ctx.fmt.d1.format(v*100), unit:'%' };
      }
      if (/^t[_-]?/.test(id)) { return { value: ctx.fmt.d1.format(v), unit:'d' }; }
      return { value: ctx.fmt.d3.format(v), unit:'' };
    }
    return { value: String(v), unit:'' };
  }
  return { value: '—', unit:'' };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4) Public Mount (Deck rendern & Bus verkabeln)
// ─────────────────────────────────────────────────────────────────────────────
export async function mountKeyKPIDeck(deck, { lang='de', model='SIR' } = {}){
  if (!deck) return;

  const locale = (String(lang).toLowerCase().startsWith('de')) ? 'de' : 'en';
  const mode   = (document.documentElement?.dataset?.mode || 'university').toLowerCase();
  const ctx    = makeContext(locale);
  const REG    = getKeyRegistry?.(model, locale, mode) || {};

  const groups = new Set((getLS(LS.groups, ['goal']) || [])
                  .map(x => String(x).toLowerCase())
                  .filter(x => ['goal','model','sim','synth'].includes(x)));

  let lastModel = null;
  let lastData  = null;
  let lastPtr   = null;

  function cardsForGroup(groupId){
    const ord = REG?.[groupId]?.order || [];
    const extras = computeExtras(model, lastModel || {}, lastData || {});
    return ord.map(id => {
      const { value, unit, secondary } = computeKPI(id, { p:lastModel||{}, s:lastData||{}, ctx, ptr:lastPtr, extras });
      const title = labelFor(id, locale, REG?.labels?.[id]);
      return makeCardNode({ id, title, value, secondary, unit }, locale, mode);
    }).filter(Boolean);
  }

  function currentNodes(){
    const seq = [];
    if (groups.has('goal'))  seq.push(...cardsForGroup('goal'));
    if (groups.has('model')) seq.push(...cardsForGroup('model'));
    if (groups.has('sim'))   seq.push(...cardsForGroup('sim'));
    if (groups.has('synth')) seq.push(...cardsForGroup('synth'));
    return seq;
  }

  function render(){ renderInto(deck, currentNodes()); }

  const offModel = bus.on('uid:e:model:update', (payload)=>{ lastModel = payload; render(); });
  const offData  = bus.on('uid:e:sim:data',     (payload)=>{ lastData  = payload; render(); });
  const offPtr   = bus.on?.('uid:e:sim:pointer', (payload)=>{ lastPtr = payload; render(); }) || (()=>{});

  const offGroup = bus.on(KEYKPI_TOPICS.GROUP_SET, ({ id, on })=>{
    const gid = String(id||'').toLowerCase();
    if (!['goal','model','sim','synth'].includes(gid)) return;
    if (on) groups.add(gid); else groups.delete(gid);
    setLS(LS.groups, [...groups]);
    render();
  }, { replay:true });

  try {
    const lastM = bus.getLast?.('uid:e:model:update');  if (lastM)  { lastModel = lastM; }
    const lastD = bus.getLast?.('uid:e:sim:data');      if (lastD)  { lastData  = lastD; }
    const lastP = bus.getLast?.('uid:e:sim:pointer');   if (lastP)  { lastPtr   = lastP; }
  } catch {}

  render();

  return ()=> { try{ offModel?.(); offData?.(); offPtr?.(); offGroup?.(); }catch{} };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5) Default-Export
// ─────────────────────────────────────────────────────────────────────────────
export default { mountKeyKPIDeck };
