/*!
 * File:      mini/index.js
 * Module:    UID-Pres · Chart Mini (collapsed-view)
 * Purpose:   Mini-Chart (nur I rot), ohne Animations — sofortiges Ein/Aus bei Power
 * License:   CC BY 4.0
 */

import * as EBUS from '../../../12-1_base/bus.js';

export function mountChartMini(widgetOrSelector, opts = {}) {
  const widget = (typeof widgetOrSelector === 'string')
    ? document.querySelector(widgetOrSelector)
    : widgetOrSelector;
  if (!widget) throw new Error('[chart-mini] widget host not found');

  // Mini-Container direkt unter dem Header einhängen
  let mini = widget.querySelector('.widget-mini');
  if (!mini) {
    mini = document.createElement('div');
    mini.className = 'widget-mini';
    const head = widget.querySelector('.uidw-head');
    (head && head.nextSibling)
      ? widget.insertBefore(mini, head.nextSibling)
      : widget.appendChild(mini);
  }

  // kompakt & neutral
  const H = Math.max(24, Number(opts.height ?? 44));
  mini.style.cssText = `
    display:none; position:relative; height:${H}px; padding:4px 6px;
    box-sizing:border-box; overflow:hidden;
  `;

  // Canvas
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;height:100%;display:block';
  mini.appendChild(canvas);
  const ctx  = canvas.getContext('2d', { alpha: true });
  const dpr  = Math.max(1, window.devicePixelRatio || 1);
  let W=0, Hpx=0;

  // Optional: Mini-Play/Pause (icon-only, sehr klein)
  let btn=null, playing=false;
  if (opts.playButton !== false) {
    btn = document.createElement('button');
    btn.setAttribute('aria-label','Play/Pause');
    btn.textContent = '▶';
    btn.style.cssText = `
      position:absolute; right:6px; top:6px; font:600 10px system-ui;
      padding:2px 6px; border-radius:999px; border:1px solid rgba(255,255,255,.25);
      background:transparent; color:#e5e7eb; opacity:.85;
    `;
    btn.addEventListener('click', () => {
      playing = !playing; btn.textContent = playing ? '❚❚' : '▶';
      EBUS.emit(playing ? 'uid:e:sim:play' : 'uid:e:sim:pause');
    });
    mini.appendChild(btn);
  }

  // Daten-State
  let I=null, N=0, yMax=1, peakIdx=0, idx=null;

  // ResizeHandling
  function resize() {
    const w = mini.clientWidth, h = mini.clientHeight;
    if (!w || !h) return;
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    W = canvas.width; Hpx = canvas.height;
    draw();
  }
  const ro = new ResizeObserver(resize); ro.observe(mini);

  // Skalen
  const x = (i) => (!N ? 0 : (i/(N-1))*W);
  const y = (v) => (1 - (v/(yMax||1e-9))) * Hpx;

  // Crisp Stroke Style
  function setStroke(c, w=1.25){
    c.lineWidth = Math.max(1, Math.round(dpr*w));
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.miterLimit = 2;
  }

  function setSeries(payload){
    const s = payload?.series || payload; if (!s) return;
    const arr = s.I || s.i; if (!arr || !arr.length) return;
    I = arr; N = I.length;

    // Y-Max nur aus I, mit 5% Headroom
    let maxI = 0, pIdx = 0;
    for (let i=0;i<N;i++){ const v=I[i]; if (v>maxI){ maxI=v; pIdx=i; } }
    yMax = maxI * 1.05 || 1;
    peakIdx = pIdx;

    draw();
  }

  function setPointer(p){ const v=p?.idx ?? p; if (Number.isFinite(v)) { idx=v|0; draw(); } }

  function draw(){
    if (!ctx) return;
    ctx.clearRect(0,0,W,Hpx);

    // I(t) – rot, crisp
    if (I && N>1){
      setStroke(ctx, 1.25);
      ctx.strokeStyle = opts.color || '#ff5a5f';
      ctx.beginPath();
      ctx.moveTo(0, y(I[0]));
      for (let i=1;i<N;i++) ctx.lineTo(x(i), y(I[i]));
      ctx.stroke();

      // Peak (dezent gestrichelt)
      if (opts.showPeak !== false) {
        const px = x(peakIdx);
        ctx.setLineDash([3*dpr, 3*dpr]);
        ctx.strokeStyle = 'rgba(255,90,95,.6)';
        ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, Hpx); ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Playhead
    if (Number.isFinite(idx)) {
      const xx = x(idx);
      setStroke(ctx, 1);
      ctx.strokeStyle = 'rgba(255,255,255,.82)';
      ctx.beginPath(); ctx.moveTo(xx, 0); ctx.lineTo(xx, Hpx); ctx.stroke();
    }
  }

  // Interaktion: Scrub
  function onMove(e){
    const r = canvas.getBoundingClientRect();
    const xx = Math.max(0, Math.min((e.clientX - r.left)*dpr, W));
    if (!N) return;
    const i = Math.round(xx/W*(N-1));
    EBUS.emit('uid:e:sim:pointer', { idx: i });
  }
  canvas.addEventListener('mousemove', onMove);

  // Bus-Subscriptions (mit Replay)
  const offFns = [];
  const on = (ev, fn) => { EBUS.on(ev, fn, { replay:true }); offFns.push(()=>EBUS.off(ev, fn)); };
  on('uid:e:sim:data',    setSeries);
  on('uid:e:sim:pointer', setPointer);

  // Sichtbarkeit direkt am Widget-Power — ohne Animation
  function syncMini(){
    const enabled = widget.dataset.widgetEnabled !== 'false';
    mini.style.display = enabled ? 'none' : 'block';
    if (!enabled) resize();
  }
  syncMini();
  const mo = new MutationObserver(syncMini);
  mo.observe(widget, { attributes:true, attributeFilter:['data-widget-enabled'] });

  // Cleanup
  function dispose(){
    try{ ro.disconnect(); }catch{}
    try{ mo.disconnect(); }catch{}
    try{ canvas.removeEventListener('mousemove', onMove); }catch{}
    offFns.forEach(off=>{ try{ off(); }catch{} });
    try{ widget.contains(mini) && widget.removeChild(mini); }catch{}
  }

  return { dispose, el: mini };
}

export default { mountChartMini };
