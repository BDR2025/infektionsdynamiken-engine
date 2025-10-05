/*!
 * File:      index.js
 * Folder:    12-3_presentation/vectors/core-equation/model-specs
 * Project:   UID-Explore Presentation Layer · Vector-Tool Living Equation
 * Type:      ModelSpecs Barrel (getSpec)
 * Authors:   B. D. Rausch · A. Heinz
 * Contact:   info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:   CC BY 4.0
 *
 * Created:   2025-09-28
 * Updated:   2025-09-28
 * Version:   0.9.47
 * Changelog: - Exports SEIR, SIR, SIS, SIRD, SIRV · getSpec()
 */

import { SPEC as SEIR } from './seir.js';
import { SPEC as SIR  } from './sir.js';
import { SPEC as SIS  } from './sis.js';
import { SPEC as SIRD } from './sird.js';
import { SPEC as SIRV } from './sirv.js';

const MAP = { SEIR, SIR, SIS, SIRD, SIRV };

export function getSpec(model){
  const key = String(model||'SEIR').toUpperCase();
  return MAP[key] || SEIR;
}

export { SEIR, SIR, SIS, SIRD, SIRV };
