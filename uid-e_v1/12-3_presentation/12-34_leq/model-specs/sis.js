/*!
 * File:      sis.js
 * Folder:    12-3_presentation/vectors/core-equation/model-specs
 * Project:   UID-Explore Presentation Layer · Vector-Tool Living Equation
 * Type:      ModelSpec (SIS)
 * Authors:   B. D. Rausch · A. Heinz
 * Contact:   info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:   CC BY 4.0
 *
 * Created:   2025-09-28
 * Updated:   2025-09-28
 * Version:   0.9.47
 * Changelog: - states/rows/flows + derivTex
 */

export const SPEC = {
  id: 'SIS',
  states: ['S','I'],
  rows: {
    S: [ {sign:-1, term:'betaSI_N'}, {sign:+1, term:'gammaI'} ],
    I: [ {sign:+1, term:'betaSI_N'}, {sign:-1, term:'gammaI'} ],
  },
  flows: ['betaSI_N','gammaI'],
  derivTex: String.raw`\(\beta=R_0\,\gamma\quad \gamma=1/D\)`
};
