/*! 
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Input Layer · Parameter Tool · Formulas
 * File:     /formulas/index.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-01
 * Updated:  2025-10-03
 * Version:  6.1.0
 * Changelog:
 *   - v6.1.0 Live-Wiring: Formeln hören nativ auf 'uid:e:model:update' und
 *             'uid:e:sim:data' (plus Pointer), inkl. Initial-Replay. Keine DOM-/Strukturänderung.
 *   - v6.0.0 Modularisierung: Aufspaltung in config, styles, templates, dom,
 *             initial, runtime, events, math. Public API stabilisiert
 *             (mountFormulaRenderer(container)).
 *
 * eAnnotation:
 *   Facade-Datei des Formeln-Panels (keine Geschäftslogik).
 *   Aufgaben:
 *     • Styles injizieren
 *     • Flags lesen (Order/Flat/Sigma)
 *     • Cards bauen (Chain/Pair)
 *     • Initial-Render (Chains/Derived)
 *     • Math typeset (einmalig)
 *     • Events verdrahten (Mark/Pulse, Pointer)
 *     • Live-Bus-Wiring (MODEL/SIM/POINTER) → renderNumbers()
 *     • Öffentliche API: updateModel/updateSim/dispose
 */

import * as bus from '../../../12-1_base/bus.js';
import { getFlags } from './config.js';
import { inject } from './styles.js';
import { makeCardChain, makeCardPair } from './dom.js';
import { renderChainsOnce, renderDerivedOnce } from './initial.js';
import { renderNumbers } from './runtime.js';
import { wireMarkPulse, wirePointerActive } from './events.js';
import { typesetOnce } from './math.js';

/**
 * Mount the Formula Renderer (Facade)
 * @param {HTMLElement} container - Host element for the formulas panel
 * @returns {{updateModel: Function, updateSim: Function, dispose: Function}}
 */
export function mountFormulaRenderer(container){
  if (!container) throw new Error('[formulas] host container missing');
  const HOST = container;

  // 1) Styles
  inject();

  // 2) Flags
  const flags = getFlags(HOST);

  // 3) Cards (DOM)
  const cards = flags.order.slice();
  HOST.innerHTML = `<div class="fe-panel${flags.flat ? ' pt-flat' : ''}">`
    + cards.map(k=>{
        if (k === 'beta_eff') {
          return makeCardPair('fe-be', String.raw`\\beta_{\\text{eff}} = \\beta \\cdot (1-m)`);
        }
        if (k === 'R_eff_t') {
          return makeCardPair('fe-ret', String.raw`R_{\\text{eff}}(t) = R_0(1-m)\\cdot S/N`);
        }
        if (k === 'R_eff_0') {
          return makeCardPair('fe-re0', String.raw`R_{\\text{eff}}(0) = R_0(1-m)\\cdot S_0/N`);
        }
        return makeCardChain(
          k==='D'     ? 'fe-D'   :
          k==='R0'    ? 'fe-R0'  :
          k==='beta'  ? 'fe-beta':
          k==='gamma' ? 'fe-g'   :
          k==='sigma' ? 'fe-sigma': ''
        );
      }).join('') + `</div>`;

  // 4) Initial-Render (TeX rein)
  renderChainsOnce(HOST);
  renderDerivedOnce(HOST);

  // 5) State-Cache & erster Zahlen-Render (mit Replay)
  let lastModel = bus.getLast?.('uid:e:model:update') || null;
  let lastSim   = bus.getLast?.('uid:e:sim:data')     || null;

  // Erst typesetten, dann Zahlen malen (nutzt lastModel/lastSim)
  typesetOnce(HOST.querySelectorAll('.fe-chain, .fe-sym, .fe-num'))
    .then(()=>{ renderNumbers(HOST, lastModel, lastSim); })
    .catch(()=>{ /* silent fallback: Zahlen folgen bei erstem updateModel/updateSim */ });

  // 6) Events (Mark/Pulse + Pointer-Highlight)
  const offBus = wireMarkPulse(HOST);
  const offPtr = wirePointerActive(HOST);

  // 7) Live-Wiring: MODEL/SIM/POINTER → renderNumbers()
  const offLiveModel = bus.on?.('uid:e:model:update', (m)=>{
    lastModel = m;
    renderNumbers(HOST, lastModel, lastSim);
  }, { replay:false });

  const offLiveSim = bus.on?.('uid:e:sim:data', (s)=>{
    lastSim = s;
    renderNumbers(HOST, lastModel, lastSim);
  }, { replay:false });

  const offLivePtr = bus.on?.('uid:e:sim:pointer', ()=>{
    // Pointerwechsel beeinflusst z. B. R_eff(t); Model/Sim unverändert → neu zeichnen
    renderNumbers(HOST, lastModel, lastSim);
  }, { replay:false });

  // 8) Public API (kompatibel)
  function updateModel(m){ lastModel = m; renderNumbers(HOST, lastModel, lastSim); }
  function updateSim(s){   lastSim   = s; renderNumbers(HOST, lastModel, lastSim); }

  function dispose(){
    try { offBus && offBus(); } catch(_){}
    try { offPtr && offPtr(); } catch(_){}
    try { offLiveModel && offLiveModel(); } catch(_){}
    try { offLiveSim && offLiveSim(); } catch(_){}
    try { offLivePtr && offLivePtr(); } catch(_){}
    HOST.innerHTML = '';
  }

  return { updateModel, updateSim, dispose };
}
