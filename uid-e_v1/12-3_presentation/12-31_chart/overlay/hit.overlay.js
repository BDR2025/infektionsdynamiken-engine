/*!
 * File:      hit.overlay.js
 * Folder:    12-3_presentation/chart/overlay
 * Project:   UID-Explore · Chart Overlay (HIT)
 * License:   CC BY 4.0
 *
 * Features
 *   • Horizontale HIT-Schwelle (S_eff/N = 1/R0) + vertikales t(HIT) – beide strikt auf Plot geclippt
 *   • Farbe aus Serie R (CSS var --series-R), Fallback angenehmes Blau
 *   • Edge-cases:
 *       – kein Crossing → nur horizontale Linie (keine t(HIT))
 *       – Schwelle außerhalb des y-Rahmens → horizontale + Label unterdrückt
 *   • Reagiert auf: uid:e:lines:hit:toggle, …data:series, …model:params, …viz:scale:changed, …viz:resize
 *   • Optionaler Export (Opt‑in):
 *       on('uid:e:export:collect-overlays', (req) => {
 *         // Opt‑in Varianten
 *         // 1) req.include?.hit === true
 *         // 2) Array enthält 'hit': req.layers?.includes('hit')
 *         // 3) req.all === true  (falls „alles exportieren“)
 *         // Übergabe: req.add(node, { id:'hit', z:5 }) ODER req.overlays.push({ id:'hit', node })
 *       })
 */

import { on, emit } from '../../../12-1_base/bus.js';

export function mountHitOverlay(chartRootEl, { widgetEl, model = 'SIR', color } = {}) {
  if (!chartRootEl) return () => {};
  // Idempotenz
  if (chartRootEl.querySelector('.uid-hit-overlay')) return () => {};

  // Layout
  const css = getComputedStyle(chartRootEl);
  const px  = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const PAD = {
    l: px(css.getPropertyValue('--plot-pad-l')) || px(css.getPropertyValue('--chart-pad-left'))   || 44,
    r: px(css.getPropertyValue('--plot-pad-r')) || px(css.getPropertyValue('--chart-pad-right'))  || 18,
    t: px(css.getPropertyValue('--plot-pad-t')) || px(css.getPropertyValue('--chart-pad-top'))    || 12,
    b: px(css.getPropertyValue('--plot-pad-b')) || px(css.getPropertyValue('--chart-pad-bottom')) || 28
  };

  // Farbe (Serie R)
  const pickR = () =>
    color ||
    css.getPropertyValue('--series-R')?.trim() ||
    getComputedStyle(document.documentElement).getPropertyValue('--series-R')?.trim() ||
    '#65AFFF';

  // SVG-Layer
  chartRootEl.style.position = chartRootEl.style.position || 'relative';
  const ns  = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.classList.add('uid-hit-overlay');
  Object.assign(svg.style, { position:'absolute', inset:0, pointerEvents:'none', zIndex:5 });
  chartRootEl.appendChild(svg);

  // Eine sichtbare Ebene für Export leichter klonbar gestalten
  const gLayer = document.createElementNS(ns, 'g');
  gLayer.setAttribute('class', 'hit-layer');
  svg.appendChild(gLayer);

  const mk = (tag, a = {}, parent = gLayer) => {
    const el = document.createElementNS(ns, tag);
    for (const k in a) el.setAttribute(k, a[k]);
    parent.appendChild(el);
    return el;
  };
  const clearLayer = () => { while (gLayer.firstChild) gLayer.firstChild.remove(); };

  // State
  let enabled = false;
  let series  = null;                     // { t,S,I,R,V?,N }
  let params  = { R0:null, vaccineEff:1 };
  let scale   = 'abs';

  // Render
  function render() {
    clearLayer();
    if (!enabled || model === 'SIS') return;
    if (!series?.t?.length || !series?.S?.length || !series?.N || !params?.R0) return;

    const rect = chartRootEl.getBoundingClientRect();
    const W = Math.max(1, rect.width), H = Math.max(1, rect.height);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    const plot = { x:PAD.l, y:PAD.t, w:Math.max(1, W-PAD.l-PAD.r), h:Math.max(1, H-PAD.t-PAD.b) };

    // ClipPath auf die Ebene anwenden
    const defs  = svg.querySelector('defs') || svg.insertBefore(document.createElementNS(ns,'defs'), svg.firstChild);
    // neue ID je Render ist nicht nötig – eine stabile ID reicht
    let clip = defs.querySelector('#hit-clip');
    if (!clip) {
      clip = document.createElementNS(ns,'clipPath'); clip.setAttribute('id','hit-clip');
      defs.appendChild(clip);
      clip.appendChild(document.createElementNS(ns,'rect'));
    }
    const clipRect = clip.firstElementChild;
    clipRect.setAttribute('x', plot.x); clipRect.setAttribute('y', plot.y);
    clipRect.setAttribute('width', plot.w); clipRect.setAttribute('height', plot.h);
    gLayer.setAttribute('clip-path','url(#hit-clip)');

    const x = series.t, N = series.N;
    const t0 = x[0], t1 = x[x.length-1];
    const y0 = 0,     y1 = Math.max(series.S[0]||0, N);

    // Effektive Suszeptible (SIRV)
    const eff  = params.vaccineEff ?? 1;
    const Seff = (model === 'SIRV' && series.V)
      ? series.S.map((s,i)=> s + (1-eff)*(series.V[i]||0))
      : series.S;

    const thrAbs = N / (+params.R0 || 1);

    const xPx = (tx)=> plot.x + (tx - t0)/(t1 - t0) * plot.w;
    const yPx = (vy)=> plot.y + plot.h - (vy - y0)/(y1 - y0) * plot.h;

    const C = pickR();

    // Schwelle liegt außerhalb des y-Bereichs? → horizontale + Label unterdrücken
    const hy = yPx(thrAbs);
    const threshInside = (thrAbs >= y0 && thrAbs <= y1) && (hy >= plot.y && hy <= (plot.y + plot.h));

    if (threshInside) {
      // horizontale
      mk('line', { x1:plot.x, y1:hy, x2:plot.x+plot.w, y2:hy, stroke:C, 'stroke-width':1.5, 'stroke-dasharray':'4 4', opacity:.9 });

      // Label (oben rechts, im Plot halten)
      const fmt = (scale === 'pct') ? `${(thrAbs/N*100).toFixed(1)}%` : `${Math.round(thrAbs)}`;
      const labY = Math.min(Math.max(plot.y + 12, hy - 12), plot.y + plot.h - 12);
      // Halo + Text
      const halo = mk('text', { x:plot.x+plot.w-6, y:labY, 'text-anchor':'end', 'dominant-baseline':'middle', 'font-size':12, 'font-variant-numeric':'tabular-nums', stroke:'rgba(0,0,0,.35)', 'stroke-width':3, fill:'none' });
      halo.textContent = `HIT: ${fmt}`;
      const label = mk('text', { x:halo.getAttribute('x'), y:labY, 'text-anchor':'end', 'dominant-baseline':'middle', 'font-size':12, 'font-variant-numeric':'tabular-nums', fill:C });
      label.textContent = `HIT: ${fmt}`;
    }

    // vertikal t(HIT) nur wenn Crossing vorhanden und x im Plot
    let xi = null;
    for (let i=1;i<Seff.length;i++){
      const a = Seff[i-1] - thrAbs;
      const b = Seff[i]   - thrAbs;
      if (a === 0) { xi = x[i-1]; break; }
      if (a * b <= 0) {
        const t = (0 - a) / ((b - a) || 1e-12);
        xi = x[i-1] + t * (x[i] - x[i-1]);
        break;
      }
    }
    if (xi != null && xi >= t0 && xi <= t1) {
      const vx = xPx(xi);
      mk('line', { x1:vx, y1:plot.y, x2:vx, y2:plot.y+plot.h, stroke:C, 'stroke-width':1.5, 'stroke-dasharray':'2 3', opacity:.9 });
      // kleines Label oben (nicht aus dem Plot laufen lassen)
      const tx = Math.min(plot.x + plot.w - 6, vx + 6);
      mk('text', { x:tx, y:plot.y+12, 'text-anchor':'end', 'font-size':11, fill:'#bcd7ff' }).textContent = `(tHIT)=${Math.round(xi)}`;
    }
  }

  // Bus-Wiring
  const off = [];
  off.push(on('uid:e:lines:hit:toggle', ({ on, scope }) => { if (scope && scope !== widgetEl) return; const was = enabled; enabled = !!on; if (enabled && !was) emit('uid:e:kpi:pulse', { kind:'HIT', scope: widgetEl }); render(); }));
  off.push(on('uid:e:data:series',  (s) => { series = s; render(); }));
  off.push(on('uid:e:model:params', (p) => { params = { ...params, ...p }; render(); }));
  off.push(on('uid:e:viz:scale:changed', ({ mode, scope }) => { if (scope && scope !== widgetEl) return; if (mode === 'pct' || mode === 'abs') { scale = mode; render(); } }));
  off.push(on('uid:e:viz:resize', () => render()));
  window.addEventListener('resize', () => render(), { passive:true });

  // OPTIONALER EXPORT (Opt‑in)
  off.push(on('uid:e:export:collect-overlays', (req) => {
    // Opt‑in prüfen
    const want =
      req?.all === true ||
      req?.include?.hit === true ||
      (Array.isArray(req?.layers) && req.layers.includes('hit')) ||
      (typeof req?.filter === 'function' && req.filter('hit')) ||
      false;

    if (!want) return;
    if (!enabled || !gLayer.firstChild) return;

    // Bereite exportierbaren Knoten vor: <g> in <svg>-Koordinaten duplizieren
    const node = gLayer.cloneNode(true);
    // Variante A: Collector-API
    if (typeof req?.add === 'function') {
      try { req.add(node, { id:'hit', z:5, widget: widgetEl }); return; } catch {}
    }
    // Variante B: Array-Accumulator
    if (Array.isArray(req?.overlays)) {
      req.overlays.push({ id:'hit', node, z:5 });
      return;
    }
    // Variante C: Fallback – Push-Funktion
    if (typeof req?.push === 'function') {
      try { req.push(node); return; } catch {}
    }
    // Variante D: Fallback – direkt anhängen, falls Zielknoten angegeben
    if (req?.target && req.target.appendChild) {
      try { req.target.appendChild(node); } catch {}
    }
  }));

  // Cleanup
  return () => {
    try { off.forEach(f => typeof f === 'function' && f()); } catch {}
    try { svg.remove(); } catch {}
  };
}

export default { mountHitOverlay };
