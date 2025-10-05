/*!
 * File:     core/schema.js
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 * Type:     Open Educational Resource (OER)
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-09-26
 * Updated:  2025-09-26
 * Version:  v1.0.0
 * Changelog:
 *   - v1.0.0 Parameter catalog, normalization and algebraic couplings implemented
 */

// ============================================================================
// Parameter-Katalog
// ============================================================================
// Enthält Grenzen, Schrittweiten und Defaults für alle relevanten Parameter.
// Entwickler: Änderungen hier nur in Absprache vornehmen, da UI und Engine
// diesen Katalog gemeinsam nutzen. Zusätzliche Modelle können Felder erweitern.
export function makeCatalog(model='SIR', mode='school') {
  const base = {
    N:       { min: 1, max: 1e9,   step: 1,      def: 1_000_000 },
    I0:      { min: 0, max: 1e7,   step: 1,      def: 10 },
    T:       { min: 1, max: 3650,  step: 1,      def: 180 },
    dt:      { min: 0.01, max: 10, step: 0.01,   def: 0.5 },
    R0:      { min: 0.1, max: 10,  step: 0.01,   def: 3.0 },
    beta:    { min: 0, max: 5,     step: 0.0001, def: 0.6 },
    gamma:   { min: 0.0001, max: 5, step: 0.0001, def: 0.2 },
    D:       { min: 0.2, max: 365, step: 0.01,   def: 5.0 },
    measures:{ min: 0, max: 1,     step: 0.01,   def: 0.0 },
    sigma:   { min: 0.0001, max: 5, step: 0.0001, def: 0.25 }, // SEIR
    mu:      { min: 0, max: 1,     step: 0.0001, def: 0.0 },   // SIRD
    nu:      { min: 0, max: 1,     step: 0.0001, def: 0.0 },   // SIRV
    L:       { min: 1, max: 14,    step: 1,      def: 4 }      // Latenz (Tage) für SEIR
  };
  return base;
}

// ============================================================================
// Utility-Funktionen
// ============================================================================
// toStep runden Werte auf definierte Schrittweite, clamp setzt harte Grenzen.
// Entwickler: Diese Hilfen sollten unverändert bleiben, da sie überall genutzt werden.
export function toStep(val, step) {
  if (!Number.isFinite(val) || !Number.isFinite(step) || step <= 0) return val;
  return Math.round(val / step) * step;
}

export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

// ============================================================================
// Normalisierung
// ============================================================================
// Nimmt ein Parameterobjekt entgegen und erzwingt Defaults, Clamping und Rasterung.
// Entwickler: Keine unbekannten Keys zulassen. Erweiterungen nur durch Anpassung des Katalogs.
export function normalizeParams(p, cat) {
  const out = {};
  for (const k of Object.keys(cat)) {
    const def = cat[k].def;
    let v = (p && Number.isFinite(p[k])) ? Number(p[k]) : def;
    v = clamp(v, cat[k].min, cat[k].max);
    v = toStep(v, cat[k].step);
    out[k] = v;
  }
  return out;
}

// ============================================================================
// Algebraische Kopplungen
// ============================================================================
// Stellt Konsistenz zwischen abhängigen Größen her.
// changedKey steuert die Richtung, verhindert Ping-Pong.
// Entwickler: Struktur nicht verändern. Neue Kopplungen sauber als
// if-Branches hinzufügen. Immer clamp verwenden.
export function applyCouplings(p, changedKey) {
  const prev = { ...p };

  // gamma ↔ D
  if (changedKey === 'gamma') {
    p.D = clamp(1 / p.gamma, 0.000001, 365);
  } else if (changedKey === 'D') {
    p.gamma = clamp(1 / p.D, 0.000001, 5);
  }

  // R0 ↔ beta ↔ gamma
  if (changedKey === 'R0') {
    p.beta = p.R0 * p.gamma;
  } else if (changedKey === 'beta') {
    p.R0 = (p.gamma > 0) ? p.beta / p.gamma : p.R0;
  } else if (changedKey === 'gamma') {
    p.R0 = (p.gamma > 0) ? p.beta / p.gamma : p.R0;
  }

  // sigma ↔ L
  if (changedKey === 'sigma') {
    p.L = clamp(1 / p.sigma, 0.000001, 14);
  } else if (changedKey === 'L') {
    p.sigma = clamp(1 / p.L, 0.000001, 5);
  }

  return p;
}
