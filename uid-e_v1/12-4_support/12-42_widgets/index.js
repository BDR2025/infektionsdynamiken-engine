/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Widget Logic (Index)
 * File:     /uid/12-4_support/widgets/index.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamiken.de · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-03
 * Updated:  2025-10-04
 * Version:  1.4.3
 * Changelog:
 *   - v1.4.3  ensureTooltips() einmalig initialisiert (Layer-only, keine globalen Listener).
 *   - v1.4.2  Repo-Polishing: Kopfzeile/Gliederung; One-time Style-Boot bleibt erhalten.
 */

'use strict';

/* 1) Public API */
export { attachWidgetHeader } from './header.js';
export { mountWidgetActions } from './actions.js';
export * as presets          from './registry.js';
export { applyOffState }     from './off-policy.js';

/* 2) Boot (einmalig pro Seite) */
import { ensureWidgetStyles } from './styles.js';
import './hub.js';
import './tooltip.js'; // Cursor-Tooltips (Body/Visuals)
import { ensureTooltips } from './tips.js'; // Layer für Focus/Hover (Header/Cards)

ensureWidgetStyles();
ensureTooltips(document);
