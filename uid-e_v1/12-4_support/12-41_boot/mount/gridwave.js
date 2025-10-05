/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Boot Module (ESM)
 * File:     /uid/12-4_support/app/boot/mount/gridwave.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-04
 * Updated:  2025-10-05
 * Version:  1.0.3
 * Changelog:
 *   - v1.0.3  Korrekte VT-Pfade mit Leerzeichen (grid%20wave) + toleranter Fallback (kein Crash).
 *   - v1.0.2  Loader mit Fallbacks auf neue VT-Struktur (12-35_vt/gridwave/*).
 *   - v1.0.1  Pfade auf neue VT-Struktur (12-35_vt/gridwave) korrigiert.
 *   - v1.0.0  Erstes Commit: GridWave-Mount inkl. Actions-Lade-Logik & Rehydrate.
 */

'use strict';

import { attachWidgetHeader } from '/uid-e_v1/12-4_support/12-42_widgets/index.js';
import { attachAutoRehydrate, DEFAULT_EXPLORE_EVENTS } from '/uid-e_v1/12-4_support/12-42_widgets/rehydrate.js';
import { initRehydrate }      from '/uid-e_v1/12-4_support/12-41_boot/rehydrate/core.js';
import * as EBUS              from '../../../12-1_base/bus.js';

// --- Loader: mountGridWidget aus VT (mit Leerzeichen im Ordnernamen) ---
async function loadMountGridWidget() {
  const candidates = [
    '/uid-e_v1/12-3_presentation/12-35_vt/grid%20wave/gridwave.js',
    '/uid-e_v1/12-3_presentation/12-35_vt/grid%20wave/index.js',
    '/uid-e_v1/12-3_presentation/12-35_vt/visual%20tool/grid%20wave/gridwave.js',
    '/uid-e_v1/12-3_presentation/12-35_vt/visual%20tool/grid%20wave/index.js'
  ];
  let lastErr = null;
  for (const spec of candidates) {
    try {
      const mod = await import(spec);
      const fn  = mod?.mountGridWidget || mod?.default;
      if (typeof fn === 'function') return fn;
    } catch (e) { lastErr = e; }
  }
  console.warn('[gridwave] widget not found; skipping:', lastErr?.message || lastErr);
  // Kein Hard-Fail: no-op Widget zurückgeben, damit der Rest der App läuft
  return () => ({ update(){}, resize(){}, dispose(){} });
}

// --- Loader: Actions in VT/Grid Wave ---
async function loadGWActions() {
  const candidates = [
    '/uid-e_v1/12-3_presentation/12-35_vt/grid%20wave/gw.widget-actions.js',
    '/uid-e_v1/12-3_presentation/12-35_vt/visual%20tool/grid%20wave/gw.widget-actions.js'
  ];
  let lastErr = null;
  for (const spec of candidates) {
    try {
      const mod = await import(spec);
      const fn  = mod?.mountGridWaveActions || mod?.mountSVGWWidgetActions;
      if (typeof fn === 'function') return { mountGridWaveActions: fn };
    } catch (e) { lastErr = e; }
  }
  // Actions sind optional – kein Hard-Fail
  if (lastErr) console.warn('[gridwave] actions not found:', lastErr?.message || lastErr);
  return {};
}

export async function mountGridWave() {
  const host = document.getElementById('gw-widget');
  if (!host) return;

  const { header } = attachWidgetHeader(host, {
    title: 'GridWave',
    storageKey: 'uid:d2:gridwave:enabled',
    defaultEnabled: true
  });

  attachAutoRehydrate(host, EBUS, DEFAULT_EXPLORE_EVENTS, header);

  // Widget laden (neue VT-Struktur)
  const mountGridWidget = await loadMountGridWidget();
  const apiGW = mountGridWidget({
    el: document.getElementById('gw-host'),
    bus: EBUS,
    grid: 40,
    mode: 'proportional',
    animate: false
  });

  try {
    const { mountGridWaveActions } = await loadGWActions();
    mountGridWaveActions?.(host, apiGW || {}, { bus: EBUS });
  } catch (e) {
    console.warn('[gridwave] actions skipped:', e?.message || e);
  }

  initRehydrate(host, EBUS, { id: 'gridwave', refresh: () => apiGW?.resize?.() });

  console.info('[mount-widgets] GridWave ready');
}
