/*!
 * File:    chart.sim-controls.js
 * Version: v17-prod-safe
 * Purpose: Chart Simulation Controls (SSoG + DPR), no auto-probe, no global scan
 * License: CC BY 4.0
 */

import * as EBUS from '../../../12-1_base/bus.js';

const ICON_NUDGE_Y_PX = -4;

/* ---------------------- Legend / SSoG helpers ---------------------- */

function pickLegend(root) {
  return (root && root.querySelector && root.querySelector('.uid-legend'))
      || (root && root.closest && root.closest('.uid-legend'))
      || document.querySelector('.uid-legend');
}

function getRightmostOverlayToggle(legend) {
  if (!legend) return null;
  const all = legend.querySelectorAll('[data-role="overlays-toggle"]');
  return all.length ? all[all.length - 1] : null;
}

function readGeomFrom(el) {
  const cs = getComputedStyle(el);
  const w  = parseFloat(cs.width)  || 18;
  const h  = parseFloat(cs.height) || 18;
  const bw = parseFloat(cs.borderTopWidth || cs.borderWidth) || 2;
  return { w, h, bw };
}

function readSSoG(widgetEl){
  const legend = pickLegend(widgetEl);
  const refEl  = getRightmostOverlayToggle(legend) || (legend && legend.querySelector && legend.querySelector('.legend-dot'));
  if (!refEl) return null;
  const geom   = readGeomFrom(refEl);
  const cs     = getComputedStyle(refEl);
  const color  = cs.borderTopColor || cs.borderColor || cs.color || '';
  return { legend, refEl, geom, color };
}

/* ---------------- DPR-safe Button & Progress-Ring factory ---------- */

function mkBtn(title, geom, fixedStrokeColor){
  const { w, h, bw } = geom;

  const btn = document.createElement('button');
  btn.type  = 'button';
  btn.className = 'legend-dot simc-dot';
  btn.setAttribute('aria-label', title);
  btn.title = title;

  Object.assign(btn.style, {
    all:'unset', position:'relative', boxSizing:'border-box',
    display:'inline-block', width:`${w}px`, height:`${h}px`,
    borderRadius:'50%', border:`${bw}px solid currentColor`,
    background:'transparent', cursor:'pointer', opacity:'0.95',
    transition:'opacity 120ms ease, transform 120ms ease, border-color 120ms ease',
    outline:'none'
  });

  // SVG container
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('shape-rendering','geometricPrecision');
  Object.assign(svg.style, {
    position:'absolute', left:'0', top:'0', width:`${w}px`, height:`${h}px`,
    pointerEvents:'none', zIndex:'0', overflow:'visible'
  });

  // DPR aware stroke & radius
  const dpr  = window.devicePixelRatio || 1;
  const snap = v => Math.round(v * dpr) / dpr;
  const strokeW = snap(bw + (dpr >= 2 ? 0.25 : 0));
  const rNow    = snap((Math.min(w,h) - strokeW) / 2);

  // Progress circle
  const cir = document.createElementNS('http://www.w3.org/2000/svg','circle');
  cir.setAttribute('cx', String(w/2));
  cir.setAttribute('cy', String(h/2));
  cir.setAttribute('r',  String(rNow));
  cir.setAttribute('fill','none');
  cir.setAttribute('stroke', fixedStrokeColor || 'currentColor');
  cir.setAttribute('stroke-width', String(strokeW));
  cir.setAttribute('stroke-linecap','round');
  cir.style.transformOrigin = '50% 50%';
  cir.style.transform = 'rotate(-90deg)';

  const circLen = 2*Math.PI*rNow;
  cir.style.strokeDasharray  = String(circLen);
  cir.style.strokeDashoffset = String(circLen); // empty

  svg.appendChild(cir);
  btn.appendChild(svg);

  // Icon span
  const icon = document.createElement('span');
  const size = Math.round(Math.max(8, Math.min(12, w*(10/18))));
  Object.assign(icon.style, {
    position:'absolute', left:'50%', top:'50%',
    width:`${size}px`, height:`${size}px`,
    marginLeft:`-${size/2}px`, marginTop:`-${size/2}px`,
    display:'inline-block', zIndex:'1', transform:`translateY(${ICON_NUDGE_Y_PX}px)`
  });
  btn.appendChild(icon);

  // API
  btn.__simc = {
    icon, ring:cir, geom:{...geom}, circ:circLen,
    active:false, paused:false,
    setActive(on){
      this.active = !!on;
      btn.style.borderColor = on ? 'transparent' : '';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    },
    setPaused(on){ this.paused = !!on; },
    setProgress(p){
      const c = Math.max(0, Math.min(1, p));
      this.ring.style.strokeDashoffset = String((1-c)*this.circ);
    },
    reset(){
      this.ring.style.strokeDashoffset = String(this.circ);
      this.setActive(false); this.setPaused(false);
    },
    applyGeometry(geomNow, strokeColor){
      const { w, h, bw } = geomNow;
      btn.style.width  = `${w}px`;
      btn.style.height = `${h}px`;
      btn.style.borderWidth = `${bw}px`;

      const dpr  = window.devicePixelRatio || 1;
      const snap = v => Math.round(v * dpr) / dpr;
      const strokeW = snap(bw + (dpr >= 2 ? 0.25 : 0));
      const rNow    = snap((Math.min(w,h) - strokeW) / 2);

      this.circ = 2*Math.PI*rNow;
      this.ring.setAttribute('cx', String(w/2));
      this.ring.setAttribute('cy', String(h/2));
      this.ring.setAttribute('r',  String(rNow));
      this.ring.setAttribute('stroke-width', String(strokeW));
      if (strokeColor) this.ring.setAttribute('stroke', strokeColor);
      this.ring.style.strokeDasharray = String(this.circ);
    }
  };

  return btn;
}

/* ------------------------------ Icons -------------------------------- */

const Glyph = {
  Play:  '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M3 2l4 3-4 3z" fill="currentColor"/></svg>',
  Pause: '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 2h2v6H2zM6 2h2v6H6z" fill="currentColor"/></svg>',
  Reset: function(bw){ return '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 2v-1L2.5 3 5 5V4a3 3 0 1 1-3 3" stroke="currentColor" stroke-width="'+bw+'" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'; },
  Bar1:  '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1" y="7" width="2" height="2" fill="currentColor"/></svg>',
  Bar2:  '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1" y="7" width="2" height="2" fill="currentColor"/><rect x="4" y="7" width="2" height="2" fill="currentColor"/></svg>',
  Bar3:  '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1" y="7" width="2" height="2" fill="currentColor"/><rect x="4" y="7" width="2" height="2" fill="currentColor"/><rect x="7" y="7" width="2" height="2" fill="currentColor"/></svg>'
};

function playWithBars(n){
  var bars = (n===3?Glyph.Bar3:(n===2?Glyph.Bar2:Glyph.Bar1));
  return '<svg viewBox="0 0 10 10" aria-hidden="true"><g>'+Glyph.Play+'</g><g>'+bars+'</g></svg>';
}

/* ------------------------------- Mount -------------------------------- */

export function mountChartSimControls(widgetEl){
  const ssog = readSSoG(widgetEl || document);
  if (!ssog) return { dispose:function(){} };

  let legend = ssog.legend;
  let geom   = ssog.geom;
  let color  = ssog.color;

  // avoid duplicate mount
  if (legend.querySelector('[data-sim-controls]')) {
    return { dispose:function(){} };
  }

  const group = document.createElement('div');
  group.setAttribute('data-role', 'sim-controls');
  group.setAttribute('data-sim-controls', 'sim-controls');
  Object.assign(group.style, { display:'inline-flex', gap:'12px', alignItems:'center', marginLeft:'auto' });
  if (color) group.style.color = color;

  const b1 = mkBtn('Play (1x)',    geom, color); b1.__simc.icon.innerHTML = playWithBars(3);
  const b2 = mkBtn('Play (0.5x)',  geom, color); b2.__simc.icon.innerHTML = playWithBars(2);
  const b3 = mkBtn('Play (0.25x)', geom, color); b3.__simc.icon.innerHTML = playWithBars(1);
  const bp = mkBtn('Pause/Resume', geom, color); bp.__simc.icon.innerHTML = Glyph.Pause;
  const br = mkBtn('Reset (t=0)',  geom, color); br.__simc.icon.innerHTML = Glyph.Reset(geom.bw);

  legend.appendChild(group);
  group.append(b1,b2,b3,bp,br);

  const local = { activeBtn:null, speed:1, playing:false, paused:false };

  function idle(){
    [b1,b2,b3,bp,br].forEach(function(x){ x.__simc.reset(); });
    bp.__simc.icon.innerHTML = Glyph.Pause;
    bp.setAttribute('aria-pressed','false');
    local.activeBtn=null; local.playing=false; local.paused=false;
  }
  function start(btn){
    [b1,b2,b3,bp,br].forEach(function(x){ x.__simc.reset(); });
    local.activeBtn = btn;
    btn.__simc.setActive(true);
    local.playing = true; local.paused = false;
    bp.__simc.icon.innerHTML = Glyph.Pause;
    bp.setAttribute('aria-pressed','false');
  }
  function setSpeed(s){ local.speed = s; }

  // Click -> Bus (no extra data emission)
  b1.addEventListener('click', function(){ setSpeed(1);   EBUS.emit('uid:e:sim:reset'); EBUS.emit('uid:e:sim:speed:set',{speed:1});   EBUS.emit('uid:e:sim:play'); });
  b2.addEventListener('click', function(){ setSpeed(0.5); EBUS.emit('uid:e:sim:reset'); EBUS.emit('uid:e:sim:speed:set',{speed:0.5}); EBUS.emit('uid:e:sim:play'); });
  b3.addEventListener('click', function(){ setSpeed(0.25);EBUS.emit('uid:e:sim:reset'); EBUS.emit('uid:e:sim:speed:set',{speed:0.25});EBUS.emit('uid:e:sim:play'); });
  bp.addEventListener('click', function(){
    if (local.playing && !local.paused) {
      EBUS.emit('uid:e:sim:pause');
    } else {
      EBUS.emit('uid:e:sim:speed:set', { speed: local.speed });
      EBUS.emit('uid:e:sim:play');
    }
  });
  br.addEventListener('click', function(){ EBUS.emit('uid:e:sim:reset'); });

  // Bus -> UI (pure consumers)
  const offReset = EBUS.on('uid:e:sim:reset', function(){ idle(); });
  const offSpeed = EBUS.on('uid:e:sim:speed:set', function(payload){ setSpeed(payload && payload.speed); });
  const offPlay  = EBUS.on('uid:e:sim:play', function(){
    const btn = (local.speed===1) ? b1 : (local.speed===0.5) ? b2 : b3;
    if (!local.paused || !local.activeBtn) start(btn);
    else {
      local.playing = true; local.paused = false;
      if(!local.activeBtn) local.activeBtn = btn;
      local.activeBtn.__simc.setActive(true);
      bp.__simc.icon.innerHTML = Glyph.Pause;
      bp.setAttribute('aria-pressed','false');
    }
  });
  const offPause = EBUS.on('uid:e:sim:pause', function(){
    local.playing=false; local.paused=true;
    if(local.activeBtn) local.activeBtn.__simc.setPaused(true);
    bp.__simc.icon.innerHTML = Glyph.Play;
    bp.setAttribute('aria-pressed','true');
  });

  // Progress coupling
  var N=0;
  const offData = EBUS.on('uid:e:sim:data', function(payload){
    var series = payload && payload.series;
    if (series && series.t && series.t.length) N = series.t.length;
  }, {replay:true});

  const offPointer = EBUS.on('uid:e:sim:pointer', function(payload){
    var idx = payload && payload.idx;
    if(!N || !local.activeBtn) return;
    var p = Math.max(0, Math.min(1, idx/(N-1)));
    local.activeBtn.__simc.setProgress(p);
    if (p>=1) idle();
  });

  // Only watch the legend container for re-render; re-attach if controls removed/replaced
  const watchRoot = legend.parentNode || legend;
  const mo = new MutationObserver(function(){
    const currentLegend = pickLegend(widgetEl || document);
    if (!currentLegend) return;
    if (!currentLegend.querySelector('[data-sim-controls]')) {
      try { currentLegend.appendChild(group); } catch(e){}
      // refresh SSoG in case geometry/color changed
      const now = readSSoG(widgetEl || document);
      if (now){
        geom = now.geom; color = now.color;
        [b1,b2,b3,bp,br].forEach(function(b){ b.__simc.applyGeometry(geom, color); });
        if (color){
          group.style.color = color;
          [b1,b2,b3,bp,br].forEach(function(b){ b.__simc.ring.setAttribute('stroke', color); });
          br.__simc && (br.__simc.icon.innerHTML = Glyph.Reset(geom.bw));
        }
      }
    }
  });
  try { mo.observe(watchRoot, { childList:true, subtree:true }); } catch(e){}

  // Resize -> geometry/color refresh
  const ro = new ResizeObserver(function(){
    const now = readSSoG(widgetEl || document);
    if(!now) return;
    geom = now.geom; color = now.color;
    [b1,b2,b3,bp,br].forEach(function(b){ b.__simc.applyGeometry(geom, color); });
    if (color){
      group.style.color = color;
      [b1,b2,b3,bp,br].forEach(function(b){ b.__simc.ring.setAttribute('stroke', color); });
      br.__simc && (br.__simc.icon.innerHTML = Glyph.Reset(geom.bw));
    }
  });
  try { ro.observe(legend); } catch (e) {}

  // Keyboard
  group.addEventListener('keydown', function(e){
    if(e.key==='Enter' || e.key===' ') e.preventDefault();
  });

  return {
    dispose:function(){
      try{ offReset(); offSpeed(); offPlay(); offPause(); offData(); offPointer(); }catch(e){}
      try{ mo.disconnect(); }catch(e){}
      try{ ro.disconnect(); }catch(e){}
      try{ group.remove(); }catch(e){}
    }
  };
}

export default { mountChartSimControls };
