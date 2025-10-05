/*!
 * File:      square/hub/header.js
 * License:   CC BY 4.0
 */

'use strict';

export function drawHeaderBand(ctx, box, M){
  const { x,y,w,h } = box;
  const barH = Math.max(4, Math.round(h*0.22));

  // Reff links
  const rW = Math.max(60, Math.round(w*0.38));
  drawReffBar(ctx, x, y, rW, barH, M.reff, {
    low:getVar('--uidv-reff-low','#2EC27E'),
    mid:getVar('--uidv-reff-mid','#FFFFFF'),
    high:getVar('--uidv-reff-high','#EF4444')
  });
  ctx.font = `${Math.max(9, Math.round(h*0.32))}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New"`;
  ctx.textAlign='left'; ctx.textBaseline='top'; ctx.fillStyle='rgba(255,255,255,0.88)';
  ctx.fillText(`Rₑff ${Number.isFinite(M.reff)?M.reff.toFixed(2):'–'}`, x, y + barH + 4);

  // Zeit progress rechts
  const zW = Math.max(60, Math.round(w*0.38));
  const zX = x + w - zW;
  const frac = (M.T>0) ? Math.max(0, Math.min(1, M.t/M.T)) : 0;
  drawProgressBar(ctx, zX, y, zW, barH, frac);

  ctx.textAlign='right'; ctx.textBaseline='top'; ctx.fillStyle='rgba(255,255,255,0.85)';
  ctx.fillText(`t ${formatDay(M.t)} d`, zX + zW, y + barH + 4);
}

export function drawReffBar(ctx, x, y, w, h, reff, col){
  const RMAX=3.0, EPS=0.01;
  ctx.save();
  roundedRectPath(ctx, x, y, w, h, Math.min(6, h*0.5));
  ctx.fillStyle='rgba(255,255,255,0.16)'; ctx.fill();

  const tx=x + (w*(1/RMAX));
  ctx.fillStyle = col?.mid || '#fff';
  ctx.fillRect(Math.round(tx)+0.5, y, 1, h);

  const val=Number(reff); let c=col?.mid||'#fff';
  if (Number.isFinite(val)){ if (val>1+EPS) c=col?.high||'#f00'; else if (val<1-EPS) c=col?.low||'#0f0'; }
  const p = Number.isFinite(val) ? Math.max(0, Math.min(1, val/RMAX)) : 0.5;
  ctx.fillStyle=c; roundedRectPath(ctx, x, y, w*p, h, Math.min(6, h*0.5)); ctx.fill();
  ctx.restore();
}

export function drawProgressBar(ctx, x, y, w, h, frac){
  const p = Math.max(0, Math.min(1, frac));
  ctx.save();
  roundedRectPath(ctx, x, y, w, h, Math.min(6, h*0.5));
  ctx.fillStyle='rgba(255,255,255,0.16)'; ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.85)';
  roundedRectPath(ctx, x, y, w*p, h, Math.min(6, h*0.5)); ctx.fill();
  ctx.restore();
}

/* helpers */
function roundedRectPath(ctx,x,y,w,h,r){ const rr=Math.max(0,r||0); ctx.beginPath();
  ctx.moveTo(x+rr,y); ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr);
  ctx.arcTo(x,y+h,x,y,rr); ctx.arcTo(x,y,x+w,y,rr); ctx.closePath(); }
function getVar(name, fb){ try{ const v=getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v||fb; }catch{ return fb; } }
function formatDay(n){ try{ return Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }catch{ return String(Math.round(n*100)/100); } }

export default { drawHeaderBand };
