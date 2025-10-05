/*!
 * File:      /uid-e_v1/orchestrator.js
 * Project:   UID-Engine (engine.infektionsdynamiken.de)
 * Role:      DOM ready → Boot import (native Import-Maps) mit robusten Fallbacks
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-05
 * Version:   1.1.1
 * Changelog:
 *   - v1.1.1  Zusätzlicher Fallback auf /12-41_boot/boot.js (kein index.js vorhanden).
 *   - v1.1.0  Native Import-Maps, kein importShim/addImportMap.
 */

'use strict';

(function () {
  console.time('[orchestrator] total');

  const domReady = () =>
    document.readyState === 'loading'
      ? new Promise(res => document.addEventListener('DOMContentLoaded', res, { once: true }))
      : Promise.resolve();

  async function tryImportChain(specifiers) {
    for (const spec of specifiers) {
      try {
        const mod = await import(spec);
        console.info('[orchestrator] boot module resolved:', spec);

        if (typeof mod?.default === 'function') {
          await mod.default();
          console.info('[orchestrator] boot default() executed');
        } else if (typeof mod?.boot === 'function') {
          await mod.boot();
          console.info('[orchestrator] boot.boot() executed');
        }
        return true;
      } catch (e) {
        console.debug('[orchestrator] candidate failed:', spec, e?.message ?? e);
      }
    }
    return false;
  }

  (async () => {
    try {
      await domReady();
      console.info('[orchestrator] starting boot…');

      const ok = await tryImportChain([
        '/uid-e_v1/12-4_support/12-41_boot/index.js',
        '/uid-e_v1/12-4_support/12-41_boot/index.js',

        // Direkte Pfade (robuste Fallbacks)
        '/uid-e_v1/12-4_support/12-41_boot/index.js',
        '/uid-e_v1/12-4_support/12-41_boot/boot.js',  // <— neu
        '/uid-e_v1/12-4_support/app/boot.js'
      ]);

      if (!ok) throw new Error('No boot module found via import map or direct path.');

      console.info('[orchestrator] boot dispatched');
    } catch (err) {
      console.error('[orchestrator] failed:', err);
    } finally {
      console.timeEnd('[orchestrator] total');
    }
  })();
})();
