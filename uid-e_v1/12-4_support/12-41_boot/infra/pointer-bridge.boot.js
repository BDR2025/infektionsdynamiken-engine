/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Boot Module (ESM)
 * File:     /uid/12-4_support/app/boot/infra/pointer-bridge.boot.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-04
 * Updated:  2025-10-04
 * Version:  1.0.0
 * Changelog:
 *   - v1.0.0  Idempotente Boot-Verdrahtung der Pointer-Bridge (einmalig).
 *
 * Role:
 *   Einmalige Verdrahtung der Pointer-Bridge.
 *   Pre: `/app/boot/infra/pointer-bridge.js` exportiert `wirePointerBridge(bus, opts?)`.
 *
 * ModuleMap (short)
 *   /app/boot/infra/
 *     pointer-bridge.js      (Implementierung)
 *     pointer-bridge.boot.js (dieses Boot-Modul)
 */
'use strict';

import * as EBUS from '../../../12-1_base/bus.js';
import { wirePointerBridge } from './pointer-bridge.js';

try {
  wirePointerBridge(EBUS);
} catch (e) {
  console.warn('[pointer-bridge.boot] failed:', e?.message || e);
}
