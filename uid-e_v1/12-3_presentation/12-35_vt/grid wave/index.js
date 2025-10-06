/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Presentation Layer · Visual Tool · Grid Wave Widget
 * File:     /visual tool/grid wave/index.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-01
 * Updated:  2025-10-06
 * Version:  1.4.4
 * Changelog:
 *   - v1.4.4  Robuster Start: Nach wiring.resume() IMMER ein Kick (timeline:set) – sowohl bei
 *             async Wiring-Ready als auch bei Header-Resume (setEnabled(true)). Kick nimmt t
 *             aus dem letzten Pointer (falls vorhanden), sonst t:0. Dadurch kein Warten mehr
 *             auf SV-Impulse oder UI-Aktionen.
 *   - v1.4.3  Robustheit: Nach async Wiring-Ready und Header=ON → wiring.resume()
 *             und, falls keine Stickies vorhanden sind, sanfter Kick via timeline:set.
 *   - v1.4.2  Sicherer First-Frame nach Enable: wiring.resume() wenn Widget aktiv ist.
 *   - v1.4.1  setMode(): lokale Mode-Variable aktualisiert; actionsBus.emit(): default source:'wa'.
 */

import { createGridWave } from './gridwave.js';
import { mountGridWaveActions } from './gw.widget-actions.js';

export function mountGridWidget({
  el, bus, grid = 128, mode = 'hybrid', animate = false, hybrid
}) {
  if (!el) throw new Error('[UID-G] mountGridWidget: missing el');
  if (!el.style.position) el.style.position = 'relative';

  // -------------------- Persistenz-Keys --------------------
  const K_MODE   = 'uidg:mode';
  const K_ENABLED= 'uidg:enabled:v2';
  const K_DEN    = 'uidg:disp:density';
  const K_CRISP  = 'uidg:disp:crisp';
  const K_RATIO  = 'uidg:disp:ratio';

  // -------------------- Defaults aus Persistenz --------------------
  try { mode = localStorage.getItem(K_MODE) || mode; } catch {}
  let enabled = true; try { const v=localStorage.getItem(K_ENABLED); if (v==='false') enabled=false; } catch {}

  let density = grid;  try { const v = parseInt(localStorage.getItem(K_DEN)||'',10); if (v) density = v; } catch {}
  let crisp   = true;  try { const v = localStorage.getItem(K_CRISP); if (v==='false') crisp=false; } catch {}
  let ratio   = 0.33;  try { const v = parseFloat(localStorage.getItem(K_RATIO)||''); if (Number.isFinite(v)) ratio=v; } catch {}

  // -------------------- Widget erzeugen --------------------
  const gw = createGridWave(el, {
    grid: density,
    mode: String(mode||'hybrid').toLowerCase(),
    animate: !!animate,
    hybrid,
    crisp,
    dotRatio: ratio
  });

  // -------------------- Hilfsfunktion: sicherer Kick --------------------
  function kickTimeline(source) {
    try {
      const lastPtr = bus?.getLast?.('uid:e:sim:pointer');
      const t = (lastPtr && typeof lastPtr.idx === 'number') ? lastPtr.idx : 0;
      // Ein einziger sanfter Kick reicht; Engine emittiert daraufhin aktuelle Series/Pointer
      bus?.emit?.('uid:e:timeline:set', { t, source });
    } catch {}
  }

  // -------------------- Gemeinsames Wiring laden --------------------
  let wiring = null;
  (async () => {
    try {
      const mod = await import('../wiring/index.js');
      if (mod?.wireBus) {
        const viewAdapter = {
          update({ params, series, idx /*, model*/ }) {
            try {
              if (params) gw.onParams?.({ state: { params } });
              if (series) gw.onSimData?.({ series });
              if (idx !== undefined) gw.onUpdate?.({ idx });
            } catch {}
          }
        };
        wiring = mod.wireBus(viewAdapter, bus);

        // Zustand des Headers prüfen und wiring synchronisieren (First-Frame sicherstellen)
        const widgetEl = el.closest('.widget') || el;
        const isOn = (widgetEl?.dataset?.widgetEnabled ?? 'true') !== 'false';
        try {
          if (isOn) {
            wiring?.resume?.();
            // NEU (unbedingt): frischer Kick, unabhängig davon, ob Stickies vorhanden sind
            // damit GW IMMER unmittelbar Daten bekommt.
            kickTimeline('gw:wiring');
          } else {
            wiring?.pause?.();
          }
        } catch {}
      }
    } catch (e) {
      // Silent fallback
    }
  })();

  // -------------------- Placeholder / Gate --------------------
  if (!el.dataset.gwId) el.dataset.gwId = 'uidg-' + Math.random().toString(36).slice(2,8);
  const gateCss = document.createElement('style');
  gateCss.textContent = `
    [data-gw-id="${el.dataset.gwId}"] .uidg-gw-placeholder{display:none;}
    [data-gw-id="${el.dataset.gwId}"][data-gw-enabled="false"] .uidg-gw-placeholder{display:flex;}
  `;
  el.appendChild(gateCss);

  let placeholder = el.querySelector('.uidg-gw-placeholder');
  if (!placeholder) {
    placeholder = document.createElement('div');
    placeholder.className = 'uidg-gw-placeholder';
    placeholder.style.cssText = 'position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:600; opacity:.7; pointer-events:none; z-index:5;';
    placeholder.textContent = 'GridWave deaktiviert';
    el.appendChild(placeholder);
  }

  // -------------------- Power-Gating (Header) --------------------
  function setEnabled(next) {
    const on = !!next;
    enabled = on;
    try { localStorage.setItem(K_ENABLED, String(on)); } catch {}
    el.dataset.gwEnabled = on ? 'true' : 'false';

    const cv = el.querySelector('canvas');
    if (cv) cv.style.display = on ? '' : 'none';

    try {
      if (!on) {
        wiring?.pause?.();
      } else {
        wiring?.resume?.();
        // NEU (unbedingt): Immer ein Kick nach Resume – kein Warten auf SV/Actions.
        kickTimeline('gw:resume');
      }
    } catch {}
  }

  const widgetEl = el.closest('.widget') || el;
  const mo = new MutationObserver(() => {
    const on = (widgetEl.dataset.widgetEnabled ?? 'true') !== 'false';
    if (on !== enabled) setEnabled(on);
  });
  mo.observe(widgetEl, { attributes:true, attributeFilter:['data-widget-enabled'] });

  const headerOn = (widgetEl.dataset.widgetEnabled ?? 'true') !== 'false';
  setEnabled(headerOn);

  // -------------------- Header-Actions anschließen --------------------
  const actionsBus = {
    emit: (ev, data) => {
      // default source:'wa' injizieren (nicht überschreiben)
      const p = (data && typeof data === 'object' && !Array.isArray(data) && !data.source)
        ? { ...data, source: 'wa' }
        : data;
      try { bus?.publish?.(ev, p); } catch {}
      try { bus?.emit?.(ev, p); } catch {}
    }
  };

  const actionsCtl = mountGridWaveActions(widgetEl, {
    getMode,     setMode,
    getDensity,  setDensity,
    getCrisp,    setCrisp,
    getDotRatio, setDotRatio
  }, { bus: actionsBus });

  // -------------------- Display/Mode APIs --------------------
  function setMode(m) {
    const next = String(m || 'hybrid').toLowerCase();
    try { gw.setMode?.(next); } catch {}
    try { localStorage.setItem(K_MODE, next); } catch {}
    mode = next;
  }
  function getMode() { return gw.getMode?.() || mode; }

  function setDensity(n) {
    const d = Math.max(16, Math.min(192, n|0));
    try { gw.setDensity?.(d); } catch {}
    try { localStorage.setItem(K_DEN, String(d)); } catch {}
  }
  function getDensity() { return gw.getDensity?.() ?? density; }

  function setCrisp(b) {
    const v = !!b;
    try { gw.setCrisp?.(v); } catch {}
    try { localStorage.setItem(K_CRISP, String(v)); } catch {}
  }
  function getCrisp() { return gw.getCrisp?.(); }

  function setDotRatio(r) {
    try { gw.setDotRatio?.(r); } catch {}
    try { localStorage.setItem(K_RATIO, String(r)); } catch {}
  }
  function getDotRatio() { return gw.getDotRatio?.(); }

  // -------------------- Public Destroy --------------------
  gw._destroy = () => {
    try { wiring?.off?.(); } catch {}
    try { actionsCtl?.dispose?.(); } catch {}
    try { mo.disconnect(); } catch {}
    try { el.contains(gateCss) && el.removeChild(gateCss); } catch {}
    try { const ph = el.querySelector('.uidg-gw-placeholder'); if (ph) el.removeChild(ph); } catch {}
    try { gw.destroy?.(); } catch {}
  };

  return gw;
}

export default { mountGridWidget };
