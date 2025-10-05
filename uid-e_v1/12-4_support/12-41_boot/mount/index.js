/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Boot Module (ESM)
 * File:     /uid/12-4_support/app/boot/mount/index.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-04
 * Updated:  2025-10-04
 * Version:  1.0.0
 * Changelog:
 *   - v1.0.0  Neuer Mount-Orchestrator: ruft die Widget-Mounts sequentiell auf.
 *
 * eAnnotation:
 *   Zentraler Orchestrator des Boot-Moduls. Lädt und startet die einzelnen
 *   Widget-Mounts in definierter Reihenfolge. Die Detail-QA-Marker kommen aus den
 *   jeweiligen Mount-Modulen (z. B. "[mount-widgets] KPI ready").
 *
 * ModuleMap (short)
 *   /app/boot/mount/index.js     (dieses Modul)
 *   /app/boot/mount/chart.js
 *   /app/boot/mount/kpi.live.js
 *   /app/boot/mount/kpi.key.js
 *   /app/boot/mount/gridwave.js
 *   /app/boot/mount/params.classic.js
 *   /app/boot/mount/params.formulas.js
 *   /app/boot/mount/state.visuals.js
 *   /app/boot/mount/leq.js
 */

'use strict';

import { mountChart }          from './chart.js';
import { mountKPILive }        from './kpi.live.js';
import { mountKPIKey }         from './kpi.key.js';
import { mountGridWave }       from './gridwave.js';
import { mountParamsClassic }  from './params.classic.js';
import { mountParamsFormulas } from './params.formulas.js';
import { mountStateVisuals }   from './state.visuals.js';
import { mountLEQ }            from './leq.js';

(async function mountAll() {
  try {
    await mountChart();
    await mountKPILive();
    await mountKPIKey();
    await mountGridWave();
    await mountParamsClassic();
    await mountParamsFormulas();
    await mountStateVisuals();
    await mountLEQ();

    console.info('[mount] sequence ok (chart → kpi.live → kpi.key → gridwave → params.classic → params.formulas → state.visuals → leq)');
  } catch (e) {
    console.warn('[mount] failed:', e?.message || e);
  }
})();
