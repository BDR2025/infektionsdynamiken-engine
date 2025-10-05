/*!
 * File:      sird.js
 * Folder:    12-3_presentation/vectors/core-equation/model-specs
 * Project:   UID-Explore Presentation Layer · Vector-Tool Living Equation
 * Type:      ModelSpec (SIRD)
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
  id: 'SIRD',
  states: ['S','I','R','D'],
  rows: {
    S: [ {sign:-1, term:'betaSI_N'} ],
    I: [ {sign:+1, term:'betaSI_N'}, {sign:-1, term:'gammaI'}, {sign:-1, term:'muI'} ],
    R: [ {sign:+1, term:'gammaI'} ],
    D: [ {sign:+1, term:'muI'} ],
  },
  flows: ['betaSI_N','gammaI','muI'],
  derivTex: String.raw`\(\beta=R_0\,\gamma\quad \gamma=1/D\quad \mu=\text{mortality rate}\)`
};
