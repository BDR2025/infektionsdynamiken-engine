/*!
 * File:      12-3_presentation/chart/overlay/manager.js
 * Module:    UID-Chart · Overlay Manager (SVG single-layer)
 * Version:   v0.3.0 (WP0 baseline)
 * License:   CC BY 4.0
 *
 * Purpose:
 *   - Provides a single SVG overlay layer above the chart canvas.
 *   - Manages overlay groups (lines, crosshairs, badges) without touching the render core.
 *   - Bus-driven; safe to mount/unmount at runtime.
 *
 * Public API:
 *   initOverlay({ root, bus, zIndex? }) -> manager
 *   manager.getLayer(id)    // <g> create-or-get
 *   manager.dropLayer(id)   // remove <g>
 *   manager.clear()         // remove all overlay content
 *
 * Bus (listen):
 *   uid:e:overlay:clear
 *   uid:e:overlay:drop {id}
 *
 * Notes:
 *   - Does not assume any specific chart lib; only needs a DOM root to attach to.
 *   - Consumers (HIT lines, Ruler, etc.) request/create sublayers via getLayer().
 */
import { on, emit } from '../../../12-1_base/bus.js';

export function initOverlay({ root, bus = { on, emit }, zIndex = 2 } = {}){
  if (!root) throw new Error('[Overlay] Missing root element');
  // idempotent: reuse existing overlay if present
  let overlay = root.querySelector(':scope > .uid-overlay');
  if (!overlay){
    overlay = document.createElement('div');
    overlay.className = 'uid-overlay';
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = String(zIndex);
    // single SVG layer for minimal DOM
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'uid-overlay-svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 1000 1000'); // virtual box; scale via transforms
    overlay.appendChild(svg);
    root.style.position = root.style.position || 'relative';
    root.appendChild(overlay);
  }
  const svg = overlay.querySelector('svg');

  // helpers
  const ns = 'http://www.w3.org/2000/svg';
  const groups = new Map();

  function getLayer(id){
    let g = groups.get(id);
    if (!g){
      g = document.createElementNS(ns, 'g');
      g.setAttribute('data-layer', id);
      svg.appendChild(g);
      groups.set(id, g);
    }
    return g;
  }
  function dropLayer(id){
    const g = groups.get(id);
    if (g && g.parentNode) g.parentNode.removeChild(g);
    groups.delete(id);
  }
  function clear(){
    groups.forEach(g => g.parentNode && g.parentNode.removeChild(g));
    groups.clear();
  }

  // Bus listeners
  bus.on('uid:e:overlay:clear', clear);
  bus.on('uid:e:overlay:drop', ({ id }) => dropLayer(id));

  // expose simple utils for line + text
  function line(x1,y1,x2,y2, attrs={}){
    const el = document.createElementNS(ns, 'line');
    el.setAttribute('x1', x1); el.setAttribute('y1', y1);
    el.setAttribute('x2', x2); el.setAttribute('y2', y2);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }
  function text(x,y, str, attrs={}){
    const el = document.createElementNS(ns, 'text');
    el.setAttribute('x', x); el.setAttribute('y', y);
    el.setAttribute('dominant-baseline', 'middle');
    el.setAttribute('text-anchor', 'start');
    el.textContent = str;
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  return { root, overlay, svg, getLayer, dropLayer, clear, line, text };
}
