/*!
 * File:      /12-3_presentation/kpi/key/index.js
 * Project:   UID-Explore · Presentation Layer · KPI Tool — KEY Deck
 * Role:      Mountet das Key KPI Widget (2-Spalten, statisches Deck): Header/Actions, Style-Guard, Bus→DOM
 * Type:      Open Educational Resource (OER) · ESM
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-04
 * Version:   3.2.0
 * Changelog:
 *   - v3.2.0  Focus-Tooltips für KPI-Cards (scoped) via bindCardFocusTips(deck).
 *   - v3.1.0  KSPLIT-1: Orchestrierung verschlankt; Renderer ausgelagert (./renderer.js); forceCols:2; Bus→DOM.
 */

import { mountKeyKPIActions } from './kpi.key.widget-actions.js';
import { mountKeyKPIDeck }    from './renderer.js';
import attachKPIStyle         from '../common/style/controller.js';
import * as bus               from '../../../12-1_base/bus.js';
// NEU: Focus-Tooltips für Cards
import { bindCardFocusTips }  from '/uid-e_v1/12-4_support/12-42_widgets/tips.js';

// ─────────────────────────────────────────────────────────────────────────────
// 1) DOM-Helpers
// ─────────────────────────────────────────────────────────────────────────────
function ensureWidgetBody(root){
  let body = root.querySelector('.widget-body');
  if (!body){ body = document.createElement('div'); body.className = 'widget-body'; root.appendChild(body); }
  return body;
}
function ensureHeader(root, title){
  let header = root.querySelector('.widget-header');
  if (header) return header;
  header = document.createElement('div'); header.className = 'widget-header';
  const hTitle   = document.createElement('div'); hTitle.className   = 'widget-title';       hTitle.textContent = title || 'Key KPI';
  const hActions = document.createElement('div'); hActions.className = 'widget-actions-slot';
  header.appendChild(hTitle); header.appendChild(hActions);
  root.insertBefore(header, root.firstChild);
  return header;
}
function headerActionsSlot(header){
  return header.querySelector('.widget-actions-slot') || header;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2) Public Mount
// ─────────────────────────────────────────────────────────────────────────────
export async function mountKeyKPI(root, opts = {}) {
  if (!root) return;

  if (!root.classList.contains('widget')) root.classList.add('widget');
  root.classList.add('widget-kpi','widget-keykpi');

  // Body & Header
  const body   = ensureWidgetBody(root);
  try { attachWidgetHeader(root, { id:'keykpi', title: opts.title || 'Key KPI' }); } catch {}
  const header = ensureHeader(root, opts.title || 'Key KPI');

  // Actions (Digits/Burger)
  const actionsHost = headerActionsSlot(header);
  await mountKeyKPIActions(actionsHost, opts.actions || {});

  // Deck-Container
  let deck = body.querySelector('.kpi-deck');
  if (!deck){
    deck = document.createElement('div');
    deck.className = 'kpi-deck';
    deck.setAttribute('data-kind', 'static');
    body.appendChild(deck);
  }

  // Kontext
  const lang  = document.documentElement?.lang || 'de';
  const model = document.documentElement?.getAttribute('data-model') || 'SIR';

  // Style-Guard: KEY = 2 Spalten
  const widgetRoot = root.closest('.widget.widget-kpi') || root;
  if (!widgetRoot.hasAttribute('data-format'))  widgetRoot.setAttribute('data-format','hybrid');
  if (!widgetRoot.hasAttribute('data-reduced')) widgetRoot.setAttribute('data-reduced','false');
  const styleCtl = attachKPIStyle(widgetRoot, { auto:false, forceCols:2 });

  // Bus → DOM (Replay)
  bus.on('uid:keykpi:view:format', ({ mode }) => {
    const m = (mode === 'pct' || mode === 'abs') ? mode : 'hybrid';
    widgetRoot.setAttribute('data-format', m);
    try { styleCtl?.classify(); } catch {}
  }, { replay:true });

  bus.on('uid:keykpi:view:reduced', ({ on }) => {
    widgetRoot.setAttribute('data-reduced', on ? 'true' : 'false');
    try { styleCtl?.classify(); } catch {}
  }, { replay:true });

  bus.on('uid:keykpi:enabled', ({ on }) => {
    widgetRoot.setAttribute('data-widget-enabled', on ? 'true' : 'false');
  }, { replay:true });

  // Deck starten (nach Style)
  await mountKeyKPIDeck(deck, { lang, model });

  // NEU: Focus-Tooltips für KPI-Cards (Maus bleibt unverändert)
  try { bindCardFocusTips(deck, { selector: '.kpi-card, .kpi, .card, [data-kpi]' }); } catch {}
}

export default { mountKeyKPI };
