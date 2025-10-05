/*!
 * File:      square/hybrid/core.js
 * Module:    UID-V · Hybrid Core (Square ring via SVG path dashes)
 * License:   CC BY 4.0
 * Version:   1.2.0
 */

'use strict';

export function createHybrid(host, opts = {}) {
  if (!host) throw new Error('[UID-V Hybrid] host missing');
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

  const svg = ns('svg');
  Object.assign(svg.style, { position:'absolute', inset:'0', width:'100%', height:'100%', display:'block', pointerEvents:'none' });
  host.appendChild(svg);

  const gRoot=ns('g'), gTrack=ns('g'), gSegs=ns('g');
  gRoot.setAttribute('class','uidv-ring-group');
  svg.appendChild(gRoot); gRoot.appendChild(gTrack); gRoot.appendChild(gSegs);

  const pTrack=ns('path'); gTrack.appendChild(pTrack);
  const segPaths=[ns('path'), ns('path'), ns('path'), ns('path')]; segPaths.forEach(p=>gSegs.appendChild(p));

  let series=null, idx=0, L=0, T=12, pathD='';
  const START_F = 0.07;

  const ro=new ResizeObserver(()=>{ layout(); redraw(); }); ro.observe(host);
  layout();

  function layout(){
    const r=host.getBoundingClientRect(), w=Math.max(1,r.width|0), h=Math.max(1,r.height|0);
    const half=Math.min(w,h)*0.5, MARGIN=6, baseR=Math.max(24, half-MARGIN);
    const T_pre=Math.max(6, Math.round(baseR*0.09)); T=T_pre;
    const inset=MARGIN + T/2, x=inset, y=inset, ww=Math.max(2,w-inset*2), hh=Math.max(2,h-inset*2);
    const rc=Math.max(6, Math.round(Math.min(ww,hh)*0.09));
    pathD=roundedRectPathTopStart(x,y,ww,hh,rc);

    pTrack.setAttribute('d', pathD);
    pTrack.setAttribute('fill','none');
    pTrack.setAttribute('stroke-width', String(T));
    pTrack.setAttribute('stroke-linecap','butt');
    pTrack.setAttribute('stroke-linejoin','round');
    pTrack.setAttribute('stroke', getVar('--uidv-ring-bg','rgba(255,255,255,.08)'));

    for (const p of segPaths){
      p.setAttribute('d', pathD);
      p.setAttribute('fill','none');
      p.setAttribute('stroke-width', String(T));
      p.setAttribute('stroke-linecap','butt');
      p.setAttribute('stroke-linejoin','round');
    }
    try { L=pTrack.getTotalLength(); } catch { L=Math.max(ww*2+hh*2,1); }
  }

  function redraw(){
    const S=series; if (!S || !Array.isArray(S.t) || !S.t.length){ segPaths.forEach(p=>p.setAttribute('stroke','none')); return; }
    const i=Math.max(0, Math.min(idx|0, S.t.length-1));
    const v=k => (Array.isArray(S[k]) ? Number(S[k][i]||0) : 0);

    const Sabs=v('S'), Eabs=v('E'), Iabs=v('I'), Rabs=v('R');
    const Nsum=(Sabs+Eabs+Iabs+Rabs)||1;
    let s=Sabs/Nsum, e=Eabs/Nsum, ii=Iabs/Nsum, r=Rabs/Nsum;
    let sum=s+e+ii+r; if (!Number.isFinite(sum)||sum<=0){ s=e=ii=r=0; sum=1; }
    s/=sum; e/=sum; ii/=sum; r/=sum;

    const colors={ S:getVar('--c-s','#34d399'), E:getVar('--c-e','#f59e0b'), I:getVar('--c-i','#ef4444'), R:getVar('--c-r','#60a5fa') };
    const segs=[]; if (s>0) segs.push({frac:s,col:colors.S}); if (e>0) segs.push({frac:e,col:colors.E});
    if (ii>0) segs.push({frac:ii,col:colors.I}); if (r>0) segs.push({frac:r,col:colors.R});

    segPaths.forEach(p=>{ p.setAttribute('stroke','none'); p.removeAttribute('stroke-dasharray'); p.removeAttribute('stroke-dashoffset'); });
    if (!L || segs.length===0) return;

    const baseOffset=START_F*L; let offset=0;
    for (let k=0; k<segs.length && k<segPaths.length; k++){
      const sp=segPaths[k], isLast=(k===segs.length-1);
      const len=isLast ? (L - offset) : Math.max(0, Math.min(L, segs[k].frac*L));
      sp.setAttribute('stroke', segs[k].col);
      sp.setAttribute('stroke-dasharray', `${len} ${L}`);
      sp.setAttribute('stroke-dashoffset', String(-(offset+baseOffset)));
      offset+=len;
    }
  }

  function update(payload={}){ if ('series' in payload) series=payload.series || payload?.state?.series || series;
    if ('idx' in payload && Number.isFinite(payload.idx)) idx=payload.idx|0; redraw(); }

  function dispose(){ try{ ro.disconnect(); }catch{} try{ host.contains(svg)&&host.removeChild(svg);}catch{} }

  redraw();
  return { update, dispose };

  // helpers
  function ns(n){ return document.createElementNS('http://www.w3.org/2000/svg', n); }
  function getVar(name, fb){ try{ const v=getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v||fb; }catch{ return fb; } }
  function roundedRectPathTopStart(x,y,w,h,r){
    const cx=x+w/2, y0=y, x1=x+w, y1=y+h; const xr=Math.max(0,Math.min(r,w/2)), yr=Math.max(0,Math.min(r,h/2));
    return ['M',cx,y0,'H',x1-xr,'A',xr,yr,0,0,1,x1,y0+yr,'V',y1-yr,'A',xr,yr,0,0,1,x1-xr,y1,'H',x+xr,'A',xr,yr,0,0,1,x,y1-yr,'V',y0+yr,'A',xr,yr,0,0,1,x+xr,y0,'H',cx].join(' ');
  }
}

export default { createHybrid };
