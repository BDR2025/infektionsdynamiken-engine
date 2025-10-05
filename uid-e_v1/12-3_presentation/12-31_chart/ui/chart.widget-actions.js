/*!
 * File:      chart.widget-actions.js
 * Folder:    12-3_presentation/chart/ui
 * Project:   UID-Explore · Chart Widget — Header Actions
 * License:   CC BY 4.0
 *
 * Purpose:
 *   - Unverändert: Globaler Burger (Integrator Euler/Heun/RK4) + ✓-Status-Broadcaster.
 *   - WA-Buttons (globals): %/# (Scale), HIT (Herdimmunität), R (Ruler · Maßband).
 *   - Ruler: Console-Fix fest verdrahtet (Seeding, Capture-Listener, Inline-Overlay, Dedupe).
 *   - HIT: Overlay (leicht) + Seed vor Toggle; kein Doppel-Mount.
 *   - Idempotent & robust: kein Doppel-Mount / keine doppelten Buttons; keine Boot-Änderungen nötig.
 *
 * Exports:
 *   - named:   mountChartWidgetActions
 *   - default: mountChartWidgetActions
 */

import * as EBUS from '../../../12-1_base/bus.js';
import { setBurgerMenu } from '/uid-e_v1/12-4_support/12-42_widgets/header.js';

/* FIX (WP3 · path only):
   /uid-e_v1/12-4_support/wa/dom.js  →  /uid-e_v1/12-4_support/12-42_widgets/wa/dom.js */
import { ensureSlots, measureAndApply } from '/uid-e_v1/12-4_support/12-42_widgets/wa/dom.js';

function resolveWidget(hostEl){
  return hostEl?.closest?.('.uid-widget') || hostEl;
}

const MOUNTED = new WeakSet(); // ein Mount pro Widget

export function mountChartWidgetActions(widgetEl){
  const widget = resolveWidget(widgetEl);
  const DEFAULT_KIND = 'rk4';
  if (!widget) return { dispose(){} };

  // Head-Guard: wenn bereits initialisiert, sofort raus
  const head = widget.querySelector('.uidw-head') || widget;
  if (head.dataset.waChartInit === '1' || MOUNTED.has(widget)) {
    return { dispose(){} };
  }
  head.dataset.waChartInit = '1';
  MOUNTED.add(widget);

  /* ──────────────────────────────────────────────────────────
   * 0) Hilfsfunktionen (Seed, Dedupe, Utils)
   * ────────────────────────────────────────────────────────── */
  function seedParamsIfEmpty(modelUpper){
    const last = EBUS.getLast?.('uid:e:model:params');
    if (last && +last.R0 > 0) return last;
    const P = { R0: 3, gamma: 0.2, N: 1_000_000, I0: 10, T: 180, dt: 0.5, model: modelUpper };
    EBUS.emit('uid:e:model:params', P);
    return P;
  }
  function seedSeriesIfEmpty(P){
    const last = EBUS.getLast?.('uid:e:data:series');
    if (last && Array.isArray(last.t) && last.t.length > 1 && last.N) return last;
    // synthetische SIR-Serie (Euler)
    const n=Math.max(2, Math.round(P.T/P.dt)),
          t=Array.from({length:n+1},(_,i)=>i*P.dt),
          S=new Array(n+1), I=new Array(n+1), R=new Array(n+1);
    S[0]=P.N-P.I0; I[0]=P.I0; R[0]=0;
    const beta=P.R0*P.gamma;
    for (let i=1;i<=n;i++){
      const s=S[i-1], ii=I[i-1], inf=beta*s*ii/P.N, rec=P.gamma*ii;
      S[i]=s-P.dt*inf; I[i]=ii+P.dt*(inf-rec); R[i]=R[i-1]+P.dt*rec;
      if (S[i]<0) S[i]=0; if (I[i]<0) I[i]=0; if (R[i]>P.N) R[i]=P.N;
    }
    const SERS = { t, S, I, R, N:P.N };
    EBUS.emit('uid:e:data:series', SERS);
    return SERS;
  }
  function dedupeOverlays(root, cls){
    const ovs = root ? [...root.querySelectorAll(`.${cls}`)] : [];
    if (ovs.length > 1) ovs.slice(0, -1).forEach(n => { try{ n.remove(); }catch{} });
  }
  const px = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

  // HIT-Farbe auf Serie R setzen (Fallback Blau)
  try {
    document.documentElement.style.setProperty(
      '--uid-hit-color',
      getComputedStyle(document.documentElement).getPropertyValue('--series-R')?.trim() || '#65AFFF'
    );
  } catch {}

  /* ──────────────────────────────────────────────────────────
   * 1) Globaler Burger (Integrator) — ORIGINAL belassen
   * ────────────────────────────────────────────────────────── */
  setBurgerMenu(widget, {
    title: 'Integrator wählen',
    columns: 1,
    sections: [{
      title: 'Integrator',
      items: [
        { role:'radio', group:'integrator', value:'euler', label:'Euler',
          selected:false, onSelect: () => EBUS.emit('uid:e:integrator:set', { kind:'euler' }) },
        { role:'radio', group:'integrator', value:'heun',  label:'Heun',
          selected:false, onSelect: () => EBUS.emit('uid:e:integrator:set', { kind:'heun'  }) },
        { role:'radio', group:'integrator', value:'rk4',   label:'RK4',
          selected:true,  onSelect: () => EBUS.emit('uid:e:integrator:set', { kind:'rk4'   }) }
      ]
    }],
    statusEvent: 'uid:e:integrator:status',
    stateFrom:   (s) => (s && s.kind ? { integrator: s.kind } : {})
  });

  const unsubSet = EBUS.on('uid:e:integrator:set', (p) => {
    try { EBUS.emit('uid:e:integrator:status', { kind: p?.kind ?? DEFAULT_KIND }); } catch {}
  });
  queueMicrotask(() => { try { EBUS.emit('uid:e:integrator:status', { kind: DEFAULT_KIND }); } catch {} });

  /* ──────────────────────────────────────────────────────────
   * 2) WA-Buttons (globals): %/# + HIT + R — idempotent & dedupe
   * ────────────────────────────────────────────────────────── */
  const slots = ensureSlots(widget, { separator: 'auto' });
  const globals = slots?.globals;
  if (!globals){
    return { dispose(){ try { unsubSet?.(); } catch {} } };
  }

  function dedupeAll(id, label){
    const all = head.querySelectorAll(`.wa-btn[data-wa="${id}"], .uidw-head .wa-btn`);
    const matches = Array.from(all).filter(btn => {
      if (btn.dataset.wa === id) return true;
      const txt = (btn.textContent||'').trim();
      return (!btn.dataset.wa && txt === label);
    });
    if (matches.length > 1){
      const keep = matches.find(b => b.offsetParent !== null) || matches[0];
      matches.forEach(b => { if (b !== keep) try{ b.remove(); } catch {} });
      return keep;
    }
    return matches[0] || null;
  }
  function ensureButton(id, label, title){
    let btn = dedupeAll(id, label) || globals.querySelector(`.wa-btn[data-wa="${id}"]`);
    if (!btn){
      btn = document.createElement('button');
      btn.type='button'; btn.className='wa-btn'; btn.dataset.wa=id;
      if (title) btn.title = title;
      btn.innerHTML = `<span class="wa-txt">${label}</span>`;
      globals.appendChild(btn);
    } else {
      const fresh = btn.cloneNode(true);
      btn.replaceWith(fresh);
      btn = fresh;
      btn.dataset.wa = id;
    }
    return btn;
  }

  // %/# (Scale)
  let scaleMode = 'abs';
  const btnScale = ensureButton('scale','%/#','Skala umschalten: Prozent ↔ Absolut');
  const syncScale = () => btnScale.setAttribute('aria-pressed', String(scaleMode === 'pct'));
  btnScale.addEventListener('click', () => {
    scaleMode = (scaleMode === 'pct') ? 'abs' : 'pct';
    EBUS.emit('uid:e:viz:scale:set',     { mode: scaleMode, scope: widget });
    EBUS.emit('uid:e:viz:scale:changed', { mode: scaleMode, scope: widget });
    syncScale();
  });
  const unsubScale = EBUS.on('uid:e:viz:scale:changed', ({ mode, scope }) => {
    if (scope && scope !== widget) return;
    if (mode === 'pct' || mode === 'abs'){ scaleMode = mode; syncScale(); }
  });
  syncScale();

  // HIT (SIS = disabled)
  let hitOn = false;
  const modelUpper = (document.documentElement.dataset.model || 'SIR').toUpperCase();
  const btnHIT = ensureButton('hit','HIT', modelUpper==='SIS' ? 'HIT ist für SIS nicht definiert' : 'Herdimmunität anzeigen');
  if (modelUpper === 'SIS') btnHIT.disabled = true;
  const syncHIT = () => btnHIT.setAttribute('aria-pressed', String(!!hitOn));
  syncHIT();

  btnHIT.addEventListener('click', () => {
    if (btnHIT.disabled) return;
    const want = !hitOn;
    const P = seedParamsIfEmpty(modelUpper);
    seedSeriesIfEmpty(P);
    const lastSc = EBUS.getLast?.('uid:e:viz:scale:changed');
    if (lastSc?.mode) EBUS.emit('uid:e:viz:scale:changed', { mode:lastSc.mode, scope: widget });
    requestAnimationFrame(() => {
      hitOn = want; syncHIT();
      EBUS.emit('uid:e:lines:hit:toggle', { on: hitOn, scope: widget });
      if (hitOn) EBUS.emit('uid:e:kpi:pulse', { kind:'HIT', scope: widget });
    });
  });
  const unsubHit = EBUS.on('uid:e:lines:hit:toggle', ({ on, scope }) => {
    if (scope && scope !== widget) return;
    if (typeof on === 'boolean'){ hitOn = on; syncHIT(); }
  });

  // --- Ruler (Maßband) · Console-Fix in Code gegossen -----------------------
  const btnRUL = ensureButton('ruler','R','Maßband / Ruler');
  let rulerOn = false;
  const syncRUL = () => btnRUL.setAttribute('aria-pressed', String(rulerOn));

  // Ruler-Overlay inline (ohne externe Datei; idempotent)
  function mountInlineRuler(chartRootEl){
    if (!chartRootEl || chartRootEl.querySelector('.uid-ruler-overlay')) return;

    const css = getComputedStyle(chartRootEl);
    const PAD = {
      l: px(css.getPropertyValue('--plot-pad-l')) || px(css.getPropertyValue('--chart-pad-left'))   || 44,
      r: px(css.getPropertyValue('--plot-pad-r')) || px(css.getPropertyValue('--chart-pad-right'))  || 18,
      t: px(css.getPropertyValue('--plot-pad-t')) || px(css.getPropertyValue('--chart-pad-top'))    || 12,
      b: px(css.getPropertyValue('--plot-pad-b')) || px(css.getPropertyValue('--chart-pad-bottom')) || 28
    };
    const COLOR =
      getComputedStyle(document.documentElement).getPropertyValue('--uid-hit-color')?.trim() ||
      getComputedStyle(document.documentElement).getPropertyValue('--series-R')?.trim() ||
      '#65AFFF';

    chartRootEl.style.position = chartRootEl.style.position || 'relative';
    const ns  = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.classList.add('uid-ruler-overlay');
    Object.assign(svg.style, { position:'absolute', inset:0, pointerEvents:'none', zIndex:100 });
    chartRootEl.appendChild(svg);

    const g  = document.createElementNS(ns, 'g'); g.setAttribute('class','ruler-layer'); svg.appendChild(g);
    const mk = (t,a={},p=g)=>{ const el=document.createElementNS(ns,t); for(const k in a) el.setAttribute(k,a[k]); p.appendChild(el); return el; };
    const clear = ()=>{ while(g.firstChild) g.firstChild.remove(); };

    let enabled=false, series=null, width=1, height=1, xDom=[0,1], yDom=[0,1];
    let P1=null, P2=null;

    function recompute(){
      if (!series?.t?.length) return;
      const r = chartRootEl.getBoundingClientRect();
      width  = Math.max(1, r.width);
      height = Math.max(1, r.height);
      xDom = [series.t[0], series.t[series.t.length-1]];
      const yMax = Math.max(series.N || 0, series.S?.[0] || 0, series.E?.[0] || 0, series.I?.[0] || 0, series.R?.[0] || 0);
      yDom = [0, yMax || 1];
    }
    const xPx  = x => PAD.l + (x - xDom[0])/(xDom[1]-xDom[0]) * (width - PAD.l - PAD.r);
    const yPx  = y => PAD.t + (height - PAD.t - PAD.b) - (y - yDom[0])/(yDom[1]-yDom[0]) * (height - PAD.t - PAD.b);
    const pxToX= pxv=> xDom[0] + (pxv - PAD.l)/(width - PAD.l - PAD.r) * (xDom[1]-xDom[0]);

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
      const rc = cp.firstChild; rc.setAttribute('x',PAD.l); rc.setAttribute('y',PAD.t);
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
      const pxv = evt.clientX - rect.left;
      const t  = Math.max(xDom[0], Math.min(xDom[1], pxToX(pxv)));
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

    const opt={ replay:true };
    EBUS.on('uid:e:tool:ruler:toggle', ({ on, scope }) => { if (scope && scope!==widget) return; enabled = !!on; if (!enabled){ P1=null; P2=null; clear(); } else { recompute(); render(); } }, opt);
    EBUS.on('uid:e:data:series',  s => { series=s; recompute(); if(enabled) render(); }, opt);
    EBUS.on('uid:e:viz:resize',   () => { recompute(); if(enabled) render(); }, opt);
    window.addEventListener('resize', () => { recompute(); if(enabled) render(); }, { passive:true });

    // Klick-Layer ganz oben (damit Klicks garantiert ankommen)
    const hit = document.createElement('div');
    Object.assign(hit.style,{ position:'absolute', inset:0, cursor:'crosshair', pointerEvents:'auto', zIndex:110 });
    chartRootEl.appendChild(hit);
    hit.addEventListener('click', onClick);
    window.addEventListener('keydown', onKey);
  }

  // Chart-Root & Overlay bereitstellen
  const chartRoot =
    widget.querySelector('#chart-host') ||
    widget.querySelector('[data-chart-root]') ||
    document.getElementById('chart-host');

  if (chartRoot) {
    dedupeOverlays(chartRoot, 'uid-ruler-overlay');
    // Inline-Overlay + Hit-Layer sofort einmal montieren
    mountInlineRuler(chartRoot);
  }

  // Capture-Click → garantiertes Toggle + Seed + Mount (wie Console-Fix)
  const onRClickCapture = (ev) => {
    ev.stopImmediatePropagation?.();
    const want = btnRUL.getAttribute('aria-pressed') !== 'true';
    // Seed vor Toggle
    const P = seedParamsIfEmpty(modelUpper);
    seedSeriesIfEmpty(P);
    // Sicherstellen, dass Overlay existiert
    if (chartRoot) { mountInlineRuler(chartRoot); }
    // Toggle im nächsten Frame
    requestAnimationFrame(() => {
      rulerOn = want; syncRUL();
      EBUS.emit('uid:e:tool:ruler:toggle', { on: rulerOn, scope: widget });
    });
  };
  btnRUL.addEventListener('click', onRClickCapture, { capture: true });
  const unsubRuler = EBUS.on('uid:e:tool:ruler:toggle', ({ on, scope }) => {
    if (scope && scope !== widget) return;
    if (typeof on === 'boolean') { rulerOn = on; syncRUL(); }
  });
  syncRUL();
  // --------------------------------------------------------------------------

  /* ──────────────────────────────────────────────────────────
   * 3) HIT-Overlay (leichter Inline-Fallback) — kein Doppel-Mount
   * ────────────────────────────────────────────────────────── */
  (async () => {
    try {
      if (!chartRoot) return;
      dedupeOverlays(chartRoot, 'uid-hit-overlay');
      if (chartRoot.querySelector('.uid-hit-overlay')) return; // schon da

      const css = getComputedStyle(chartRoot);
      const PAD = {
        l: px(css.getPropertyValue('--plot-pad-l')) || px(css.getPropertyValue('--chart-pad-left'))   || 44,
        r: px(css.getPropertyValue('--plot-pad-r')) || px(css.getPropertyValue('--chart-pad-right'))  || 18,
        t: px(css.getPropertyValue('--plot-pad-t')) || px(css.getPropertyValue('--chart-pad-top'))    || 12,
        b: px(css.getPropertyValue('--plot-pad-b')) || px(css.getPropertyValue('--chart-pad-bottom')) || 28
      };
      const COLOR = getComputedStyle(document.documentElement).getPropertyValue('--uid-hit-color')?.trim() || '#65AFFF';
      const ns  = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.classList.add('uid-hit-overlay');
      Object.assign(svg.style, { position:'absolute', inset:0, pointerEvents:'none', zIndex:50 });
      chartRoot.style.position = chartRoot.style.position || 'relative';
      chartRoot.appendChild(svg);
      const g = document.createElementNS(ns, 'g'); g.setAttribute('class','hit-layer'); svg.appendChild(g);
      const mk=(t,a={},p=g)=>{ const el=document.createElementNS(ns,t); for(const k in a) el.setAttribute(k,a[k]); p.appendChild(el); return el; };
      const clear=()=>{ while(g.firstChild) g.firstChild.remove(); };

      let enabled=false, series=null, params={R0:null, vaccineEff:1}, scale='abs';
      const render = () => {
        clear(); if (!enabled || modelUpper==='SIS') return;
        if (!series?.t?.length || !series?.S?.length || !series?.N || !(+params?.R0>0)) return;

        const rect=chartRoot.getBoundingClientRect(); const W=Math.max(1,rect.width), H=Math.max(1,rect.height);
        svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
        const plot={ x:PAD.l, y:PAD.t, w:Math.max(1,W-PAD.l-PAD.r), h:Math.max(1,H-PAD.t-PAD.b) };

        // Clip
        let defs = svg.querySelector('defs'); if(!defs){ defs=document.createElementNS(ns,'defs'); svg.insertBefore(defs, svg.firstChild); }
        let cp = defs.querySelector('#hit-clip'); if(!cp){ cp=document.createElementNS(ns,'clipPath'); cp.id='hit-clip'; defs.appendChild(cp); cp.appendChild(document.createElementNS(ns,'rect')); }
        const rc = cp.firstChild; rc.setAttribute('x',plot.x); rc.setAttribute('y',plot.y); rc.setAttribute('width',plot.w); rc.setAttribute('height',plot.h);
        g.setAttribute('clip-path','url(#hit-clip)');

        const x=series.t, N=series.N, t0=x[0], t1=x[x.length-1];
        const y0=0, y1=Math.max(series.S[0]||0,N);

        const eff = params.vaccineEff ?? 1;
        const Seff = (modelUpper==='SIRV' && series.V) ? series.S.map((s,i)=> s + (1-eff)*(series.V[i]||0)) : series.S;

        const thr = N / (+params.R0 || 1);
        const xPx = tx => plot.x + (tx - t0)/(t1 - t0) * plot.w;
        const yPx = vy => plot.y + plot.h - (vy - y0)/(y1 - y0) * plot.h;

        // horizontale
        const hy = yPx(thr);
        const inside = thr>=y0 && thr<=y1 && hy>=plot.y && hy<=plot.y+plot.h;
        if (inside){
          mk('line',{x1:plot.x,y1:hy,x2:plot.x+plot.w,y2:hy,stroke:COLOR,'stroke-width':1.5,'stroke-dasharray':'4 4',opacity:.9});
          const txt = scale==='pct' ? (thr/N*100).toFixed(1)+'%' : String(Math.round(thr));
          const labY = Math.min(Math.max(plot.y+12, hy-12), plot.y+plot.h-12);
          mk('text',{x:plot.x+plot.w-6,y:labY,'text-anchor':'end','dominant-baseline':'middle','font-size':12,fill:COLOR,'font-variant-numeric':'tabular-nums'}).textContent='HIT: '+txt;
        }

        // vertikal
        let xi=null;
        for (let i=1;i<Seff.length;i++){
          const a=Seff[i-1]-thr, b=Seff[i]-thr;
          if (a===0){ xi=x[i-1]; break; }
          if (a*b<=0){ const tt=(0-a)/((b-a)||1e-12); xi=x[i-1]+tt*(x[i]-x[i-1]); break; }
        }
        if (xi!=null && xi>=t0 && xi<=t1){
          const vx=xPx(xi);
          mk('line',{x1:vx,y1:plot.y,x2:vx,y2:plot.y+plot.h,stroke:COLOR,'stroke-width':1.5,'stroke-dasharray':'2 3',opacity:.9});
          mk('text',{x:Math.min(plot.x+plot.w-6,vx+6),y:plot.y+12,'text-anchor':'end','font-size':11,fill:'#bcd7ff'}).textContent='(tHIT)='+Math.round(xi);
        }
      };

      const opt={ replay:true };
      EBUS.on('uid:e:lines:hit:toggle', e=>{ if (e?.scope && e.scope!==widget) return; enabled=!!e?.on; requestAnimationFrame(render); }, opt);
      EBUS.on('uid:e:data:series',  s=>{ series=s; requestAnimationFrame(render); }, opt);
      EBUS.on('uid:e:model:params', p=>{ params={...params,...p}; requestAnimationFrame(render); }, opt);
      EBUS.on('uid:e:viz:scale:changed', e=>{ if (e?.scope && e.scope!==widget) return; if (e?.mode) { scale=e.mode; requestAnimationFrame(render); } }, opt);
      window.addEventListener('resize', ()=>requestAnimationFrame(render), { passive:true });

      // Seed letzte Werte (falls vorhanden)
      try {
        const ls=EBUS.getLast?.('uid:e:data:series'); if (ls) series=ls;
        const lp=EBUS.getLast?.('uid:e:model:params'); if (lp) params={...params,...lp};
      } catch {}
    } catch {}
  })();

  // Auto-Compact / „…“
  try { measureAndApply(slots); } catch {}
  const onResize = () => { try { measureAndApply(slots); } catch {} };
  window.addEventListener('resize', onResize, { passive: true });

  return {
    dispose(){
      try { unsubSet?.(); } catch {}
      try { unsubScale?.(); } catch {}
      try { unsubHit?.(); } catch {}
      try { unsubRuler?.(); } catch {}
      try { window.removeEventListener('resize', onResize); } catch {}
      try { delete head.dataset.waChartInit; MOUNTED.delete(widget); } catch {}
    }
  };
}

export default mountChartWidgetActions;
