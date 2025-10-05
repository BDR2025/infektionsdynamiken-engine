/*!
 * File:      vectors/core/angles.js
 * Project:   UID-Explore (Presentation)
 * Module:    Fixed angles for parameter arrows
 * License:   CC BY 4.0
 */

export function getParamAngles(model = 'SIR') {
  const M = String(model).toUpperCase();
  // Angles in radians (0 = 3 Uhr, -π/2 = 12 Uhr)
  if (M === 'SEIR') {
    return {
      beta:  Math.PI / 3,        // 60°
      gamma: Math.PI,            // 180°
      sigma: 5 * Math.PI / 3     // 300°
    };
  }
  // SIR (β, γ)
  return {
    beta:  Math.PI / 3,          // 60°
    gamma: Math.PI               // 180°
  };
}
