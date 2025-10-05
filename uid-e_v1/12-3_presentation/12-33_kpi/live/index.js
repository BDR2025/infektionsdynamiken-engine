/*!
 * File:      /12-3_presentation/kpi/live/index.js
 * Project:   UID-Explore · Presentation Layer · KPI Tool — LIVE Deck
 * Role:      Entry/Orchestrierung des Live KPI Widgets (4-Spalten, dynamisches Deck)
 * Type:      Open Educational Resource (OER) · ESM
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-03
 * Version:   3.1.0
 * Changelog:
 *   - v3.1.0  Split & Cleanup: Orchestrierung verschlankt; View-/Style-/Order-Hilfen in live/view.js.
 *             Imports auf common/* vereinheitlicht; LIVE autoritativ (forceCols:4).
 *             Default-Header-Title auf „Live KPIs“ korrigiert (vorher „Key KPIs“).
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1) Imports
// ─────────────────────────────────────────────────────────────────────────────
import * as bus from '../../../12-1_base/bus.js';
import { getRegistry, kpiLabel }                    from '../common/registry.js';
import { makeContext, STATIC, LIVE, setLiveFormat } from '../common/compute/index.js';
import {
  ensureBody, ensureHeader, headerActionsSlot,
  mountStyleGuard, makeOrderHelpers, cardNode, renderInto
} from './view.js';

// ─────────────────────────────────────────────────────────────────────────────
// 2) Public Mount
// ─────────────────────────────────────────────────────────────────────────────
export function mountKPI(hostId, opts = {}) {
  const host = document.getElementById(hostId);
  if (!host) return () => {};

  // 2.1) Deck-Kind & Style-Guard
  const deckId = opts.deckId || 'static'; // 'static' | 'live' | 'live-comp' | 'live-context' | 'live-peaks' | 'live-outcomes'
  host.classList.add('kpi-deck');
  host.dataset.kind = deckId.startsWith('live') ? 'live' : 'static';

  const widgetRoot = host.closest('.widget.widget-kpi') || host;
  const styleCtl   = mountStyleGuard(widgetRoot, 4); // LIVE → 4 Spalten

  // 2.2) Kontext (HTML-Attrs, Registry, Formatter)
  const html   = document.documentElement;
  const model  = (html.dataset.model || 'SIR').toUpperCase();
  const mode   = (html.dataset.mode  || 'university').toLowerCase();
  const locale = (html.lang || 'de');

  const REG    = getRegistry(model, locale, mode);
  const ctx    = makeContext(locale);

  // 2.3) DOM (Body, Header, Actions-Slot)
  const body   = ensureBody(widgetRoot);
  const header = ensureHeader(widgetRoot, opts.title || 'Live KPIs');
  headerActionsSlot(header); // Hook für künftige Header-Tools

  // 2.4) Gruppen-State (persistiert)
  const groupState = { comp:true, context:true, peaks:(mode==='university'), outcomes:false };
  const PKEY = `uid:kpi:groups:${host.id || 'live'}`;
  try { Object.assign(groupState, JSON.parse(localStorage.getItem(PKEY) || '{}')); } catch {}
  const saveGroups = ()=>{ try{ localStorage.setItem(PKEY, JSON.stringify(groupState)); }catch{} };

  // 2.5) Cache & Ordnungen
  let lastModel=null, lastSim=null, lastPtr=null, renderedControls=new Set();
  const { orderFor, combinedLiveOrder } = makeOrderHelpers(REG);

  // Sichtbarkeit statischer KPIs dynamisch abhängig von vorhandenen Slidern
  const STATIC_TO_PARAM = { R0:'R0', beta:'beta', gamma:'gamma', D:'D', N:'N', I0:'I0', m:'measures', dt:'dt', T:'T', sigma:'sigma', L:'sigma' };
  const shouldShowStatic = (id)=>{
    if (deckId !== 'static') return true;
    if (!REG.static?.autoShowWhenSliderMissing) return true;
    const param = STATIC_TO_PARAM[id];
    if (!param) return true;
    return !renderedControls.has(param);
  };
  const effectiveStaticOrder = ()=> orderFor('static').filter(id => shouldShowStatic(id));
  const liveParams = ()=>{
    const p = Object.assign({}, lastSim || {}, lastSim?.series ? {} : {}, lastModel || {});
    if ((p.N==null || isNaN(p.N)) && lastSim?.N != null) p.N = lastSim.N;
    return p;
  };

  // 2.6) Render-Funktionen
  const renderStatic = ()=>{
    if (!lastModel) return renderInto(host, [], styleCtl);
    const ord = effectiveStaticOrder();
    const nodes = ord.map(id => {
      const fn = STATIC[id]; if (!fn) return null;
      const { value, unit, secondary } = fn({ p:lastModel, fmt: ctx.fmt });
      return cardNode({ id, title:kpiLabel(id, locale), value, secondary, unit }, locale, mode);
    }).filter(Boolean);
    renderInto(host, nodes, styleCtl);
  };

  const renderLiveSingle = (kind)=>{
    const s   = lastSim?.series || {};
    const p   = liveParams();
    const ord = orderFor(kind);
    const nodes = ord.map(id => {
      const fn = LIVE[id]; if (!fn) return null;
      const { value, unit, secondary } = fn({ p, s, ptr:lastPtr, fmt: ctx.fmt });
      return cardNode({ id, title:kpiLabel(id, locale), value, secondary, unit }, locale, mode);
    }).filter(Boolean);
    renderInto(host, nodes, styleCtl);
  };

  const renderLiveAgg = ()=>{
    const s   = lastSim?.series || {};
    const p   = liveParams();
    const ord = combinedLiveOrder(groupState);
    const nodes = ord.map(id => {
      const fn = LIVE[id]; if (!fn) return null;
      const { value, unit, secondary } = fn({ p, s, ptr:lastPtr, fmt: ctx.fmt });
      return cardNode({ id, title:kpiLabel(id, locale), value, secondary, unit }, locale, mode);
    }).filter(Boolean);
    renderInto(host, nodes, styleCtl);
  };

  // 2.7) Initial-Placeholder
  const initOrder = (deckId === 'static')
    ? effectiveStaticOrder()
    : (deckId === 'live' ? combinedLiveOrder(groupState) : orderFor(deckId));
  renderInto(host, initOrder.map(id => cardNode({ id, title:kpiLabel(id, locale), value:'—', unit:'' }, locale, mode)), styleCtl);

  // 2.8) Subscriptions
  const offModel = bus.on('uid:e:model:update', payload => {
    lastModel = payload;
    if (deckId === 'static') renderStatic();
    else renderDeck();
  });

  const offSim = bus.on('uid:e:sim:data', payload => {
    lastSim = payload;
    if (deckId !== 'static') renderDeck();
  });

  const offPtr = bus.on?.('uid:e:sim:pointer', payload => {
    lastPtr = payload;
    if (deckId !== 'static') renderDeck();
  }) || (()=>{});

  const offControls = bus.on?.('uid:e:ui:controls', e => {
    try { renderedControls = new Set(e?.rendered || []); } catch {}
    if (deckId === 'static') renderStatic();
  }) || (()=>{});

  const normFormat=(v)=>{
    const s=String(v||'').toLowerCase();
    if(['pct','percent','rel','relativ'].includes(s)) return 'pct';
    if(['abs','absolut','absolute'].includes(s))     return 'abs';
    if(['hybrid','mix'].includes(s))                 return 'hybrid';
    return '';
  };

  const offFmt = bus.on?.('uid:kpi:view:format', e => {
    try { setLiveFormat(e?.mode); } catch {}
    const f = normFormat(e?.mode || e?.format);
    if (f) { widgetRoot.setAttribute('data-format', f); }
    if (deckId !== 'static') renderDeck();
  }) || (()=>{});

  const offReduced = bus.on?.('uid:kpi:view:reduced', e => {
    const on = typeof e?.on === 'boolean' ? e.on
             : typeof e?.enabled === 'boolean' ? e.enabled
             : Boolean(e?.value);
    widgetRoot.setAttribute('data-reduced', String(on));
  }) || (()=>{});

  const offGroup = bus.on?.('uid:kpi:group:set', e => {
    if (deckId !== 'live') return;
    if (!e || !e.id) return;
    const map = { comp:'comp', context:'context', peaks:'peaks', outcomes:'outcomes' };
    const gid = map[e.id]; if (!gid) return;
    if (typeof e.on === 'boolean') groupState[gid] = e.on;
    saveGroups(); renderLiveAgg();
  }) || (()=>{});

  const offDeckCompat = bus.on?.('uid:kpi:deck:toggle', e => {
    if (deckId !== 'live') return;
    const map = { comp:'comp', tx:'context', peaks:'peaks', outcomes:'outcomes' };
    const gid = map[e?.id]; if (!gid) return;
    if (typeof e.on === 'boolean') groupState[gid] = e.on;
    saveGroups(); renderLiveAgg();
  }) || (()=>{});

  // 2.9) Render-Dispatcher & Dispose
  function renderDeck(){
    if (deckId === 'static') return renderStatic();
    if (deckId === 'live')   return renderLiveAgg();
    return renderLiveSingle(deckId);
  }

  return function dispose(){
    try { offModel && offModel(); } catch {}
    try { offSim && offSim(); } catch {}
    try { offPtr && offPtr(); } catch {}
    try { offControls && offControls(); } catch {}
    try { offFmt && offFmt(); } catch {}
    try { offReduced && offReduced(); } catch {}
    try { offGroup && offGroup(); } catch {}
    try { offDeckCompat && offDeckCompat(); } catch {}
  };
}
