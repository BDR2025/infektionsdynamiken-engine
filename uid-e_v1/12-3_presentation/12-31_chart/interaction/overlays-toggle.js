// ============================================================================
// UID-Chart · interaction/overlays-toggle.js
// Master-Toggle für Zusatz-Overlays (Peak-Linien, Marker, …)
// - Emit: uid:e:viz:overlays:enable { enabled:boolean }
// - Fügt sich bevorzugt rechts in die vorhandene .uid-legend ein (edel, ohne Layoutbruch)
// - Fallback: eigener kleiner Wrap, falls keine Legend existiert
// CC BY 4.0
// ============================================================================
import { emit } from '../../../12-1_base/bus.js';

export function mountOverlaysToggle(host, { defaultEnabled = true } = {}) {
  if (!host) return { dispose(){} };

  const root   = document.documentElement;
  const isDe   = String(root.lang || '').toLowerCase().startsWith('de');
  const parent = host.parentElement || host;
  const legend = parent.querySelector?.('.uid-legend');

  // Button erstellen
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('data-role', 'overlays-toggle');
  btn.setAttribute('aria-pressed', String(!!defaultEnabled));
  btn.title = isDe ? 'Hilfslinien an/aus' : 'Toggle helper lines';
  btn.textContent = ''; // kein Text – reiner Dot

  // Ring (gestrichelt) – neutral grau, keine CSS-Abhängigkeit
  Object.assign(btn.style, {
    all: 'unset',
    boxSizing: 'border-box',
    position: 'relative',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    border: '2px dashed rgba(180,180,180,.95)',
    background: 'transparent',
    cursor: 'pointer',
    opacity: '.95',
    marginLeft: '1px'  // Button wird in die Legend verschoben
  });

  // Innerer Punkt (zeigt "an"); bleibt neutral grau
  const inner = document.createElement('span');
  Object.assign(inner.style, {
    position: 'absolute',
    left: '50%', top: '50%',
    width: '8px', height: '8px',
    marginLeft: '-4px', marginTop: '-4px',
    borderRadius: '50%',
    background: 'rgba(210,210,210,1)',
    transition: 'opacity 120ms ease',
    opacity: defaultEnabled ? '1' : '0'
  });
  btn.appendChild(inner);

  function paint(enabled) {
    btn.setAttribute('aria-pressed', String(enabled));
    // Ring bleibt neutral; nur Sättigung leicht variieren
    btn.style.borderColor = enabled ? 'rgba(190,190,190,.95)' : 'rgba(140,140,140,.55)';
    inner.style.opacity   = enabled ? '1' : '0';
  }

  let enabled = !!defaultEnabled;
  paint(enabled);

  // --- Einfügen in Legend direkt neben die Halo-Dots ---------------------
  if (legend) {
    const s = getComputedStyle(legend);
    if (s.display !== 'flex') {
      legend.style.display = 'flex';
      legend.style.alignItems = legend.style.alignItems || 'center';
      legend.style.gap = legend.style.gap || '12px';
      legend.style.padding = legend.style.padding || '8px 6px 0 6px';
      legend.style.minHeight = legend.style.minHeight || '22px';
    }
    legend.appendChild(btn); // Button wird direkt in die Legend eingefügt
  } else {
    // Falls keine Legend, dann in den Wrap (Backup)
    const wrap = document.createElement('div');
    Object.assign(wrap.style, {
      display: 'flex', justifyContent: 'flex-end', gap: '8px',
      padding: '4px 6px 0 6px', alignItems: 'center'
    });
    wrap.appendChild(btn);
    parent.appendChild(wrap);
  }

  // Initialzustand broadcasten (Listener hängen dann sicher)
  queueMicrotask(() => emit('uid:e:viz:overlays:enable', { enabled }));

  // Toggle
  btn.addEventListener('click', () => {
    enabled = !enabled;
    paint(enabled);
    emit('uid:e:viz:overlays:enable', { enabled });
  });

  return {
    dispose(){
      try {
        if (legend) {
          // Falls in Legend eingebaut, entfernen wir es von dort
          legend.contains(btn) && legend.removeChild(btn);
        } else {
          btn.parentElement && btn.parentElement.removeChild(btn);
        }
      } catch {}
    }
  };
}
