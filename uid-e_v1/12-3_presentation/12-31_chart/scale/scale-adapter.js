/*!
 * Scale Adapter (Y-Formatter für % ↔ #) · CC BY 4.0
 * Emits: uid:e:viz:format:y → { tick(v), tooltip(v), mode, scope }
 */
import { on, emit, getLast } from '../../../12-1_base/bus.js';

export function mountScaleAdapter(widgetEl){
  if (!widgetEl) return () => {};
  let mode = 'abs';
  let N = getLast?.('uid:e:data:series')?.N || 1;

  const fmt = (v) => mode === 'pct'
    ? `${((v / (N || 1)) * 100).toFixed(v < 1 ? 2 : 1)}%`
    : String(Math.round(v));

  const payload = () => ({
    tick:    (v) => fmt(v),
    tooltip: (v) => fmt(v),
    mode,
    scope: widgetEl
  });

  function broadcast(){ emit('uid:e:viz:format:y', payload()); }

  const off1 = on('uid:e:viz:scale:changed', ({ mode:m, scope }) => {
    if (scope && scope !== widgetEl) return;
    if (m === 'pct' || m === 'abs'){ mode = m; broadcast(); }
  });
  const off2 = on('uid:e:data:series', (s) => { if (s?.N) { N = s.N; broadcast(); } });

  // initial
  broadcast();
  return () => { try{ off1?.(); off2?.(); }catch{} };
}

export default { mountScaleAdapter };
