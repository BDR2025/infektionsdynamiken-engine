/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Boot Module (ESM)
 * File:     /uid/12-4_support/app/boot/engine/boot-engine.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-04
 * Updated:  2025-10-04
 * Version:  1.0.0
 * Changelog:
 *   - v1.0.0  Initiale Engine-Init: createUID(), Seed-Bus, HIT-Akzent, KPI-Preset, Nudge.
 *
 * eAnnotation:
 *   Startet die Explore-Engine und füttert den Event-Bus, falls leer (Params + einfache SIR-Serie).
 *   Exponiert bootEngine(model). Self-Run-Guard sorgt dafür, dass die Init genau einmal erfolgt.
 *   HINWEIS: Chart/Sim-Bridges werden im Mount-Layer verdrahtet (z. B. /app/boot/mount/chart.js).
 */
'use strict';

import * as EBUS from '../../../12-1_base/bus.js';
import { createUID } from '/uid-e_v1/12-1_base/uid.js';

/** Engine + Seeds + Demo-Hilfen starten */
export function bootEngine(model = 'SIR') {
  const M = String(model).toUpperCase();

  // 1) Engine
  createUID({
    model: M,
    params: { R0: 3, gamma: 0.2, N: 1_000_000, I0: 10, T: 180, dt: 0.5, measures: 0 },
    integrator: 'rk4'
  });

  // (Keine sim-bridge Verdrahtung hier — Chart/Playback wird im Mount-Layer gesetzt, z. B. in /app/boot/mount/chart.js)

  // 2) Seeds (Params + einfache SIR-Serie, falls Bus leer)
  seedBusIfEmpty(M);

  // 3) HIT-Farbe
  try { document.documentElement.style.setProperty('--uid-hit-color', 'var(--series-R, #65AFFF)'); } catch {}

  // 4) Nudge (Aggregatoren initial rechnen lassen)
  setTimeout(() => EBUS.emit('uid:e:params:change', { bulk: {} }), 0);

  // 5) KPI-Preset (Demo): comp/context (+peaks/outcomes bei SEIR, Uni)
  setTimeout(() => {
    try {
      const html  = document.documentElement;
      const mdl   = (html.dataset.model || 'SIR').toUpperCase();
      const mode  = (html.dataset.mode  || 'university').toLowerCase();
      let groups  = { comp: true, context: true, peaks: false, outcomes: false };
      if (mdl === 'SEIR') groups = { comp: true, context: true, peaks: true, outcomes: (mode === 'university') };
      EBUS.emit('uid:kpi:group:set', { id: 'comp',     on: !!groups.comp });
      EBUS.emit('uid:kpi:group:set', { id: 'context',  on: !!groups.context });
      EBUS.emit('uid:kpi:group:set', { id: 'peaks',    on: !!groups.peaks });
      EBUS.emit('uid:kpi:group:set', { id: 'outcomes', on: !!groups.outcomes });
    } catch {}
  }, 0);
}

/** Füllt den Bus, falls noch keine Daten vorhanden sind */
function seedBusIfEmpty(modelUpper) {
  const lastS = EBUS.getLast?.('uid:e:data:series');
  const lastP = EBUS.getLast?.('uid:e:model:params');

  if (!lastP || !Number.isFinite(+lastP.R0)) {
    const P = { R0: 3, gamma: 0.2, N: 1_000_000, I0: 10, T: 180, dt: 0.5, model: modelUpper };
    EBUS.emit('uid:e:model:params', P);
  }
  if (!lastS || !Array.isArray(lastS.t) || lastS.t.length < 2) {
    const P2 = EBUS.getLast?.('uid:e:model:params') || { R0: 3, gamma: 0.2, N: 1_000_000, I0: 10, T: 180, dt: 0.5, model: modelUpper };
    const n  = Math.max(1, Math.round(P2.T / P2.dt));
    const t  = Array.from({ length: n + 1 }, (_, i) => i * P2.dt);
    const S  = new Array(n + 1), I = new Array(n + 1), R = new Array(n + 1);
    S[0] = P2.N - P2.I0; I[0] = P2.I0; R[0] = 0;
    const beta = P2.R0 * P2.gamma;
    for (let i = 1; i <= n; i++) {
      const s = S[i-1], ii = I[i-1];
      const inf = beta * s * ii / P2.N;
      const rec = P2.gamma * ii;
      S[i] = s - P2.dt * inf;
      I[i] = ii + P2.dt * (inf - rec);
      R[i] = R[i-1] + P2.dt * rec;
    }
    EBUS.emit('uid:e:data:series', { t, S, I, R, N: P2.N });
  }
}

/* ---- Self-Run (einmalig), wenn per <script type="module"> eingebunden ---- */
if (!window.__uidBootEngineOnce) {
  window.__uidBootEngineOnce = true;
  try {
    const model = (document.documentElement.dataset.model || 'SIR');
    bootEngine(model);
  } catch (e) {
    console.warn('[boot-engine] failed:', e?.message || e);
  }
}
