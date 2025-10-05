/*!
 * File:      vectors/core/draw.arrows.js
 * Project:   Understanding Infection Dynamics · Infektionsdynamiken verstehen
 * Type:      Open Educational Resource (OER)
 * Authors:   B. D. Rausch · A. Heinz
 * License:   CC BY 4.0
 * Version:   1.0.1
 * Changelog: - v1.0.1 rInnerFinal aus Orchestrator verwenden (statt rInnerBase),
 *                     damit Nadeln korrekt starten und dynamisch wirken
 *            - v1.0.0 Nadeln enden vor dem Außenring; Labels innen & seitlich
 */

import { TOK } from './draw.util.js';
import { getParamAngles } from './angles.js';

export function drawArrows(ctx, prep) {
  // NEU: finaler Innenradius aus dem Orchestrator (fallback: base)
  const { cx, cy, rOuter, thickness, rInnerFinal, rInnerBase, model, n } = prep;
  const rInner = Number.isFinite(rInnerFinal) ? rInnerFinal : rInnerBase;

  const M = String(model||'SIR').toUpperCase();
  const angles = getParamAngles(M);

  // Norm-Verstärkung für bessere Sichtbarkeit
  const boost = (v) => Math.pow(v, 0.6);

  function arrow(angle, active, label, normRaw){
    if (!active || !Number.isFinite(angle)) return;

    const nVis = boost(normRaw);

    // Länge: Start knapp hinter Mini-Disc, Ende mit Sicherheitsabstand vor Außenring
    const start  = rInner + 6;                    // NIE unter die Disc
    const minEnd = rInner + 16;
    const maxEnd = rOuter - thickness * 0.28;     // NIE an den Außenring
    const end    = minEnd + (maxEnd - minEnd) * nVis;

    // Strichdicke spürbar variieren
    const lwMin  = Math.max(2.0, thickness * 0.22);
    const lwMax  = Math.max(lwMin, thickness * 0.48);
    const lw     = lwMin + (lwMax - lwMin) * nVis;

    // Geometrie
    const dx = Math.cos(angle), dy = Math.sin(angle);
    const x1 = cx + dx * start, y1 = cy + dy * start;
    const x2 = cx + dx * end,   y2 = cy + dy * end;

    const col = TOK.AUX();

    // Schaft + Spitze
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = col;
    ctx.lineWidth   = lw;
    ctx.lineCap     = 'round';
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x2,y2, Math.max(2.4, thickness*0.22), 0, Math.PI*2); ctx.fill();

    // Label: innen & seitlich (nicht auf dem Schaft, nie am Ring)
    const labelInset = 12;                       // nach innen von der Spitze
    const sideOffset = 8;                        // seitlicher Versatz (Normalvektor)
    const nx = -dy, ny = dx;                     // 90°-Versatz zum Schaft
    const lx = x2 - labelInset*dx + sideOffset*nx;
    const ly = y2 - labelInset*dy + sideOffset*ny;

    ctx.font = '600 14px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,.35)';
    ctx.shadowBlur  = 1;
    ctx.fillStyle   = col;
    ctx.fillText(label, lx, ly);
    ctx.restore();
  }

  // SIR: β,γ — SEIR: β,γ,σ  (σ nur in SEIR sichtbar)
  arrow(angles.beta,  (M==='SIR'||M==='SEIR'), 'β', n?.beta ?? 0.5);
  arrow(angles.gamma, (M==='SIR'||M==='SEIR'), 'γ', n?.gamma ?? 0.5);
  if (M==='SEIR' && 'sigma' in angles) {
    arrow(angles.sigma, true, 'σ', n?.sigma ?? 0.5);
  }

  return true;
}
