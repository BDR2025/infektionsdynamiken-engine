/*!
 * File:      wheel/draw.js
 * Project:   Understanding Infection Dynamics · Infektionsdynamiken verstehen
 * Module:    UID-V · Wheel Core Renderer (States + inner param band + Reeff gauge)
 * License:   CC BY 4.0
 *
 * Updated:   2025-09-30
 * Version:   2.3.1
 * Changelog:
 *   - v2.3.1 Fit & Stability:
 *       • State-Ring passt sicher in den Canvas (Radius berücksichtigt Strichdicke)
 *       • Param-Band + Hub mit festen Abständen (kein Clipping)
 *       • Arcs ohne Pixel-Snap (stabil zentriert), Text/Gauge mit Snap + Δt-Snapping
 *   - v2.3.0 Reₑff dezenter, Zeitlabel entflackert (monospace, Δt-Snapping)
 *   - v2.2.1 Safe-Mode Guards, getrenntes Param-Band + Reₑff-Gauge
 */

'use strict';

export function draw(ctx, state, cfg = {}) {
  if (!ctx || !ctx.canvas) return;
  const canvas = ctx.canvas;

  // ---------- Geometry guards ----------
  const W = (canvas.width  | 0) || 0;
  const H = (canvas.height | 0) || 0;
  if (W <= 0 || H <= 0) return;

  // ---------- Helpers ----------
  const clamp   = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const clamp01 = (x) => clamp(Number.isFinite(x) ? x : 0, 0, 1);
  const pickNum = (...vals) => { for (const v of vals) { const n = Number(v); if (Number.isFinite(n)) return n; } return undefined; };
  const invOr   = (D, fb) => { const d = Number(D); return (Number.isFinite(d) && d > 0) ? (1/d) : fb; };
  const val     = (arr, i) => (Array.isArray(arr) && Number.isFinite(i) ? (arr[i] ?? 0) : 0);

  function norm01(value, range, defMin, defMax) {
    const v = Number(value);
    if (!Number.isFinite(v)) return 0.5;
    const min = (range && Number.isFinite(range.min)) ? range.min : defMin;
    const max = (range && Number.isFinite(range.max)) ? range.max : defMax;
    if (!(Number.isFinite(min) && Number.isFinite(max)) || max <= min) return 0.5;
    return clamp01((v - min) / (max - min));
  }

  function formatDay(t) {
    const n = Number(t);
    if (!Number.isFinite(n)) return '';
    try { return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    catch { return String(Math.round(n * 100) / 100); }
  }

  function safeStyle(el){
    try { return getComputedStyle(el); } catch { return { getPropertyValue: () => '' }; }
  }
  const css = safeStyle(canvas);
  const color = (v, fb) => {
    try {
      const s = (css.getPropertyValue(v) || '').trim();
      return s || fb;
    } catch { return fb; }
  };

  // ---------- Snapshot / Series ----------
  const series = (state && state.series) || {};
  const len = Array.isArray(series.t) ? series.t.length : 0;
  if (!len) { ctx.clearRect(0,0,W,H); return; }

  const idx = clamp((Number.isFinite(state?.idx) ? (state.idx|0) : (len - 1)), 0, len - 1);

  const Sabs = val(series.S, idx);
  const Eabs = val(series.E, idx);
  const Iabs = val(series.I, idx);
  const Rabs = val(series.R, idx);

  const params = (state && state.params) || {};
  const ranges = (state && state.ranges) || {};
  const model  = String(state?.model || 'SIR').toUpperCase();

  // N bevorzugt aus Params, sonst Summe
  const N = (Number.isFinite(params.N) && params.N > 0) ? params.N : (Sabs + Eabs + Iabs + Rabs) || 1;

  // ---------- Fractions (robust) ----------
  let s = clamp01(Sabs / N), e = clamp01(Eabs / N), i = clamp01(Iabs / N), r = clamp01(Rabs / N);
  let sum = s + e + i + r;
  if (!Number.isFinite(sum) || sum <= 0) { s = e = i = r = 0; sum = 1; }
  if (Math.abs(sum - 1) > 1e-6) { s /= sum; e /= sum; i /= sum; r /= sum; }

  // ---------- Parameterwerte ----------
  const gamma = pickNum(params.gamma, invOr(params.D, null));                    // γ = 1/D
  const sigma = (model === 'SEIR') ? pickNum(params.sigma, invOr(params.L, 0)) : 0; // σ = 1/L (SEIR), sonst 0
  const mfac  = Number.isFinite(params.measures) ? (1 - clamp01(params.measures)) : 1; // 0..1 → 1 reduziert β
  const beta  = pickNum(params.beta, (Number.isFinite(params.R0) && Number.isFinite(gamma)) ? params.R0 * gamma * mfac : undefined);

  // Param-Normalisierung
  const nbeta  = norm01(beta,  ranges.beta,  0.0, 2.5 * (gamma || 0.2));
  const ngamma = norm01(gamma, ranges.gamma, 0.0, 1.0);
  const nsigma = norm01(sigma, ranges.sigma, 0.0, 0.5);

  // ---------- Geometrie (fit-sicher) ----------
  ctx.clearRect(0,0,W,H);

  // Zentrum NICHT auf 0.5 snappen (Arcs bleiben absolut mittig)
  const cx = W * 0.5;
  const cy = H * 0.5;

  const half   = Math.min(W, H) * 0.5;
  const MARGIN = 12;                          // Außenabstand zum Canvasrand
  const baseR  = Math.max(24, half - MARGIN); // Basisradius, noch ohne Strichdicken

  // Strichdicken auf Basis berechnen …
  const T_state_pre = Math.max(6, Math.round(baseR * 0.12));
  // … und dann den effektiven Ring-Radius so wählen, dass OUTER (inkl. halber Dicke) im Canvas bleibt:
  const R_outer = baseR - (T_state_pre * 0.5);
  const T_state = T_state_pre;

  const gap     = Math.max(2, Math.round(T_state * 0.25));
  const T_param = Math.max(3, Math.round(T_state * 0.33));

  // Param-Band liegt deutlich innerhalb des State-Rings:
  let R_param = R_outer - (T_state * 0.5) - gap - (T_param * 0.5);
  if (R_param < 8) { R_param = 8; } // Untergrenze, falls Widget extrem klein

  // Hub mit zusätzlichem Abstand:
  let R_hub = R_param - (T_param * 0.5) - gap - 2;
  if (R_hub < 12) R_hub = 12;

  // ---------- Farben ----------
  const C_S  = color('--c-s', '#34d399');     // grün
  const C_E  = color('--c-e', '#f59e0b');     // amber
  const C_I  = color('--c-i', '#ef4444');     // rot
  const C_R  = color('--c-r', '#60a5fa');     // blau
  const C_BG = color('--uidv-ring-bg', 'rgba(255,255,255,.08)');

  const C_PB = color('--uidv-p-beta',  'rgba(255,255,255,0.40)');
  const C_PG = color('--uidv-p-gamma', 'rgba(255,255,255,0.40)');
  const C_PS = color('--uidv-p-sigma', 'rgba(245,158,11,0.50)'); // abgeblendet, unterscheidbar von E

  const HUB_BG = color('--uidv-hub-bg', 'rgba(0,0,0,0.55)');
  const HUB_FG = color('--uidv-hub-fg', 'rgba(255,255,255,0.85)');

  const REFF_LOW  = color('--uidv-reff-low',  '#2EC27E'); // <1
  const REFF_HIGH = color('--uidv-reff-high', '#EF4444'); // >1
  const REFF_MID  = color('--uidv-reff-mid',  '#FFFFFF'); // ≈1

  // ---------- Render: States-Ring ----------
  ctx.beginPath();
  ctx.lineWidth = T_state;
  ctx.strokeStyle = C_BG;
  ctx.arc(cx, cy, R_outer, 0, Math.PI * 2);
  ctx.stroke();

  let ang = -Math.PI / 2;
  drawArc(T_state, R_outer, s, C_S);
  drawArc(T_state, R_outer, e, C_E);
  drawArc(T_state, R_outer, i, C_I);
  drawArc(T_state, R_outer, r, C_R);

  // ---------- Render: Param-Band (innen, getrennt) ----------
  drawArc(T_param, R_param, nbeta,  C_PB, -Math.PI/2);
  drawArc(T_param, R_param, ngamma, C_PG, -Math.PI/2);
  drawArc(T_param, R_param, nsigma, C_PS, -Math.PI/2);

  // ---------- Hub (Kreis) ----------
  if (R_hub > 0) {
    ctx.beginPath();
    ctx.fillStyle = HUB_BG;
    ctx.arc(cx, cy, R_hub, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---------- Re_eff Gauge (dezent) ----------
  const reff = computeReff(beta, gamma, s); // s = S/N
  drawReffGauge(ctx, cx, cy, R_hub, reff, { low: REFF_LOW, mid: REFF_MID, high: REFF_HIGH });

  // ---------- Zeit-Label (stabil) ----------
  const tNow = val(series.t, idx);
  if (Number.isFinite(tNow) && R_hub > 0) {
    // Δt schätzen (Snapping reduziert Flackern)
    const dt = (len >= 2) ? Math.max(1e-6, (series.t[1] - series.t[0])) : 0.5;
    const snap = (dt >= 0.25 ? 0.5 : (dt >= 0.1 ? 0.1 : 0.05));
    const tDisp = Math.round(tNow / snap) * snap;

    // Text pixel-snap (nur Text, nicht Arcs)
    const tx = Math.round(cx) + 0.5;
    const ty = Math.round(cy) + 0.5;

    ctx.save();
    const size = Math.max(10, Math.round(R_hub * 0.28));
    ctx.font = `${size}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = HUB_FG;
    ctx.fillText(`t = ${formatDay(tDisp)} d`, tx, ty);
    ctx.restore();
  }

  // ---------- Param-Kürzel dezent im Hub ----------
  try {
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.font = `${Math.max(9, Math.round(R_hub * 0.17))}px ui-sans-serif, system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawLabel(cx, cy, R_hub * 0.68, -Math.PI/6, 'σ', C_PS);
    drawLabel(cx, cy, R_hub * 0.82,  Math.PI/2, 'β', C_PB);
    drawLabel(cx, cy, R_hub * 0.68, -5*Math.PI/6, 'γ', C_PG);
    ctx.restore();
  } catch {}

  // ---- Debug Export ----
  try { window.__SV_LAST = { S:s, E:e, I:i, R:r, idx, t:tNow, sum:s+e+i+r, reff }; } catch {}

  // ===== helpers =====
  function drawArc(thickness, radius, frac, col, startAngle){
    if (!Number.isFinite(frac) || frac <= 0 || radius <= 0 || thickness <= 0) return;
    const start = Number.isFinite(startAngle) ? startAngle : ang;
    const sweep = frac * Math.PI * 2;
    ctx.beginPath();
    ctx.lineWidth = thickness;
    ctx.lineCap = 'butt';
    ctx.strokeStyle = col;
    ctx.arc(cx, cy, radius, start, start + sweep);
    ctx.stroke();
    if (!Number.isFinite(startAngle)) ang += sweep;
  }

  function drawLabel(x, y, rad, a, text, fill){
    const px = Math.round(x + rad * Math.cos(a)) + 0.5;
    const py = Math.round(y + rad * Math.sin(a)) + 0.5;
    ctx.fillStyle = fill;
    ctx.fillText(text, px, py);
  }

  function computeReff(beta, gamma, Sfrac){
    const b = Number(beta), g = Number(gamma), sfrac = Number(Sfrac);
    if (!(Number.isFinite(b) && Number.isFinite(g) && g > 0 && Number.isFinite(sfrac))) return NaN;
    return (b / g) * sfrac;
  }

  function drawReffGauge(ctx, x, y, R_hub, reff, col){
    if (!(R_hub > 0)) return;
    const RMAX = 3.0;                 // Skalenendwert
    const EPS  = 0.01;                // Toleranz um 1.00
    const a0   = -Math.PI * 5/6;      // -150°
    const a1   = -Math.PI * 1/6;      //  -30°
    const Rg   = R_hub * 0.80;        // etwas kleiner für mehr Luft
    const Tg   = Math.max(2, Math.round(R_hub * 0.08));
    const neutral = 'rgba(255,255,255,0.18)';

    // Hintergrundbogen (mit Text-Snap)
    const gx = Math.round(x) + 0.5;
    const gy = Math.round(y) + 0.5;

    ctx.beginPath();
    ctx.lineWidth = Tg;
    ctx.lineCap = 'round';
    ctx.strokeStyle = neutral;
    ctx.arc(gx, gy, Rg, a0, a1);
    ctx.stroke();

    // Tick bei R=1 (Mitte)
    const amid = (a0 + a1) / 2;
    ctx.beginPath();
    ctx.lineWidth = Math.max(2, Math.round(Tg * 0.45));
    ctx.strokeStyle = col?.mid || '#fff';
    ctx.arc(gx, gy, Rg, amid - 0.015, amid + 0.015);
    ctx.stroke();

    // Nadel
    const val = Number(reff);
    let c = col?.mid || '#fff';
    if (Number.isFinite(val)) {
      if (val > 1 + EPS)      c = col?.high || '#f00';
      else if (val < 1 - EPS) c = col?.low  || '#0f0';
    }
    const n = Number.isFinite(val) ? clamp01(val / RMAX) : 0.5;
    const ang = a0 + n * (a1 - a0);

    const r0 = Rg - Tg * 0.9, r1 = Rg + Tg * 0.9;
    ctx.beginPath();
    ctx.lineWidth = Math.max(2, Math.round(Tg * 0.6));
    ctx.strokeStyle = c;
    ctx.moveTo(gx + r0 * Math.cos(ang), gy + r0 * Math.sin(ang));
    ctx.lineTo(gx + r1 * Math.cos(ang), gy + r1 * Math.sin(ang));
    ctx.stroke();

    // Reff-Label (klein/dezent)
    if (Number.isFinite(val)) {
      ctx.save();
      ctx.globalAlpha = 0.82;
      ctx.font = `${Math.max(9, Math.round(R_hub * 0.16))}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = c;
      ctx.fillText(`Rₑff ${val.toFixed(2)}`, gx, gy - R_hub * 0.24);
      ctx.restore();
    }
  }
}

export default { draw };
