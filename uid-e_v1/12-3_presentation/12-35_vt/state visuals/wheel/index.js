/*!
 * File:      wheel/index.js
 * Project:   Understanding Infection Dynamics · Infektionsdynamiken verstehen
 * Module:    UID-V · Core-Brücke (Wheel)
 * Type:      Open Educational Resource (OER)
 * Authors:   B. D. Rausch · A. Heinz
 * License:   CC BY 4.0
 *
 * Updated:   2025-09-29
 * Version:   1.0.2
 * Changelog:
 *   - v1.0.2  FIX: 'ranges' in den internen State übernehmen (update & initial),
 *             sodass draw.util.normParam(...) echte 0..1-Werte erhält.
 *   - v1.0.1  Robustere Größenanpassung + Render-Batching.
 *   - v1.0.0  Erste Fassung (Brücke zu core/draw.js).
 */

'use strict';

import * as Core from './draw.js'; // export function draw(ctx, state, cfg)
const drawFn = Core.draw || Core.default;
if (typeof drawFn !== 'function') {
  throw new Error('[UID-V] core/draw.js exportiert keine draw(ctx,state,cfg).');
}

export function createWheel(host, opts = {}) {
  if (!host) throw new Error('[UID-V Core] host missing');
  if (!host.style.position) host.style.position = 'relative';

  // Canvas
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  host.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  ctx.imageSmoothingEnabled = true;

  // Interner State genau so, wie draw() es erwartet
  let state = {
    series: null,
    idx: null,
    params: {},
    model: (document.documentElement.dataset.model || 'SIR').toUpperCase(),
    ranges: {} // ← NEU: ohne ranges bleiben β/γ/σ auf 0.5 stehen
  };

  // Resize + Render-Batching
  let raf = 0, destroyed = false;
  function schedule() {
    if (!raf && !destroyed) {
      raf = requestAnimationFrame(() => {
        raf = 0;
        try { drawFn(ctx, state, opts || {}); } catch (e) {
          console.warn('[UID-V Wheel] draw error:', e);
        }
      });
    }
  }
  function resizeToHost() {
    const DPR = window.devicePixelRatio || 1;
    const w = Math.max(1, host.clientWidth  || 300);
    const h = Math.max(1, host.clientHeight || 300);
    canvas.width  = Math.round(w * DPR);
    canvas.height = Math.round(h * DPR);
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(1,0,0,1,0,0);
    schedule();
  }
  requestAnimationFrame(resizeToHost);
  const ro = new ResizeObserver(resizeToHost);
  ro.observe(host);

  // API (vom Wiring aufgerufen)
  function update(p = {}) {
    if ('series' in p) state.series = p.series || null;
    if ('idx'    in p) state.idx    = (p.idx == null ? null : Math.max(0, p.idx|0));
    if ('params' in p) state.params = { ...state.params, ...(p.params || {}) };
    if ('model'  in p) state.model  = String(p.model || state.model || 'SIR').toUpperCase();
    if ('ranges' in p) state.ranges = { ...state.ranges, ...(p.ranges || {}) }; // ← NEU
    schedule();
  }
  function setVisible(_b) { /* reserved */ }
  function dispose() {
    destroyed = true;
    try { ro.disconnect(); } catch {}
    try { if (host.contains(canvas)) host.removeChild(canvas); } catch {}
    if (raf) cancelAnimationFrame(raf);
  }

  return { update, setVisible, dispose };
}

export default { createWheel };
