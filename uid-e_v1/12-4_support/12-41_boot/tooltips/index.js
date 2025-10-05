/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Boot Module (ESM)
 * File:     /uid/12-4_support/app/boot/tooltips/index.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-04
 * Updated:  2025-10-04
 * Version:  1.0.0
 * Changelog:
 *   - v1.0.0  Legacy-stabile Variante (keine Root-Absolute, sichere Head/Body-Guards).
 */

'use strict';

export function ensureWidgetStyles() {
  try {
    if (document.getElementById('uid-tooltips-style')) return;
    const css = `
      .uid-tooltips-layer{position:fixed;left:0;top:0;pointer-events:none;z-index:2147483646;}
      .uid-tip{position:absolute;transform:translate(-50%,-120%);background:rgba(0,0,0,.85);color:#fff;
               border-radius:8px;padding:6px 8px;font-size:12px;line-height:1.2;box-shadow:0 2px 8px rgba(0,0,0,.3);
               max-width:280px;white-space:nowrap;pointer-events:none}
      .uid-tip[data-variant="header"]{background:rgba(20,20,30,.95)}
    `;
    const insert = () => {
      if (document.getElementById('uid-tooltips-style')) return;
      const style = document.createElement('style');
      style.id = 'uid-tooltips-style';
      style.textContent = css;
      (document.head || document.documentElement).appendChild(style);
    };
    if (document.head) insert(); else document.addEventListener('DOMContentLoaded', insert, { once: true });
  } catch {}
}

export function ensureTooltips(root = document) {
  try {
    let layer = (root.getElementById ? root.getElementById('uid-tooltips-root') : null)
             || document.getElementById('uid-tooltips-root');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'uid-tooltips-root';
      layer.className = 'uid-tooltips-layer';
      (document.body || document.documentElement).appendChild(layer);
      // Falls noch kein <body> existiert: später sauber verschieben
      if (!document.body) {
        document.addEventListener('DOMContentLoaded', () => {
          try { if (layer.parentNode !== document.body) document.body.appendChild(layer); } catch {}
        }, { once: true });
      }
    }
    return layer;
  } catch {
    return null;
  }
}
