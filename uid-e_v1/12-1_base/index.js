/*!
 * File:     core/index.js
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 * Type:     Open Educational Resource (OER)
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-09-26
 * Updated:  2025-09-26
 * Version:  v1.0.0
 * Changelog:
 *   - v1.0.0 Initial barrel file for UID-E Base
 */

// ============================================================================
// Barrel File für die Base-Schicht
// ============================================================================
// Stellt die zentralen Exporte des Kernsystems bereit.
// Entwickler: Keine Logik hinzufügen, keine Seiteneffekte einbauen.
// Nur gezielt Exporte aus uid.js, bus.js oder weiteren Core-Modulen.
// ============================================================================

// Director-Fabrik (createUID) initialisiert den Kern
export { createUID } from './uid.js';

// Event-Bus wird als Namensraum weitergereicht
export * as bus from './bus.js';
