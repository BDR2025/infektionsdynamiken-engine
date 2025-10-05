// ============================================================================
// UID-Chart · core/chart-renderer.js
// Canvas-Renderer mit korrekter DPR-Skalierung, Padding, Clamping & Diag
// CC BY 4.0
// ============================================================================
export function createRenderer(host) {
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  host.appendChild(canvas);

  // Transparentes Canvas (alpha: true)
  const ctx = canvas.getContext('2d', { alpha: true });

  let W = 0, H = 0, PAD = 32;

  function setSize(cssW, cssH) {
    const w = Math.max(10, Math.floor(cssW || host.clientWidth || 0));
    const h = Math.max(10, Math.floor(cssH || host.clientHeight || 0));

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;

    W = w; H = h;
    clear();
  }

  // Transparent räumen (kein FillRect-Hintergrund mehr)
  function clear() {
    ctx.save();
    // Transform neutralisieren, damit wirklich die volle Pixel-Fläche gecleart wird
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  function drawAxes() {
    ctx.strokeStyle = '#2a3344';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, H - PAD); ctx.lineTo(W - PAD, H - PAD); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD, PAD);     ctx.lineTo(PAD, H - PAD);     ctx.stroke();
  }

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  function drawLine(xs, ys, color, ymin, ymax) {
    if (!xs || !ys || xs.length < 2) return;
    const n = Math.min(xs.length, ys.length);
    const x0 = xs[0], x1 = xs[n - 1];
    const rx = Math.max(1e-9, (x1 - x0));
    const ry = Math.max(1e-9, (ymax - ymin));
    const sx = (W - 2 * PAD) / rx;
    const sy = (H - 2 * PAD) / ry;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const X = PAD + (xs[i] - x0) * sx;
      const Yraw = H - PAD - (ys[i] - ymin) * sy;
      const Y = clamp(Yraw, PAD, H - PAD);
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.stroke();
  }

  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const colS = () => css('--c-s') || '#22c55e';
  const colE = () => css('--c-e') || '#f59e0b';
  const colI = () => css('--c-i') || '#ef4444';
  const colR = () => css('--c-r') || '#3b82f6';

  function drawSeries(series = {}) {
    if (!W || !H) setSize();
    clear();
    drawAxes();

    // Zeitachse
    const t = Array.isArray(series.t) ? series.t
            : (series.S && series.S.map((_, i) => i)) || [];

    // Y-Bounds über alle existenten Serien (S,E,I,R)
    const pick = k => (Array.isArray(series[k]) ? series[k] : null);
    const arrs = ['S','E','I','R'].map(pick).filter(Boolean);
    const flat = arrs.flat();
    let ymin = flat.length ? Math.min(...flat) : 0;
    let ymax = flat.length ? Math.max(...flat) : 1;
    if (!Number.isFinite(ymin) || !Number.isFinite(ymax) || Math.abs(ymax - ymin) < 1e-9) {
      ymin = 0; ymax = 1;
    }
    const margin = (ymax - ymin) * 0.05; ymin -= margin; ymax += margin;

    // Linien zeichnen (nur wenn vorhanden)
    if (series.S) drawLine(t, series.S, colS(), ymin, ymax);
    if (series.E) drawLine(t, series.E, colE(), ymin, ymax);
    if (series.I) drawLine(t, series.I, colI(), ymin, ymax);
    if (series.R) drawLine(t, series.R, colR(), ymin, ymax);
  }

  function diag() {
    const info = {
      hostRect: { w: host.clientWidth, h: host.clientHeight },
      canvasStyle: { w: canvas.style.width, h: canvas.style.height },
      canvasPx: { w: canvas.width, h: canvas.height },
      dpr: window.devicePixelRatio || 1,
      pad: PAD
    };
    console.table(info);
    ctx.save(); ctx.strokeStyle = '#555'; ctx.setLineDash([4,3]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1); ctx.restore();
    return info;
  }

  function dispose() {
    try { host.contains(canvas) && host.removeChild(canvas); } catch {}
  }

  return { canvas, setSize, drawSeries, dispose, diag };
}
