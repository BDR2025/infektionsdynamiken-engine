/*!
 * File:      equations.js
 * Module:    UID-V · core-hybrid · Equations Overlay (SEIR)
 * Export:    createEquations(host, opts) -> { update, dispose, setVisible }
 * Author:    ChatGPT · CC BY 4.0
 * Version:   1.2.4
 * Changelog:
 *  - Layering fix: higher z-index + bringToFront() so the wheel can't cover cards
 *  - Hybrid-first visibility; hide aggressively on Real/Wheel
 *  - MathJax re-typeset hook when MJ finishes loading
 */

'use strict';

export function createEquations(host, opts = {}) {
  if (!host) throw new Error('[UID-V Eq] host missing');
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

  // ---------- CSS (injected once) ----------
  var CSS_ID = 'uidv-eq-cards-css-v124';
  if (!document.getElementById(CSS_ID)) {
    var style = document.createElement('style');
    style.id = CSS_ID;
    style.textContent =
      '.uidv-eq-cards{position:absolute;left:var(--svw-eq-inset-x,28px);right:var(--svw-eq-inset-x,28px);top:var(--svw-eq-inset-top,56px);display:flex;flex-direction:column;gap:10px;pointer-events:none;font-variant-numeric:tabular-nums;font-feature-settings:\"tnum\" 1;z-index:10000;max-width:calc(100% - 2*var(--svw-eq-inset-x,28px))}' +
      '.uidv-eq-card{pointer-events:auto;border-radius:14px;padding:10px 12px;color:#fff;box-shadow:0 3px 10px rgba(0,0,0,.28);backdrop-filter:saturate(115%) blur(2px);display:grid;grid-template-columns:auto 1fr;column-gap:10px;align-items:center}' +
      '.uidv-lhs-badge{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:999px;color:#fff;font-weight:700;box-shadow:inset 0 0 0 1px rgba(255,255,255,.15)}' +
      '.uidv-eq-card.k-s{background:color-mix(in srgb,var(--c-s,#2EC27E) 18%,transparent)}' +
      '.uidv-eq-card.k-e{background:color-mix(in srgb,var(--c-e,#FF9F1A) 18%,transparent)}' +
      '.uidv-eq-card.k-i{background:color-mix(in srgb,var(--c-i,#EF4444) 20%,transparent)}' +
      '.uidv-eq-card.k-r{background:color-mix(in srgb,var(--c-r,#00C6FF) 22%,transparent)}' +
      '.uidv-eq-card.k-s .uidv-lhs-badge{background:var(--c-s,#2EC27E)}' +
      '.uidv-eq-card.k-e .uidv-lhs-badge{background:var(--c-e,#FF9F1A)}' +
      '.uidv-eq-card.k-i .uidv-lhs-badge{background:var(--c-i,#EF4444)}' +
      '.uidv-eq-card.k-r .uidv-lhs-badge{background:var(--c-r,#00C6FF)}' +
      '.uidv-eq-body{display:grid;row-gap:3px}' +
      '.uidv-line{display:flex;align-items:baseline;gap:8px;white-space:nowrap}' +
      '.uidv-eq{opacity:.95}.uidv-live{opacity:.95}.uidv-approx{margin-left:6px;font-weight:600;opacity:.95}' +
      '.uidv-lhs-badge mjx-container{color:#fff !important}';
    document.head.appendChild(style);
  }

  // ---------- DOM ----------
  var wrap = document.createElement('div');
  wrap.className = 'uidv-eq-cards';
  host.appendChild(wrap);

  function bringToFront(){
    try { host.appendChild(wrap); } catch(e){}
    wrap.style.zIndex = '10000';
  }

  function makeCard(key) {
    var card  = document.createElement('div'); card.className = 'uidv-eq-card k-' + key;
    var badge = document.createElement('div'); badge.className = 'uidv-lhs-badge';
    var body  = document.createElement('div'); body.className = 'uidv-eq-body';

    var line1 = document.createElement('div'); line1.className = 'uidv-line line1';
    var eq1   = document.createElement('span'); eq1.textContent = ' = ';
    var symRHS= document.createElement('span'); symRHS.className = 'uidv-eq';

    var line2 = document.createElement('div'); line2.className = 'uidv-line line2';
    var eq2   = document.createElement('span'); eq2.textContent = ' = ';
    var liveRHS=document.createElement('span'); liveRHS.className = 'uidv-live';
    var approx = document.createElement('span'); approx.className = 'uidv-approx';

    line1.appendChild(eq1); line1.appendChild(symRHS);
    line2.appendChild(eq2); line2.appendChild(liveRHS); line2.appendChild(approx);
    body.appendChild(line1); body.appendChild(line2);

    card.appendChild(badge); card.appendChild(body);
    wrap.appendChild(card);
    return { card:card, badge:badge, symRHS:symRHS, liveRHS:liveRHS, approx:approx };
  }
  var cs = { s:makeCard('s'), e:makeCard('e'), i:makeCard('i'), r:makeCard('r') };

  // ---------- MathJax helpers ----------
  function MJ(){ return (window.MathJax && window.MathJax.typesetPromise) ? window.MathJax : null; }
  function mjWrap(tex){ return window.MathJax ? ('\\(' + tex + '\\)') : tex.replace(/\\/g,''); }
  function typeset(el){ var M = MJ(); if (!M) return; if (el._mj_done) M.typesetClear([el]); el._mj_done=true; M.typesetPromise([el]).catch(function(){}); }

  // ---------- Static content ----------
  cs.s.badge.innerHTML = mjWrap('\\dot S');
  cs.e.badge.innerHTML = mjWrap('\\dot E');
  cs.i.badge.innerHTML = mjWrap('\\dot I');
  cs.r.badge.innerHTML = mjWrap('\\dot R');
  typeset(cs.s.badge); typeset(cs.e.badge); typeset(cs.i.badge); typeset(cs.r.badge);

  var TEX_RHS = {
    s: '-\\\\beta \\\\frac{S\\\\,I}{N}',
    e: '\\\\beta \\\\frac{S\\\\,I}{N} - \\\\sigma E',
    i: '\\\\sigma E - \\\\gamma I',
    r: '\\\\gamma I'
  };
  cs.s.symRHS.innerHTML = mjWrap(TEX_RHS.s);
  cs.e.symRHS.innerHTML = mjWrap(TEX_RHS.e);
  cs.i.symRHS.innerHTML = mjWrap(TEX_RHS.i);
  cs.r.symRHS.innerHTML = mjWrap(TEX_RHS.r);
  typeset(cs.s.symRHS); typeset(cs.e.symRHS); typeset(cs.i.symRHS); typeset(cs.r.symRHS);

  // ---------- State ----------
  var series = null, idx = 0;
  var N = 1, beta = 0, sigma = 0, gamma = 0;
  var raf = 0, destroyed = false;
  var lastSig = '';

  function snap(s, i){
    var Nmax = Math.max(0, (s && s.t ? s.t.length : 1) - 1);
    var k    = Math.max(0, Math.min(Nmax, i|0));
    function v(key){ var arr = s && s[key]; return Array.isArray(arr) ? Number(arr[k] || 0) : 0; }
    return { idx:k, S:v('S'), E:v('E'), I:v('I') };
  }
  function nfDec(d){ return new Intl.NumberFormat('de-DE',{minimumFractionDigits:d,maximumFractionDigits:d}); }
  var nfInt = new Intl.NumberFormat('de-DE');
  function fmtDec(x,d){ return nfDec(d).format(x); }
  function fmtInt(x){ return nfInt.format(Math.round(x)); }
  function fmtKM(x){
    var ax = Math.abs(x);
    if (ax >= 999500) return fmtDec(x/1000000,1) + ' M';
    if (ax >=   9950) return fmtDec(x/1000,1) + ' K';
    if (ax >=    999.5) return fmtDec(x/1000,1) + ' K';
    return fmtDec(x,1);
  }
  function pick(v, kIdx){
    if (Array.isArray(v)) {
      var i = Math.max(0, Math.min(v.length-1, kIdx));
      return Number(v[i] || 0);
    }
    return Number(v || 0);
  }

  function livingTex(which, S,E,I,N,b,s,g){
    var Si = fmtInt(S), Ei = fmtInt(E), Ii = fmtInt(I), Ni = fmtInt(Math.max(1,N));
    if (which === 's') return '-\\\\beta(t)\\\\cdot\\\\frac{' + Si + '\\\\cdot' + Ii + '}{' + Ni + '}';
    if (which === 'e') return '\\\\beta(t)\\\\cdot\\\\frac{' + Si + '\\\\cdot' + Ii + '}{' + Ni + '}-\\\\sigma(t)\\\\,' + Ei;
    if (which === 'i') return '\\\\sigma(t)\\\\,' + Ei + '-\\\\gamma(t)\\\\,' + Ii;
    if (which === 'r') return '\\\\gamma(t)\\\\,' + Ii;
    return '';
  }
  function flows(S,E,I,N,b,s,g){
    var Fse = b * S * I / Math.max(1,N);
    var Fei = s * E;
    var Fir = g * I;
    return { Sd:-Fse, Ed:Fse-Fei, Id:Fei-Fir, Rd:Fir };
  }

  function render(){
    raf = 0; if (!series || destroyed) return;
    var v = snap(series, idx);
    var b = pick(beta, idx), s = pick(sigma, idx), g = pick(gamma, idx), n = pick(N, idx) || 1;
    var out = flows(v.S, v.E, v.I, n, b, s, g);

    cs.s.liveRHS.innerHTML = mjWrap(livingTex('s', v.S,v.E,v.I, n, b,s,g));
    cs.e.liveRHS.innerHTML = mjWrap(livingTex('e', v.S,v.E,v.I, n, b,s,g));
    cs.i.liveRHS.innerHTML = mjWrap(livingTex('i', v.S,v.E,v.I, n, b,s,g));
    cs.r.liveRHS.innerHTML = mjWrap(livingTex('r', v.S,v.E,v.I, n, b,s,g));

    var unit = opts.unit || 'Pers./d';
    cs.s.approx.textContent = ' ≈ ' + fmtKM(out.Sd) + ' ' + unit;
    cs.e.approx.textContent = ' ≈ ' + fmtKM(out.Ed) + ' ' + unit;
    cs.i.approx.textContent = ' ≈ ' + fmtKM(out.Id) + ' ' + unit;
    cs.r.approx.textContent = ' ≈ ' + fmtKM(out.Rd) + ' ' + unit;

    typeset(cs.s.liveRHS); typeset(cs.e.liveRHS); typeset(cs.i.liveRHS); typeset(cs.r.liveRHS);
    bringToFront(); // keep overlay above any newly inserted wheel layers
  }
  function schedule(){ if (!raf) raf = requestAnimationFrame(render); }

  function update(p){
    p = p || {};
    if ('series' in p) series = p.series || null;
    if ('idx' in p)    idx    = p.idx|0;
    if ('N' in p)      N      = p.N;
    if ('beta' in p)   beta   = p.beta;
    if ('sigma' in p)  sigma  = p.sigma;
    if ('gamma' in p)  gamma  = p.gamma;

    var sig = String(idx) + '|' + (Array.isArray(N)?'A':'n') + '|' + (Array.isArray(beta)?'A':'b') + '|' + (Array.isArray(sigma)?'A':'s') + '|' + (Array.isArray(gamma)?'A':'g');
    if (sig !== lastSig) { lastSig = sig; schedule(); }
  }

  // ---------- Visibility guards (hybrid-first) ----------
  function setVisible(v){ wrap.style.display = v ? '' : 'none'; }
  setVisible(true);

  function parseMode(detail){
    var m = String(detail && (detail.mode || detail.view || detail.type) || detail || '').toLowerCase();
    if (/real|wheel|rad/.test(m))        return false;
    if (/hybrid|square|quadrat/.test(m)) return true;
    return null;
  }

  var EVENT_NAMES = [
    'uid:e:vectors:mode','uid:vectors:mode','uid:e:vw:mode','uid:e:vw:view',
    'uid:e:vectors:view','uid:pres:vectors:mode','uid:vectors:view',
    'uid:vector:mode','uid:vector:view','uid:e:vector:mode','uid:e:vector:view'
  ];
  function evHandler(e){
    var res = parseMode(e && e.detail);
    if (res === false){ setVisible(false); }
    else if (res === true){ setVisible(true); bringToFront(); }
  }
  for (var i=0;i<EVENT_NAMES.length;i++){ window.addEventListener(EVENT_NAMES[i], evHandler); }

  function detectFromDOM(){
    var isR = host.querySelector('[data-vmode=\"real\"],[data-view=\"real\"],.is-real,.real,.wheel,[aria-label*=\"Rad\" i],[aria-label*=\"Wheel\" i]') !== null;
    if (isR) { setVisible(false); return; }
    var isH = host.querySelector('[data-vmode=\"hybrid\"],[data-view=\"hybrid\"],.is-hybrid,.hybrid,.square,[aria-label*=\"Quadrat\" i]') !== null;
    if (isH) { setVisible(true); bringToFront(); return; }
  }
  var mo = new MutationObserver(function(){ detectFromDOM(); });
  mo.observe(host, { attributes:true, childList:true, subtree:true });
  detectFromDOM();

  function clickGuard(ev){
    var t = ev.target && ev.target.closest ? ev.target.closest('button,[role=\"button\"],.chip,.pill') : null;
    if (!t) return;
    var txt = (t.textContent || '').toLowerCase();
    if (/modus|darstellung|mode|view/.test(txt)) {
      setVisible(false);
      setTimeout(detectFromDOM, 0);
      setTimeout(detectFromDOM, 60);
      setTimeout(detectFromDOM, 180);
      setTimeout(detectFromDOM, 360);
    }
  }
  host.addEventListener('click', clickGuard, true);

  // Re-typeset when MathJax finishes loading (in case overlay mounted early)
  var mjScript = document.getElementById('MathJax-script');
  if (mjScript && !window.MathJax) {
    mjScript.addEventListener('load', function(){
      try {
        typeset(cs.s.badge); typeset(cs.e.badge); typeset(cs.i.badge); typeset(cs.r.badge);
        typeset(cs.s.symRHS); typeset(cs.e.symRHS); typeset(cs.i.symRHS); typeset(cs.r.symRHS);
        typeset(cs.s.liveRHS); typeset(cs.e.liveRHS); typeset(cs.i.liveRHS); typeset(cs.r.liveRHS);
      } catch(e){}
    }, { once:true });
  }

  function dispose(){
    try { if (host.contains(wrap)) host.removeChild(wrap); } catch(e) {}
    host.removeEventListener('click', clickGuard, true);
    for (var j=0;j<EVENT_NAMES.length;j++){ window.removeEventListener(EVENT_NAMES[j], evHandler); }
    mo.disconnect();
  }

  return { update:update, dispose:dispose, setVisible:setVisible };
}
