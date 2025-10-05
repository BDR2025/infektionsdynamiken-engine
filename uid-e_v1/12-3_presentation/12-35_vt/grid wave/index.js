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
 * Updated:  2025-10-03
 * Version:  1.4.2
 * Changelog:
 *   - v1.4.2  Sicherer First-Frame nach Enable: ruft wiring.resume() auf, wenn Widget aktiv ist,
 *             auch wenn wiring asynchron nachträglich geladen wird. Rehydrate erfolgt über wiring v1.0.2.
 *             Keine direkten sim:pointer-Emits aus dem Widget; nur Params/Actions.
 *   - v1.4.1  setMode() aktualisiert lokale Mode-Variable (ARIA/Segmented fix).
 *             actionsBus.emit() setzt default source:'wa' (ohne vorhandene zu überschreiben).
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
          if (isOn) { wiring?.resume?.(); } else { wiring?.pause?.(); }
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
      if (!on) { wiring?.pause?.(); }
      else     { wiring?.resume?.(); } // resume() triggert rehydrate in wiring v1.0.2
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
    mode = next; // ARIA/Segmented: getMode() liefert sofort den neuen Wert
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
