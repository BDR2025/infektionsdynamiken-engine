/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Boot Module (ESM)
 * File:     /uid/12-4_support/app/boot/mount/kpi.live.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-04
 * Updated:  2025-10-04
 * Version:  1.0.0
 * Changelog:
 *   - v1.0.0  Erstes Commit: Mount der Live-KPIs mit Actions, One-Header-Policy & Rehydrate.
 *
 * eAnnotation:
 *   Mountet das Live-KPI-Panel. Vermeidet doppelte Header durch One-Header-Policy,
 *   bindet Actions gezielt an die Widget-Shell und registriert AutoRehydrate/Rehydrate.
 *   Keine Root-absoluten Pfade — nur Aliase/relative Importe.
 *
 * ModuleMap (short)
 *   /app/boot/mount/kpi.live.js   (dieses Modul)
 *   @uid/pres/kpi/index.js        (liefert mountKPI)
 *   @uid/pres/kpi/kpi.widget-actions.js (Header-/Deck-Actions)
 */

'use strict';

import { attachWidgetHeader } from '/uid-e_v1/12-4_support/12-42_widgets/index.js';
import { attachAutoRehydrate, DEFAULT_EXPLORE_EVENTS } from '/uid-e_v1/12-4_support/12-42_widgets/rehydrate.js';
import { initRehydrate }      from '/uid-e_v1/12-4_support/12-41_boot/rehydrate/core.js';
import { mountKPI }           from '/uid-e_v1/12-3_presentation/12-33_kpi/index.js';
import { mountKPIActions }    from '/uid-e_v1/12-3_presentation/12-33_kpi/kpi.widget-actions.js';
import * as EBUS              from '../../../12-1_base/bus.js';
import { logVersionAfterReady } from '../qa/log.js';


function oneHeader(host, title) {
  try {
    const uidw = host.querySelector('.uidw-header');
    if (!uidw) return;
    const dups = host.querySelectorAll('.widget-header');
    dups.forEach(h => { if (!h.closest('.uidw-header')) h.remove(); });
    const t = uidw.querySelector('.uidw-title .uidw-title-text');
    if (t && title) t.textContent = title;
  } catch {}
}

export async function mountKPILive() {
  const host = document.getElementById('kpi-widget');
  if (!host) return;

  const { header } = attachWidgetHeader(host, {
    title: 'Kompartimente & Live KPIs',
    storageKey: 'uid:d2:kpi:enabled',
    defaultEnabled: true
  });

  attachAutoRehydrate(host, EBUS, DEFAULT_EXPLORE_EVENTS, header);

  mountKPI('kpi-live', { deckId: 'live' });
  try { mountKPIActions(host, { persistKey: 'uid:d2:kpi' }); }
  catch (e) { console.warn('[kpi] actions skipped:', e?.message || e); }

  oneHeader(host, 'Kompartimente & Live KPIs');
  initRehydrate(host, EBUS, { id: 'kpi-live' });

  console.info('[mount-widgets] KPI ready');
}

logVersionAfterReady('mount-widgets', 'KPI', new URL('../../../12-3_presentation/12-33_kpi/bridge.js', import.meta.url).href);
