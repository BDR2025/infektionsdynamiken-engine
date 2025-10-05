/*!
 * File:      ruler.js
 * Folder:    12-3_presentation/chart/tools
 * Project:   UID-Explore · Chart Tool (Ruler / Maßband)
 * License:   CC BY 4.0
 *
 * Toggle via: uid:e:tool:ruler:toggle { on, scope }
 * P1 = erster Klick, P2 = zweiter Klick, ESC löscht.
 * Snap an Daten (t), zeigt Δt + ΔS/E/I/R (falls vorhanden).
 * Geclippt; Farbe = --uid-hit-color bzw. --series-R (Blau-Fallback).
 */
import { on } from '../../../12-1_base/bus.js';

export function mountRuler(chartRootEl, { widgetEl } = {}) {
  if (!chartRootEl) return () => {};
  if (chartRootEl.querySelector('.uid-ruler-overlay')) return () => {}; // idempotent

  const css = getComputedStyle(chartRootEl);
  const px  = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const PAD = {
    l: px(css.getPropertyValue('--plot-pad-l')) || px(css.getPropertyValue('--chart-pad-left'))   || 44,
    r: px(css.getPropertyValue('--plot-pad-r')) || px(css.getPropertyValue('--chart-pad-right'))  || 18,
    t: px(css.getPropertyValue('--plot-pad-t')) || px(css.getPropertyValue('--chart-pad-top'))    || 12,
    b: px(css.getPropertyValue('--plot-pad-b')) || px(css.getPropertyValue('--chart-pad-bottom')) || 28
  };
  const COLOR =
    getComputedStyle(document.documentElement).getPropertyValue('--uid-hit-color')?.trim() ||
    getComputedStyle(document.documentElement).getPropertyValue('--series-R')?.trim() || '#65AFFF';

  chartRootEl.style.position = chartRootEl.style.position || 'relative';
  const ns  = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.classList.add('uid-ruler-overlay');
  Object.assign(svg.style, { position:'absolute', inset:0, pointerEvents:'none', zIndex:65 });
  chartRootEl.appendChild(svg);

  const g  = document.createElementNS(ns, 'g'); g.setAttribute('class','ruler-layer'); svg.appendChild(g);
  const mk = (t,a={},p=g)=>{ const el=document.createElementNS(ns,t); for(const k in a) el.setAttribute(k,a[k]); p.appendChild(el); return el; };
  const clear = ()=>{ while(g.firstChild) g.firstChild.remove(); };

  let enabled=false, series=null, width=1, height=1, xDomain=[0,1], yDomain=[0,1];
  let P1=null, P2=null;

  function recompute(){
    if (!series?.t?.length) return;
    const r = chartRootEl.getBoundingClientRect();
    width  = Math.max(1, r.width);
    height = Math.max(1, r.height);
    xDomain = [series.t[0], series.t[series.t.length-1]];
    const yMax = Math.max(series.N || 0, series.S?.[0] || 0, series.E?.[0] || 0, series.I?.[0] || 0, series.R?.[0] || 0);
    yDomain = [0, yMax || 1];
  }
  const xPx  = x => PAD.l + (x - xDomain[0])/(xDomain[1]-xDomain[0]) * (width - PAD.l - PAD.r);
  const yPx  = y => PAD.t + (height - PAD.t - PAD.b) - (y - yDomain[0])/(yDomain[1]-yDomain[0]) * (height - PAD.t - PAD.b);
  const pxToX= px=> xDomain[0] + (px - PAD.l)/(width - PAD.l - PAD.r) * (xDomain[1]-xDomain[0]);

  function nearestIndex(t){
    if (!series?.t?.length) return 0;
    let lo=0, hi=series.t.length-1, x=+t;
    while (lo<hi){ const mid=(lo+hi)>>1; if (series.t[mid] < x) lo=mid+1; else hi=mid; }
    if (lo>0 && Math.abs(series.t[lo-1]-x) < Math.abs(series.t[lo]-x)) return lo-1;
    return lo;
  }
  const valAt = (i,k)=> Array.isArray(series?.[k]) ? series[k][Math.max(0,Math.min(series[k].length-1,i))] : undefined;

  function render(){
    clear(); if (!enabled || !series?.t?.length) return;

    // Clip
    let defs = svg.querySelector('defs'); if(!defs){ defs=document.createElementNS(ns,'defs'); svg.insertBefore(defs, svg.firstChild); }
    let cp = defs.querySelector('#ruler-clip'); if(!cp){ cp=document.createElementNS(ns,'clipPath'); cp.id='ruler-clip'; defs.appendChild(cp); cp.appendChild(document.createElementNS(ns,'rect')); }
    const rc = cp.firstElementChild; rc.setAttribute('x',PAD.l); rc.setAttribute('y',PAD.t);
    rc.setAttribute('width', width - PAD.l - PAD.r); rc.setAttribute('height', height - PAD.t - PAD.b);
    g.setAttribute('clip-path','url(#ruler-clip)');

    // Crosshair P1
    if (P1 && !P2){
      const x = xPx(P1.t), y = yPx(P1.y || 0);
      mk('line',{x1:x,y1:PAD.t,x2:x,y2:height-PAD.b,stroke:COLOR,'stroke-dasharray':'2 3','stroke-width':1.5,opacity:.9});
      mk('line',{x1:PAD.l,y1:y,x2:width-PAD.r,y2:y,stroke:COLOR,'stroke-dasharray':'2 3','stroke-width':1.5,opacity:.4});
      mk('text',{x:x+6,y:PAD.t+12,'text-anchor':'start','font-size':11,fill:'#bcd7ff'}).textContent = `${(P1.t).toFixed(1)} d`;
    }

    // Strecke P1–P2
    if (P1 && P2){
      const x1=xPx(P1.t), x2=xPx(P2.t);
      mk('line',{x1:x1,y1:PAD.t,x2:x1,y2:height-PAD.b,stroke:COLOR,'stroke-dasharray':'2 3','stroke-width':1.2,opacity:.6});
      mk('line',{x1:x2,y1:PAD.t,x2:x2,y2:height-PAD.b,stroke:COLOR,'stroke-dasharray':'2 3','stroke-width':1.2,opacity:.6});
      mk('line',{x1:x1,y1:height-PAD.b-8,x2:x2,y2:height-PAD.b-8,stroke:COLOR,'stroke-width':2,opacity:.8});

      const dt = +(P2.t - P1.t).toFixed(1);
      const keys = ['S','E','I','R'].filter(k => Array.isArray(series?.[k]));
      const deltas = keys.map(k => `${k}: ${Math.round((P2[k] ?? 0) - (P1[k] ?? 0))}`).join('   ');
      mk('text',{x:(x1+x2)/2,y:height-PAD.b-14,'text-anchor':'middle','font-size':11,fill:'#fff','font-variant-numeric':'tabular-nums'})
        .textContent = `Δt=${dt} d   ${deltas}`;
    }
  }

  function pickPoint(evt){
    const rect = chartRootEl.getBoundingClientRect();
    const px = evt.clientX - rect.left;
    const t  = Math.max(xDomain[0], Math.min(xDomain[1], pxToX(px)));
    const i  = nearestIndex(t);
    return {
      t: series.t[i],
      S: valAt(i,'S'), E: valAt(i,'E'), I: valAt(i,'I'), R: valAt(i,'R'),
      y: valAt(i,'I') ?? valAt(i,'E') ?? valAt(i,'S') ?? 0
    };
  }

  function onClick(evt){
    if (!enabled || !series?.t?.length) return;
    if (!P1){ P1 = pickPoint(evt); P2 = null; render(); return; }
    if (!P2){ P2 = pickPoint(evt); render(); return; }
    P1 = pickPoint(evt); P2=null; render();
  }
  function onKey(evt){ if (enabled && evt.key === 'Escape'){ P1=null; P2=null; render(); } }

  on('uid:e:tool:ruler:toggle', ({ on, scope }) => {
    if (scope && scope!==widgetEl) return;
    enabled = !!on;
    if (!enabled){ P1=null; P2=null; clear(); }
    else { recompute(); render(); }
  }, { replay:true });

  on('uid:e:data:series', s => { series=s; recompute(); if(enabled) render(); }, { replay:true });
  on('uid:e:viz:resize',  () => { recompute(); if(enabled) render(); }, { replay:true });
  window.addEventListener('resize', () => { recompute(); if(enabled) render(); }, { passive:true });

  // Klick-Layer ganz oben (damit Klicks garantiert ankommen)
  const hit = document.createElement('div');
  Object.assign(hit.style,{ position:'absolute', inset:0, cursor:'crosshair', pointerEvents:'auto', zIndex:70 });
  chartRootEl.appendChild(hit);
  hit.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);

  return () => { try{hit.remove();}catch{} try{svg.remove();}catch{} window.removeEventListener('keydown', onKey); };
}

export default { mountRuler };
