/*!
 * File:      tex-symbolic.js
 * Folder:    12-3_presentation/living equation
 * Project:   UID-Explore Presentation Layer · Living Equation
 * Type:      TeX Builder (Left & Middle · Symbolic)
 * Authors:   B. D. Rausch · A. Heinz
 * License:   CC BY 4.0
 *
 * Created:   2025-09-28
 * Updated:   2025-09-30
 * Version:   0.10.2
 * Changelog:
 *   - LEQ-Anchors ergänzt: leq-a-{S,E,I,R,N,beta,sigma,gamma}
 *   - Term-Wrapper ergänzt: leq-t-{betaSI_N,sigmaE,gammaI,muI,nuS}
 *   - Left/Rows nun mit \class-Wrappern (row-STATE) und Anchors
 *   - Spacing: row-Join von 6pt → 8pt
 */

function lineJoin(lines){ return lines.join('\\\\[8pt]\n'); }
const SPM = (neg, first) => first ? (neg ? '-' : '') : (neg ? '\\, -\\, ' : '\\, +\\, ');

// ---------- Anchors (werden später vom Overlay/Plugins genutzt) ----------
const A = {
  S:     String.raw`\class{leq-a-S}{S}`,
  E:     String.raw`\class{leq-a-E}{E}`,
  I:     String.raw`\class{leq-a-I}{I}`,
  R:     String.raw`\class{leq-a-R}{R}`,
  N:     String.raw`\class{leq-a-N}{N}`,
  beta:  String.raw`\class{leq-a-beta}{\beta}`,
  sigma: String.raw`\class{leq-a-sigma}{\sigma}`,
  gamma: String.raw`\class{leq-a-gamma}{\gamma}`,
};

// ---------- Symbolische Terme mit Ankern & stabilen Struts ----------
const TERM = {
  betaSI_N: () => String.raw`
    \class{term term-beta leq-t-betaSI_N}{
      ${A.beta}\,\dfrac{${A.S}\,${A.I}\vphantom{888}}{${A.N}\vphantom{888}}
    }`,
  sigmaE:   () => String.raw`
    \class{term term-sigma leq-t-sigmaE}{
      ${A.sigma}\,${A.E}
    }`,
  gammaI:   () => String.raw`
    \class{term term-gamma leq-t-gammaI}{
      ${A.gamma}\,${A.I}
    }`,
  // optional für SIRD/SIRV-Varianten
  muI:      () => String.raw`
    \class{term term-mu leq-t-muI}{\mu\,${A.I}}`,
  nuS:      () => String.raw`
    \class{term term-nu leq-t-nuS}{\nu\,${A.S}}`,
};

// Fallback (falls ein unbekannter Term kommt)
function renderTerm(name){
  const f = TERM[name];
  if (f) return f();
  // minimaler Fallback entspricht alter SYM-Form
  switch(name){
    case 'betaSI_N': return String.raw`\beta\,\dfrac{S\,I\vphantom{888}}{N\vphantom{888}}`;
    case 'sigmaE':   return String.raw`\sigma E`;
    case 'gammaI':   return String.raw`\gamma I`;
    case 'muI':      return String.raw`\mu I`;
    case 'nuS':      return String.raw`\nu S`;
    default:         return '';
  }
}

function renderLineSymbolic(items){
  let out = '';
  items.forEach((it, i) => { out += SPM(it.sign < 0, i) + renderTerm(it.term); });
  return out;
}

// ---------- LEFT: d/dt · Zustandsvektor (mit Anchors) ----------
export function texLeft(states){
  const rows = states.map(st => {
    const sym = A[st] || st; // falls unbekanntes Kürzel
    return String.raw`\class{row row-${st}}{${sym}}`;
  }).join(String.raw`\\[2pt]
`);
  return String.raw`\[
\require{html}
\frac{d}{dt}
\begin{pmatrix}
${rows}
\end{pmatrix}
\]`;
}

// ---------- MIDDLE: rechte Seite · symbolisch (mit Row-Wrappern) ----------
export function texMidSymbolic(spec){
  // jede Zeile in ROW-Wrapper -> \class{row row-<STATE>}{ ... }
  const lines = spec.states.map(st => {
    const inner = renderLineSymbolic(spec.rows[st] || []);
    return String.raw`\class{row row-${st}}{${inner}}`;
  });
  return String.raw`\[
\require{html}
\begin{pmatrix}
${lineJoin(lines)}
\end{pmatrix}
\]`;
}

// ---------- Deriv-Zeile ----------
export function texDerivLine(spec){
  if (spec?.derivTex) return spec.derivTex;
  // Hinweis: hier keine Anchors notwendig (nur Referenzformeln)
  return String.raw`\(\beta=R_0\,\gamma\quad \gamma=1/D\quad R_{\mathrm{eff}}(t)=R_0\,\frac{S(t)}{N}\)`;
}
