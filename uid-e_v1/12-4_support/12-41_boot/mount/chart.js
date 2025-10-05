/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Boot Module (ESM)
 * File:     /uid/12-4_support/app/boot/mount/chart.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-04
 * Updated:  2025-10-04
 * Version:  1.0.0
 * Changelog:
 *   - v1.0.0  Erstes Commit: Chart-Mount inkl. Header-Tools, AutoRehydrate & Rehydrate.
 *
 * eAnnotation:
 *   Mountet das Chart-Widget, dockt Header-Tools am UIDW-Header an, koppelt AutoRehydrate
 *   und registriert Rehydrate. Verwendet nur Aliase/relative Importe (keine Root-Absolute).
 *
 * ModuleMap (short)
 *   /app/boot/mount/chart.js   (dieses Modul)
 *   @uid/pres/chart/index.js   (liefert attachChart)
 *   @uid/widgets/header.tools.js (Header-Tools)
 */

'use strict';

import { attachWidgetHeader } from '/uid-e_v1/12-4_support/12-42_widgets/index.js';
import { attachHeaderTools }  from '/uid-e_v1/12-4_support/12-42_widgets/header.tools.js';
import { attachAutoRehydrate, DEFAULT_EXPLORE_EVENTS } from '/uid-e_v1/12-4_support/12-42_widgets/rehydrate.js';
import { initRehydrate }      from '/uid-e_v1/12-4_support/12-41_boot/rehydrate/core.js';
import { attachChart }        from '/uid-e_v1/12-3_presentation/12-31_chart/index.js';
import * as EBUS              from '../../../12-1_base/bus.js';

export async function mountChart() {
  const host = document.getElementById('chart-widget');
  if (!host) return;

  const MODEL = (document.documentElement.dataset.model || 'SIR').toUpperCase();
  const { header } = attachWidgetHeader(host, {
    title: 'Simulation',
    storageKey: 'uid:d2:chart:enabled',
    defaultEnabled: true
  });

  try { attachHeaderTools({ widgetEl: host, headerEl: header, model: MODEL }); }
  catch (e) { console.warn('[chart] header-tools skipped:', e?.message || e); }

  attachAutoRehydrate(host, EBUS, DEFAULT_EXPLORE_EVENTS, header);
  attachChart('chart-host');
  initRehydrate(host, EBUS, { id: 'chart' });

  console.info('[mount-widgets] Chart ready');
}
