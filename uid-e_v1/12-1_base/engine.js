/*!
 * File:     core/engine.js
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 * Type:     Open Educational Resource (OER)
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-09-21
 * Updated:  2025-09-27
 * Version:  v1.1.1
 * Changelog:
 *   - v1.1.1 Replaced placeholders with full model + integrator implementations
 *   - v1.1.0 Added SIRV model and improved stabilization
 *   - v1.0.0 Initial core with SIR and SEIR
 */

// ============================================================================
// Hilfsfunktionen
// ============================================================================
// Klein, schnell, ohne Seiteneffekte.
const finite = (x) => Number.isFinite(x);
const nnz    = (x) => (finite(x) && x > 0 ? x : 0);

// ============================================================================
// Modell-Definitionen
// ============================================================================
// Jeder Eintrag liefert:
//  - dims: Reihenfolge der Kompartimente
//  - init(p): Startvektor
//  - deriv(p, y): Differentialgleichungen
// Entwickler: Neue Modelle hier ergänzen. Bestehende sauber lassen.
const MODELS = {
  SIR: {
    dims: ['S','I','R'],
    init: (p) => [Math.max(0, p.N - p.I0), p.I0, 0],
    deriv: (p, y) => {
      const [S,I,R] = y; const N = Math.max(1, p.N);
      const be = p.beta * (1 - Math.max(0, Math.min(1, p.measures || 0)));
      const dS = -be * S * I / N;
      const dI =  be * S * I / N - p.gamma * I;
      const dR =  p.gamma * I;
      return [dS, dI, dR];
    }
  },

  SEIR: {
    dims: ['S','E','I','R'],
    init: (p) => [Math.max(0, p.N - p.I0), 0, p.I0, 0],
    deriv: (p, y) => {
      const [S,E,I,R] = y; const N = Math.max(1, p.N);
      const be = p.beta * (1 - Math.max(0, Math.min(1, p.measures || 0)));
      const dS = -be * S * I / N;
      const dE =  be * S * I / N - p.sigma * E;
      const dI =  p.sigma * E - p.gamma * I;
      const dR =  p.gamma * I;
      return [dS, dE, dI, dR];
    }
  },

  SIRD: {
    dims: ['S','I','R','D'],
    init: (p) => [Math.max(0, p.N - p.I0), p.I0, 0, 0],
    deriv: (p, y) => {
      const [S,I,R,D] = y; const N = Math.max(1, p.N);
      const be = p.beta * (1 - Math.max(0, Math.min(1, p.measures || 0)));
      const mu = Math.max(0, p.mu || 0);
      const dS = -be * S * I / N;
      const dI =  be * S * I / N - p.gamma * I - mu * I;
      const dR =  p.gamma * I;
      const dD =  mu * I;
      return [dS, dI, dR, dD];
    }
  },

  SIRV: {
    dims: ['S','I','R','V'],
    init: (p) => [Math.max(0, p.N - p.I0), p.I0, 0, 0],
    deriv: (p, y) => {
      const [S,I,R,V] = y; const N = Math.max(1, p.N);
      const be = p.beta * (1 - Math.max(0, Math.min(1, p.measures || 0)));
      const nu = Math.max(0, p.nu || 0); // Impf-Rate
      const dS = -be * S * I / N - nu * S;
      const dI =  be * S * I / N - p.gamma * I;
      const dR =  p.gamma * I;
      const dV =  nu * S;
      return [dS, dI, dR, dV];
    }
  },

  // Optionaler Minimalfall
  SIS: {
    dims: ['S','I'],
    init: (p) => [Math.max(0, p.N - p.I0), p.I0],
    deriv: (p, y) => {
      const [S,I] = y; const N = Math.max(1, p.N);
      const be = p.beta * (1 - Math.max(0, Math.min(1, p.measures || 0)));
      const dS = -be * S * I / N + p.gamma * I;
      const dI =  be * S * I / N - p.gamma * I;
      return [dS, dI];
    }
  }
};

// ============================================================================
// Integratoren (generisch für y' = f(p,y))
// ============================================================================
// Entwickler: Neue Verfahren hier ergänzen. Bestehende Schnittstellen beibehalten.
function stepEuler(f, p, y, h) {
  const k1 = f(p, y);
  const out = new Array(y.length);
  for (let i=0;i<y.length;i++) out[i] = y[i] + h*k1[i];
  return out;
}

function stepHeun(f, p, y, h) {
  const k1 = f(p, y);
  const y2 = new Array(y.length);
  for (let i=0;i<y.length;i++) y2[i] = y[i] + h*k1[i];
  const k2 = f(p, y2);
  const out = new Array(y.length);
  for (let i=0;i<y.length;i++) out[i] = y[i] + (h/2)*(k1[i]+k2[i]);
  return out;
}

function stepRK4(f, p, y, h) {
  const k1 = f(p, y);
  const y2 = new Array(y.length);
  for (let i=0;i<y.length;i++) y2[i] = y[i] + (h/2)*k1[i];
  const k2 = f(p, y2);
  const y3 = new Array(y.length);
  for (let i=0;i<y.length;i++) y3[i] = y[i] + (h/2)*k2[i];
  const k3 = f(p, y3);
  const y4 = new Array(y.length);
  for (let i=0;i<y.length;i++) y4[i] = y[i] + h*k3[i];
  const k4 = f(p, y4);
  const out = new Array(y.length);
  for (let i=0;i<y.length;i++) out[i] = y[i] + (h/6)*(k1[i] + 2*k2[i] + 2*k3[i] + k4[i]);
  return out;
}

const STEPPERS = { euler: stepEuler, heun: stepHeun, rk4: stepRK4 };

// ============================================================================
// Haupt-API
// ============================================================================
// Führt eine Simulation aus und liefert { series, meta, drift }.
// Schnittstelle stabil halten, da Director und KPI-Module diese nutzen.
/**
 * Run a simulation.
 * @param {{model?:string, params?:object, integrator?:'euler'|'heun'|'rk4'}} cfg
 * @returns {{series:object, meta:object, drift:number}}
 */
export function run({ model='SIR', params={}, integrator='rk4' }) {
  const MKEY = (model || 'SIR').toUpperCase();
  const M = MODELS[MKEY];
  if (!M) throw new Error(`[UID-E Engine] Unknown model: ${model}`);

  const step = STEPPERS[(integrator||'rk4').toLowerCase()] || stepRK4;

  // Schutz & Limits
  const N  = Math.max(1, Number(params.N || 1_000_000));
  const dt = Math.max(1e-6, Number(params.dt || 0.5));
  const T  = Math.max(dt, Number(params.T || 180));
  const steps = Math.max(1, Math.floor(T / dt));

  // Initialer Zustandsvektor
  let y = M.init({ ...params, N, I0: Math.max(0, Number(params.I0 || 10)) }).map(nnz);

  // Serien vorbereiten
  const series = { t: new Array(steps+1) };
  for (const d of M.dims) series[d] = new Array(steps+1);

  // Startwerte
  series.t[0] = 0;
  for (let i=0;i<M.dims.length;i++) series[M.dims[i]][0] = y[i];

  // Integrationsschleife
  const f = (p, yv) => M.deriv(params, yv); // params by ref

  for (let k=1;k<=steps;k++) {
    y = step(f, params, y, dt);

    // Non-negativity + einfache Stabilisierung
    for (let i=0;i<y.length;i++) y[i] = nnz(y[i]);

    // Sanfte Massenkorrektur
    let sum = 0; for (let i=0;i<y.length;i++) sum += y[i];
    const drift = N - sum;
    if (finite(drift) && Math.abs(drift) > Math.max(1e-9 * N, 1e-9)) {
      // Nur S (erstes Kompartment) korrigieren
      y[0] = nnz(y[0] + drift);
    }

    // Werte ablegen
    series.t[k] = k*dt;
    for (let i=0;i<M.dims.length;i++) series[M.dims[i]][k] = y[i];
  }

  // Abschlussdrift
  let endSum = 0; for (let i=0;i<y.length;i++) endSum += y[i];
  const endDrift = Math.abs(endSum - N);

  const meta = { model: MKEY, method: (integrator||'rk4').toLowerCase(), dims: M.dims.slice() };
  return { series, meta, drift: endDrift };
}
