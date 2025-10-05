/*!
 * File:      qa/log.js
 * Project:   UID-Explore · Boot QA
 * Role:      Konsistente Log-Helfer (Version nach "ready")
 * License:   CC BY 4.0
 */
'use strict';
import { getHeaderVersion } from './version.js';
export async function logVersionAfterReady(prefix, label, moduleUrl) {
  try {
    const v = await getHeaderVersion(moduleUrl);
    if (v) console.log(`[${prefix}] ${label} ${v}`);
  } catch {}
}
