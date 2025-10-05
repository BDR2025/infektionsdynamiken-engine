/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Boot Module (ESM)
 * File:     /uid/12-4_support/app/boot/infra/sim-bridge.boot.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-04
 * Updated:  2025-10-04
 * Version:  1.0.0
 * Changelog:
 *   - v1.0.0  Idempotente Boot-Verdrahtung der Sim-Bridge (einmalig).
 *
 * Role:
 *   Verdrahtet die Sim-Bridge genau 1× (idempotent).
 *   Pre: /app/boot/infra/sim-bridge.js exportiert `function wireSimBridge(){...}`.
 *
 * ModuleMap (short)
 *   /app/boot/infra/
 *     sim-bridge.boot.js   (dieses Boot-Modul; ruft wireSimBridge() 1×)
 *     sim-bridge.js        (Implementierung der Playback-/Pointer-Brücke)
 */
'use strict';

import { wireSimBridge } from './sim-bridge.js';

if (!window.__uidSimBridge) {
  try {
    wireSimBridge();
    // Hinweis: Der Ready-Marker kommt aus sim-bridge.js selbst ([sim-bridge] ready)
  } catch (e) {
    console.warn('[sim-bridge.boot] failed:', e?.message || e);
  }
}
