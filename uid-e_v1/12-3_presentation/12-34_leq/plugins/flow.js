/*!
 * File:    plugins/flow.js  · Flow (S1–S3)
 * Purpose: Pfeil S→E (βSI/N), optional Snap-Line & Puls je Didaktik-Stufe
 */

function q(sel, ctx){ return (ctx||document).querySelector(sel); }
function rect(el){ return el?.getBoundingClientRect?.(); }
function center(r){ return r ? { x:r.left+r.width/2, y:r.top+r.height/2 } : null; }

function ensureOverlay(host){
  const ceq = q('.ceq', host) || host;
  ceq.style.position = ceq.style.position || 'relative';
  let svg = q('svg.leq-overlay', ceq);
  if (!svg){
    svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.classList.add('leq-overlay');
    Object.assign(svg.style, { position:'absolute', inset:'0', pointerEvents:'none' });
    svg.setAttribute('width','100%'); svg.setAttribute('height','100%');
    const defs = document.createElementNS(svg.namespaceURI,'defs');
    const m = document.createElementNS(svg.namespaceURI,'marker');
    m.setAttribute('id','leq-arrow'); m.setAttribute('markerWidth','8'); m.setAttribute('markerHeight','8');
    m.setAttribute('refX','8'); m.setAttribute('refY','3'); m.setAttribute('orient','auto');
    const head = document.createElementNS(svg.namespaceURI,'path'); head.setAttribute('d','M0,0 L8,3 L0,6 Z'); head.setAttribute('fill','currentColor');
    m.appendChild(head); defs.appendChild(m); svg.appendChild(defs);
    ceq.appendChild(svg);
  }
  return svg;
}

function path(svg, id, color, width, dashed){
  let p = svg.querySelector('#'+id);
  if (!p){
    p = document.createElementNS(svg.namespaceURI,'path');
    p.setAttribute('id', id);
    p.setAttribute('fill','none');
    svg.appendChild(p);
  }
  p.style.color = color;
  p.setAttribute('stroke','currentColor');
  p.setAttribute('stroke-width', String(width));
  p.setAttribute('stroke-dasharray', dashed ? '4 4' : 'none');
  return p;
}

function cubic(from,to){
  const dx = Math.max(40, Math.abs(to.x-from.x)*0.4);
  const c1x = from.x + dx, c1y = from.y;
  const c2x = to.x   - dx, c2y = to.y;
  return `M ${from.x} ${from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}`;
}

export default function mountFlow(root, card){
  const svg = ensureOverlay(root);

  function currentLevel(){
    const d = +(card?.dataset?.didaktik ?? 0);
    return isNaN(d) ? 0 : d;
  }

  function redraw(){
    const hostRect = q('.ceq', root)?.getBoundingClientRect();
    const tS = q('.block-mid .row-S .leq-t-betaSI_N', root);
    const tE = q('.block-mid .row-E .leq-t-betaSI_N', root);
    if (!hostRect || !tS || !tE){
      ['leq-flow-beta','leq-snap-beta'].forEach(id => svg.querySelector('#'+id)?.setAttribute('d',''));
      return;
    }
    const sC = center(rect(tS)); const eC = center(rect(tE)); if (!sC || !eC) return;
    const from = { x: sC.x - hostRect.left + 24, y: sC.y - hostRect.top };
    const to   = { x: eC.x - hostRect.left - 24, y: eC.y - hostRect.top  };

    // S1: Hauptpfeil
    const pArrow = path(svg, 'leq-flow-beta', 'var(--c-e, #fbd24d)', 2.5, false);
    pArrow.setAttribute('d', cubic(from,to));
    pArrow.setAttribute('marker-end','url(#leq-arrow)');

    // S2: Snap-Line (senkrecht in der Mitte)
    const lvl = currentLevel();
    const midX = (from.x + to.x)/2;
    const pSnap = path(svg, 'leq-snap-beta', 'var(--c-muted, rgba(255,255,255,.40))', 1.5, true);
    if (lvl >= 2){
      pSnap.setAttribute('d', `M ${midX} ${from.y} L ${midX} ${to.y}`);
    } else {
      pSnap.setAttribute('d','');
    }
  }

  // S3: sanfter Puls
  let t0 = 0;
  function tick(t){
    if (currentLevel() < 3) return;
    if (!svg) return;
    const a = svg.querySelector('#leq-flow-beta'); if (!a) return;
    // leichte Opacity/Width-Modulation
    const k = 0.5 + 0.5*Math.sin((t - t0)/500);
    a.setAttribute('stroke-width', String(2.5 + 0.7*k));
    a.style.opacity = String(0.85 + 0.15*k);
  }

  function dispose(){
    try { svg.querySelector('#leq-flow-beta')?.remove(); } catch {}
    try { svg.querySelector('#leq-snap-beta')?.remove(); } catch {}
  }

  // sofort eine erste Zeichnung
  redraw();

  return { redraw, tick, dispose };
}
