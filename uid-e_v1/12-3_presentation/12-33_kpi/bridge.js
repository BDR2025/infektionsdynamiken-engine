/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Presentation Layer · KPI Tool · Bridge (Public API)
 * File:     /12-3_presentation/kpi/bridge.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-03
 * Updated:  2025-10-03
 * Version:  3.1.0
 * Changelog:
 *   - v3.0.1  MAP-Dateinamen an Projektstruktur angepasst (kpi.live.widget-actions.js / kpi.key.widget-actions.js).
 *   - v3.0.0  Erstversion der Bridge (Public API). MAP hinzugefügt. Re-Exports für live/key/common.
 *
 * MAP (Struktur & Imports):
 *   /12-3_presentation/kpi/
 *     bridge.js                     # diese Datei (Public API)
 *     live/
 *       index.js                    # mountLiveKPI(...)  – LIVE = 4 Spalten (forceCols:4)
 *       kpi.live.widget-actions.js  # Header/Actions für LIVE
 *     key/
 *       index.js                    # mountKeyKPI(...)   – KEY  = 2 Spalten (forceCols:2)
 *       renderer.js                 # statische Karten
 *       kpi.key.widget-actions.js   # Header/Actions für KEY
 *     common/
 *       compute/
 *         format.js                 # Formatter/Context/LIVE_FORMAT
 *         helpers.js                # numerische Ableitungen
 *         static.js                 # STATIC-Map (model:update)
 *         live.js                   # LIVE-Map   (sim:data)
 *         index.js                  # Aggregator (Public API)
 *         extras.js                 # Synthese-Extras (SIS/SIRD/SIRV)
 *       style/
 *         controller.js             # JS-only Style Controller (Guard + forceCols)
 *         css.js                    # CSS-Generator
 *         tokens.js                 # Defaults & Accents
 *         icons.js                  # SVG-Icons
 *         classify.js               # Kartenklassifikation
 *       registry.js                 # Labels & Orders (DE/EN) – inkl. KEY-Gruppen
 *       tooltips.js                 # KPI-Tooltips (DE/EN; School/Uni)
 *       wiring.js                   # Topics & Alias-Bridge (kpi ↔ keykpi)
 *
 *   Import-Map (Beispiel, nur in bridge.js dokumentiert):
 *     {
 *       "imports": {
 *         "/uid-e_v1/12-3_presentation/kpi":         "/12-3_presentation/kpi/bridge.js",
 *         "/uid-e_v1/12-3_presentation/kpi/live":    "/12-3_presentation/kpi/live/index.js",
 *         "/uid-e_v1/12-3_presentation/kpi/key":     "/12-3_presentation/kpi/key/index.js",
 *         "/uid-e_v1/12-3_presentation/kpi/common/": "/12-3_presentation/kpi/common/"
 *       }
 *     }
 *
 *   Public API (über @uid/pres/kpi):
 *     import {
 *       mountLiveKPI, mountKeyKPI, attachKPIStyle, makeContext, LIVE, STATIC,
 *       getRegistry, kpiLabel, kpiTooltip, KPI_TOPICS, KEYKPI_TOPICS,
 *       wireKPIAliases, mountKPIWiring
 *     } from "/uid-e_v1/12-3_presentation/kpi";
 *
 * eAnnotation:
 *   Schlanke Brücke für konsistente Exporte. Interne Dateien können weiter
 *   relativ importieren; Consumer nutzen bevorzugt diese Bridge + Import-Map.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1) Live/Key Mounts
// ─────────────────────────────────────────────────────────────────────────────
export { mountKPI as mountLiveKPI } from './live/index.js';
export { mountKeyKPI }              from './key/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// 2) Style Controller (JS-only, Guard + forceCols)
// ─────────────────────────────────────────────────────────────────────────────
export { default as attachKPIStyle } from './common/style/controller.js';

// ─────────────────────────────────────────────────────────────────────────────
// 3) Compute (Formatter/Context + STATIC/LIVE)
// ─────────────────────────────────────────────────────────────────────────────
export { makeContext, LIVE_FORMAT, setLiveFormat } from './common/compute/index.js';
export { STATIC }                                  from './common/compute/index.js';
export { LIVE }                                    from './common/compute/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// 4) Registry & Tooltips
// ─────────────────────────────────────────────────────────────────────────────
export { getRegistry, kpiLabel } from './common/registry.js';
export { kpiTooltip }            from './common/tooltips.js';

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
export {
  KPI_TOPICS,
  KEYKPI_TOPICS,
  wireKPIAliases,
  mountKPIWiring
} from './common/wiring.js';
