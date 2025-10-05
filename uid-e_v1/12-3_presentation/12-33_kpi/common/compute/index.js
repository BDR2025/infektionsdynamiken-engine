/*!
 * File:      /12-3_presentation/kpi/common/compute/index.js
 * Project:   UID-Explore · Presentation Layer · KPI Tool — Common · Compute
 * Role:      Aggregator: Public API (Context/Format + STATIC + LIVE)
 * Type:      Open Educational Resource (OER) · ESM
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-03
 * Version:   3.1.0
 * Changelog:
 *   - v3.1.0  Short-Header vereinheitlicht; Public API unverändert.
 *   - v3.0.0  Public API initial: makeContext, LIVE_FORMAT, setLiveFormat, STATIC, LIVE.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1) Public API: Context & Format-State
// ─────────────────────────────────────────────────────────────────────────────
export { makeContext, LIVE_FORMAT, setLiveFormat } from './format.js';

// ─────────────────────────────────────────────────────────────────────────────
// 2) Public API: STATIC & LIVE Maps
// ─────────────────────────────────────────────────────────────────────────────
export { STATIC } from './static.js';
export { LIVE }   from './live.js';

// Hinweis: Intern belassen — resolveFmt, fmtRelAbs, helpers.* (kein Re-Export)
