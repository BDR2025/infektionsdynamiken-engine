/*!
 * File:      /12-3_presentation/kpi/common/tooltips.js
 * Project:   UID-Explore · Presentation Layer · KPI Tool — Common
 * Role:      Tooltips für STATIC & LIVE (DE/EN; School/Uni)
 * Type:      Open Educational Resource (OER) · ESM
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-03
 * Version:   3.1.0
 * Changelog:
 *   - v3.1.0  Short-Header vereinheitlicht; Release 3.1.0; keine inhaltlichen Änderungen.
 *   - v3.0.0  Port aus /kpi/tooltips.js nach common/tooltips.js (DE/EN · School/Uni).
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1) Tooltip-Texte (TT)
// ─────────────────────────────────────────────────────────────────────────────
export const TT = {
  school: {
    de: {
      // LIVE – Compartments & Co.
      S_t:'Menschen, die sich noch anstecken können.',
      E_t:'Menschen, die sich angesteckt haben (noch nicht ansteckend).',
      I_t:'Menschen, die aktuell erkrankt und ansteckend sind.',
      R_t:'Menschen, die wieder gesund und dadurch immun sind.',
      t:'Aktuelle Simulationszeit.',
      Reff_t:'Wie viele Menschen eine erkrankte Person jetzt im Durchschnitt ansteckt.',
      Ipeak:'Höchster Wert der Erkrankten.',
      tpeak:'Zeitpunkt des höchsten Werts der Erkrankten.',
      Epeak:'Höchster Wert der Angesteckten.',
      tEpeak:'Zeitpunkt des höchsten Werts der Angesteckten.',
      tHIT:'Ab hier ist der R-Wert höchstens 1 – die Welle flacht ab.',
      Attack:'Anteil aller Menschen, die insgesamt erkrankt sind.',
      // STATIC – rechts im Parameter-Panel
      R0:'R-Wert (Basis): durchschnittliche Ansteckungen ohne Maßnahmen.',
      Reff0:'R-Wert zu Beginn (t=0).',
      HIT:'Schwelle, ab der Rₑff ≤ 1 (Anteil Immuner).',
      T2:'Zeit, bis sich die Fälle verdoppeln (statisch).',
      N:'Gesamtbevölkerung.',
      I0:'Indexfälle zu Beginn.',
      D:'Dauer der Ansteckungsfähigkeit (Tage).',
      L:'Latenzzeit bis zur Ansteckungsfähigkeit (Tage).',
      beta:'Infektionsrate β pro Tag.',
      gamma:'Genesungsrate γ pro Tag.',
      sigma:'Übergangsrate σ pro Tag (E→I).',
      betaEff:'Effektive Infektionsrate β·(1−m).',
      dt:'Zeitschritt Δt (Tage).',
      T:'Gesamtdauer T (Tage).',
      m:'Maßnahmen: Anteil der Reduktion (0–100%).'
    },
    en: {
      S_t:'People who can still get infected.',
      E_t:'People who got infected (not yet infectious).',
      I_t:'People who are currently sick and infectious.',
      R_t:'People who have recovered and are immune.',
      t:'Current simulation time.',
      Reff_t:'How many people one infected person infects now on average.',
      Ipeak:'Highest number of infected.',
      tpeak:'When the highest infected value occurs.',
      Epeak:'Highest number of exposed.',
      tEpeak:'When the highest exposed value occurs.',
      tHIT:'From here R is at most 1 — the wave declines.',
      Attack:'Share of people who ever got infected.',
      R0:'R number (basic): secondary cases without measures.',
      Reff0:'R number at start (t=0).',
      HIT:'Share immune where Rₑff ≤ 1.',
      T2:'Time until cases double (static).',
      N:'Total population.',
      I0:'Index cases at start.',
      D:'Infectious period (days).',
      L:'Latency until infectious (days).',
      beta:'Infection rate β per day.',
      gamma:'Recovery rate γ per day.',
      sigma:'Progression rate σ per day (E→I).',
      betaEff:'Effective infection rate β·(1−m).',
      dt:'Time step Δt (days).',
      T:'Total duration T (days).',
      m:'Measures: reduction share (0–100%).'
    }
  },
  uni: {
    de: {
      S_t:'Suszeptible Bevölkerung zum Zeitpunkt t.',
      E_t:'Exponierte (infiziert, noch nicht infektiös) zum Zeitpunkt t.',
      I_t:'Infektiöse zum Zeitpunkt t.',
      R_t:'Genesene/Entfernte zum Zeitpunkt t.',
      t:'Zeitkoordinate t.',
      Reff_t:'Rₑff(t) = R₀ · (1−m) · S(t)/N.',
      Ipeak:'Maximum von I(t).',
      tpeak:'Zeitpunkt des I-Maximums.',
      Epeak:'Maximum von E(t).',
      tEpeak:'Zeitpunkt des E-Maximums.',
      tHIT:'Erster Zeitpunkt mit Rₑff(t) ≤ 1.',
      Attack:'Finale Attack-Rate 1 − S(T)/N.',
      R0:'Basisreproduktionszahl R₀.',
      Reff0:'Rₑff zu t=0.',
      HIT:'Herdenschutz-Schwelle 1 − 1/R₀.',
      T2:'Verdopplungszeit T₂ (statisch).',
      N:'Population N.',
      I0:'Indexfälle I₀.',
      D:'Infektiöse Dauer D = 1/γ.',
      L:'Latenz L = 1/σ.',
      beta:'Infektionsrate β (/d).',
      gamma:'Genesungsrate γ (/d).',
      sigma:'Übergangsrate σ (/d).',
      betaEff:'βₑff = β·(1−m).',
      dt:'Zeitschritt Δt (d).',
      T:'Horizont T (d).',
      m:'Maßnahmen m (0..1 oder 0..100%).'
    },
    en: {
      S_t:'Susceptible population at time t.',
      E_t:'Exposed (infected, not yet infectious) at time t.',
      I_t:'Infectious at time t.',
      R_t:'Recovered/removed at time t.',
      t:'Time coordinate t.',
      Reff_t:'Rₑff(t) = R₀ · (1−m) · S(t)/N.',
      Ipeak:'Maximum of I(t).',
      tpeak:'Time of I-maximum.',
      Epeak:'Maximum of E(t).',
      tEpeak:'Time of E-maximum.',
      tHIT:'First time with Rₑff(t) ≤ 1.',
      Attack:'Final attack rate 1 − S(T)/N.',
      R0:'Basic reproduction number R₀.',
      Reff0:'Rₑff at t=0.',
      HIT:'Herd immunity threshold 1 − 1/R₀.',
      T2:'Doubling time T₂ (static).',
      N:'Population N.',
      I0:'Index cases I₀.',
      D:'Infectious period D = 1/γ.',
      L:'Latency L = 1/σ.',
      beta:'Infection rate β (/d).',
      gamma:'Recovery rate γ (/d).',
      sigma:'Progression rate σ (/d).',
      betaEff:'βₑff = β·(1−m).',
      dt:'Time step Δt (d).',
      T:'Horizon T (d).',
      m:'Measures m (0..1 or 0..100%).'
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2) Public API
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Liefert den Tooltip-Text für eine KPI-ID in passender Sprache/Didaktik.
 * @param {string} id     KPI-Schlüssel (z. B. 'R0', 'Ipeak', 'Reff_t')
 * @param {string} locale 'de' | 'en'
 * @param {string} mode   'school' | 'university'
 * @returns {string}
 */
export function kpiTooltip(id, locale='de', mode='university') {
  const L = (String(locale).toLowerCase().startsWith('de')) ? 'de' : 'en';
  const M = (String(mode).toLowerCase()==='school') ? 'school' : 'uni';
  return TT[M][L][id] || '';
}
