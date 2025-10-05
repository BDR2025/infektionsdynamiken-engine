/*! 
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Input Layer · Parameter Tool · Controls
 * File:     /parameters/controls/config.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-01
 * Updated:  2025-10-01
 * Version:  6.0.0
 * Changelog:
 *   - v6.0.0 Sichtbarkeiten & Gruppen (learning/model/simulation) ausgelagert
 *
 * eAnnotation:
 *   Liefert sichtbare Parameterlisten und Gruppenzuordnung für das Classic-Panel.
 *   Leitet sich aus mode/model und optionalem data-school-sim am <html> ab; Titel sind überschreibbar.
 */

/** Default-Titel (DE) – bei Bedarf via opts.titles überschreiben */
const DEFAULT_TITLES = {
  learning:   'Lernzielparameter',
  model:      'Modellparameter',
  simulation: 'Simulationsparameter'
};

const EXTRAS_BY_MODEL = {
  SEIR:  ['sigma'],
  SIRD:  ['mu'],
  SIRV:  ['nu'],
  SIS:   []
};

function truthy(v){ return v === '' || v === '1' || v === 'true'; }

/**
 * Sichtbarkeit & Gruppen für Classic-Panel ermitteln.
 * @param {{container: HTMLElement, opts?: any}} param0
 * @returns {{visible:string[], groups:{learning:Set<string>,model:Set<string>,simulation:Set<string>}, titles: {learning:string,model:string,simulation:string}}}
 */
export function getControlsConfig({ container, opts = {} }){
  const html   = document.documentElement;
  const mode   = (html.getAttribute('data-mode')  || 'university').toLowerCase();
  const model  = (html.getAttribute('data-model') || 'SIR').toUpperCase();

  // School: optionale Konfiguration, welche Sim-Keys zusätzlich gezeigt werden
  const SCHOOL_SIM_DEFAULT = ['N','T'];
  const schoolSimAttr = (html.dataset.schoolSim || '').trim();
  const schoolSim = schoolSimAttr
    ? schoolSimAttr.split(',').map(s=>s.trim()).filter(Boolean)
    : SCHOOL_SIM_DEFAULT;

  const baseSchool = ['D','measures', ...schoolSim];
  const baseUni    = ['R0','beta','gamma','D','N','I0','T','dt','measures'];
  const extras     = EXTRAS_BY_MODEL[model] || [];

  const visible = (mode === 'school')
    ? baseSchool
    : [...baseUni, ...extras];

  // Gruppen-Zuordnung (für Accordion)
  const groups = {
    learning:   new Set(['D','measures']),
    model:      new Set(['R0','beta','gamma','sigma','mu','nu']),
    simulation: new Set(['N','I0','T','dt'])
  };

  const titles = {
    learning:   opts.titles?.learning   || DEFAULT_TITLES.learning,
    model:      opts.titles?.model      || DEFAULT_TITLES.model,
    simulation: opts.titles?.simulation || DEFAULT_TITLES.simulation
  };

  return { visible, groups, titles };
}

/**
 * Hilfszuordnung: liefert Gruppenschlüssel für einen Parameter.
 * @param {string} key
 * @returns {'learning'|'model'|'simulation'|null}
 */
export function pickGroup(key){
  const k = String(key||'').trim();
  if (k === 'D' || k === 'measures') return 'learning';
  if (['R0','beta','gamma','sigma','mu','nu'].includes(k)) return 'model';
  if (['N','E0','I0','T','dt'].includes(k)) return 'simulation';
  return null;
}
