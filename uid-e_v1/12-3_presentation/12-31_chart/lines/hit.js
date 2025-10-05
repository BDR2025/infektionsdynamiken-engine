/*!
 * File:      12-3_presentation/chart/lines/hit.js
 * Module:    UID-Chart · HIT Lines (horizontal + vertical)
 * Version:   v1.0.0 (WP2)
 * License:   CC BY 4.0
 *
 * Assumptions:
 *   - Bus provides time series via 'uid:e:data:series' → { t:[], S:[], E?, I:[], R:[], N }
 *   - Bus provides parameters via 'uid:e:model:params' → { R0, vaccineEff?, vaccinated? }
 *   - SIS: toggle ignored (no HIT); others: SIR, SEIR, SIRD, SIRV supported.
 *
 * Rationale:
 *   - Horizontal line at S/N = 1/R0 (or S_eff/N for SIRV).
 *   - Vertical line at first t with S/N <= 1/R0 (crossing of threshold).
 *
 * KPI Pulse:
 *   - Emits 'uid:e:kpi:pulse' with kind:'HIT' on activation.
 */
import { on, emit } from '../../../12-1_base/bus.js';
import { initOverlay } from '../overlay/manager.js';
import { createScaler, firstCrossing } from '../overlay/utils.js';
import { getScaleMode, formatY } from '../scale/scale-mode.js';

export function initHIT({ widgetEl, chartRoot, bus={on,emit} }){
  if (!chartRoot) throw new Error('[HIT] chartRoot missing');
  const overlay = initOverlay({ root: chartRoot, bus });

  let series = null;     // { t, S, I, R, N }
  let params = { R0: null, vaccineEff: null, vaccinated: null, model: 'SIR' };
  let enabled = false;

  bus.on('uid:e:lines:hit:toggle', ({ on, scope })=>{
    if (scope && scope!==widgetEl) return;
    enabled = !!on;
    render();
    if (enabled) bus.emit('uid:e:kpi:pulse', { kind:'HIT', scope: widgetEl });
  });
  bus.on('uid:e:data:series', (s)=>{ series = s; if (enabled) render(); });
  bus.on('uid:e:model:params', (p)=>{ params = { ...params, ...p }; if (enabled) render(); });
  bus.on('uid:e:viz:scale:changed', ({ scope })=>{
    if (scope && scope!==widgetEl) return;
    if (enabled) render();
  });
  bus.on('uid:e:viz:resize', ()=>{ if (enabled) render(); });

  function computeThreshold(){
    const R0 = +params.R0 || 0;
    if (!R0 || R0<=0) return null;

    const N = series?.N || 0;
    if (!N || !series?.S || !series?.t) return null;

    // S_eff for SIRV
    let S_eff = series.S.slice();
    if (params.model==='SIRV' && series.V){
      const eff = params.vaccineEff ?? 1;
      S_eff = series.S.map((s,i)=> s + (1 - eff) * (series.V[i] || 0));
    }
    const thresholdAbs = N / R0; // S threshold in ABS
    // find first crossing in ABS
    const x = series.t;
    const y = S_eff;
    const hit = firstCrossing(x, y, thresholdAbs);
    return { N, thresholdAbs, x, y, hit };
  }

  function render(){
    const layer = overlay.getLayer('hit');
    // clear
    while (layer.firstChild) layer.removeChild(layer.firstChild);
    if (!enabled || !series) return;

    const rootRect = chartRoot.getBoundingClientRect();
    const width  = rootRect.width;
    const height = rootRect.height;

    // Scaler expects domains; we infer from series
    const xDomain = [series.t[0], series.t[series.t.length-1]];
    const yMax = Math.max(series.S[0], series.N); // upper bound
    const yDomain = [0, yMax];

    const scale = createScaler({ width, height, xDomain, yDomain, padding: 8 });
    const comp  = computeThreshold();
    if (!comp) return;

    const { N, thresholdAbs, hit } = comp;

    const mode = getScaleMode(widgetEl);
    const yDisplay = (mode==='pct') ? (thresholdAbs/N*100) : thresholdAbs;

    // horizontal line (HIT value)
    const ypx = scale.yToPx(thresholdAbs);
    const hLine = overlay.line(0, ypx, width, ypx, {
      stroke: 'var(--uid-hit-color, #2EC27E)',
      'stroke-width': 1.5,
      'stroke-dasharray': '4 4',
      opacity: '0.9'
    });
    layer.appendChild(hLine);

    // label (top-left)
    const label = overlay.text(10, Math.max(14, ypx-10),
      `HIT: ${formatY(widgetEl, thresholdAbs, N)}`,
      { fill: 'var(--uid-hit-color, #2EC27E)', 'font-size':'12px', 'font-variant-numeric':'tabular-nums' }
    );
    layer.appendChild(label);

    // vertical line (time when reached)
    if (hit){
      const xpx = scale.xToPx(hit.x);
      const vLine = overlay.line(xpx, 0, xpx, height, {
        stroke: 'var(--uid-hit-color, #2EC27E)',
        'stroke-width': 1.5,
        'stroke-dasharray': '2 3',
        opacity: '0.9'
      });
      layer.appendChild(vLine);

      // badge near axis
      const tBadge = overlay.text(Math.min(width-80, xpx+6), 12,
        `t(HIT)=${Math.round(hit.x)}`,
        { fill:'#93e1c0', 'font-size':'11px' }
      );
      layer.appendChild(tBadge);
    }
  }

  // public small helpers (optional use)
  return {
    enable(){ enabled=true; render(); bus.emit('uid:e:kpi:pulse', { kind:'HIT', scope: widgetEl }); },
    disable(){ enabled=false; overlay.getLayer('hit').innerHTML=''; },
    refresh: render
  };
}
