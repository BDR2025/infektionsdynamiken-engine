/*!
 * File:      12-3_presentation/chart/scale/scale-mode.js
 * Module:    UID-Chart · Scale Switcher (% ↔ #)
 * Version:   v1.0.0 (WP1)
 * License:   CC BY 4.0
 *
 * Behavior:
 *   - Keeps global (per-widget) scale state in data-mode: 'abs' | 'pct'.
 *   - Emits bus events so Chart, Tooltips, Overlays can re-render accordingly.
 *
 * Integration:
 *   - Call initScaleMode({ widgetEl, bus }).
 *   - Subscribe in chart core to 'uid:e:viz:scale:set' and redraw axis/tooltip.
 */
import { on, emit } from '../../../12-1_base/bus.js';

const STATE = new WeakMap(); // widgetEl -> { mode }

export function initScaleMode({ widgetEl, initial='abs', bus={on,emit} } = {}){
  if (!widgetEl) throw new Error('[ScaleMode] widgetEl required');
  const st = { mode: initial };
  STATE.set(widgetEl, st);

  bus.on('uid:e:viz:scale:set', ({ mode, scope })=>{
    if (scope && scope!==widgetEl) return;
    if (mode && (mode==='abs' || mode==='pct')){
      st.mode = mode;
      bus.emit('uid:e:viz:scale:changed', { mode, scope: widgetEl });
    }
  });

  // initial broadcast
  bus.emit('uid:e:viz:scale:changed', { mode: st.mode, scope: widgetEl });
  return st;
}

export function getScaleMode(widgetEl){
  const st = STATE.get(widgetEl);
  return st ? st.mode : 'abs';
}

export function formatY(widgetEl, value, N=1){
  const mode = getScaleMode(widgetEl);
  if (mode==='pct'){
    const v = (value / (N||1)) * 100;
    return `${(Math.round(v*10)/10).toFixed(1)}%`;
  }
  return String(Math.round(value));
}

export function transformSeries(widgetEl, arr, N=1){
  const mode = getScaleMode(widgetEl);
  if (mode==='pct'){
    const NN = N||1;
    return arr.map(v => v/NN*100);
  }
  return arr;
}
