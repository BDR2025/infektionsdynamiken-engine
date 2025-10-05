// UID-Chart · interaction/scale-bridge.js
// Read-only Brücke zwischen t[] und Canvas-X (index <-> x, t <-> idx)
export function makeScaleBridge() {
  let t = [], x0 = 32, x1 = 0;

  function setDomain(_t, _x0, _x1) {
    t = Array.isArray(_t) ? _t : [];
    x0 = Number(_x0) || 32;
    x1 = Number(_x1) || 0;
  }

  const tLen = () => t.length;
  const tOfIdx = (i) => (t.length ? t[Math.max(0, Math.min(t.length-1, i|0))] : 0);

  function idxOfX(x) {
    const n = t.length; if (n < 2) return null;
    const w = Math.max(1, x1 - x0);
    const rel = Math.min(1, Math.max(0, (x - x0) / w));
    return Math.round(rel * (n - 1));
  }
  function xOfIdx(i) {
    const n = t.length; if (n < 2) return x0;
    const w = Math.max(1, x1 - x0);
    const rel = Math.min(1, Math.max(0, i / (n - 1)));
    return x0 + rel * w;
  }

  return { setDomain, tLen, tOfIdx, idxOfX, xOfIdx };
}
