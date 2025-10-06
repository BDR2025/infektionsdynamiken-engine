/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Boot Module (ESM)
 * File:     /uid/12-4_support/app/boot/mount/kpi.key.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-04
 * Updated:  2025-10-04
 * Version:  1.0.0
 * Changelog:
 *   - v1.0.0  Erstes Commit: Mount der Key-KPIs mit Actions, One-Header-Policy & Rehydrate.
 *
 * eAnnotation:
 *   Mountet das Key-KPI-Panel. Vermeidet doppelte Header (One-Header-Policy),
 *   dockt Actions am UIDW-Header an und registriert AutoRehydrate/Rehydrate.
 *
 * ModuleMap (short)
 *   /app/boot/mount/kpi.key.js            (dieses Modul)
 *   @uid/pres/kpi/keykpi.mount.js         (liefert mountKeyKPI)
 *   @uid/pres/kpi/keykpi.widget-actions.js (Header-/Deck-Actions)
 */

'use strict';

import { attachWidgetHeader } from '/uid-e_v1/12-4_support/12-42_widgets/index.js';
import { attachAutoRehydrate, DEFAULT_EXPLORE_EVENTS } from '/uid-e_v1/12-4_support/12-42_widgets/rehydrate.js';
import { initRehydrate }      from '/uid-e_v1/12-4_support/12-41_boot/rehydrate/core.js';
import { mountKeyKPI }        from '/uid-e_v1/12-3_presentation/12-33_kpi/keykpi.mount.js';
import { mountKeyKPIActions } from '/uid-e_v1/12-3_presentation/12-33_kpi/keykpi.widget-actions.js';
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

export async function mountKPIKey() {
  const host = document.getElementById('kpi-static-widget');
  if (!host) return;

  const { header } = attachWidgetHeader(host, {
    title: 'Key KPIs',
    storageKey: 'uid:d2:keykpi:enabled',
    defaultEnabled: true
  });

  attachAutoRehydrate(host, EBUS, DEFAULT_EXPLORE_EVENTS, header);

  await mountKeyKPI(host);
  try { mountKeyKPIActions(header, { title: 'Key KPIs', storageKey: 'uid:keykpi:enabled' }); }
  catch (e) { console.warn('[key-kpi] actions skipped:', e?.message || e); }

  oneHeader(host, 'Key KPIs');
  initRehydrate(host, EBUS, { id: 'keykpi' });

  console.info('[mount-widgets] Key KPI ready');
}

logVersionAfterReady('mount-widgets', 'Key KPI', import.meta.url);
