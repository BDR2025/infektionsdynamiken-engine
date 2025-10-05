/*! 
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Input Layer · Parameter Tool · Formulas
 * File:     /parameters/formulas/initial.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-01
 * Updated:  2025-10-01
 * Version:  6.0.0
 * Changelog:
 *   - v6.0.0 Initialrender ausgelagert (Chains + Derived mit Platzhaltern)
 *
 * eAnnotation:
 *   Schreibt die TeX-Ketten (Slider-Parameter) und abgeleiteten Zeilen initial in die Slots.
 *   Nutzt nur Strings/DOM – kein Typeset; das übernimmt später der Math-Adapter.
 */

import { rowNum, chain_D, chain_R0, chain_beta, chain_gamma, chain_sigma } from './templates.js';

/** Platzhalter (DE-Format) für das Initialrendering */
const PH = {
  r0:    '3,000',
  beta:  '0,5000',
  gamma: '0,2000',
  D:     '5,0',
  L:     '4,0',
  sigma: '0,2500',
  mPct:  '0,0',   // Measures in %
  frac:  '1,000'  // S/N
};

/**
 * Schreibt die einzeiligen Ketten für Slider-Parameter in ihre .fe-chain-Slots.
 * Erwartet Karten mit IDs: fe-D, fe-R0, fe-beta, fe-g, optional fe-sigma.
 */
export function renderChainsOnce(HOST){
  if (!HOST) return;

  const slotD   = HOST.querySelector('#fe-D .fe-chain');
  const slotR0  = HOST.querySelector('#fe-R0 .fe-chain');
  const slotB   = HOST.querySelector('#fe-beta .fe-chain');
  const slotG   = HOST.querySelector('#fe-g .fe-chain');
  const slotSig = HOST.querySelector('#fe-sigma .fe-chain');

  if (slotD)   slotD.textContent   = `$${chain_D(PH.gamma, PH.D)}$`;
  if (slotR0)  slotR0.textContent  = `$${chain_R0(PH.beta, PH.gamma, PH.r0)}$`;
  if (slotB)   slotB.textContent   = `$${chain_beta(PH.r0, PH.gamma, PH.beta)}$`;
  if (slotG)   slotG.textContent   = `$${chain_gamma(PH.beta, PH.r0, PH.gamma)}$`;
  if (slotSig) slotSig.textContent = `$${chain_sigma(PH.L, PH.sigma)}$`;
}

/**
 * Schreibt die abgeleiteten Zahlenzeilen (beta_eff, R_eff_t, R_eff_0) in ihre .fe-num-Slots.
 * Nutzt Klassen (fev-*) für spätere Live-Updates ohne Re-Typeset.
 */
export function renderDerivedOnce(HOST){
  if (!HOST) return;

  const be = HOST.querySelector('#fe-be .fe-num');
  if (be){
    be.textContent = `$${rowNum(
      String.raw`\class{fe-prod}{\class{fev-be-beta}{\text{${PH.beta}}}\cdot\bigl(1-\class{fev-be-m}{\text{${PH.mPct}}}\;\%\bigr)}`,
      String.raw`\class{fe-res}{\class{fev-be-val fe-var fe-beff}{\text{${PH.beta}}}}\;\class{fe-res-unit}{\mathrm{d}^{-1}}`
    )}$`;
  }

  const ret = HOST.querySelector('#fe-ret .fe-num');
  if (ret){
    ret.textContent = `$${rowNum(
      String.raw`\class{fe-prod}{\class{fev-ret-r0}{\text{${PH.r0}}}\cdot\bigl(1-\class{fev-ret-m}{\text{${PH.mPct}}}\;\%\bigr)\cdot\class{fev-ret-frac}{\text{${PH.frac}}}}`,
      String.raw`\class{fe-res}{\class{fev-ret-val}{\text{${PH.r0}}}}`
    )}$`;
  }

  const re0 = HOST.querySelector('#fe-re0 .fe-num');
  if (re0){
    re0.textContent = `$${rowNum(
      String.raw`\class{fe-prod}{\class{fev-re0-r0}{\text{${PH.r0}}}\cdot\bigl(1-\class{fev-re0-m}{\text{${PH.mPct}}}\;\%\bigr)\cdot\class{fev-re0-s0f}{\text{1,000}}}`,
      String.raw`\class{fe-res}{\class{fev-re0-val}{\text{${PH.r0}}}}`
    )}$`;
  }
}
