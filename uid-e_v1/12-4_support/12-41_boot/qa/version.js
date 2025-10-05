/*!
 * File:      qa/version.js
 * Project:   UID-Explore · Boot QA
 * Role:      Version aus Datei-Header lesen (cached) → "Vx.y.z" oder null
 * License:   CC BY 4.0
 */
'use strict';
const _cache = new Map();
async function _read(url) {
  if (_cache.has(url)) return _cache.get(url);
  const p = fetch(url, { cache: 'force-cache' })
    .then(r => r.ok ? r.text() : '')
    .catch(() => '');
  _cache.set(url, p);
  return p;
}
function _extractVersion(text) {
  if (!text) return null;
  const patterns = [
    /^\s*\*\s*Version:\s*([Vv]?\d+\.\d+\.\d[.\-\w]*)/m,
    /@version\s+([Vv]?\d+\.\d+\.\d[.\-\w]*)/i,
  ];
  for (const rx of patterns) {
    const m = text.match(rx);
    if (m && m[1]) {
      const raw = String(m[1]).trim();
      return raw.startsWith('V') ? raw : raw.startsWith('v') ? 'V' + raw.slice(1) : 'V' + raw;
    }
  }
  return null;
}
export async function getHeaderVersion(moduleUrl) {
  try {
    const txt = await _read(moduleUrl);
    return _extractVersion(txt);
  } catch {
    return null;
  }
}
