/*!
 * File:      contracts.js
 * Folder:    12-3_presentation/vectors/core-equation
 * Project:   UID-Explore Presentation Layer · Vector-Tool Living Equation
 * Type:      Model Contracts & Flow Definitions
 * Authors:   B. D. Rausch · A. Heinz
 * Contact:   info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:   CC BY 4.0
 *
 * Created:   2025-09-28
 * Updated:   2025-09-28
 * Version:   0.9.47
 * Changelog: - FLOW_FNS (betaSI_N, sigmaE, gammaI, muI, nuS) · normalizeParams
 */

export const FLOW_FNS = {
  betaSI_N: ({ beta, S, I, N }) => (beta && S!=null && I!=null && N) ? (beta*S*I/N) : 0,
  sigmaE:   ({ sigma, E })      => (sigma && E!=null) ? (sigma*E) : 0,
  gammaI:   ({ gamma, I })      => (gamma && I!=null) ? (gamma*I) : 0,
  muI:      ({ mu, I })         => (mu && I!=null) ? (mu*I) : 0,
  nuS:      ({ nu, S })         => (nu && S!=null) ? (nu*S) : 0,
};

export function normalizeParams(p){
  const out = { ...p };
  const pick = (...keys) => {
    for (const k of keys) { if (out[k] != null) return +out[k]; }
    return undefined;
  };

  const N  = pick('N','population','Population','N0');
  const g  = pick('gamma','γ','Gamma','g') ?? (out.D ? 1/Number(out.D) : undefined);
  const s  = pick('sigma','σ','Sigma','s') ?? (out.L ? 1/Number(out.L) : undefined);
  const mu = pick('mu','μ','Mu');
  const nu = pick('nu','ν','Nu');
  let beta = pick('beta','β','Beta','b');

  const R0 = pick('R0','R_0','R');
  if ((beta==null) && (R0!=null) && (g!=null)) beta = R0 * g;

  return {
    N: N ?? 1,
    beta: beta ?? 0,
    gamma: g ?? 0,
    sigma: s ?? 0,
    mu: mu ?? 0,
    nu: nu ?? 0,
  };
}
