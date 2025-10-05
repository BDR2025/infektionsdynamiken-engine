/*!
 * File:     core/uid.js
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 * Type:     Open Educational Resource (OER)
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-09-26
 * Updated:  2025-09-26
 * Version:  v1.0.2
 * Changelog:
 *   - v1.0.2 Initial Director implementation
 *   - consumes parameter events, applies couplings and normalization
 *   - calls engine and emits model, update, data, status and error events
 */

// ============================================================================
// Imports
// ============================================================================
// Bus liefert Event-System (nicht verändern, nur über API nutzen)
import { on, emit } from './bus.js';

// Schema verwaltet Parameterkatalog, Normalisierung und Kopplungen
// Änderungen nur über makeCatalog/normalizeParams/applyCouplings, 
// niemals manuell Eingriffe in params-Struktur einfügen
import { makeCatalog, normalizeParams, applyCouplings, clamp } from './schema.js';

// Engine führt numerische Berechnung durch (nicht hier verändern)
import { run } from './engine.js';

// ============================================================================
// Konstanten
// ============================================================================
// Integratoren, die für die Engine erlaubt sind
// Falls neue Verfahren ergänzt werden sollen, hier hinzufügen
const INTEGRATORS = new Set(['euler','heun','rk4']);

// ============================================================================
// Hauptfunktion createUID
// ============================================================================
// Initialisiert den Director, verbindet Schema, Engine und Event-Bus
// Entwickler sollten hier KEINE neue Logik außerhalb der vorgesehenen
// schedule/recalc-Mechanik ergänzen, um Seiteneffekte zu vermeiden
export function createUID(cfg = {}) {
  // --------------------------------------------------------------------------
  // Kontext: Sprache und Modus aus <html> lesen oder aus cfg übernehmen
  // Nur falls zwingend nötig, hier Default-Handling ergänzen
  // --------------------------------------------------------------------------
  const html = (typeof document !== 'undefined')
    ? document.documentElement
    : { lang: 'en', dataset: {} };

  const model = (cfg.model || (html.dataset?.model || 'SIR')).toUpperCase();
  const mode  = (cfg.mode  || (html.dataset?.mode  || 'school')).toLowerCase();
  let integrator = (cfg.integrator || 'rk4').toLowerCase();
  if (!INTEGRATORS.has(integrator)) integrator = 'rk4';

  // --------------------------------------------------------------------------
  // Parameterkatalog und Startparameter
  // Änderungen an den Grenzen oder Defaults immer über schema.js
  // --------------------------------------------------------------------------
  const catalog = makeCatalog(model, mode);
  let params = normalizeParams(cfg.params || {}, catalog);

  // --------------------------------------------------------------------------
  // READY: Initiale Meldung an das System
  // Entwickler: Struktur dieses Events nicht verändern, nur erweitern
  // --------------------------------------------------------------------------
  emit('uid:e:params:ready', {
    state: { params, meta: { lang: html.lang || 'en', mode, model, driverKey: 'init' } }
  });

  // ========================================================================
  // Scheduler und Rechenlogik
  // ========================================================================
  // rAF throttle sorgt dafür, dass viele schnelle Änderungen zusammengefasst
  // werden. Entwickler sollten schedule() und recalc() nicht umgehen.
  let raf = 0, dirty = false;

  function recalc() {
    raf = 0; dirty = false;

    // ----------------------------
    // Publiziere normalisierte Parameter
    // Änderungen an der Struktur dieses Events vermeiden, da viele Module
    // (Chart, KPI, VectorWheel) darauf hören
    // ----------------------------
    emit('uid:e:model:update', {
      N: params.N, I0: params.I0,
      R0: params.R0, beta: params.beta, gamma: params.gamma, D: params.D,
      sigma: params.sigma, mu: params.mu, nu: params.nu,
      measures: params.measures,
      dt: params.dt, T: params.T,
      method: integrator
    });

    // ----------------------------
    // Engine berechnen
    // run() niemals ersetzen, Änderungen an engine.js vornehmen
    // ----------------------------
    const { series, meta, drift } = run({ model, params, integrator });

    // ----------------------------
    // Drift-Guard
    // Toleranzen hier nicht ändern, nur in Absprache, da Stabilität sonst leidet
    // ----------------------------
    const tol = Math.max(1e-6 * params.N, 1e-3);
    if (!Number.isFinite(drift) || drift > tol) {
      emit('uid:e:error', { type: 'Invariant', context: { drift, N: params.N } });
    }

    // ----------------------------
    // Publiziere neue Simulationsdaten
    // Struktur unverändert lassen, Konsistenz mit Chart/KPI/VectorWheel
    // ----------------------------
    emit('uid:e:sim:data', { series, N: params.N, dt: params.dt, T: params.T });
  }

  function schedule() {
    if (!raf) raf = requestAnimationFrame(recalc);
    dirty = true;
  }

  // ========================================================================
  // Eingehende Parameter-Events
  // ========================================================================
  // Nur hier dürfen Entwickler Änderungen an Parametern entgegennehmen.
  // Die interne Parametervalidierung läuft immer über schema.js
  on('uid:e:params:change', (payload) => {
    if (!payload) return;

    if (payload.bulk && typeof payload.bulk === 'object') {
      params = normalizeParams({ ...params, ...payload.bulk }, catalog);
    } else if (typeof payload.key === 'string') {
      const key = payload.key;
      const v = Number(payload.value);
      if (Number.isFinite(v) && catalog[key]) {
        params[key] = clamp(v, catalog[key].min, catalog[key].max);
        applyCouplings(params, key);
      } else {
        emit('uid:e:error', { type: 'InvalidParam', context: { key, value: payload.value } });
      }
    }
    schedule();
  });

  // ========================================================================
  // Integrator-Wechsel (Hot-Swap)
  // ========================================================================
  // Entwickler sollten nur neue Integratoren hinzufügen, bestehende Logik 
  // aber unverändert lassen
  on('uid:e:integrator:set', (payload) => {
    const m = String(payload?.method || payload?.mode || '').toLowerCase();
    if (!INTEGRATORS.has(m)) return;
    if (m === integrator) return;
    integrator = m;

    // Status aktualisieren und mit identischen Parametern neu rechnen
    emit('uid:e:engine:status', { model, method: integrator, steps: Math.floor(params.T / params.dt) });
    schedule();
  });

  // ========================================================================
  // Initialstatus und erste Rechnung
  // ========================================================================
  emit('uid:e:engine:status', { model, method: integrator, steps: Math.floor(params.T / params.dt) });
  schedule();

  // ========================================================================
  // Öffentliches API
  // ========================================================================
  // Getter liefern Kopien, direkte Mutationen an params außerhalb verbieten
  return {
    get model() { return model; },
    get mode() { return mode; },
    get params() { return { ...params }; },

    // Integratorwechsel über API, nur zulässige Verfahren
    setIntegrator(m) {
      const mm = String(m||'').toLowerCase();
      if (INTEGRATORS.has(mm)) { integrator = mm; schedule(); }
    },

    // Manuelles Recalc erzwingen, selten nötig
    recalc: schedule
  };
}
