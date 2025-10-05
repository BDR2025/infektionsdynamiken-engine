/*!
 * File:      view.js
 * Project:   UID-Explore · Living Equation
 * Type:      View (Bare CEQ · Freeze Slots)
 * License:   CC BY 4.0
 *
 * Update:    Entfernt inneren Widget-Header/Chips/Rahmen.
 *            Rendert nur noch die CEQ-Struktur in #core-equation.
 */

import { texNumeric } from './tex-numeric.js';
import { fmtFloat, fmtInt } from './format.js';

export function mountView(rootSel){
  // ---------- Mount / Template ----------
  const host = document.querySelector(rootSel);
  let root;

  if (!host) {
    // Fallback: Host anlegen (selten nötig)
    root = document.createElement('div');
    root.id = (rootSel.replace('#','') || 'core-equation');
    root.innerHTML = templateBare();
    document.body.appendChild(root);
  } else {
    root = host;
    root.innerHTML = templateBare();
  }

  const refs = {
    root,
    body:   root.querySelector('.ceq'),
    left:   root.querySelector('.block-left'),
    mid:    root.querySelector('.block-mid'),
    right:  root.querySelector('.block-right'),
    deriv:  root.querySelector('.deriv-line'),
  };

  // ---------- MathJax Helper ----------
  function typesetWhenReady(nodes){
    if (!Array.isArray(nodes)) nodes = [nodes];
    return new Promise(resolve => {
      const run = () => {
        const p = window.MathJax?.typesetPromise
          ? window.MathJax.typesetPromise(nodes)
          : Promise.resolve();
        p.finally(resolve);
      };
      if (window.MathJax?.typesetPromise) return run();
      const mj = document.getElementById('MathJax-script');
      if (mj) mj.addEventListener('load', run, { once:true });
      else window.addEventListener('load', run, { once:true });
    });
  }

  // ---------- Static Render (LEFT + MID + DERIV) ----------
  async function renderStatic({ left, mid, deriv }){
    refs.left.innerHTML  = left;
    refs.mid.innerHTML   = mid;
    refs.deriv.innerHTML = deriv;
    await typesetWhenReady([refs.left, refs.mid, refs.deriv]);
  }

  // ---------- Calibration (Pre-Measure) ----------
  async function calibrate(spec, series, params){
    if (!spec || !series) return;

    const maxOf = a => (Array.isArray(a)&&a.length) ? Math.max(...a) : 0;
    const valsMax = {
      S: maxOf(series.S), E: maxOf(series.E), I: maxOf(series.I),
      R: maxOf(series.R), D: maxOf(series.D), V: maxOf(series.V),
      N: params?.N ?? 1,
      beta:  params?.beta  ?? (params?.R0!=null && params?.gamma!=null ? params.R0*params.gamma : 0),
      gamma: params?.gamma ?? (params?.D ? 1/Number(params.D) : 0),
      sigma: params?.sigma ?? (params?.L ? 1/Number(params.L) : 0),
      mu:    params?.mu    ?? 0,
      nu:    params?.nu    ?? 0,
    };

    // Offscreen-Ghost der numerischen Matrix
    const ghost = document.createElement('div');
    ghost.style.cssText = 'position:absolute; left:-99999px; top:-99999px; visibility:hidden;';
    ghost.innerHTML = texNumeric(spec, valsMax);
    refs.right.appendChild(ghost);
    await typesetWhenReady([ghost]);

    // Breiten messen
    const rowLocks = {};
    ghost.querySelectorAll('.row').forEach(r=>{
      const key = Array.from(r.classList).find(c=>c.startsWith('row-'))?.slice(4) || 'X';
      rowLocks[key] = Math.ceil(r.getBoundingClientRect().width);
    });
    const getW = sel => {
      const el = ghost.querySelector(sel);
      return el ? Math.ceil(el.getBoundingClientRect().width) : 0;
    };
    const wNum  = getW('.num.num-Z');
    const wDen  = getW('.num.num-N');
    const wCoef = getW('.coef');

    if (wNum)  refs.right.style.setProperty('--wNum',  wNum  + 'px');
    if (wDen)  refs.right.style.setProperty('--wDen',  wDen  + 'px');
    if (wCoef) refs.right.style.setProperty('--wCoef', wCoef + 'px');

    applyLineLocks(refs.right, rowLocks);
    ghost.remove();
  }

  function applyLineLocks(host, locks){
    const rows = host?.querySelectorAll('.row'); if (!rows) return;
    rows.forEach(r=>{
      const key = Array.from(r.classList).find(c=>c.startsWith('row-'))?.slice(4) || 'X';
      const target = locks?.[key] ?? Math.ceil(r.getBoundingClientRect().width);
      r.style.display   = 'inline-block';
      r.style.minWidth  = target + 'px';
      r.style.textAlign = 'left';
    });
  }

  // ---------- Freeze-Mode (Slots) ----------
  let slots = null; // { beta,gamma,sigma,mu,nu,S,E,I,N }

  async function enableFreeze(spec, series, params){
    if (!spec || !series) return;

    const maxOf = a => (Array.isArray(a)&&a.length) ? Math.max(...a) : 0;
    const init = {
      S: maxOf(series.S), E: maxOf(series.E), I: maxOf(series.I),
      R: maxOf(series.R), D: maxOf(series.D), V: maxOf(series.V),
      N: params?.N ?? 1,
      beta:  params?.beta  ?? (params?.R0!=null && params?.gamma!=null ? params.R0*params.gamma : 0),
      gamma: params?.gamma ?? (params?.D ? 1/Number(params.D) : 0),
      sigma: params?.sigma ?? (params?.L ? 1/Number(params.L) : 0),
      mu:    params?.mu    ?? 0,
      nu:    params?.nu    ?? 0,
    };

    refs.right.innerHTML = frozenTex(spec, init);
    await typesetWhenReady([refs.right]);

    const qAll = sel => Array.from(refs.right.querySelectorAll(sel));
    slots = {
      beta:  qAll('.slot-beta'),
      gamma: qAll('.slot-gamma'),
      sigma: qAll('.slot-sigma'),
      mu:    qAll('.slot-mu'),
      nu:    qAll('.slot-nu'),
      S:     qAll('.slot-S'),
      E:     qAll('.slot-E'),
      I:     qAll('.slot-I'),
      N:     qAll('.slot-N'),
    };

    updateSlots(init);
    applyLineLocks(refs.right);
  }

  function hasFreeze(){ return !!slots; }

  function updateSlots(vals){
    if (!slots) return;
    const write3 = (nodes, v) => {
      const text = (v==null || !isFinite(v)) ? '–'
        : new Intl.NumberFormat(document.documentElement.lang||'de',{minimumFractionDigits:3,maximumFractionDigits:3}).format(+v);
      for (const n of (nodes||[])) if (n && n.textContent !== text) n.textContent = text;
    };
    const write0 = (nodes, v) => {
      const text = (v==null || !isFinite(v)) ? '–'
        : new Intl.NumberFormat(document.documentElement.lang||'de',{maximumFractionDigits:0}).format(Math.round(+v));
      for (const n of (nodes||[])) if (n && n.textContent !== text) n.textContent = text;
    };

    write3(slots.beta,  vals.beta);
    write3(slots.gamma, vals.gamma);
    write3(slots.sigma, vals.sigma);
    write3(slots.mu,    vals.mu);
    write3(slots.nu,    vals.nu);

    write0(slots.S, vals.S);
    write0(slots.E, vals.E);
    write0(slots.I, vals.I);
    write0(slots.N, vals.N);
  }

  async function renderRightFromVals(spec, vals){
    refs.right.innerHTML = texNumeric(spec, vals);
    await typesetWhenReady([refs.right]);
  }

  function highlight(winnerKeys = []){
    // Didaktik-Chips sind entfernt → nur Family-Highlights (über Klassen)
    const map = { betaSI_N:'beta', sigmaE:'sigma', gammaI:'gamma', muI:'mu', nuS:'nu' };
    const winners = winnerKeys.map(k => map[k]).filter(Boolean);
    [refs.mid, refs.right].forEach(host => {
      if (!host) return;
      host.classList.remove('hot-beta','hot-sigma','hot-gamma','hot-mu','hot-nu','pulse','bold');
      winners.forEach(id => host.classList.add('hot-' + id));
    });
  }

  // ---------- Exports ----------
  return {
    root: refs.root,
    renderStatic,
    calibrate,
    enableFreeze,
    hasFreeze,
    updateSlots,
    renderRightFromVals,
    highlight,
  };
}

function frozenTex(spec, initial){
  const SPM = (neg, first) => first ? (neg ? '-' : '') : (neg ? '\\, -\\, ' : '\\, +\\, ');
  const sNum  = (k, val) => String.raw`\class{slot slot-${k}}{\mathrm{${fmtInt(val)}}}`;
  const sCoef = (k, val) => String.raw`\class{slot slot-${k}}{\mathrm{${fmtFloat(val)}}}`;

  const NUM = {
    betaSI_N: (v) => String.raw`\class{term term-beta}{${sCoef('beta', v.beta)}\,\dfrac{\class{num num-Z}{${sNum('S',v.S)}\,${sNum('I',v.I)}}\vphantom{888}}{\class{num num-N}{${sNum('N',v.N)}}\vphantom{888}}}`,
    sigmaE:   (v) => String.raw`\class{term term-sigma}{${sCoef('sigma', v.sigma)}\,${sNum('E',v.E)}}`,
    gammaI:   (v) => String.raw`\class{term term-gamma}{${sCoef('gamma', v.gamma)}\,${sNum('I',v.I)}}`,
    muI:      (v) => String.raw`\class{term term-mu}{${sCoef('mu', v.mu)}\,${sNum('I',v.I)}}`,
    nuS:      (v) => String.raw`\class{term term-nu}{${sCoef('nu', v.nu)}\,${sNum('S',v.S)}}`,
  };
  function renderLine(items, vals){
    let out=''; items.forEach((it,i)=>{ out += SPM(it.sign<0, i) + (NUM[it.term] ? NUM[it.term](vals) : ''); }); return out;
  }
  const lines = spec.states.map(st => String.raw`\class{row row-${st}}{${renderLine(spec.rows[st]||[], initial)}}`);
  return String.raw`\[
\require{html}
\begin{pmatrix}
${lines.join('\\\\[6pt]\n')}
\end{pmatrix}
\]`;
}

function templateBare(){
  return `
    <div class="ceq">
      <div class="eq-triple">
        <div class="block block-left"></div>
        <div class="block eq-sign">=</div>
        <div class="block block-mid"></div>
        <div class="block eq-sign">=</div>
        <div class="block block-right"></div>
      </div>
      <div class="deriv-line"></div>
    </div>`;
}
