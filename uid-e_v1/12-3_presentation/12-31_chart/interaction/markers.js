// ============================================================================
// UID-Chart · interaction/markers.js
// Marker-Knötchen am Playhead-Index auf allen sichtbaren Serien.
// - hört: uid:e:sim:data, uid:e:sim:pointer, uid:e:viz:series:state
// - rechnet Y-Scaling identisch zum Renderer (inkl. 5% Margin)
// - dezentes Glow ~ |dy/dt| (Steigung) → edles Finish, nicht „billig“
// - reagiert auf Master-Toggle uid:e:viz:overlays:enable
// CC BY 4.0
// ============================================================================
import { on } from '../../../12-1_base/bus.js';

const SERIES = ['S','E','I','R'];
const COLOR = k => ({
  S: getCSS('--c-s'),
  E: getCSS('--c-e', '#a855f7'),
  I: getCSS('--c-i'),
  R: getCSS('--c-r')
}[k] || '#ccc');

function getCSS(name, fallback){
  return getComputedStyle(document.documentElement).getPropertyValue(name)?.trim() || fallback || '#ccc';
}

export function mountMarkers(host, { pad = 32 } = {}){
  if (!host) return { dispose(){} };

  // Overlay-Canvas
  const cv = document.createElement('canvas');
  Object.assign(cv.style, {
    position:'absolute', inset:'0', width:'100%', height:'100%',
    display:'block', pointerEvents:'none'
  });
  // Host absichern (relative), falls nicht gesetzt
  const pos = getComputedStyle(host).position;
  if (pos === 'static' || !pos) host.style.position = 'relative';
  host.appendChild(cv);
  const ctx = cv.getContext('2d');

  // State
  let W=0, H=0, DPR=1;
  let series = null;  // { t, S, E, I, R }
  let idx = null;     // aktueller Playhead-Index
  let visible = { S:true, E:true, I:true, R:true };
  let overlaysEnabled = true; // Master-Toggle

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

  // ----- Data handling -------------------------------------------------------
  const offData = on('uid:e:sim:data', p => { series = p?.series || null; draw(); });
  const offPtr  = on('uid:e:sim:pointer', p => { idx = Number.isFinite(p?.idx) ? (p.idx|0) : null; draw(); });
  const offViz  = on('uid:e:viz:series:state', p => { if (p?.visible) visible = { ...visible, ...p.visible }; draw(); });
  const offOverlays = on?.('uid:e:viz:overlays:enable', p => {
    overlaysEnabled = !!(p?.enabled);
    draw();
  }) || (()=>{});

  // ----- Draw ---------------------------------------------------------------
  function draw(){
    if (!series || !Array.isArray(series.t) || !series.t.length) {
      clear(); return;
    }
    // Ohne Pointer keinen Marker (bewusst)
    const N = series.t.length;
    const i = (idx==null) ? null : Math.max(0, Math.min(idx|0, N-1));
    if (i==null) { clear(); return; }

    // Canvas vorbereiten
    ctx.save();
    ctx.scale(DPR, DPR);
    ctx.clearRect(0,0,W,H);

    // Master-Toggle: Overlays komplett aus
    if (!overlaysEnabled) { ctx.restore(); return; }

    const t = series.t;
    // y-Min/Max wie im Renderer (über alle vorhandenen & sichtbaren Reihen)
    let ymin = +Infinity, ymax = -Infinity;
    for (const k of SERIES){
      if (!visible[k]) continue;
      const arr = series[k];
      if (!Array.isArray(arr) || !arr.length) continue;
      for (let j=0;j<arr.length;j++){
        const v = arr[j];
        if (Number.isFinite(v)) { if (v<ymin) ymin=v; if (v>ymax) ymax=v; }
      }
    }
    if (!isFinite(ymin) || !isFinite(ymax)) { ctx.restore(); clear(); return; }
    if (ymin===ymax){ ymin -= 1; ymax += 1; }
    const margin = (ymax - ymin) * 0.05; ymin -= margin; ymax += margin;

    // Scales (wie drawLine): x anhand t-Domain, y anhand [ymin,ymax]
    const x0 = t[0], x1 = t[N-1];
    const sx = (W - 2*pad) / Math.max(1e-9, (x1 - x0));
    const sy = (H - 2*pad) / Math.max(1e-9, (ymax - ymin));

    const X = x => (pad + (x - x0) * sx);
    const Y = y => clamp(H - pad - (y - ymin) * sy, pad, H - pad);

    // Edles, dezentes Glow: Stärke ~ |dy/dt|, weich gekappt
    for (const k of SERIES){
      if (!visible[k]) continue;
      const arr = series[k];
      if (!Array.isArray(arr) || arr.length<=i || !Number.isFinite(arr[i])) continue;

      const x = X(t[i]), y = Y(arr[i]);

      // Steigung ~ zentrale Differenz (wo möglich)
      const im1 = Math.max(0, i-1), ip1 = Math.min(N-1, i+1);
      const dt = Math.max(1e-9, (t[ip1] - t[im1]));
      const dy = arr[ip1] - arr[im1];
      const slope = Math.abs(dy / dt);           // absolut
      const glow = Math.min(8, 2 + slope * 2);   // 2..8 px
      const radius = 3;                          // feiner Punkt

      // Glow
      ctx.save();
      ctx.shadowColor = COLOR(k);
      ctx.shadowBlur  = glow;
      ctx.fillStyle   = COLOR(k);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();

      // feine Outline für Präzision
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, radius+0.5, 0, Math.PI*2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function clear(){
    ctx.save();
    ctx.scale(DPR, DPR);
    ctx.clearRect(0,0,W,H);
    ctx.restore();
  }

  function clamp(v, lo, hi){ return Math.min(hi, Math.max(lo, v)); }

  // ----- API ----------------------------------------------------------------
  return {
    dispose(){
      try { offData && offData(); } catch {}
      try { offPtr  && offPtr();  } catch {}
      try { offViz  && offViz();  } catch {}
      try { offOverlays && offOverlays(); } catch {}
      try { ro.disconnect(); } catch {}
      try { host.contains(cv) && host.removeChild(cv); } catch {}
    }
  };
}
