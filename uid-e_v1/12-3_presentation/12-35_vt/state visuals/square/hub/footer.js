/*!
 * File:      square/hub/footer.js
 * License:   CC BY 4.0
 * Version:   1.2.0
 * Changes:
 *  - Group-centering (bullet + text) with clamp to box width
 *  - Clip to footer band; slightly larger, crisper typography
 */

'use strict';

export function drawFooterBand(ctx, box, M, unit){
  const { x,y,w,h } = box;
  const best = topRank(M.rates, M.present);

  const txt = best
    ? (unit==='ppd'
       ? `Top Δ: ${best.key} ${best.r>=0?'↑':'↓'} ${Math.abs(best.r).toFixed(2)} pp/d`
       : `Top Δ: ${best.key} ${best.r>=0?'↑':'↓'} ${formatAbsPerDay(Math.abs(best.r))}`)
    : 'Top Δ: –';

  // Clip auf Band, damit nichts rausmalt
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();

  // Typo
  const fontPx = Math.max(12, Math.round(h * 0.40));
  ctx.font = `${fontPx}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New"`;
  ctx.textBaseline = 'middle';
  const m = ctx.measureText(txt);

  // Bullet + Text Gruppe berechnen
  const padX    = Math.max(10, Math.round(w * 0.05));
  const bulletR = Math.max(4, Math.round(fontPx * 0.35));
  const gap     = Math.max(8, Math.round(fontPx * 0.60));
  const groupW  = (best ? (bulletR*2 + gap) : 0) + m.width;

  // Gruppe zentrieren, dann in [x+padX, x+w-padX] clampen
  let groupLeft = x + (w - groupW)/2;
  const minLeft = x + padX;
  const maxLeft = x + w - padX - groupW;
  groupLeft = Math.max(minLeft, Math.min(maxLeft, groupLeft));

  const cy      = y + h/2;
  const bulletX = groupLeft + (best ? bulletR : 0);
  const textX   = best ? (groupLeft + bulletR*2 + gap) : groupLeft;

  // Bullet (nur wenn best vorhanden)
  if (best){
    const C = { S:getVar('--c-s','#34d399'), E:getVar('--c-e','#f59e0b'), I:getVar('--c-i','#ef4444'), R:getVar('--c-r','#60a5fa') };
    ctx.beginPath();
    ctx.fillStyle = C[best.key] || 'rgba(255,255,255,0.92)';
    ctx.arc(bulletX, cy, bulletR, 0, Math.PI*2);
    ctx.fill();
  }

  // Text
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText(txt, textX, cy);

  ctx.restore();
}

/* helpers */
function topRank(rates, present){ let b=null; for (const k of present){ const v=rates[k]; if (v===undefined) continue; if (!b||Math.abs(v)>Math.abs(b.r)) b={key:k,r:v}; } return b; }
function formatAbsPerDay(x){ const s=x>=0?'+':'-'; const v=Math.abs(x); if(v>=1e6)return`${s}${(v/1e6).toFixed(2)} M/d`; if(v>=1e3)return`${s}${(v/1e3).toFixed(2)} k/d`; return `${s}${v.toFixed(0)}/d`; }
function getVar(name, fb){ try{ const v=getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v||fb; }catch{ return fb; } }

export default { drawFooterBand };
