/*!
 * File:      12-3_presentation/chart/overlay/utils.js
 * Module:    UID-Chart · Overlay Utils
 * Version:   v0.2.0
 * License:   CC BY 4.0
 *
 * Helpers for coordinate transforms and simple searches.
 */
export function createScaler({ width, height, xDomain=[0,1], yDomain=[0,1], padding=0 }){
  const [x0,x1] = xDomain, [y0,y1] = yDomain;
  const iw = Math.max(1, width  - 2*padding);
  const ih = Math.max(1, height - 2*padding);
  return {
    xToPx: (x)=> padding + (x - x0) / (x1 - x0) * iw,
    yToPx: (y)=> padding + ih - (y - y0) / (y1 - y0) * ih,
    pxToX: (px)=> x0 + (px - padding)/iw * (x1-x0),
    pxToY: (py)=> y0 + (ih - (py - padding))/ih * (y1-y0)
  };
}

export function binarySearchFirstLeq(arr, threshold){
  // first index with arr[i] <= threshold (assumes arr monotonic decreasing);
  let lo=0, hi=arr.length-1, ans=-1;
  while (lo<=hi){
    const mid=(lo+hi)>>1;
    if (arr[mid] <= threshold){ ans=mid; hi=mid-1; }
    else lo=mid+1;
  }
  return ans;
}

export function firstCrossing(x, y, yConst){
  // find first x where y crosses below yConst; linear interpolate
  for (let i=1;i<y.length;i++){
    const y0=y[i-1], y1=y[i];
    if ((y0 - yConst) * (y1 - yConst) <= 0){
      const t = (yConst - y0)/((y1 - y0) || 1e-9);
      const xi = x[i-1] + t*(x[i]-x[i-1]);
      return { index:i, x:xi, t };
    }
  }
  return null;
}
