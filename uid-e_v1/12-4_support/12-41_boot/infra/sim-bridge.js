/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Boot Module (ESM)
 * File:     /uid/12-4_support/app/boot/infra/sim-bridge.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-04
 * Updated:  2025-10-04
 * Version:  1.0.0
 * Changelog:
 *   - v1.0.0  Zentrale Playback-/Pointer-Brücke implementiert (pointer, status, integrator-status).
 *
 * Role:
 *   Zeit-/Playback-Schicht. Normalisiert Timeline/Playback-Events auf:
 *     • uid:e:sim:pointer  { idx, t? }
 *     • uid:e:sim:status   { running, speed, idx, … }
 *     • uid:e:integrator:status { kind }
 *
 * Hört u. a. auf:
 *   uid:e:sim:data, uid:e:timeline:set, uid:e:sim:play, uid:e:sim:pause, uid:e:sim:reset,
 *   uid:e:sim:speed:set, uid:e:integrator:set
 *
 * ModuleMap (short)
 *   /app/boot/infra/
 *     sim-bridge.js        (DIES · Implementierung)
 *     sim-bridge.boot.js   (Boot-Aufrufer, idempotent)
 */
'use strict';

import * as EBUS from '../../../12-1_base/bus.js';

export function wireSimBridge(chartApi) {
  const state = {
    speed: 1, durMs: 7000, N: 0, playing: false,
    t0: 0, elapsedMs: 0, justReset: false, lastIdx: 0, integrator: 'rk4'
  };

  const speedToDur = (s) => (s === 1 ? 7000 : (s === 0.5 ? 14000 : 21000));
  const clamp01 = (x) => (x < 0 ? 0 : (x > 1 ? 1 : x));

  function emitPointerIdx(idx)    { try { EBUS.emit('uid:e:sim:pointer', { idx }); } catch {} }
  function emitSimStatus(extra)   { try { EBUS.emit('uid:e:sim:status', { running:state.playing, speed:state.speed, idx:state.lastIdx, ...(extra||{}) }); } catch {} }
  function emitIntegratorStatus() { try { EBUS.emit('uid:e:integrator:status', { kind: state.integrator }); } catch {} }

  function closestIdx(arr, t) {
    if (!Array.isArray(arr) || !arr.length) return 0;
    let lo = 0, hi = arr.length - 1;
    if (t <= arr[0]) return 0;
    if (t >= arr[hi]) return hi;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      (arr[mid] < t ? (lo = mid) : (hi = mid));
    }
    return (t - arr[lo] <= arr[hi] - t) ? lo : hi;
  }

  const offData = EBUS.on('uid:e:sim:data', ({ series } = {}) => {
    state.N = series?.t?.length || 0;
  }, { replay: true });

  function emitIdxFromFrac(frac) {
    if (!state.N) return;
    const idx = Math.round(clamp01(frac) * (state.N - 1));
    state.lastIdx = idx;
    emitPointerIdx(idx);
  }

  let raf = 0;
  function loop(now) {
    if (!state.playing) return;
    const elapsed = (now - state.t0) + state.elapsedMs;
    const frac = clamp01(elapsed / state.durMs);
    emitIdxFromFrac(frac);
    if (frac >= 1) { stop(); return; }
    raf = requestAnimationFrame(loop);
  }

  function start() {
    try { chartApi?.pause?.(); } catch {}
    state.playing = true;
    state.t0 = performance.now();
    cancelAnimationFrame(raf);
    emitSimStatus();
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    state.playing = false;
    cancelAnimationFrame(raf);
    raf = 0;
    emitSimStatus();
  }

  function reset() {
    stop();
    state.elapsedMs = 0;
    state.justReset = true;
    emitIdxFromFrac(0);
    emitSimStatus({ idx: state.lastIdx });
  }

  function setSpeedNumeric(s) {
    const next = (s === 1 || s === 0.5 || s === 0.25) ? s : 1;
    state.speed = next;
    state.durMs = speedToDur(next);
    emitSimStatus();
  }

  const offs = [];
  function onSpeedSet(p = {}) {
    if ('speed' in p) return setSpeedNumeric(p.speed);
    if ('label' in p) {
      const map = { '1x':1, '0.5x':0.5, '0.25x':0.25 };
      const s = map[p.label];
      if (s) return setSpeedNumeric(s);
    }
  }

  offs.push(EBUS.on('uid:e:sim:speed:set', onSpeedSet));
  offs.push(EBUS.on('uid:e:sim:reset', () => reset()));
  offs.push(EBUS.on('uid:e:sim:play', () => {
    if (state.justReset){ state.elapsedMs = 0; state.justReset = false; }
    start();
  }));
  offs.push(EBUS.on('uid:e:sim:pause', () => {
    if (state.playing){
      state.elapsedMs += (performance.now() - state.t0);
      stop();
    } else {
      state.t0 = performance.now();
      start();
    }
  }));
  offs.push(EBUS.on('uid:e:integrator:set', ({ kind } = {}) => {
    if (kind) state.integrator = String(kind);
    emitIntegratorStatus();
  }));
  offs.push(EBUS.on('uid:e:timeline:set', (pl = {}) => {
    const sd = EBUS.getLast?.('uid:e:sim:data');
    const tt = sd?.series?.t;
    const idx = Number.isFinite(pl.idx)
      ? (pl.idx | 0)
      : (Array.isArray(tt) ? closestIdx(tt, Number(pl.t ?? 0)) : 0);
    state.lastIdx = idx;
    emitPointerIdx(idx);
    emitSimStatus();
  }));

  queueMicrotask(() => { emitSimStatus(); emitIntegratorStatus(); });

  const api = {
    get snapshot(){ return { ...state }; },
    dispose(){
      try { offData?.(); } catch {}
      offs.forEach(off => { try { off?.(); } catch {} });
      stop();
    }
  };

  try { window.__uidSimBridge = api; } catch {}
  console.info('[sim-bridge] ready');
  return api;
}

export default { wireSimBridge };
