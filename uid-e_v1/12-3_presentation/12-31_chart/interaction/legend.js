// ============================================================================
// UID-Chart · interaction/legend.js
// Minimalistische Legend mit Halo-Dots (Punkt = an, Ring = aus).
// - Keine Labels im interaktiven Modus
// - Emit: uid:e:viz:series:state { visible: {S,E,I,R} }
// CC BY 4.0
// ============================================================================
import { on, emit } from '../../../12-1_base/bus.js';

const SERIES_KEYS = ['S','E','I','R'];
const COLOR_BY_KEY = { S: 'var(--c-s)', E: 'var(--c-e)', I: 'var(--c-i)', R: 'var(--c-r)' };

// Fremde Controls, die in der Legend erhalten bleiben sollen
// NEU: sim-controls aufgenommen, damit sie bei Rebuilds nicht verschwinden
const PRESERVE_SELECTOR = '[data-role="overlays-toggle"],[data-role="sim-controls"]';

export function mountLegend(hostEl, { getAvailableKeys } = {}) {
  if (!hostEl) return { dispose(){} };

  // Container direkt unterhalb des Charts
  const el = document.createElement('div');
  el.className = 'uid-legend';
  hostEl.parentElement?.appendChild(el);

  // Sichtbarkeiten-Map
  let visible = Object.create(null);
  for (const k of SERIES_KEYS) visible[k] = true;

  function render() {
    const avail = (getAvailableKeys?.() || SERIES_KEYS).filter(Boolean);

    // ▼ fremde Controls (z. B. Overlays-Toggle & Sim-Controls) vor dem Clear sichern
    const preserved = Array.from(el.querySelectorAll(PRESERVE_SELECTOR));

    // Container-Layout: Luft & Ausrichtung (inline, damit unabhängig von CSS-Dateien)
    el.innerHTML = '';
    el.style.display = 'flex';
    el.style.gap = '12px';
    el.style.alignItems = 'center';
    el.style.padding = '8px 6px 6px 6px'; // top right bottom left
    el.style.minHeight = '22px';

    const COLOR_BY_KEY_LOCAL = { S:'var(--c-s)', E:'var(--c-e, #a855f7)', I:'var(--c-i)', R:'var(--c-r)' };

    for (const k of avail) {
      const isOn = !!visible[k];

      // Button: immer ein Ring (border), KEIN Hintergrund
      const dot = document.createElement('button');
      dot.className = 'legend-dot' + (isOn ? ' is-on' : ' is-off');
      dot.type = 'button';
      dot.setAttribute('data-series', k);
      dot.setAttribute('aria-label', k);
      dot.title = k;

      // Ring-Styles (edel, großzügig)
      const C = COLOR_BY_KEY_LOCAL[k] || COLOR_BY_KEY[k] || 'currentColor';
      dot.style.all = 'unset';
      dot.style.position = 'relative';
      dot.style.boxSizing = 'border-box';
      dot.style.display = 'inline-block';
      dot.style.width = '18px';                 // etwas größer
      dot.style.height = '18px';
      dot.style.borderRadius = '50%';
      dot.style.border = `2px solid ${C}`;      // der Ring
      dot.style.background = 'transparent';     // nie füllen
      dot.style.cursor = 'pointer';
      dot.style.opacity = isOn ? '.95' : '.55';
      dot.style.transition = 'opacity 120ms ease, transform 120ms ease';
      dot.style.color = C;                      // für Konsistenz (falls gebraucht)
      dot.onmouseenter = () => { dot.style.transform = 'scale(1.06)'; };
      dot.onmouseleave = () => { dot.style.transform = 'scale(1.00)'; };

      // Innerer Punkt: nur wenn "an" → kleiner Abstand nach innen
      const inner = document.createElement('span');
      inner.style.position = 'absolute';
      inner.style.left = '50%';
      inner.style.top = '50%';
      inner.style.width = '8px';                // Dot-Größe
      inner.style.height = '8px';
      inner.style.marginLeft = '-4px';          // Zentrierung
      inner.style.marginTop  = '-4px';
      inner.style.borderRadius = '50%';
      inner.style.background = C;
      inner.style.opacity = isOn ? '1' : '0';   // off → Punkt raus
      inner.style.transition = 'opacity 120ms ease';
      dot.appendChild(inner);

      dot.addEventListener('click', () => {
        visible[k] = !visible[k];
        emit('uid:e:viz:series:state', { visible: { ...visible } });
        render(); // Repaint (Punkt rein/raus)
      });

      el.appendChild(dot);
    }

    // ▼ preserved Controls am Ende wieder anhängen (rechts ausgerichtet)
    for (const node of preserved) {
      try { el.appendChild(node); } catch {}
    }
  }

  // Bei neuen Daten ggf. neu rendern (z. B. wenn E bei SIR wegfällt)
  const offData = on('uid:e:sim:data', () => render());

  // initial zeichnen
  render();

  return {
    dispose(){
      try { offData && offData(); } catch {}
      try { el.remove(); } catch {}
    }
  };
}
