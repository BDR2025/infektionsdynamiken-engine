/*!
 * File:    sim-button.play05.js
 * Version: v1.0
 * Purpose: Single Play Button (0.5x) for State Visuals (EBUS + optional SSoG)
 * License: CC BY 4.0
 */

import * as EBUS from '../../../12-1_base/bus.js';

const ICON_NUDGE_Y_PX = -4;

// ------- SSoG helpers (optional legend) -------
function getLegend(elOrSel){
  if (!elOrSel) return document.querySelector('.uid-legend');
  if (typeof elOrSel === 'string') return document.querySelector(elOrSel);
  return elOrSel;
}
function rightmostOverlayToggle(legend){
  if (!legend) return null;
  const all = legend.querySelectorAll('[data-role="overlays-toggle"]');
  return all.length ? all[all.length-1] : null;
}
function readGeomColorFromLegend(legend){
  const ref = rightmostOverlayToggle(legend) || legend?.querySelector?.('.legend-dot');
  if (!ref) return null;
  const cs = getComputedStyle(ref);
  const w  = parseFloat(cs.width)  || 18;
  const h  = parseFloat(cs.height) || 18;
  const bw = parseFloat(cs.borderTopWidth || cs.borderWidth) || 2;
  const color = cs.borderTopColor || cs.borderColor || cs.color || '';
  return { size:{ w, h, bw }, color };
}

// ------- Button factory (DPR-aware progress ring) -------
function mkBtnPlay05(size, color){
  const { w, h, bw } = size || { w:18, h:18, bw:2 };

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'sv-sim-btn sv-sim-btn--play05';
  btn.setAttribute('aria-label', 'Play 0.5x');
  btn.title = 'Play 0.5x';
  Object.assign(btn.style, {
    all:'unset', position:'relative', boxSizing:'border-box',
    display:'inline-block', width:`${w}px`, height:`${h}px`,
    borderRadius:'50%', border:`${bw}px solid currentColor`,
    background:'transparent', cursor:'pointer', opacity:'0.95',
    transition:'opacity 120ms ease, transform 120ms ease, border-color 120ms ease',
  });

  // SVG progress ring
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('shape-rendering','geometricPrecision');
  Object.assign(svg.style, {
    position:'absolute', left:'0', top:'0', width:`${w}px`, height:`${h}px`,
    pointerEvents:'none', zIndex:'0', overflow:'visible'
  });

  const dpr  = window.devicePixelRatio || 1;
  const snap = v => Math.round(v * dpr) / dpr;
  const strokeW = snap(bw + (dpr >= 2 ? 0.25 : 0));
  const rNow    = snap((Math.min(w,h) - strokeW) / 2);

  const cir = document.createElementNS('http://www.w3.org/2000/svg','circle');
  cir.setAttribute('cx', String(w/2));
  cir.setAttribute('cy', String(h/2));
  cir.setAttribute('r',  String(rNow));
  cir.setAttribute('fill','none');
  cir.setAttribute('stroke', color || 'currentColor'); // hard stroke to match overlay
  cir.setAttribute('stroke-width', String(strokeW));
  cir.setAttribute('stroke-linecap','round');
  cir.style.transformOrigin = '50% 50%';
  cir.style.transform = 'rotate(-90deg)';

  const circLen = 2*Math.PI*rNow;
  cir.style.strokeDasharray  = String(circLen);
  cir.style.strokeDashoffset = String(circLen); // empty

  svg.appendChild(cir);
  btn.appendChild(svg);

  // Icon: Play + 2 bars (encodes 0.5x)
  const icon = document.createElement('span');
  const sizeIcon = Math.round(Math.max(8, Math.min(12, w*(10/18))));
  Object.assign(icon.style, {
    position:'absolute', left:'50%', top:'50%',
    width:`${sizeIcon}px`, height:`${sizeIcon}px`,
    marginLeft:`-${sizeIcon/2}px`, marginTop:`-${sizeIcon/2}px`,
    display:'inline-block', zIndex:'1', transform:`translateY(${ICON_NUDGE_Y_PX}px)`
  });
  icon.innerHTML = (
    '<svg viewBox="0 0 10 10" aria-hidden="true">'
    + '<g><path d="M3 2l4 3-4 3z" fill="currentColor"/></g>'
    + '<g><rect x="1" y="7" width="2" height="2" fill="currentColor"/>'
    +     '<rect x="4" y="7" width="2" height="2" fill="currentColor"/></g>'
    + '</svg>'
  );
  btn.appendChild(icon);

  // State API
  btn.__sv05 = {
    icon, ring: cir, circLen, active:false, paused:false,
    setActive(on){
      this.active = !!on;
      btn.style.borderColor = on ? 'transparent' : ''; // hide static border while active
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    },
    setPaused(on){ this.paused = !!on; },
    reset(){
      this.ring.style.strokeDashoffset = String(this.circLen);
      this.setActive(false); this.setPaused(false);
    },
    progress(p){
      const c = Math.max(0, Math.min(1, p));
      this.ring.style.strokeDashoffset = String((1-c)*this.circLen);
    },
    applyGeometry(nextSize, nextColor){
      const ns = nextSize || size;
      const { w, h, bw } = ns;
      btn.style.width = `${w}px`; btn.style.height = `${h}px`; btn.style.borderWidth = `${bw}px`;
      const dpr = window.devicePixelRatio || 1;
      const snap = v => Math.round(v * dpr) / dpr;
      const strokeW = snap(bw + (dpr >= 2 ? 0.25 : 0));
      const rNow = snap((Math.min(w,h) - strokeW) / 2);
      this.circLen = 2*Math.PI*rNow;
      this.ring.setAttribute('cx', String(w/2));
      this.ring.setAttribute('cy', String(h/2));
      this.ring.setAttribute('r',  String(rNow));
      this.ring.setAttribute('stroke-width', String(strokeW));
      if (nextColor) this.ring.setAttribute('stroke', nextColor);
      this.ring.style.strokeDasharray = String(this.circLen);
    }
  };

  // simple focus ring for keyboard users
  btn.addEventListener('focus', ()=>{ btn.style.boxShadow = '0 0 0 2px currentColor inset'; });
  btn.addEventListener('blur',  ()=>{ btn.style.boxShadow = ''; });

  return btn;
}

// ------- Public mount API -------
/**
 * mountSimButtonPlay05
 * @param {Object} options
 * @param {Element} options.anchor  - required: DOM node where the button is appended
 * @param {Element|string} [options.legend] - optional: DOM node or selector for chart legend (SSoG)
 * @param {Object}  [options.size]  - fallback size {w,h,bw} if no legend
 * @param {string}  [options.color] - fallback stroke color if no legend
 * @returns {Object} { dispose() }
 */
export function mountSimButtonPlay05(options={}){
  const anchor = options.anchor;
  if (!anchor) throw new Error('[sim-button.play05] options.anchor is required');

  // derive size/color (legend first, then fallbacks)
  const legend = getLegend(options.legend);
  const fromLegend = legend ? readGeomColorFromLegend(legend) : null;
  const size  = options.size  || fromLegend?.size  || { w:18, h:18, bw:2 };
  const color = options.color || fromLegend?.color || '';

  const btn = mkBtnPlay05(size, color);
  anchor.appendChild(btn);

  // click -> EBUS
  btn.addEventListener('click', ()=>{
    EBUS.emit('uid:e:sim:reset');
    EBUS.emit('uid:e:sim:speed:set', { speed: 0.5 });
    EBUS.emit('uid:e:sim:play');
  });

  // listen -> UI
  let N = 0; // length of t
  const offReset = EBUS.on('uid:e:sim:reset', ()=> btn.__sv05.reset(), {replay:false});
  const offData  = EBUS.on('uid:e:sim:data',  ({series}={})=>{
    if (series?.t?.length) N = series.t.length;
  }, {replay:true});
  const offPlay  = EBUS.on('uid:e:sim:play',  ()=>{
    // Only mark active if current speed is 0.5
    // We rely on last speed:set replay; if not available, we still start active on first click.
    btn.__sv05.setActive(true); btn.__sv05.setPaused(false);
  });
  const offPause = EBUS.on('uid:e:sim:pause', ()=>{
    btn.__sv05.setPaused(true);
  });
  const offSpeed = EBUS.on('uid:e:sim:speed:set', ({speed})=>{
    // If speed changes away from 0.5 while running, keep ring but remove "active" border hide if desired.
    if (speed !== 0.5 && btn.__sv05.active) btn.__sv05.setActive(false);
  });
  const offPtr   = EBUS.on('uid:e:sim:pointer', ({idx})=>{
    if (!N) return;
    const p = Math.max(0, Math.min(1, idx/(N-1)));
    btn.__sv05.progress(p);
    if (p >= 1) btn.__sv05.reset();
  });

  // optional: keep geometry synced to legend size changes
  let ro = null;
  if (legend) {
    ro = new ResizeObserver(()=> {
      const now = readGeomColorFromLegend(legend);
      if (now) btn.__sv05.applyGeometry(now.size, now.color);
    });
    try { ro.observe(legend); } catch(e){}
  }

  return {
    dispose(){
      try{ offReset(); offData(); offPlay(); offPause(); offSpeed(); offPtr(); }catch(e){}
      try{ ro && ro.disconnect(); }catch(e){}
      try{ btn.remove(); }catch(e){}
    }
  };
}

export default { mountSimButtonPlay05 };
