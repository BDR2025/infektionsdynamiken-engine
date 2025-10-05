/*!
 * File:      tex-numeric.js
 * Folder:    12-3_presentation/vectors/core-equation
 * Project:   UID-Explore Presentation Layer · Vector-Tool Living Equation
 * Type:      TeX Builder (Right · Numeric mirror of symbolic)
 * Authors:   B. D. Rausch · A. Heinz
 * Contact:   info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:   CC BY 4.0
 *
 * Created:   2025-09-28
 * Updated:   2025-09-28
 * Version:   0.9.47
 * Changelog: - Numeric terms with classes (coef/num-Z/num-N), row wrappers
 */


import { fmtFloat, fmtInt } from './format.js';

const NUM = {
  betaSI_N: (v) => String.raw`\class{term term-beta}{\class{coef}{\mathrm{${fmtFloat(v.beta)}}}\,\dfrac{\class{num num-Z}{\mathrm{${fmtInt(v.S)}}\,\mathrm{${fmtInt(v.I)}}}\vphantom{888}}{\class{num num-N}{\mathrm{${fmtInt(v.N)}}}\vphantom{888}}}`,
  sigmaE:   (v) => String.raw`\class{term term-sigma}{\class{coef}{\mathrm{${fmtFloat(v.sigma)}}}\,\class{num num-E}{\mathrm{${fmtInt(v.E)}}}}`,
  gammaI:   (v) => String.raw`\class{term term-gamma}{\class{coef}{\mathrm{${fmtFloat(v.gamma)}}}\,\class{num num-I}{\mathrm{${fmtInt(v.I)}}}}`,
  muI:      (v) => String.raw`\class{term term-mu}{\class{coef}{\mathrm{${fmtFloat(v.mu)}}}\,\class{num num-I}{\mathrm{${fmtInt(v.I)}}}}`,
  nuS:      (v) => String.raw`\class{term term-nu}{\class{coef}{\mathrm{${fmtFloat(v.nu)}}}\,\class{num num-S}{\mathrm{${fmtInt(v.S)}}}}`,
};

const SPM = (neg, first) => first ? (neg ? '-' : '') : (neg ? '\\, -\\, ' : '\\, +\\, ');

function renderLineNumeric(items, vals){
  let out = '';
  items.forEach((it, i) => { out += SPM(it.sign < 0, i) + (NUM[it.term] ? NUM[it.term](vals) : ''); });
  return out;
}

function lineJoin(lines){ return lines.join('\\\\[6pt]\n'); }

export function texNumeric(spec, vals){
  // jede Zeile in ROW-Wrapper -> \class{row row-<STATE>}{ ... }
  const lines = spec.states.map(st => {
    const inner = renderLineNumeric(spec.rows[st] || [], vals);
    return String.raw`\class{row row-${st}}{${inner}}`;
  });
  return String.raw`\[
\require{html}
\begin{pmatrix}
${lineJoin(lines)}
\end{pmatrix}
\]`;
}
