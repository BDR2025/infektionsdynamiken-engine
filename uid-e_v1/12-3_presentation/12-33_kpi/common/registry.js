/*!
 * File:      /12-3_presentation/kpi/common/registry.js
 * Project:   UID-Explore · Presentation Layer · KPI Tool — Common
 * Role:      Registry (Labels & Orders) für STATIC, LIVE und KEY KPIs
 * Type:      Open Educational Resource (OER) · ESM
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-03
 * Version:   3.1.0
 * Changelog:
 *   - v3.1.0  KEY-Gruppen ergänzt; einheitliche Registry für LIVE & KEY; Labels DE/EN konsolidiert; Short-Header.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1) Versions-Tag (optional für Diagnostik)
// ─────────────────────────────────────────────────────────────────────────────
export const KPI_REGISTRY_VERSION = '3.1.0';

// ─────────────────────────────────────────────────────────────────────────────
// 2) Labels (DE/EN)
// ─────────────────────────────────────────────────────────────────────────────
const LABELS_DE = {
  // Static / Parameters
  N:       'Population',
  I0:      'Indexfälle I₀',
  R0:      'R₀',
  beta:    'β [1/d]',
  gamma:   'γ [1/d]',
  D:       'D [d]',
  sigma:   'σ [1/d]',
  L:       'L [d]',
  m:       'Maßnahmen',
  dt:      'Δt [d]',
  T:       'Dauer T [d]',
  Reff0:   'Rₑff(0)',
  HIT:     'Herdenschutz-Schwelle',
  betaEff: 'β_eff [1/d]',
  T2:      'Verdopplungszeit T₂',

  // Live
  t:       'Zeit',
  S_t:     'S(t)',
  E_t:     'E(t)',
  I_t:     'I(t)',
  R_t:     'R(t)',
  Ipeak:   'I-Peak',
  Epeak:   'E-Peak',
  tpeak:   't(I-Peak)',
  tEpeak:  't(E-Peak)',
  Reff_t:  'Rₑff(t)',
  Attack:  'Attack Rate',
  tHIT:    't(Herdenschutz)'
};

const LABELS_EN = {
  // Static / Parameters
  N:       'Population',
  I0:      'Index cases I₀',
  R0:      'R₀',
  beta:    'β [1/d]',
  gamma:   'γ [1/d]',
  D:       'D [d]',
  sigma:   'σ [1/d]',
  L:       'L [d]',
  m:       'Measures',
  dt:      'Δt [d]',
  T:       'Duration T [d]',
  Reff0:   'Rₑff(0)',
  HIT:     'Herd immunity threshold',
  betaEff: 'β_eff [1/d]',
  T2:      'Doubling time T₂',

  // Live
  t:       'Time',
  S_t:     'S(t)',
  E_t:     'E(t)',
  I_t:     'I(t)',
  R_t:     'R(t)',
  Ipeak:   'I-peak',
  Epeak:   'E-peak',
  tpeak:   't(I-peak)',
  tEpeak:  't(E-peak)',
  Reff_t:  'Rₑff(t)',
  Attack:  'Attack rate',
  tHIT:    't(Herd immunity)'
};

// ─────────────────────────────────────────────────────────────────────────────
// 3) Label-Helper
// ─────────────────────────────────────────────────────────────────────────────
function labelMap(locale='de'){
  const l = String(locale||'de').toLowerCase();
  return l.startsWith('de') ? LABELS_DE : LABELS_EN;
}

/** Öffentliche Label-Funktion (Fallback: ID) */
export function kpiLabel(id, locale='de'){
  const map = labelMap(locale);
  return map[id] || id;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4) Anzeige-Reihenfolgen (STATIC, LIVE, KEY)
// ─────────────────────────────────────────────────────────────────────────────
function staticOrder(model='SIR'){
  return [
    'R0','beta','gamma','D','sigma','L','m',
    'N','I0','T','dt',
    'Reff0','HIT','betaEff','T2'
  ];
}

function liveOrderGroups(model='SIR', mode='university'){
  return {
    comp:     { order: (model==='SEIR' ? ['S_t','E_t','I_t','R_t'] : ['S_t','I_t','R_t']) },
    context:  { order: ['t','Reff_t'] },
    peaks:    { order: (model==='SEIR' ? ['Ipeak','tpeak','Epeak','tEpeak'] : ['Ipeak','tpeak']) },
    outcomes: { order: ['Attack','tHIT'] }
  };
}

function keyOrderGroups(model='SIR'){
  return {
    goal:  { order: ['HIT','T2','Reff0','Attack'] },
    model: { order: ['R0','beta','gamma','sigma','D','L'] },
    sim:   { order: ['N','I0','T','dt'] },
    synth: { order: (model==='SEIR' ? ['Ipeak','tpeak','Epeak','tEpeak','tHIT'] : ['Ipeak','tpeak','tHIT']) }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5) Registry-Factory (Public API)
// ─────────────────────────────────────────────────────────────────────────────
export function getRegistry(model='SIR', locale='de', mode='university'){
  const m = String(model||'SIR').toUpperCase();
  const l = String(locale||'de');
  const x = String(mode||'university').toLowerCase();

  const staticCfg = { order: staticOrder(m), autoShowWhenSliderMissing: true };

  return {
    locale: l,
    mode: x,
    model: m,
    labels: labelMap(l),
    static: staticCfg,
    live:   liveOrderGroups(m, x),
    ...keyOrderGroups(m)
  };
}
