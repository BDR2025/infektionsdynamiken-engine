/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Boot Module (ESM)
 * File:     /uid/12-4_support/app/boot/mount/state.visuals.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-04
 * Updated:  2025-10-05
 * Version:  1.0.1
 * Changelog:
 *   - v1.0.1  Pfadfix: VT „state visuals“ → index.js (URL-encoded) + robuster Host-Fallback.
 *   - v1.0.0  Erstes Commit: Mount der State Visuals mit robustem Fallback & Actions.
 */

'use strict';

import { attachWidgetHeader } from '/uid-e_v1/12-4_support/12-42_widgets/index.js';
import { attachAutoRehydrate, DEFAULT_EXPLORE_EVENTS } from '/uid-e_v1/12-4_support/12-42_widgets/rehydrate.js';
import { initRehydrate }      from '/uid-e_v1/12-4_support/12-41_boot/rehydrate/core.js';
import * as EBUS              from '../../../12-1_base/bus.js';

export async function mountStateVisuals() {
  // Host & Render-Knoten robust bestimmen
  const host = document.getElementById('sv-widget') || document.getElementById('app-vt');
  if (!host) { console.warn('[sv] host missing'); return; }

  let el = document.getElementById('sv-host') || document.getElementById('vt-host');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sv-host';
    host.appendChild(el);
  }
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';

  const { header } = attachWidgetHeader(host, {
    title: 'State Visuals',
    storageKey: 'uid:d2:sv:enabled',
    defaultEnabled: true
  });

  attachAutoRehydrate(host, EBUS, DEFAULT_EXPLORE_EVENTS, header);

  // WICHTIG: Ordner mit Leerzeichen (URL-encoded) und explizit /index.js
  const svMod = await import('/uid-e_v1/12-3_presentation/12-35_vt/state%20visuals/index.js');

  const MODEL = (document.documentElement.dataset.model || 'SIR').toUpperCase();
  const CANDS = (MODEL === 'SEIR') ? ['S','E','I','R'] : ['S','I','R'];

  let api = null, lastErr = null;
  const trials = [
    () => svMod.mountVector?.(el, { bus: EBUS, mode: 'wheel', candidates: CANDS, labels: true, format: 'units', animate: true }),
    () => svMod.mountVector?.(el, { bus: EBUS, candidates: CANDS }),
    () => svMod.mountVector?.(el, { bus: EBUS }),
    () => svMod.default?.(el,      { bus: EBUS, candidates: CANDS }),
    () => svMod.default?.(el,      { bus: EBUS })
  ];

  for (const t of trials) {
    try { api = await t(); if (api) break; }
    catch (e) {
      if (/candidates is not defined/i.test(String(e))) {
        try { globalThis.candidates = CANDS; } catch {}
      }
      lastErr = e;
    }
  }
  if (!api && lastErr) console.warn('[sv] mount fallback used:', lastErr?.message || lastErr);

  try {
    const { mountSVActions } =
      await import('/uid-e_v1/12-3_presentation/12-35_vt/state%20visuals/sv.widget-actions.js');
    mountSVActions?.(host, api || {}, { bus: EBUS });
  } catch (e) {
    console.warn('[sv] actions skipped:', e?.message || e);
  }

  initRehydrate(host, EBUS, { id: 'state' });
  console.info('[mount-widgets] State Visuals ready');
}
