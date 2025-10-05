/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Boot Module (ESM)
 * File:     /uid/12-4_support/app/boot/bridge.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-04
 * Updated:  2025-10-04
 * Version:  1.0.0
 * Changelog:
 *   - v1.0.0  Orchestrator eingeführt: Boot-Flow (tooltips → sim-bridge → pointer-bridge → engine → mount).
 *
 * eAnnotation:
 *   Bridge als Composition Root des Support-Layers. Startet die Boot-Sequenz in
 *   definierter Reihenfolge und liefert stabile QA-Marker in die Konsole.
 *   Dieses Modul enthält KEINE Import-Map, sondern nur die Orchestrierung.
 *
 * Boot-Order (0–4):
 *   0) tooltips/boot.js
 *   1) infra/sim-bridge.boot.js
 *   2) infra/pointer-bridge.boot.js
 *   3) engine/index.js
 *   4) mount/index.js
 *
 * ModuleMap (Skeleton · für Orientierung & Reviews)
 *
 *  /uid/12-4_support/app/boot/
 *  ├─ bridge.js                 (DIESES Modul · Orchestrator)
 *  ├─ boot.js                   (einziger <script type="module"> Einstieg; importiert ./boot/bridge.js)
 *  ├─ tooltips/
 *  │   ├─ boot.js               (ensureWidgetStyles + ensureTooltips + initCursorTooltip)
 *  │   ├─ index.js              (Styles/Layer idempotent)
 *  │   ├─ tooltip.js            (Cursor-Tooltip; ignoriert Header)
 *  │   └─ tips.js               (bindHeaderTips / bindCardFocusTips; scoped, dispose())
 *  ├─ infra/
 *  │   ├─ sim-bridge.js         (Implementierung: wireSimBridge())
 *  │   ├─ sim-bridge.boot.js    (Verdrahtung: ruft wireSimBridge() genau 1×)
 *  │   ├─ pointer-bridge.js     (Implementierung: wirePointerBridge() → uid:e:sim:pointer)
 *  │   └─ pointer-bridge.boot.js(once: ruft wirePointerBridge() 1×; QA: [pointer-bridge] ready)
 *  ├─ engine/
 *  │   ├─ index.js              (Boot-Engine: Env/Services/Telemetry/MathJax-Init)
 *  │   └─ boot-engine.js        (engine-seed / aktive Engine-Routinen; von index.js importiert)
 *  ├─ mount/
 *  │   ├─ index.js              (Mount-Orchestrator: ruft alle Widget-Mounts sequentiell)
 *  │   ├─ chart.js              (Chart-Mount; Header-Tools; AutoRehydrate)
 *  │   ├─ kpi.live.js           (Live KPIs; Actions; One-Header-Policy)
 *  │   ├─ kpi.key.js            (Key KPIs; Actions; One-Header-Policy)
 *  │   ├─ gridwave.js           (GridWave; Actions; refresh/resize Hook)
 *  │   ├─ params.classic.js     (Parameter Classic)
 *  │   ├─ params.formulas.js    (Parameter Formeln; wartet auf MathJax)
 *  │   ├─ state.visuals.js      (State Visuals; Kandidaten-Fallback)
 *  │   └─ leq.js                (Kern-Gleichung via App-Shims; Adopt-Fallback)
 *  ├─ rehydrate/
 *  │   └─ core.js               (initRehydrate(widget,bus,{id,refresh?}))
 *  ├─ shims/
 *  │   ├─ leq.index.js          (export * from '/uid-e_v1/12-3_presentation/12-34_leq/index.js')
 *  │   └─ leq.actions.js        (export * from '/uid-e_v1/12-3_presentation/12-34_leq/leq.widget-actions.js')
 *  └─ (Legacy/Compat – nicht mehr benutzen, ggf. verschieben/löschen)
 *      ├─ mount/mount-widgets.js
 *      ├─ rehydrate/rehydrate.js
 *      └─ pointer-bridge.js
 *
 * Import-Map (erwartete Aliase · wird NICHT hier definiert)
 *   @uid/app/     → ../12-4_support/app/
 *   @uid/support/ → ../12-4_support/
 *   @uid/base/    → ../12-2_base/
 *   @uid/input/   → ../12-1_input/
 *   @uid/pres/    → ../12-3_presentation/
 *   @uid/widgets  → ../12-4_support/widgets/index.js
 *   @uid/widgets/ → ../12-4_support/widgets/
 *
 * QA-Marker:
 *   [boot] sequence ok (tooltips → sim-bridge → pointer-bridge → engine → mount)
 *   [pointer-bridge] ready
 *   [mount-widgets] <Widget> ready
 */

'use strict';

(async function boot() {
  try {
    // aus /boot/ heraus zu den Nachbarordnern → ../
    await import('../tooltips/boot.js');
    await import('../infra/sim-bridge.boot.js');
    await import('../infra/pointer-bridge.boot.js');
    await import('../engine/index.js');
    await import('../mount/index.js');

    console.info('[boot] sequence ok (tooltips → sim-bridge → pointer-bridge → engine → mount)');
  } catch (e) {
    console.error('[boot] failed:', e);
  }
})();