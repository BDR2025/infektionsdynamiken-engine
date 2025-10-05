/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Boot Module (ESM)
 * File:     /uid/12-4_support/app/boot/rehydrate/core.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-04
 * Updated:  2025-10-04
 * Version:  1.0.0
 * Changelog:
 *   - v1.0.0  Erstes Commit: Rehydrate-Core (timeline re-emit, refresh, resize), Cleanup-Callback.
 *
 * eAnnotation:
 *   API: initRehydrate(widgetEl, bus, { id?:string, refresh?:()=>void })
 *   Effekte bei Mount, neuen sim:data (replay), Sichtbarkeit und Toggle:
 *     • re-emittiert die aktuelle Zeit via 'uid:e:timeline:set'
 *     • ruft optional refresh() auf
 *     • triggert window.resize (mit rAF-Fallback)
 *
 * ModuleMap (short)
 *   /app/boot/rehydrate/core.js   (dieses Modul)
 *   (wird aus den Mount-Modulen der Widgets aufgerufen)
 */

'use strict';

export function initRehydrate(widgetEl, bus, opts = {}) {
  try {
    if (!widgetEl || !bus?.on) return () => {};
    const id = opts.id || widgetEl.id || 'widget';

    const emitTimeline = () => {
      try {
        const ptr = bus.getLast?.('uid:e:sim:pointer');
        const sd  = bus.getLast?.('uid:e:sim:data');
        const t   = (ptr && typeof ptr?.t === 'number')
          ? ptr.t
          : (sd?.series?.t && sd.series.t.length ? sd.series.t[0] : undefined);

        if (typeof t === 'number' && Number.isFinite(t)) {
          (bus.emit || bus.pub)?.call(bus, 'uid:e:timeline:set', { t, source: `rehydrate:${id}` });
        }

        try { opts.refresh?.(); } catch {}

        try {
          window.dispatchEvent(new Event('resize'));
          requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
        } catch {}
      } catch {}
    };

    // 1) Immediately on mount
    emitTimeline();

    // 2) On new sim:data (with replay so late joiners get it too)
    const offData = bus.on?.('uid:e:sim:data', emitTimeline, { replay: true });

    // 3) When element becomes visible
    let io;
    try {
      io = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) emitTimeline();
      }, { root: null, threshold: 0.1 });
      io.observe(widgetEl);
    } catch {}

    // 4) When toggled/hidden state changes
    let mo;
    try {
      mo = new MutationObserver(() => emitTimeline());
      mo.observe(widgetEl, { attributes: true, attributeFilter: ['hidden', 'data-widget-enabled'] });
    } catch {}

    // Cleanup
    return () => {
      try { offData?.(); } catch {}
      try { io?.disconnect?.(); } catch {}
      try { mo?.disconnect?.(); } catch {}
    };
  } catch {
    return () => {};
  }
}
