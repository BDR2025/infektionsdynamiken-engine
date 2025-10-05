/*! 
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Boot Module (ESM)
 * File:     /uid/12-4_support/app/boot.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-04
 * Updated:  2025-10-04
 * Version:  1.0.1
 * Changelog:
 *   - v1.0.1  Importpfad relativ gemacht (`./boot/bridge.js`).
 *   - v1.0.0  Boot-ESM Bridge eingeführt: delegiert an /app/boot/bridge.js.
 *
 * eAnnotation:
 *   Minimaler ESM-Einstiegspunkt des Support Layers. Lädt die Bridge (Composition Root),
 *   die den Boot-Flow orchestriert (tooltips → infra → engine → mount). 
 *   Keine Seiteneffekte außer dem Import – bewusst schlank halten.
 *
 * ModuleMap (short):
 *   /app/boot/
 *     boot.js                (dieses Modul)
 *     bridge.js              (Composition Root · Boot-Sequenz 0–4)
 *     infra/
 *       sim-bridge.boot.js  → sim-bridge.js
 *       pointer-bridge.boot.js → pointer-bridge.js
 *     engine/
 *       index.js            → boot-engine.js
 *     mount/
 *       index.js            → chart.js · kpi.live.js · kpi.key.js · gridwave.js ·
 *                             params.classic.js · params.formulas.js · state.visuals.js · leq.js
 *     rehydrate/
 *       core.js
 *     tooltips/
 *       boot.js · index.js · tooltip.js · tips.js
 *
 * QA-Marker (kommen aus bridge/mount):
 *   [boot] sequence ok (tooltips → sim-bridge → pointer-bridge → engine → mount)
 *   [pointer-bridge] ready
 *   [mount-widgets] <Widget> ready
 */
'use strict';

import './boot/bridge.js';
