/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Boot Module (ESM)
 * File:     /uid/12-4_support/app/boot/engine/index.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-04
 * Updated:  2025-10-04
 * Version:  1.0.0
 * Changelog:
 *   - v1.0.0  Engine-Shim konsolidiert: lädt ./boot-engine.js zentral aus /app/boot/engine/.
 *
 * Role:
 *   Engine unter /app/boot/engine/ zentralisieren. Dieses Shim delegiert auf boot-engine.js.
 *   So kann die Engine-Initialisierung künftig hier wachsen, ohne Importpfade anderswo anzupassen.
 *
 * ModuleMap (short)
 *   /app/boot/engine/
 *     index.js        (dieses Shim)
 *     boot-engine.js  (Engine-Init + Seeds)
 */
'use strict';

import './boot-engine.js';
