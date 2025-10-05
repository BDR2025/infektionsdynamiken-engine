/*!
 * File:      seir.js
 * Folder:    12-3_presentation/vectors/core-equation/model-specs
 * Project:   UID-Explore Presentation Layer · Vector-Tool Living Equation
 * Type:      ModelSpec (SEIR)
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
  id: 'SEIR',
  states: ['S','E','I','R'],
  rows: {
    S: [ {sign:-1, term:'betaSI_N'} ],
    E: [ {sign:+1, term:'betaSI_N'}, {sign:-1, term:'sigmaE'} ],
    I: [ {sign:+1, term:'sigmaE'},   {sign:-1, term:'gammaI'} ],
    R: [ {sign:+1, term:'gammaI'} ],
  },
  flows: ['betaSI_N','sigmaE','gammaI'],
  derivTex: String.raw`\(\beta=R_0\,\gamma\quad \gamma=1/D\quad \sigma=1/L\quad R_{\mathrm{eff}}(t)=R_0\,\frac{S(t)}{N}\)`
};
