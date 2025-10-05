// Back-Compat Shim: leitet die alten LIVE-Actions auf den neuen ESM-Pfad um.
export * from './live/kpi.live.widget-actions.js';
export { mountKPIActions as default } from './live/kpi.live.widget-actions.js';
