// Back-Compat Shim: leitet den alten LIVE-Entry auf den neuen ESM-Pfad um.
export * from './live/index.js';
export { mountKPI as default } from './live/index.js';
export { mountKPI as mountKPI } from './live/index.js';
