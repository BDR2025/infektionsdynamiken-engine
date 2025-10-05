/*!
 * File:      /12-3_presentation/kpi/live/view.js
 * Project:   UID-Explore · Presentation Layer · KPI Tool — LIVE Deck
 * Role:      View-/Render-Hilfen (Body/Header, Style-Guard, Order, Card, Render)
 * Type:      Open Educational Resource (OER) · ESM
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-03
 * Version:   3.1.0
 * Changelog:
 *   - v3.1.0  Auslagerung der View-/Render-Hilfen aus live/index.js; Header-Default „Live KPIs“;
 *             Style-Guard Default-Format: School→pct, sonst→hybrid. Gliederung/Kommentare ergänzt.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1) Imports
// ─────────────────────────────────────────────────────────────────────────────
import attachKPIStyle from '../common/style/controller.js';
import { kpiTooltip } from '../common/tooltips.js';
import * as Tip       from '/uid-e_v1/12-4_support/12-42_widgets/tooltip.js';

// ─────────────────────────────────────────────────────────────────────────────
// 2) DOM-Helper (Body, Header, Actions-Slot)
// ─────────────────────────────────────────────────────────────────────────────
export function ensureBody(root){
  let body = root.querySelector('.widget-body');
  if (!body){
    body = document.createElement('div');
    body.className = 'widget-body';
    root.appendChild(body);
  }
  return body;
}

export function ensureHeader(root, title){
  let header = root.querySelector('.widget-header');
  if (header) return header;
  header = document.createElement('div');
  header.className = 'widget-header';

  const hTitle   = document.createElement('div');
  hTitle.className = 'widget-title';
  hTitle.textContent = title || 'Live KPIs';

  const hActions = document.createElement('div');
  hActions.className = 'widget-actions-slot';

  header.appendChild(hTitle);
  header.appendChild(hActions);
  root.insertBefore(header, root.firstChild);
  return header;
}

export const headerActionsSlot = (header)=> header.querySelector('.widget-actions-slot') || header;

// ─────────────────────────────────────────────────────────────────────────────
// 3) Style-Guard (forceCols + Default-Attribute)
// ─────────────────────────────────────────────────────────────────────────────
export function mountStyleGuard(widgetRoot, cols=4){
  if (!widgetRoot) return null;
  const styleCtl = attachKPIStyle(widgetRoot, { forceCols: cols });

  const mode = (document.documentElement?.dataset?.mode || 'university').toLowerCase();
  if (!widgetRoot.hasAttribute('data-format')){
    widgetRoot.setAttribute('data-format', mode === 'school' ? 'pct' : 'hybrid');
  }
  if (!widgetRoot.hasAttribute('data-reduced')){
    widgetRoot.setAttribute('data-reduced','false');
  }
  return styleCtl;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4) Order-Helfer (Registry → Bestellfolgen)
// ─────────────────────────────────────────────────────────────────────────────
export function makeOrderHelpers(REG){
  const orderFor = (id)=>{
    if (id === 'static')         return (REG.static?.order || []);
    if (id === 'live-comp')      return (REG.live?.comp?.order || []);
    if (id === 'live-context')   return (REG.live?.context?.order || []);
    if (id === 'live-peaks')     return (REG.live?.peaks?.order || []);
    if (id === 'live-outcomes')  return (REG.live?.outcomes?.order || []);
    return [];
  };
  const combinedLiveOrder = (state)=>{
    const seq = [];
    if (state.comp)     seq.push(...(REG.live?.comp?.order     || []));
    if (state.context)  seq.push(...(REG.live?.context?.order  || []));
    if (state.peaks)    seq.push(...(REG.live?.peaks?.order    || []));
    if (state.outcomes) seq.push(...(REG.live?.outcomes?.order || []));
    return seq;
  };
  return { orderFor, combinedLiveOrder };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5) Card-Node (Titel/Value/Unit/Secondary + Tooltip/A11y)
// ─────────────────────────────────────────────────────────────────────────────
export function cardNode({ id, title, value, secondary, unit }, locale, mode){
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

// ─────────────────────────────────────────────────────────────────────────────
// 6) Render in Host (Tooltip-Wiring + Style-Klassifizierung)
// ─────────────────────────────────────────────────────────────────────────────
export function renderInto(host, nodes, styleCtl){
  host.innerHTML = '';
  const frag = document.createDocumentFragment();
  nodes.forEach(n => frag.appendChild(n));
  host.appendChild(frag);

  try { Tip.initOnce?.(); Tip.autoWire?.(host); } catch {}
  try { styleCtl?.classify(); styleCtl?.normalizeSecondary?.(); } catch {}
}
