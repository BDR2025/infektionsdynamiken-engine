// UID-Chart · interaction/playhead-core.js
// Zeichnet eine feine, elegante Playhead-Linie + T-Label auf einem Overlay-Canvas.
// Emits: uid:e:sim:pointer { idx }
import { emit } from '../../../12-1_base/bus.js';

export function mountPlayhead(host, { bridge, pad = 32 } = {}) {
  // Overlay-Canvas
  const cv = document.createElement('canvas');
  Object.assign(cv.style, {
    position:'absolute', inset:'0', width:'100%', height:'100%',
    display:'block', pointerEvents:'none'
  });
  // Host muss relative sein (falls nicht bereits)
  const computedPos = getComputedStyle(host).position;
  if (computedPos === 'static' || !computedPos) host.style.position = 'relative';
  host.appendChild(cv);
  const ctx = cv.getContext('2d');

  let W=0,H=0, dpr=1, idx=null, colorLine, colorLabelBg, colorLabelFg, colorLabelBorder;

  function readTokens() {
    const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
    colorLine        = css('--playhead-line')        || 'rgba(159,178,198,.85)';
    colorLabelBg     = css('--playhead-label-bg')    || 'rgba(15,22,30,.92)';
    colorLabelFg     = css('--playhead-label-fg')    || '#eaf0f6';
    colorLabelBorder = css('--playhead-label-border')|| 'rgba(159,178,198,.35)';
  }
  readTokens();

  function setSize(w,h) {
    dpr = Math.max(1, Math.floor(window.devicePixelRatio||1));
    cv.width  = Math.max(1, w|0) * dpr;
    cv.height = Math.max(1, h|0) * dpr;
    cv.style.width = (w|0)+'px'; cv.style.height = (h|0)+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    W = w|0; H = h|0;
    redraw();
  }

  function clear() { ctx.clearRect(0,0,W,H); }

  function drawLineAtX(x){
    ctx.save();
    ctx.strokeStyle = colorLine;
    ctx.lineWidth = 1; // hauchdünn
    ctx.beginPath();
    ctx.moveTo(x, pad);
    ctx.lineTo(x, H - pad);
    ctx.stroke();
    ctx.restore();
  }

  function drawTLabel(x){
    if (!bridge || bridge.tLen() < 1 || idx==null) return;
    const tVal = bridge.tOfIdx(idx);
    const text = (typeof tVal === 'number') ? tVal.toFixed(1) + ' d' : String(tVal);

    ctx.save();
    ctx.font = '12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
    ctx.textBaseline = 'middle';
    const tw = Math.ceil(ctx.measureText(text).width);
    const padX = 8, padY = 4;
    const bw = tw + 2*padX;
    const bh = 18 + 2; // ca. 18px + mini border
    const bx = Math.max(pad, Math.min(W - pad - bw, x - bw/2));
    const by = H - pad + 8; // leicht unterhalb der Achse

    // Box
    ctx.fillStyle = colorLabelBg;
    ctx.strokeStyle = colorLabelBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, bx, by, bw, bh, 6);
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = colorLabelFg;
    ctx.fillText(text, bx + padX, by + bh/2);
    ctx.restore();
  }

  function roundRect(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }

  function redraw(){
    clear();
    if (idx==null) return;
    const x = bridge?.xOfIdx ? bridge.xOfIdx(idx) : null;
    if (x==null) return;
    drawLineAtX(x);
    drawTLabel(x);
  }

  function setIndex(i){
    const n = bridge?.tLen ? bridge.tLen() : 0;
    const next = (n? Math.max(0, Math.min(n-1, i|0)) : null);
    if (next === idx) return;
    idx = next;
    redraw();
    emit('uid:e:sim:pointer', { idx });
  }

  function setIndexFromX(x){
    const i = bridge?.idxOfX ? bridge.idxOfX(x) : null;
    if (i==null) return;
    setIndex(i);
  }

  function clearPointer(){
    if (idx==null) return;
    idx = null;
    redraw();
    emit('uid:e:sim:pointer', { idx:null });
  }

  function dispose(){
    try { host.contains(cv) && host.removeChild(cv); } catch {}
  }

  return { setSize, setIndex, setIndexFromX, clearPointer, dispose, refreshTokens: readTokens };
}
