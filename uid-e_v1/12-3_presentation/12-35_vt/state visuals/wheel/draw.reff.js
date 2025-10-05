/*!
 * File:      vectors/core/draw.reff.js
 * Project:   Understanding Infection Dynamics · Infektionsdynamiken verstehen
 * Type:      Open Educational Resource (OER)
 * Authors:   B. D. Rausch · A. Heinz
 * License:   CC BY 4.0
 * Version:   1.0.0
 * Note:      Reff darf bis zum Außenring; Farbe >1 rot / =1 weiß / <1 grün
 */

import { clamp } from './draw.util.js';

export function drawReff(ctx, prep){
  const { cx, cy, rOuter, thickness, S, params } = prep;
  const p = params || {};
  const eps = 1e-9;

  // R0_eff * S(t)
  const hasBG = Number.isFinite(p.beta) && Number.isFinite(p.gamma) && p.gamma > eps;
  const R0b   = hasBG ? (p.beta/p.gamma) : (Number.isFinite(p.R0) ? p.R0 : 3);
  const meas  = Number.isFinite(p.measures) ? p.measures : 0;
  const R0e   = Math.max(0, R0b*(1 - meas));
  const Reff  = Math.max(0, R0e*S);

  const Lfrac = Math.max(0, Math.min(1, R0e > eps ? (Reff / R0e) : 0));
  const L     = (rOuter - 2) * Lfrac;     // Reff darf bis an den Außenring

  const col = (Reff > 1 + 1e-3) ? '#ef4444' : (Math.abs(Reff - 1) <= 1e-3) ? '#ffffff' : '#22c55e';

  // 12-Uhr-Winkel
  const ang = -Math.PI/2;
  const x2  = cx + Math.cos(ang)*L;
  const y2  = cy + Math.sin(ang)*L;

  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth   = Math.max(2, thickness*0.25);
  ctx.lineCap     = 'round';
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(x2,y2, Math.max(2.2, thickness*0.22), 0, Math.PI*2); ctx.fill();
  ctx.restore();

  return true;
}
