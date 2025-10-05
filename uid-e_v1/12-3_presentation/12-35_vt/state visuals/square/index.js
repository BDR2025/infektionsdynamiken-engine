/*!
 * File:      state visuals/square/index.js
 * Module:    UID-V · Square Orchestrator (Hub + Hybrid)
 * License:   CC BY 4.0
 * Version:   3.1.0
 */

'use strict';

import { createHybrid }   from './hybrid/core.js';
import { drawHeaderBand } from './hub/header.js';
import { drawMomentum }   from './hub/momentum.js';
import { drawFooterBand } from './hub/footer.js';
import { computeMetrics } from './math/rates.js';

export async function createSquare(host, opts = {}) {
  if (!host) throw new Error('[UID-V Square] host missing');
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

  injectNeonCSS();

  // Außenring (SVG)
  const hybrid = createHybrid(host, {});

  // Hub (Canvas)
  const hub = document.createElement('canvas');
  Object.assign(hub.style, { position:'absolute', inset:'0', width:'100%', height:'100%', display:'block', pointerEvents:'none' });
  host.appendChild(hub);
  const ctx = hub.getContext('2d', { alpha:true, desynchronized:true });

  // State
  let snapIn   = { series:null, idx:0, params:{}, model:'SIR', ranges:{} };
  let mode     = readLS('uidv:square:mode','momentum');    // 'momentum'|'flows'|'delta'
  let rateUnit = readLS('uidv:square:rateunit','ppd');     // 'ppd'|'absd'
  let raf = 0, destroyed = false;

  const ro = new ResizeObserver(()=> schedule()); ro.observe(host);
  function schedule(){ if (!raf && !destroyed) raf = requestAnimationFrame(()=>{ raf=0; draw(); }); }

  function sizeCanvas(){
    const r = host.getBoundingClientRect();
    const w = Math.max(1, r.width|0), h = Math.max(1, r.height|0);
    const dpr = Math.max(1, window.devicePixelRatio||1);
    hub.width = Math.round(w*dpr); hub.height = Math.round(h*dpr);
    hub.style.width = w+'px'; hub.style.height = h+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    return { w,h };
  }

  function draw(){
    const { w,h } = sizeCanvas();
    ctx.clearRect(0,0,w,h);

    // Ring press-fit (siehe hybrid), innen Hub mit Bands
    const OUT_MARGIN = 6;                                             // wie hybrid
    const ringT      = Math.max(6, Math.round(Math.min(w,h)*0.5*0.09));
    const GAP        = 8;                                             // Neon-Schlitz
    const inset      = OUT_MARGIN + ringT + GAP;

    const side = Math.max(90, Math.min(w,h) - inset*2);
    const x = (w - side)/2, y = (h - side)/2;
    const rad = Math.max(10, Math.round(side * 0.10));

    roundedRectPath(ctx, x, y, side, side, rad);
    ctx.fillStyle = getVar('--uidv-hub-bg','rgba(0,0,0,0.55)');
    ctx.fill();

    const pad       = Math.max(8, Math.round(side*0.08));
    const bandHHead = Math.max(22, Math.round(side*0.16));            // Header-Band
    const bandHFoot = Math.max(24, Math.round(side*0.18));            // Footer-Band (größer)
    const gutter    = Math.max(10, Math.round(side*0.06));            // mehr Abstand

    const headerBox = { x: x+pad, y: y+pad,               w: side-2*pad, h: bandHHead };
    const footerBox = { x: x+pad, y: y+side-pad-bandHFoot, w: side-2*pad, h: bandHFoot };
    const coreBox   = { x: x+pad,
                        y: headerBox.y + bandHHead + gutter,
                        w: side-2*pad,
                        h: footerBox.y - (headerBox.y + bandHHead + gutter) - gutter };

    // Metriken
    const M = computeMetrics(snapIn, rateUnit);

    // Zeichnen
    drawHeaderBand(ctx, headerBox, M);
    if (mode === 'momentum') {
      drawMomentum(ctx, coreBox, M, rateUnit);
    } else if (mode === 'delta') {
      drawMomentum(ctx, coreBox, M, rateUnit); // Platzhalter
    } else {
      drawMomentum(ctx, coreBox, M, rateUnit); // Platzhalter
    }
    drawFooterBand(ctx, footerBox, M, rateUnit);
  }

  // Orchestrator API
  function update(next){
    snapIn = {
      series: next.series || next?.state?.series || snapIn.series,
      idx:    Number.isFinite(next.idx) ? next.idx|0 : (Number.isFinite(snapIn.idx)?snapIn.idx:0),
      params: next.params || snapIn.params,
      model:  next.model  || snapIn.model,
      ranges: next.ranges || snapIn.ranges
    };
    hybrid.update({ series: snapIn.series, idx: snapIn.idx });
    schedule();
  }
  function dispose(){ destroyed=true; try{ ro.disconnect(); }catch{} try{ hybrid?.dispose?.(); }catch{} try{ host.contains(hub)&&host.removeChild(hub);}catch{} }

  // Burger-Hooks
  function getMode(){ return mode; }
  function setMode(m){ const next=(m==='momentum'||m==='flows'||m==='delta')?m:'momentum'; mode=next; writeLS('uidv:square:mode',next); schedule(); }
  function getRateUnit(){ return rateUnit; }
  function setRateUnit(u){ const next=(u==='ppd'||u==='absd')?u:'ppd'; rateUnit=next; writeLS('uidv:square:rateunit',next); schedule(); }

  schedule();
  return { update, dispose, getMode, setMode, getRateUnit, setRateUnit };
}

/* ---------------- helpers ---------------- */
function roundedRectPath(ctx,x,y,w,h,r){ const rr=Math.max(0,r||0); ctx.beginPath();
  ctx.moveTo(x+rr,y); ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr);
  ctx.arcTo(x,y+h,x,y,rr); ctx.arcTo(x,y,x+w,y,rr); ctx.closePath(); }
function getVar(name, fb){ try{ const v=getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v||fb; }catch{ return fb; } }
function readLS(k, def){ try{ return localStorage.getItem(k) ?? def; }catch{ return def; } }
function writeLS(k, v){ try{ localStorage.setItem(k,v); }catch{} }
function injectNeonCSS(){
  const ID='uidv-square-neon-css'; if (document.getElementById(ID)) return;
  const s=document.createElement('style'); s.id=ID; s.textContent = `
    .uidv-ring-group{
      --neon-outer: rgba(255,255,255,.12);
      --neon-inner: rgba(255,255,255,.06);
      filter: drop-shadow(0 0 6px var(--neon-outer)) drop-shadow(0 0 14px var(--neon-inner));
    }`; document.head.appendChild(s);
}

export default { createSquare };
