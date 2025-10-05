/*!
 * File:      vectors/core/canvas.js
 * Project:   UID-Explore (Presentation)
 * Module:    Canvas lifecycle (DPR, ResizeObserver)
 * License:   CC BY 4.0
 */

export function createCanvas(host) {
  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width   = '100%';
  canvas.style.height  = '100%';
  host.innerHTML = '';
  host.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let DPR = 1;

  function setSize() {
    const w = Math.max(40, host.clientWidth  | 0);
    const h = Math.max(40, host.clientHeight | 0);
    DPR = Math.max(1, window.devicePixelRatio || 1);

    canvas.width  = Math.round(w * DPR);
    canvas.height = Math.round(h * DPR);
    canvas.style.width  = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.imageSmoothingEnabled = true;
  }

  function observeResize(cb) {
    const ro = new ResizeObserver(() => cb && cb());
    ro.observe(host);
    return () => { try { ro.disconnect(); } catch {} };
  }

  function dispose() {
    try { host.contains(canvas) && host.removeChild(canvas); } catch {}
  }

  return { ctx, setSize, observeResize, dispose };
}
