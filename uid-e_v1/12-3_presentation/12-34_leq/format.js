/*!
 * File:      format.js
 * Folder:    12-3_presentation/vectors/core-equation
 * Project:   UID-Explore Presentation Layer · Vector-Tool Living Equation
 * Type:      Utility (Locale Number Formatting)
 * Authors:   B. D. Rausch · A. Heinz
 * Contact:   info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:   CC BY 4.0
 *
 * Created:   2025-09-28
 * Updated:   2025-09-28
 * Version:   0.9.47
 * Changelog: - Consistent DE/EN formatting (ints, 3-decimals floats)
 */

export function currentLocale(){ return document.documentElement.lang || 'de'; }

export function fmtFloat(x, d=3){
  if (x==null || Number.isNaN(+x)) return '–';
  return new Intl.NumberFormat(currentLocale(), { minimumFractionDigits:d, maximumFractionDigits:d }).format(+x);
}

export function fmtInt(x){
  if (x==null || Number.isNaN(+x)) return '–';
  return new Intl.NumberFormat(currentLocale(), { maximumFractionDigits:0 }).format(Math.round(+x));
}
