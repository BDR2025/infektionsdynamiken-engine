/*!
 * File:      square/math/rates.js
 * License:   CC BY 4.0
 */

'use strict';

export function computeMetrics(snapIn, unit){
  const S = snapIn.series || {};
  const t = Array.isArray(S.t) ? S.t : [];
  const len = t.length|0; if (!len) return base({});
  const i = clamp(snapIn.idx, 0, len-1)|0;
  const im1 = Math.max(0, i-1);

  const Sabs = valAt(S.S,i), Eabs = (S.E?valAt(S.E,i):undefined), Iabs = valAt(S.I,i), Rabs = (S.R?valAt(S.R,i):undefined);
  const Np   = Number(snapIn.params?.N);
  const N    = (Number.isFinite(Np)&&Np>0) ? Np : ([Sabs,Eabs,Iabs,Rabs].filter(x=>x!==undefined).reduce((a,b)=>a+(b||0),0) || 1);

  // Fraktionen (normalisiert)
  let s=Sabs/N, e=(Eabs??0)/N, ii=(Iabs??0)/N, r=(Rabs??0)/N;
  s=clamp01(s); e=clamp01(e); ii=clamp01(ii); r=clamp01(r);
  let sum=s+e+ii+r; if (!Number.isFinite(sum)||sum<=0){ s=e=ii=r=0; sum=1; } s/=sum; e/=sum; ii/=sum; r/=sum;

  const dt = Math.max(1e-6, Number((t[i]-t[im1])||0.5));

  // diskrete Rate für aktuellen Schritt
  const Sabs_m1 = valAt(S.S,im1), Eabs_m1=(S.E?valAt(S.E,im1):undefined), Iabs_m1=valAt(S.I,im1), Rabs_m1=(S.R?valAt(S.R,im1):undefined);
  const dRate = (key)=>{
    if (unit==='ppd'){
      const cur = (key==='S'?s:(key==='E'?e:(key==='I'?ii:r)));
      const prv = (key==='S'?(Sabs_m1/N): key==='E'?((Eabs_m1??0)/N): key==='I'?(Iabs_m1/N): ((Rabs_m1??0)/N));
      return (cur-prv)/dt*100;
    } else {
      const cur = (key==='S'?Sabs: key==='E'?(Eabs??0): key==='I'?Iabs: (Rabs??0));
      const prv = (key==='S'?Sabs_m1: key==='E'?(Eabs_m1??0): key==='I'?Iabs_m1: (Rabs_m1??0));
      return (cur-prv)/dt;
    }
  };

  // kleine Verlaufsfenster für EWMA + 95p-Cap
  const nWin = Math.min(12, i+1);
  const seriesRates = (key)=>{
    const out=[]; for (let k=i; k>=0 && out.length<nWin; k--){
      const tk=Number(t[k]||t[0]), tk1=Number(t[Math.max(0,k-1)]||t[0]); const dtk=Math.max(1e-6, tk-tk1 || dt);
      const cur=(key==='S'?valAt(S.S,k): key==='E'?valAt(S.E||[],k): key==='I'?valAt(S.I,k): valAt(S.R||[],k));
      const prv=(key==='S'?valAt(S.S,Math.max(0,k-1)): key==='E'?valAt(S.E||[],Math.max(0,k-1)): key==='I'?valAt(S.I,Math.max(0,k-1)): valAt(S.R||[],Math.max(0,k-1)));
      if (unit==='ppd'){
        const ck=cur/N, pk=prv/N; out.push((ck-pk)/dtk*100);
      } else { out.push((cur-prv)/dtk); }
    } return out;
  };
  const ewma = (xs, a=0.3)=> xs.slice().reverse().reduce((acc,x)=> (acc==null?x: a*x+(1-a)*acc), null);

  const present=[]; if (Sabs!==undefined) present.push('S'); if (Eabs!==undefined) present.push('E'); if (Iabs!==undefined) present.push('I'); if (Rabs!==undefined) present.push('R');

  const raw = { S:dRate('S'), E:dRate('E'), I:dRate('I'), R:dRate('R') };
  const sm  = Object.fromEntries(present.map(k=>[k, ewma(seriesRates(k)) ?? raw[k]]));

  const pool = present.flatMap(k => seriesRates(k).map(v=>Math.abs(v)));
  const cap  = dynamicCap(pool, unit, N);

  // Reff
  const p=snapIn.params||{}, gamma=pickNum(p.gamma, invOr(p.D,null)),
        mfac=Number.isFinite(p.measures)?(1-Math.max(0,Math.min(1,p.measures))):1,
        beta=pickNum(p.beta, (Number.isFinite(p.R0)&&Number.isFinite(gamma))? p.R0*gamma*mfac: undefined);
  const reff=(Number.isFinite(beta)&&Number.isFinite(gamma)&&gamma>0)? (beta/gamma)*s : NaN;

  return { t:Number(t[i]||0), T:Number(t[len-1]||t[i]), N, present, rates:sm, cap, reff };
}

/* helpers */
function clamp(x,lo,hi){ x=Number.isFinite(x)?x:0; return Math.max(lo, Math.min(hi,x)); }
function clamp01(x){ x=Number(x); return Number.isFinite(x)? (x<0?0:(x>1?1:x)) : 0; }
function valAt(arr,i){ return (Array.isArray(arr) ? Number(arr[i]??0) : 0); }
function pickNum(...vals){ for (const v of vals){ const n=Number(v); if (Number.isFinite(n)) return n; } return undefined; }
function invOr(D,fb){ const d=Number(D); return (Number.isFinite(d)&&d>0)?(1/d):fb; }
function dynamicCap(pool, unit, N){
  if (!Array.isArray(pool) || !pool.length) return (unit==='ppd') ? 5 : Math.max(1, 0.02*N);
  const xs = pool.filter(Number.isFinite).sort((a,b)=>a-b);
  const q  = quantile(xs, 0.95) || xs[xs.length-1];
  const fb = (unit==='ppd') ? 5 : Math.max(1, 0.02*N);
  return Math.max(q, fb);
}
function quantile(xs, p){ if(!xs.length)return 0; const i=(xs.length-1)*p, lo=Math.floor(i), hi=Math.ceil(i); if(lo===hi)return xs[lo]; const t=i-lo; return xs[lo]*(1-t)+xs[hi]*t; }
function base(){ return { t:0, T:0, N:1, present:[], rates:{}, cap:1, reff:NaN }; }

export default { computeMetrics };
