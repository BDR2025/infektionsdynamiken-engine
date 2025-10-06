/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Boot Module (ESM)
 * File:     /uid/12-4_support/app/boot/mount/leq.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-04
 * Updated:  2025-10-06
 * Version:  1.0.1
 * Changelog:
 *   - v1.0.1  EA-Startzustand LEQ: defaultEnabled=false; neuer Storage-Key (:ea1);
 *             erzwungenes Öffnen im Mount entfernt (kein FOUC, kein Doppel-Klick-Effekt).
 *   - v1.0.0  Erstes Commit: LEQ-Mount über App-Shims; Adopt-Fallback; Rehydrate.
 *
 * eAnnotation:
 *   Mountet die Kern-Gleichung (LEQ) über App-Shims, ohne das Präsentationsmodul anzufassen.
 *   Wenn das Modul sich selbst rendert, adoptiert der Mount den DOM in den Host.
 *   Bindet AutoRehydrate sowie QA-Marker an die Widget-Shell.
 *
 * ModuleMap (short)
 *   /app/boot/mount/leq.js         (dieses Modul)
 *   /app/shims/leq.index.js        (→ @uid/pres/living%20equation/index.js)
 *   /app/shims/leq.actions.js      (→ @uid/pres/living%20equation/leq.widget-actions.js)
 */

'use strict';

import { attachWidgetHeader } from '/uid-e_v1/12-4_support/12-42_widgets/index.js';
import { attachAutoRehydrate, DEFAULT_EXPLORE_EVENTS } from '/uid-e_v1/12-4_support/12-42_widgets/rehydrate.js';
import { initRehydrate }      from '/uid-e_v1/12-4_support/12-41_boot/rehydrate/core.js';
import { initMathJax }        from '/uid-e_v1/12-4_support/12-44_js/uid-mathjax.js';
import * as EBUS              from '../../../12-1_base/bus.js';
import { logVersionAfterReady } from '../qa/log.js';

const MJ_READY = initMathJax();

function adoptInto(eqHost) {
  const ceq = eqHost.querySelector?.('.ceq');
  if (ceq) return ceq;

  const all = Array.from(document.querySelectorAll('section.widget.formula'));
  if (!all.length) return null;

  let keep =
    all.find(el => eqHost.contains(el)) ||
    all.find(el => el.classList.contains('is-color')) ||
    all[all.length - 1];

  if (keep && !eqHost.contains(keep)) eqHost.appendChild(keep);
  for (const el of all) if (el !== keep) el.remove();
  return keep;
}

export async function mountLEQ() {
  const host   = document.getElementById('core-equation-widget');
  const eqHost = document.getElementById('core-equation');
  if (!host || !eqHost) return;

  // EA-Policy: Start geschlossen + neutralisierte Persistenz (neuer Key)
  const { header } = attachWidgetHeader(host, {
    title: 'Kern-Gleichung',
    storageKey: 'uid:d2:eq:enabled:ea1',
    defaultEnabled: false
  });

  attachAutoRehydrate(host, EBUS, DEFAULT_EXPLORE_EVENTS, header);
  await MJ_READY;

  // Einziger Importweg: App-Shim -> "living equation" (unverändertes Quellmodul)
  let mod = null;
  try {
    mod = await import('/uid-e_v1/12-4_support/12-41_boot/shims/leq.index.js');
  } catch (e) {
    console.warn('[LEQ] shim import failed (will adopt DOM):', e?.message || e);
  }

  if (mod?.mountLEQ) {
    try { await mod.mountLEQ({ el: eqHost, bus: EBUS }); }
    catch (e) { console.warn('[LEQ] mountLEQ failed (will adopt DOM):', e?.message || e); }
  }

  const W = adoptInto(eqHost);
  if (W) {
    // Wichtig: Kein erzwungenes Öffnen mehr – Offen/Zu entscheidet ausschließlich der Header.
    // (entfernt) host.dataset.widgetEnabled = 'true';
    // (entfernt) host.removeAttribute('hidden');

    // Defaults (nur interne Anzeigepräferenzen, unabhängig vom Offen/Zu-State)
    W.classList.remove('is-white');
    W.querySelector('.ceq-mode [data-mode="color"]')?.click();
    W.querySelector('.ceq-did  [data-did="pulse"]')?.click();

    // Actions via Shim (falls vorhanden)
    try {
      const act = await import('/uid-e_v1/12-4_support/12-41_boot/shims/leq.actions.js');
      act?.mountLEQActions?.(host, {}, { bus: EBUS });
    } catch (e) {
      // optional file – kein Problem, wenn 404
      console.warn('[LEQ] actions skipped:', e?.message || e);
    }

    initRehydrate(host, EBUS, { id: 'leq' });
    console.info('[mount-widgets] LEQ ready');
  } else {
    console.warn('[LEQ] Keine Instanz im DOM nach Import/Adopt');
  }
}

logVersionAfterReady('mount-widgets', 'LEQ', new URL('../../../12-3_presentation/12-34_leq/index.js', import.meta.url).href);
