/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Input Layer · Parameter Tool (classic → WA-konform + UI-Gating)
 * File:     /parameters/pt.widget-actions.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Updated:  2025-10-02
 * Version:  7.1.0
 * Changelog:
 *   - v7.1.0  WA-konform (presets.segmented) + Sichtbarkeitsfilter ohne Accordion:
 *             showGroupOnly(widgetEl, 'learning'|'model'|'simulation') setzt hidden/aria-hidden,
 *             deaktiviert Form-Controls der ausgeblendeten Gruppen; Replay & Cleanup.
 *   - v7.0.0  Migration auf globale WA-Schicht (presets.segmented, mountWidgetActions), reine Bus-Events.
 */

'use strict';

import * as EBUS from '../../12-1_base/bus.js';
import { mountWidgetActions, presets } from '/uid-e_v1/12-4_support/12-42_widgets/index.js';

// Mappings 1/2/3 ↔ Slot
const DIGITS = [
  { d:'1', slot:'learning',   titleDE:'Lernen',     titleEN:'Learning'   },
  { d:'2', slot:'model',      titleDE:'Modell',     titleEN:'Model'      },
  { d:'3', slot:'simulation', titleDE:'Simulation', titleEN:'Simulation' }
];
const SLOT_SET = new Set(['learning','model','simulation']);

// ---------- kleine CSS-Garantie: [hidden]{display:none} ----------
(function ensureHiddenRule(){
  if (document.getElementById('pt-hidden-style')) return;
  const st = document.createElement('style');
  st.id = 'pt-hidden-style';
  st.textContent = `[hidden]{display:none !important}`;
  document.head.appendChild(st);
})();

// ---------- Sichtbarkeitsfilter (ohne Accordion) ----------
function collectSections(root){
  // Wir akzeptieren verschiedene Wrapper – Hauptsache: data-group trägt learning/model/simulation
  const all = root.querySelectorAll('[data-group]');
  const sections = [];
  all.forEach(el => {
    const g = String(el.getAttribute('data-group') || '').toLowerCase();
    if (SLOT_SET.has(g)) sections.push(el);
  });
  return sections;
}
function toggleDisabled(scope, on){
  // Eingaben deaktivieren, damit sie im ausgeblendeten Zustand nicht fokussierbar sind
  scope.querySelectorAll('input, select, textarea, button').forEach(n=>{
    try { n.disabled = on; } catch {}
  });
}
function showGroupOnly(widgetEl, slot){
  const sections = collectSections(widgetEl);
  if (!sections.length) return; // falls keine Gruppierung -> nichts verändern
  sections.forEach(el=>{
    const g = String(el.getAttribute('data-group') || '').toLowerCase();
    const show = (g === slot);
    try { el.hidden = !show; } catch {}
    try { el.setAttribute('aria-hidden', show ? 'false' : 'true'); } catch {}
    toggleDisabled(el, !show);
  });
}

// ---------- Actions ----------
export function mountPTClassicActions(widgetEl, opts = {}) {
  if (!widgetEl) throw new Error('[pt.widget-actions] widgetEl missing');

  // i18n
  const isDE = String(document.documentElement.lang || 'de').toLowerCase().startsWith('de');

  // Persistenz
  const PKEY = String(opts.storageKey || 'uid:pt:classic:slot');
  const load = () => { try { return String(localStorage.getItem(PKEY) || 'model'); } catch { return 'model'; } };
  const save = v   => { try { localStorage.setItem(PKEY, v); } catch {} };

  // State
  let slot = SLOT_SET.has(load()) ? load() : 'model';

  // Emit-Wrapper: default source:'wa' (nicht überschreiben)
  const emit = (ev, payload) => {
    const p = (payload && typeof payload === 'object' && !Array.isArray(payload) && !payload.source)
      ? { ...payload, source: 'wa' } : payload;
    try { EBUS.emit(ev, p); } catch {}
  };

  // Helpers
  const toDigit = s => (DIGITS.find(x => x.slot === s)?.d || '2');
  function setSlot(next){
    if (!SLOT_SET.has(next) || next === slot) return;
    slot = next; save(slot);
    // UI-Gating lokal
    showGroupOnly(widgetEl, slot);
    // Bus-Event (externe Hörer)
    emit('uid:e:controls:segment', { slot, group: slot });
  }

  // WA-Spec (exklusiver Segmented 1/2/3)
  function buildSpec(){
    const options = DIGITS.map(({ d, titleDE, titleEN }) => ({
      label: d, value: d, title: isDE ? titleDE : titleEN
    }));
    return {
      dyn: [presets.segmented({
        id: 'uid:e:controls:segment',
        options,
        get: () => toDigit(slot),
        set: (v) => {
          const ent = DIGITS.find(x => x.d === String(v));
          if (ent) setSlot(ent.slot);
          ctrl?.update?.(buildSpec());
        }
      })],
      globals: []
    };
  }

  // Mount
  let ctrl = mountWidgetActions(widgetEl, buildSpec(), { debug:false });

  // Initial UI-Gating + Bus-Init
  showGroupOnly(widgetEl, slot);
  emit('uid:e:controls:segment', { slot, group: slot, __via:'init' });

  // Replay → UI sync (falls andere Komponenten Slot setzen)
  const off = EBUS.on?.('uid:e:controls:segment', e => {
    const next = String(e?.slot || e?.group || '').toLowerCase();
    if (SLOT_SET.has(next) && next !== slot) {
      slot = next; save(slot);
      showGroupOnly(widgetEl, slot);
      ctrl?.update?.(buildSpec());
    }
  }, { replay:true }) || (()=>{});

  return {
    dispose(){
      try { off(); } catch {}
      try { ctrl?.dispose?.(); } catch {}
    }
  };
}

export default { mountPTClassicActions };
