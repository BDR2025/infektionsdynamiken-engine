// ============================================================================
// UID-Chart · interaction/lines.js
// Peak-Linien (SIR/SEIR): I_peak (+ E_peak bei SEIR)
// - dezent: 1px, halbtransparent, feines Dash
// - unter Playhead/Marker gerendert (kein Überlagern)
// - dimmen bei Slider-Drag & wenn Serie via Halo-Dot ausgeblendet ist
// - reagiert auf Master-Toggle uid:e:viz:overlays:enable
// CC BY 4.0
// ============================================================================
import { on } from '../../../12-1_base/bus.js';

const KEYS = ['E','I']; // Reihenfolge für Label-Offsets
const COLOR = (k) => ({
  S: css('--c-s'),
  E: css('--c-e', '#a855f7'),
  I: css('--c-i'),
  R: css('--c-r')
}[k] || '#ccc');

function css(name, fallback){
  return getComputedStyle(document.documentElement).getPropertyValue(name)?.trim() || fallback || '#ccc';
}

export function mountLines(host, { pad = 32 } = {}) {
  if (!host) return { dispose(){} };

  // Canvas ANS ANFANG setzen → liegt UNTER allen späteren Overlays
  const cv = document.createElement('canvas');
  Object.assign(cv.style, {
    position:'absolute', inset:'0', width:'100%', height:'100%',
    display:'block', pointerEvents:'none'
  });
  host.insertBefore(cv, host.firstChild); // unter Playhead/Markers
  const ctx = cv.getContext('2d');

  // State
  let W=0, H=0, DPR=1;
  let series = null;                 // { t, S, E, I, R }
  let peakIdx = { E:null, I:null };  // Index der Peaks
  let visible = { S:true, E:true, I:true, R:true };
  let isAdjusting = false;           // Slider-Drag
  let adjustTimer = 0;
  let overlaysEnabled = true;        // Master-Toggle

  function setSize(){
    const r = host.getBoundingClientRect();
    DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    W = Math.max(1, Math.floor(r.width));
    H = Math.max(1, Math.floor(r.height));
    cv.width  = W * DPR;
    cv.height = H * DPR;
  }
  const ro = new ResizeObserver(() => { setSize(); draw(); });
  ro.observe(host);
  queueMicrotask(()=>{ setSize(); draw(); });

  // Events
  const offData   = on('uid:e:sim:data',   p => { series = p?.series || null; computePeaks(); draw(); });
  const offPtr    = on('uid:e:sim:pointer',_ => { /* nur Redraw für sanfte UX */ draw(); });
  const offViz    = on('uid:e:viz:series:state', p => { if (p?.visible) visible = { ...visible, ...p.visible }; draw(); });
  const offParams = on('uid:e:params:change', _ => {
    isAdjusting = true;
    clearTimeout(adjustTimer);
    adjustTimer = setTimeout(()=>{ isAdjusting=false; draw(); }, 140); // kurzer Nachlauf
    draw();
  });
  const offOverlay = on('uid:e:viz:overlays:enable', p => {
    overlaysEnabled = !!(p?.enabled);
    draw();
  });

  // Peaks bestimmen
  function computePeaks(){
    peakIdx = { E:null, I:null };
    if (!series || !Array.isArray(series.t) || !series.t.length) return;

    if (Array.isArray(series.I) && series.I.length){
      let idx=0, vmax=series.I[0] ?? -Infinity;
      for (let i=1;i<series.I.length;i++){ const v=series.I[i]; if (v>vmax){ vmax=v; idx=i; } }
      peakIdx.I = idx;
    }
    if (Array.isArray(series.E) && series.E.length){
      let idx=0, vmax=series.E[0] ?? -Infinity;
      for (let i=1;i<series.E.length;i++){ const v=series.E[i]; if (v>vmax){ vmax=v; idx=i; } }
      peakIdx.E = idx;
    }
  }

  // Zeichnen (dezent)
  function draw(){
    ctx.save();
    ctx.scale(DPR, DPR);
    ctx.clearRect(0,0,W,H);

    // Master-Toggle: Overlays komplett aus
    if (!overlaysEnabled) { ctx.restore(); return; }

    if (!series || !Array.isArray(series.t) || !series.t.length){
      ctx.restore(); return;
    }

    const t  = series.t;
    const N  = t.length;
    const x0 = t[0], x1 = t[N-1];
    const sx = (W - 2*pad) / Math.max(1e-9, (x1 - x0));
    const X  = (x) => (pad + (x - x0) * sx);

    // Farbwahl: dezent, halbtransparent – dimmen bei „aus“ oder „adjusting“
    const colorFor = (k) => {
      const base = COLOR(k);
      if (!visible[k] || isAdjusting) return 'rgba(170,180,190,0.55)'; // neutral grau
      return base; // Serienfarbe (später via globalAlpha leicht gedimmt)
    };

    // Strichstil: hauchdünn, fein gestrichelt
    const applyStroke = (k) => {
      ctx.lineWidth   = 1;
      ctx.lineCap     = 'butt';
      ctx.setLineDash([3,6]);             // dezentes Dash
      const c = colorFor(k);
      if (/rgba?\(/i.test(c)) {           // rgba → direkt
        ctx.strokeStyle = c;
        ctx.globalAlpha = 1;
      } else {                            // sonst Serienfarbe mit leichter Dimmung
        ctx.strokeStyle = c;
        ctx.globalAlpha = 0.55;
      }
    };

    // Labels oben: E links der Linie, I rechts – klein & unaufdringlich
    const drawLabel = (k, x) => {
      const label = (k === 'I') ? 'I_peak' : 'E_peak';
      const offset = 6;
      ctx.save();
      ctx.fillStyle   = colorFor(k);
      ctx.globalAlpha = (/rgba?\(/i.test(ctx.fillStyle) ? 1 : 0.75);
      ctx.font        = '12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      ctx.textBaseline= 'top';
      ctx.textAlign   = (k === 'I') ? 'left' : 'right';
      const tx        = (k === 'I') ? (x + offset) : (x - offset);
      const ty        = pad + 2;
      ctx.fillText(label, tx, ty);
      ctx.restore();
    };

    // Zeichnen in Reihenfolge E → I (damit sich Labels nicht stören)
    for (const k of KEYS){
      const pIdx = peakIdx[k];
      if (pIdx == null) continue;
      if (!Array.isArray(series[k]) || !series[k].length) continue;

      const x = X(t[pIdx]);

      // Linie
      ctx.save();
      applyStroke(k);
      ctx.beginPath();
      ctx.moveTo(x, pad);
      ctx.lineTo(x, H - pad);
      ctx.stroke();
      ctx.restore();

      // Label
      drawLabel(k, x);
    }

    ctx.restore();
  }

  // API
  return {
    dispose(){
      try { offData && offData(); } catch {}
      try { offPtr && offPtr(); } catch {}
      try { offViz && offViz(); } catch {}
      try { offParams && offParams(); } catch {}
      try { offOverlay && offOverlay(); } catch {}
      try { ro.disconnect(); } catch {}
      try { host.contains(cv) && host.removeChild(cv); } catch {}
      clearTimeout(adjustTimer);
    }
  };
}
