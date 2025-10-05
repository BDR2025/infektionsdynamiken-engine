/*!
 * File:      vectors/core/draw.segments.js
 * Project:   Understanding Infection Dynamics · Infektionsdynamiken verstehen
 * Type:      Open Educational Resource (OER)
 * Authors:   B. D. Rausch · A. Heinz
 * License:   CC BY 4.0
 * Version:   1.0.0
 * Note:      Malt den farbigen S/E/I/R-Ring (Anteile 0..1 aus prepareSnapshot)
 */

import { TOK, clamp, fracAt } from './draw.util.js';

export function drawSegments(ctx, prep) {
  const { cx, cy, rOuter, thickness, series, i } = prep;

  // Anteile an Index i
  const S = fracAt(series,'S',i);
  const E = fracAt(series,'E',i);
  const I = fracAt(series,'I',i);
  const Rf= fracAt(series,'R',i);
  let sum = S + E + I + Rf; if (sum <= 1e-9) sum = 1;

  // Ring-Track (dezent)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rOuter, 0, Math.PI*2);
  ctx.lineWidth = thickness;
  ctx.strokeStyle = 'rgba(255,255,255,.06)';
  ctx.stroke();
  ctx.restore();

  // farbige Segmente (Start 12 Uhr, cw)
  const segs = [
    { col:TOK.S(), val:S/sum },
    { col:TOK.E(), val:E/sum },
    { col:TOK.I(), val:I/sum },
    { col:TOK.R(), val:Rf/sum },
  ].filter(s => s.val > 1e-6);

  let a = -Math.PI/2;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  for (const seg of segs) {
    const a0 = a, a1 = a + seg.val * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, a0, a1);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = seg.col;
    ctx.stroke();
    a = a1;
  }
}
