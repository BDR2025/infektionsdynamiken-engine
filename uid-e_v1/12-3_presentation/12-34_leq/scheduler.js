/*!
 * File:      scheduler.js
 * Folder:    12-3_presentation/vectors/core-equation
 * Project:   UID-Explore Presentation Layer · Vector-Tool Living Equation
 * Type:      Utility (Throttle Scheduler)
 * Authors:   B. D. Rausch · A. Heinz
 * Contact:   info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:   CC BY 4.0
 *
 * Created:   2025-09-28
 * Updated:   2025-09-28
 * Version:   0.9.47
 * Changelog: - Throttle helper tuned for smooth numeric feed
 */

export function schedule(fn, ms = 120){
  let t = null, pending = false;
  return (...args) => {
    if (t) { pending = true; return; }
    t = setTimeout(() => {
      t = null;
      fn(...args);
      if (pending) { pending = false; fn(...args); }
    }, ms);
  };
}
