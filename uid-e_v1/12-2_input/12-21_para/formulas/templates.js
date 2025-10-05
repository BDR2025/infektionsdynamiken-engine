/*! 
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Input Layer · Parameter Tool · Formulas
 * File:     /parameters/formulas/templates.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-01
 * Updated:  2025-10-01
 * Version:  6.0.0
 * Changelog:
 *   - v6.0.0 TeX-Vorlagen ausgelagert: rowSym/rowNum + chain_D/R0/beta/gamma/sigma
 *
 * eAnnotation:
 *   Stellt reine TeX-Strings für Symbol- und Zahlenketten bereit (ohne DOM).
 *   Einheitlicher Stil: kompakte "="-Abstände, echte Brüche, Klassen für Live-Update.
 */

/** Einzeilige Gleichungszeile (Symbolebene) */
export const rowSym = (lhs, rhs) =>
  String.raw`\begin{alignedat}{2} & ${lhs} & = & ${rhs} \end{alignedat}`;

/** Einzeilige Gleichungszeile (Zahlenebene) */
export const rowNum = rowSym;

/** D-Kette: D = 1/γ = 1/gammaTxt = dTxt d */
export function chain_D(gammaTxt, dTxt){
  return String.raw`\begin{alignedat}{2}
    & \class{fe-lhs}{D} & = & \tfrac{1}{\class{fe-var fe-gamma}{\gamma}}
      = \tfrac{1}{\class{fev-gamma}{\text{${gammaTxt}}}}
      = \class{fe-res fev-D fe-var fe-D}{\text{${dTxt}}}\,\class{fe-res-unit}{\mathrm{d}}
  \end{alignedat}`;
}

/** R0-Kette: R0 = β/γ = betaTxt/gammaTxt = r0Txt */
export function chain_R0(betaTxt, gammaTxt, r0Txt){
  return String.raw`\begin{alignedat}{2}
    & \class{fe-lhs}{R_0} & = &
      \tfrac{\class{fe-var fe-beta}{\beta}}{\class{fe-var fe-gamma}{\gamma}}
      = \tfrac{\class{fev-beta}{\text{${betaTxt}}}}{\class{fev-gamma}{\text{${gammaTxt}}}}
      = \class{fe-res fev-R0 fe-var fe-R0}{\text{${r0Txt}}}
  \end{alignedat}`;
}

/** beta-Kette: β = R0·γ = r0Txt·gammaTxt = betaTxt d^{-1} */
export function chain_beta(r0Txt, gammaTxt, betaTxt){
  return String.raw`\begin{alignedat}{2}
    & \class{fe-lhs}{\beta} & = &
      \class{fe-var fe-R0}{R_0}\cdot\class{fe-var fe-gamma}{\gamma}
      = \class{fe-prod}{\class{fev-R0}{\text{${r0Txt}}}\,\cdot\,\class{fev-gamma}{\text{${gammaTxt}}}}
      = \class{fe-res fev-beta fe-var fe-beta}{\text{${betaTxt}}}\,\class{fe-res-unit}{\mathrm{d}^{-1}}
  \end{alignedat}`;
}

/** gamma-Kette: γ = β/R0 = betaTxt/r0Txt = gammaTxt d^{-1} */
export function chain_gamma(betaTxt, r0Txt, gammaTxt){
  return String.raw`\begin{alignedat}{2}
    & \class{fe-lhs}{\gamma} & = &
      \tfrac{\class{fe-var fe-beta}{\beta}}{\class{fe-var fe-R_0}{R_0}}
      = \tfrac{\class{fev-beta}{\text{${betaTxt}}}}{\class{fev-R0}{\text{${r0Txt}}}}
      = \class{fe-res fev-gamma fe-var fe-gamma}{\text{${gammaTxt}}}\,\class{fe-res-unit}{\mathrm{d}^{-1}}
  \end{alignedat}`;
}

/** sigma-Kette (SEIR): σ = 1/L = 1/LTxt = sigmaTxt d^{-1} */
export function chain_sigma(LTxt, sigmaTxt){
  return String.raw`\begin{alignedat}{2}
    & \class{fe-lhs}{\sigma} & = &
      \tfrac{1}{L}
      = \tfrac{1}{\class{fev-L}{\text{${LTxt}}}}
      = \class{fe-res fev-sigma fe-var fe-sigma}{\text{${sigmaTxt}}}\,\class{fe-res-unit}{\mathrm{d}^{-1}}
  \end{alignedat}`;
}
