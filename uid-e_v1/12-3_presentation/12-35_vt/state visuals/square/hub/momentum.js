/*!
 * File:      square/hub/momentum.js
 * License:   CC BY 4.0
 * Version:   1.1.2
 * Changes:
 *  - Larger row spacing (rows at 0.36 / 0.74 of core height)
 *  - Fixed baselines and arrow anchors independent of current r
 *  - Safe clamp for r to avoid touching labels/arrows
 */

'use strict';

export function drawMomentum(ctx, box, M, unit){
  const { x,y,w,h } = box;

  // Ruhigere Rows
  const rowTop    = y + h * 0.36;
  const rowBottom = y + h * 0.74;

  const colLeft   = x + w * 0.28;
  const colRight  = x + w * 0.72;

  const present = M.present;

  const minSide  = Math.min(w,h);
  const rmin     = Math.max(8,  Math.round(minSide * 0.08));
  const rmaxBase = Math.max(22, Math.round(minSide * 0.14));  // leicht höheres Max
  const gamma    = 0.7;

  // Baseline-Offsets (fix)
  const gapLbl       = Math.max(6, Math.round(minSide * 0.045));
  const arrowBaseOff = Math.max(10, Math.round(rmaxBase + 4));
  const arrowLenMax  = Math.max(10, Math.round(rmaxBase * 1.5));

  // Safe-Radius: keine Überlappung mit Label/Pfeil möglich
  const rowGap = rowBottom - rowTop;
  const safeR  = Math.max(
    rmin,
    Math.min(
      rmaxBase,
      Math.floor(rowGap/2 - gapLbl - arrowLenMax - 6)
    )
  );

  const C = { S:getVar('--c-s','#34d399'), E:getVar('--c-e','#f59e0b'), I:getVar('--c-i','#ef4444'), R:getVar('--c-r','#60a5fa') };
  const eps = (unit==='ppd') ? 0.005 : 0.5;
  const fmt = (v) => {
    const vv = (Math.abs(v) < eps) ? 0 : v;
    if (unit==='ppd') return `${vv>=0?'+':''}${vv.toFixed(2)} pp/d`;
    return formatAbsPerDay(vv);
  };

  const pos = planPositions(present, {rowTop,rowBottom,colLeft,colRight});

  for (const k of present){
    const cx = pos[k].x, cy = pos[k].y;
    const rVal = M.rates[k] ?? 0;
    const mag  = Math.min(Math.abs(rVal)/(M.cap || 1), 1);
    const r    = Math.min(safeR, rmin + Math.pow(mag, gamma) * (rmaxBase - rmin));

    // Punkt
    ctx.beginPath(); ctx.fillStyle=C[k];
    ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();

    // Pfeil: Anker unabhängig vom aktuellen r
    ctx.beginPath();
    ctx.strokeStyle='rgba(255,255,255,0.95)';
    ctx.lineWidth = Math.max(1, Math.round(r * 0.35));
    const al = Math.max(10, Math.round(r * 1.5));
    if (rVal > 0){
      const y0 = cy - arrowBaseOff, y1 = y0 - al*0.65;
      ctx.moveTo(cx, y0); ctx.lineTo(cx, y1);
      ctx.moveTo(cx, y1); ctx.lineTo(cx - al*0.18, y1 + al*0.25);
      ctx.moveTo(cx, y1); ctx.lineTo(cx + al*0.18, y1 + al*0.25);
    } else {
      const y0 = cy + arrowBaseOff, y1 = y0 + al*0.65;
      ctx.moveTo(cx, y0); ctx.lineTo(cx, y1);
      ctx.moveTo(cx, y1); ctx.lineTo(cx - al*0.18, y1 - al*0.25);
      ctx.moveTo(cx, y1); ctx.lineTo(cx + al*0.18, y1 - al*0.25);
    }
    ctx.stroke();

    // Label / Rate an fixen Linien (wandern NICHT mit r)
    ctx.font = `${Math.max(9, Math.round(minSide*0.07))}px ui-sans-serif, system-ui`;
    ctx.textAlign='center'; ctx.textBaseline='bottom';
    ctx.fillStyle='rgba(255,255,255,0.88)';
    ctx.fillText(k, cx, cy - (rmaxBase + gapLbl));

    ctx.font = `${Math.max(9, Math.round(minSide*0.07))}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New"`;
    ctx.textAlign='center'; ctx.textBaseline='top';
    ctx.fillStyle='rgba(255,255,255,0.88)';
    ctx.fillText(fmt(rVal), cx, cy + (rmaxBase + gapLbl));
  }
}

/* helpers */
function planPositions(present, {rowTop,rowBottom,colLeft,colRight}){
  const P = {};
  if (present.length === 4){
    P.S = {x:colLeft,  y:rowTop};
    P.E = {x:colRight, y:rowTop};
    P.I = {x:colLeft,  y:rowBottom};
    P.R = {x:colRight, y:rowBottom};
    return P;
  }
  if (present.length === 3){
    const keys = present.slice();
    const top = keys.slice(0,2), bottom = keys.slice(2);
    const mid = (colLeft+colRight)/2;
    P[top[0]]    = {x: mid - 40, y: rowTop};
    P[top[1]]    = {x: mid + 40, y: rowTop};
    P[bottom[0]] = {x: mid,      y: rowBottom};
    return P;
  }
  if (present.length === 2){ const mid=(colLeft+colRight)/2; return { [present[0]]:{x:mid-40,y:(rowTop+rowBottom)/2}, [present[1]]:{x:mid+40,y:(rowTop+rowBottom)/2} }; }
  if (present.length === 1){ const midX=(colLeft+colRight)/2, midY=(rowTop+rowBottom)/2; return { [present[0]]:{x:midX,y:midY} }; }
  return P;
}

function getVar(name, fb){ try{ const v=getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v||fb; }catch{ return fb; } }
function formatAbsPerDay(x){ const s=x>=0?'+':'-'; const v=Math.abs(x); if(v>=1e6)return`${s}${(v/1e6).toFixed(2)} M/d`; if(v>=1e3)return`${s}${(v/1e3).toFixed(2)} k/d`; return `${s}${v.toFixed(0)}/d`; }

export default { drawMomentum };
