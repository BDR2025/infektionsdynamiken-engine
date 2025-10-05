/*!
 * File:      leq.widget-actions.js
 * Project:   UID-Explore · Living Equation (Core Equation)
 * Role:      Header-Actions: Lesson 1–3 (dyn) + Burger (Display & Didactics)
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-02
 * Version:   1.2.2
 * Changelog:
 *   - v1.2.2  Segmented 1–3 in den dyn-Slot verlegt (links sichtbar). Burger unverändert.
 *   - v1.2.1  Burger-Modelle (getBurgerModel) für Visualisierung & Didaktik; Dropdown entfernt.
 *   - v1.2.0  Bus-Contract (uid:e:leq:view/opts, source:'wa'); Rehydrate/Power-On; i18n (DE/EN).
 */

'use strict';

import * as EBUS from '../../12-1_base/bus.js';
import { mountWidgetActions, presets } from '/uid-e_v1/12-4_support/12-42_widgets/index.js';

/* ───────── helpers: scope ───────── */
function getCard(){
  return document.getElementById('core-equation-widget')
      || document.querySelector('#core-equation')?.closest('.widget')
      || null;
}
function getRoot(){ return document.querySelector('#core-equation'); }

/* ───────── persist ───────── */
const LS = {
  lesson:   'leq:lesson',     // '1'|'2'|'3'
  visual:   'leq:visual',     // 'color'|'mono'|'bold'
  didaktik: 'leq:didaktik',   // '0'|'1'|'2'|'3'
};
const loadState = () => ({
  lesson:   localStorage.getItem(LS.lesson)   || '1',
  visual:   localStorage.getItem(LS.visual)   || 'color',
  didaktik: localStorage.getItem(LS.didaktik) || '1',
});
function persistState(s){
  try { localStorage.setItem(LS.lesson,   s.lesson);   } catch {}
  try { localStorage.setItem(LS.visual,   s.visual);   } catch {}
  try { localStorage.setItem(LS.didaktik, s.didaktik); } catch {}
}

/* ───────── apply + legacy DOM events ───────── */
function applyState(widgetEl, s){
  if (!widgetEl) return;
  const root = getRoot();

  widgetEl.dataset.lesson   = s.lesson;
  widgetEl.dataset.visual   = s.visual;
  widgetEl.dataset.didaktik = s.didaktik;

  if (root){
    const isMono = (s.visual === 'mono' || s.visual === 'bold');
    root.classList.toggle('is-white', isMono);
    root.classList.toggle('is-bold',  s.visual === 'bold');
    ['did-0','did-1','did-2','did-3'].forEach(k => root.classList.remove(k));
    root.classList.add(`did-${s.didaktik}`);
  }

  // Legacy DOM-Events (beibehalten)
  try { widgetEl.dispatchEvent(new CustomEvent('leq:options', { bubbles:true, detail:{ ...s }})); } catch {}
  try { widgetEl.dispatchEvent(new CustomEvent('leq:mode',    { bubbles:true, detail:{ mode:s.lesson }})); } catch {}
}

/* ───────── bus emit (+source:'wa') ───────── */
function emitWA(type, payload){
  const p = (payload && typeof payload === 'object' && !Array.isArray(payload) && !payload.source)
    ? { ...payload, source:'wa' } : payload;
  try { EBUS.emit(type, p); } catch {}
}
function broadcastState(s){
  emitWA('uid:e:leq:view', { lesson: s.lesson });
  emitWA('uid:e:leq:opts', { visual: s.visual, didaktik: s.didaktik });
}

/* ───────── main attach ───────── */
export function attachLEQLessonActions(){
  const widgetEl = getCard();
  if (!widgetEl) return;

  const isDE = (String(document.documentElement.lang||'de').toLowerCase().startsWith('de'));
  const L = isDE ? {
    lessonTitle: 'Lektion',
    visTitle:    'Visualisierung',
    visualColor: 'Farbig',
    visualMono:  'Weiß',
    visualBold:  'Fett',
    didTitle:    'Didaktik',
    did0:        'Aus',
    did1:        'Wenig',
    did2:        'Mittel',
    did3:        'Viel',
    l1: '1 Flow & Balance', l2: '2 Drivers (β/σ/γ)', l3: '3 Timing & Rates'
  } : {
    lessonTitle: 'Lesson',
    visTitle:    'Display',
    visualColor: 'Color',
    visualMono:  'White',
    visualBold:  'Bold',
    didTitle:    'Didactics',
    did0:        'Off',
    did1:        'Low',
    did2:        'Medium',
    did3:        'High',
    l1: '1 Flow & Balance', l2: '2 Drivers (β/σ/γ)', l3: '3 Timing & Rates'
  };

  const state = loadState();
  applyState(widgetEl, state);

  // WA-Spec: Segmented 1–3 **im dyn-Slot** (links sichtbar)
  function buildSpec(){
    return {
      dyn: [
        presets.segmented({
          id: 'uid:e:leq:lesson',
          options: [
            { label:'1', value:'1', title:L.l1 },
            { label:'2', value:'2', title:L.l2 },
            { label:'3', value:'3', title:L.l3 },
          ],
          get: () => (widgetEl.dataset.lesson || state.lesson),
          set: (v) => {
            state.lesson = String(v || '1');
            persistState(state);
            applyState(widgetEl, state);
            broadcastState(state);
            try { ctrl?.update?.(buildSpec()); } catch {}
          }
        })
      ],
      globals: [] // Burger via getBurgerModel
    };
  }

  let ctrl = mountWidgetActions(widgetEl, buildSpec());

  // Burger-Modell: Visualisierung + Didaktik
  function getBurgerModel(){
    const curVis = (widgetEl.dataset.visual   || state.visual);
    const curDid = (widgetEl.dataset.didaktik || state.didaktik);
    return {
      columns: 2,
      sections: [
        { title: L.visTitle, items: [
          { label: L.visualColor, type:'radio', group:'leq-vis', selected: curVis==='color',
            onSelect: ()=> { state.visual='color'; persistState(state); applyState(widgetEl,state); broadcastState(state); try{ ctrl?.update?.(buildSpec()); }catch{} } },
          { label: L.visualMono,  type:'radio', group:'leq-vis', selected: curVis==='mono',
            onSelect: ()=> { state.visual='mono';  persistState(state); applyState(widgetEl,state); broadcastState(state); try{ ctrl?.update?.(buildSpec()); }catch{} } },
          { label: L.visualBold,  type:'radio', group:'leq-vis', selected: curVis==='bold',
            onSelect: ()=> { state.visual='bold';  persistState(state); applyState(widgetEl,state); broadcastState(state); try{ ctrl?.update?.(buildSpec()); }catch{} } },
        ]},
        { title: L.didTitle, items: [
          { label: L.did0, type:'radio', group:'leq-did', selected: curDid==='0',
            onSelect: ()=> { state.didaktik='0'; persistState(state); applyState(widgetEl,state); broadcastState(state); try{ ctrl?.update?.(buildSpec()); }catch{} } },
          { label: L.did1, type:'radio', group:'leq-did', selected: curDid==='1',
            onSelect: ()=> { state.didaktik='1'; persistState(state); applyState(widgetEl,state); broadcastState(state); try{ ctrl?.update?.(buildSpec()); }catch{} } },
          { label: L.did2, type:'radio', group:'leq-did', selected: curDid==='2',
            onSelect: ()=> { state.didaktik='2'; persistState(state); applyState(widgetEl,state); broadcastState(state); try{ ctrl?.update?.(buildSpec()); }catch{} } },
          { label: L.did3, type:'radio', group:'leq-did', selected: curDid==='3',
            onSelect: ()=> { state.didaktik='3'; persistState(state); applyState(widgetEl,state); broadcastState(state); try{ ctrl?.update?.(buildSpec()); }catch{} } },
        ]}
      ]
    };
  }
  try { (widgetEl.__uidWA ||= {}).getBurgerModel = getBurgerModel; } catch {}

  // Rehydrate/Power-On → Zustand anwenden + Bus-Rebroadcast
  function rehydrate(){
    const cur = loadState();
    state.lesson   = cur.lesson;
    state.visual   = cur.visual;
    state.didaktik = cur.didaktik;
    applyState(widgetEl, state);
    broadcastState(state);
    try { ctrl?.update?.(buildSpec()); } catch {}
  }
  try {
    widgetEl.addEventListener('uid:widget:power:on', rehydrate);
    widgetEl.addEventListener('uid:widget:rehydrate', rehydrate);
  } catch {}
}

// Auto-Attach
if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', ()=> attachLEQLessonActions());
} else {
  attachLEQLessonActions();
}

export default attachLEQLessonActions;
