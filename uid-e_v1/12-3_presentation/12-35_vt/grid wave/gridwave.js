/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Presentation Layer · Visual Tool · Grid Wave Widget
 * File:     /visual tool/grid wave/gridwave.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-01
 * Updated:  2025-10-01
 * Version:  1.4.0
 */

export function createGridWave(el, opts = {}) {
  // -----------------------------
  // 1) State & Canvas
  // -----------------------------
  const state = {
    el,
    grid: Math.max(8, (opts.grid|0) || 128),     // Dichte: 128 default
    Nvis: 0,
    mode: String(opts.mode || 'hybrid'),
    animate: !!opts.animate,
    hybrid: Object.assign({ d0: 0.25, p: 2.0, blurPasses: 2 }, opts.hybrid || {}),
    paintBase: !!opts.paintBase,                 // optional, default transparent
    crisp: (opts.crisp !== false),               // Crisp on by default
    dotRatio: Number.isFinite(opts.dotRatio) ? Math.max(0.15, Math.min(0.48, opts.dotRatio)) : 0.33,
    dpr: 1,
    ctx: null,
    ranking: null,
    metric: null,
    sim: null,
    idx: 0,
    // Default-Farben (werden durch CSS-Tokens --c-* überschrieben)
    colors: { S:'#22C55E', E:'#F59E0B', I:'#EF4444', R:'#3B82F6', D:'#6B7280', V:'#0EA5E9' },
    seed: 'uid-g',
    // precomputed geometry
    cellsz: 0, ox: 0, oy: 0, rDot: 0, centers: null,
    raf: 0
  };

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  el.appendChild(canvas);
  state.ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

  const ro = new ResizeObserver(() => resize(true));
  ro.observe(el);

  readThemeColors();
  resize(true);

  // -----------------------------
  // 2) Öffentliche API
  // -----------------------------
  const api = {
    onParams(p) {
      state.seed = p?.state?.params?.simId || p?.state?.meta?.driverKey || 'uid-g';
      rebuildMetric();
      renderFrame();
    },
    onSimData(payload) {
      if (!payload || !payload.series) return;
      state.sim = normalizeSeries(payload);
      clampIdx();
      renderFrame();
    },
    onUpdate(u) {
      if (u && Number.isFinite(u.idx)) state.idx = Math.max(0, u.idx|0);
      renderFrame(u?.proportions);
    },
    setMode(newMode='cluster', hybridOverride) {
      if (!newMode || newMode === state.mode) return;
      state.mode = String(newMode);
      if (hybridOverride && typeof hybridOverride === 'object') {
        state.hybrid = Object.assign({}, state.hybrid, hybridOverride);
      }
      rebuildMetric();
      renderFrame();
      api.emit?.('uid:g:mode', { mode: state.mode, hybrid: state.hybrid });
    },
    setHybrid(cfg={}) { api.setMode(state.mode, cfg); },

    // ---- NEW: Display controls
    setDensity(grid) {
      const g = Math.max(8, grid|0);
      if (g === state.grid) return;
      state.grid = g;
      resize(true);           // recompute geometry
      rebuildMetric();        // regenerate metric & ranking
      renderFrame();
      api.emit?.('uid:g:display', { density: state.grid, crisp: state.crisp, dotRatio: state.dotRatio });
    },
    getDensity(){ return state.grid; },

    setCrisp(flag) {
      const next = !!flag;
      if (next === state.crisp) return;
      state.crisp = next;
      resize(true);           // geometry alignment may change
      renderFrame();
      api.emit?.('uid:g:display', { density: state.grid, crisp: state.crisp, dotRatio: state.dotRatio });
    },
    getCrisp(){ return !!state.crisp; },

    setDotRatio(r) {
      const v = Number(r);
      if (!Number.isFinite(v)) return;
      const next = Math.max(0.15, Math.min(0.48, v));
      if (Math.abs(next - state.dotRatio) < 1e-6) return;
      state.dotRatio = next;
      computeGeometry();      // recompute rDot only
      renderFrame();
      api.emit?.('uid:g:display', { density: state.grid, crisp: state.crisp, dotRatio: state.dotRatio });
    },
    getDotRatio(){ return state.dotRatio; },

    destroy() {
      ro.disconnect();
      el.contains(canvas) && el.removeChild(canvas);
    },
    emit() {}
  };

  return api;

  // -----------------------------
  // 3) Rendering (CRISP DOTS)
  // -----------------------------
  function resize(full=false) {
    const { width, height } = el.getBoundingClientRect();
    const size = Math.max(1, Math.min(width, height));
    state.dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const w = Math.round(size * state.dpr);
    const h = Math.round(size * state.dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    state.ctx.imageSmoothingEnabled = false;
    computeGeometry();
    if (full) state.Nvis = state.grid * state.grid;
  }

  function computeGeometry() {
    const ctx = state.ctx;
    const W = ctx.canvas.width, H = ctx.canvas.height;
    // Zellenbreite: ganzzahliger DPR-Pixel
    const rawCell = Math.floor(Math.min(W, H) / state.grid);
    state.cellsz = Math.max(2, rawCell);
    // Offsets mittig, ebenfalls integer
    state.ox = Math.floor((W - state.cellsz * state.grid) / 2);
    state.oy = Math.floor((H - state.cellsz * state.grid) / 2);
    // Dot-Radius
    let r = Math.floor(state.cellsz * state.dotRatio);
    state.rDot = Math.max(1, r);

    // Zentren vorberechnen
    const N = state.grid * state.grid;
    if (!state.centers || state.centers.length !== N * 2) {
      state.centers = new Int32Array(N * 2);
    }
    let k = 0;
    for (let y=0; y<state.grid; y++) {
      for (let x=0; x<state.grid; x++) {
        // Mittelpunkt auf integer Pixel
        const cx = state.ox + x*state.cellsz + Math.floor(state.cellsz / 2);
        const cy = state.oy + y*state.cellsz + Math.floor(state.cellsz / 2);
        state.centers[k++] = cx;
        state.centers[k++] = cy;
      }
    }
  }

  function clampIdx() {
    if (!state.sim) return;
    const max = (state.sim.t?.length || 1) - 1;
    state.idx = Math.max(0, Math.min(max, state.idx|0));
  }

  function renderFrame(inlineProps) {
    const ctx = state.ctx;
    if (!ctx || !state.ranking) { clearCanvas(ctx); return; }

    // Hintergrund transparent oder S-Füllung
    const W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (state.paintBase) {
      ctx.fillStyle = state.colors.S;
      ctx.fillRect(0, 0, W, H);
    }

    // Shares (SEIRDV · kanonische Datenreihenfolge)
    let S=0, E=0, I=0, R=0, D=0, V=0, N = state.grid*state.grid;
    if (inlineProps) {
      ({S=0, E=0, I=0, R=0, D=0, V=0} = inlineProps);
    } else if (state.sim?.series) {
      const k = state.idx|0, ser = state.sim.series;
      S = at(ser.S, k);
      E = at(ser.E, k);
      I = at(ser.I, k);
      R = at(ser.R, k);
      if (ser.D) D = at(ser.D, k);
      if (ser.V) V = at(ser.V, k);
    } else { return; }

    // Normieren (Anteile)
    let sum = S+E+I+R+D+V;
    if (sum > 0 && Math.abs(sum-1) > 1e-6) {
      S/=sum; E/=sum; I/=sum; R/=sum; D/=sum; V/=sum;
    }
    S=clamp01(S); E=clamp01(E); I=clamp01(I); R=clamp01(R); D=clamp01(D); V=clamp01(V);

    // Diskret: Kern = D+R+I+E, S als Rest, V außen
    let nD = Math.round(D*N),
        nR = Math.round(R*N),
        nI = Math.round(I*N),
        nE = Math.round(E*N),
        nV = Math.round(V*N);

    // Kappung auf inneren Bereich (D+R+I+E)
    let usedInner = nD + nR + nI + nE;
    if (usedInner > N) {
      const over = usedInner - N, tot = Math.max(1, usedInner);
      // proportional reduzieren
      nD -= Math.round(over * (nD/tot));
      nR -= Math.round(over * (nR/tot));
      nI -= Math.round(over * (nI/tot));
      nE -= Math.round(over * (nE/tot));
      usedInner = nD + nR + nI + nE;
    }

    // V darf nur in den Außenring
    const nOuter = Math.max(0, N - usedInner);
    if (nV > nOuter) nV = nOuter;

    // S = Restfläche zwischen innerem Kern und Außenring
    const sStart = usedInner;
    const sEnd   = Math.max(sStart, N - nV);

    // Batching pro Farbe (Canvas-Zeichenreihenfolge): D → R → I → E → S → V
    paintDots(0,                 nD,               state.colors.D);
    paintDots(nD,                nD+nR,            state.colors.R);
    paintDots(nD+nR,             nD+nR+nI,         state.colors.I);
    paintDots(nD+nR+nI,          nD+nR+nI+nE,      state.colors.E);
    paintDots(sStart,            sEnd,             state.colors.S);
    paintDots(N-nV,              N,                state.colors.V);

    function paintDots(a, b, fill) {
      if (b <= a) return;
      ctx.fillStyle = fill;
      // Für Schärfe: Kreiswege in Integer-DPR Koordinaten
      const r = state.rDot;
      const path = new Path2D();
      const rnk = state.ranking;
      const C = state.centers;
      for (let t=a; t<b; t++) {
        const idx = rnk[t] * 2;
        const cx = state.crisp ? C[idx]     : C[idx] + 0.5; // crisp = integer center
        const cy = state.crisp ? C[idx + 1] : C[idx + 1] + 0.5;
        path.moveTo(cx + r, cy);
        path.arc(cx, cy, r, 0, Math.PI * 2);
      }
      ctx.fill(path);
    }
  }

  function rebuildMetric(){
    const rnd  = mulberry32(hashStr(state.seed || 'uid-g'));
    state.metric  = buildMetric(state.grid, state.mode, rnd, state.hybrid);
    state.ranking = argsort(state.metric);
  }

  function readThemeColors() {
    try {
      const cs = getComputedStyle(el);
      const pick = (name, fallback) => (cs.getPropertyValue(name) || '').trim() || fallback;
      state.colors.S = pick('--c-s', state.colors.S);
      state.colors.E = pick('--c-e', state.colors.E);
      state.colors.I = pick('--c-i', state.colors.I);
      state.colors.R = pick('--c-r', state.colors.R);
      state.colors.D = pick('--c-d', state.colors.D);
      state.colors.V = pick('--c-v', state.colors.V);
    } catch {}
  }
}

/* ===========================
 * Helpers (unchanged core)
 * =========================== */

function normalizeSeries(payload) {
  const N = Math.max(1, Number(payload.N || 1));
  const ser = payload.series || {};
  const norm = (arr) => Array.isArray(arr) ? arr.map(v => Math.max(0, Number(v||0)) / N) : undefined;
  return {
    t: ser.t,
    series: {
      S: norm(ser.S),
      E: norm(ser.E),
      I: norm(ser.I),
      R: norm(ser.R),
      D: norm(ser.D),   // additiv: fehlt → 0 in renderFrame
      V: norm(ser.V)
    }
  };
}

function at(a, k){ if(!a||!a.length) return 0; const i=Math.max(0,Math.min(a.length-1,k|0)); return a[i]||0; }
function clamp01(v){ return v<0?0:(v>1?1:v); }
function clearCanvas(ctx){ if(!ctx) return; ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height); }

function argsort(arr){ const n=arr.length, idx=new Uint32Array(n); for(let i=0;i<n;i++){ idx[i]=i; } idx.sort((a,b)=>arr[a]-arr[b]); return idx; }
function mulberry32(a){ return function(){ let t=a+=0x6D2B79F5; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
function hashStr(str){ let h=2166136261>>>0; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619);} return h>>>0; }

function valueNoise2D(w,h,rnd){
  const f = new Float32Array(w*h);
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const rx = (x + Math.floor(rnd()*997)) % w;
      const ry = (y + Math.floor(rnd()*991)) % h;
      f[y*w+x] = rnd()*1.0 + 0.15*Math.sin(0.11*rx) + 0.15*Math.cos(0.13*ry);
    }
  }
  return f;
}
function blurField(field,size=2,passes=2,wGuess){
  const n=field.length, w=wGuess||Math.floor(Math.sqrt(n)), h=Math.floor(n/w);
  const out=new Float32Array(n), rad=Math.max(1,size|0);
  for(let p=0;p<passes;p++){
    for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        let acc=0,cnt=0; for(let dx=-rad;dx<=rad;dx++){ const xx=x+dx; if(xx<0||xx>=w) continue; acc+=field[y*w+xx]; cnt++; }
        out[y*w+x]=acc/cnt;
      }
    }
    for(let x=0;x<w;x++){
      for(let y=0;y<h;y++){
        let acc=0,cnt=0; for(let dy=-rad;dy<=rad;dy++){ const yy=y+dy; if(yy<0||yy>=h) continue; acc+=out[yy*w+x]; cnt++; }
        field[y*w+x]=acc/cnt;
      }
    }
  }
  return field;
}
function smoothstep(e0,e1,x){
  const t = Math.max(0, Math.min(1, (x - e0) / Math.max(1e-9, e1 - e0)));
  return t*t*(3-2*t);
}

function buildMetric(grid, mode, rnd, hybridCfg){
  const N = grid*grid, out = new Float32Array(N);
  if (mode === 'proportional'){ for(let i=0;i<N;i++) out[i]=i; return out; }
  const cx=(grid-1)/2, cy=(grid-1)/2, maxR=Math.hypot(cx,cy);
  if (mode === 'wave'){
    for(let y=0;y<grid;y++) for(let x=0;x<grid;x++)
      out[y*grid+x]=Math.hypot(x-cx,y-cy)/maxR;
    return out;
  }
  if (mode === 'cluster'){
    const field=valueNoise2D(grid,grid,rnd); blurField(field,2,2,grid);
    for(let i=0;i<N;i++) out[i]=field[i]; return out;
  }
  const d0=Math.max(0,Math.min(1,hybridCfg?.d0??0.25));
  const p=Math.max(0.5,Math.min(4,hybridCfg?.p??2.0));
  const nf=valueNoise2D(grid,grid,rnd); blurField(nf,2,hybridCfg?.blurPasses??2,grid);
  for(let y=0;y<grid;y++) for(let x=0;x<grid;x++){
    const r=Math.hypot(x-cx,y-cy)/maxR;
    const w=Math.pow(smoothstep(d0,1.0,r),p);
    out[y*grid+x]=(1-w)*r + w*nf[y*grid+x];
  }
  return out;
}
