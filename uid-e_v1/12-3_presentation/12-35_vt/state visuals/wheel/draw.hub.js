/*!
 * File:      vectors/core/draw.hub.js
 * Project:   Understanding Infection Dynamics · Infektionsdynamiken verstehen
 * Type:      Open Educational Resource (OER)
 * Authors:   B. D. Rausch · A. Heinz
 * License:   CC BY 4.0
 * Version:   1.0.0
 * Note:      Mini-Disc so klein wie nötig; verdeckt Nadelfuß; zentriertes t-Label
 */

export function measureMiniDisc(ctx, tStr, thickness, rOuter, rInnerBase, rHubBase){
  // t-Text messen (monospace wird im Orchestrator gesetzt)
  ctx.save();
  ctx.font = '600 13px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  const tm = ctx.measureText(tStr);
  const tW = (tm.actualBoundingBoxRight - tm.actualBoundingBoxLeft) || tm.width || 40;
  const tH = (tm.actualBoundingBoxAscent + tm.actualBoundingBoxDescent) || 16;
  ctx.restore();

  const DISC_PAD = 6;
  const rText    = Math.hypot(tW/2, tH/2) + DISC_PAD;
  const rHub     = Math.max(12, rHubBase);
  const rInner   = Math.min(rHub - 10, rText);

  return { rInner, rHubOutline: Math.max(rInner+10, rHub) };
}

export function drawHubBlock(ctx, { cx, cy, tStr, disc }){
  const { rInner, rHubOutline } = disc;

  // gefüllte Mini-Disc (verdeckt Nadelfuß)
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, rInner, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill();

  // feine Hub-Konturen
  ctx.beginPath(); ctx.arc(cx, cy, rHubOutline, 0, Math.PI*2);
  ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, rInner, 0, Math.PI*2);
  ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.10)'; ctx.stroke();
  ctx.restore();

  // t-Label (ruhig, mit minimalem Shadow)
  ctx.save();
  ctx.font = '600 13px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 1;
  ctx.fillText(tStr, cx, cy);
  ctx.restore();
}
