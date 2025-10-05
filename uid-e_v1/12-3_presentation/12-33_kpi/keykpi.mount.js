// Back-Compat Shim: leitet den alten KEY-Mount auf den neuen ESM-Pfad um.
export * from './key/index.js';
export { mountKeyKPI as default } from './key/index.js';
