/*!
 * File:      uid-mathjax.js
 * Project:   UID-Explore · Support
 * Role:      MathJax-Loader (100% lokal, keine CDN-Requests)
 * License:   CC BY 4.0
 *
 * Updated:   2025-10-03
 * Version:   3.0.1
 */
'use strict';

const LOADER_ID = 'MathJax-loader';
let READY = null;

export function initMathJax() {
  if (READY) return READY;

  // Aufräumen
  try {
    document.querySelectorAll('script#MathJax-script, script#' + LOADER_ID).forEach(s => s.remove());
    if (window.MathJax && !window.MathJax.typesetPromise) delete window.MathJax;
  } catch {}

  // Lokaler Font-Pfad relativ zu dieser Datei
  const localFontURL = new URL('./output/chtml/fonts/woff-v2', import.meta.url).href;

  // Pre-Config (nur lokal, keine externen Pfade/Loads)
  window.MathJax = {
    startup: { typeset: false },
    tex: {
      inlineMath:  [['$', '$'], ['\\(', '\\)']],
      displayMath: [['\\[','\\]'], ['$$','$$']],
      processEscapes: true,
      packages: {'[+]': ['ams','html','textmacros','noerrors','noundefined']} // Full-Build hat sie schon; harmless
    },
    chtml: { fontURL: localFontURL },
    loader: { load: [] } // offline
  };

  // Einziger Kandidat: lokale Full-Build
  const SRC = new URL('./tex-chtml-full.js', import.meta.url).href;

  READY = (async () => {
    try {
      await loadScript(SRC);
      await waitForLoaded();

      // Nach Startup: linebreaks sauber setzen & fontURL spiegeln
      try {
        await (window.MathJax?.startup?.promise || Promise.resolve());
        const out = window.MathJax?.startup?.output;
        if (out) {
          out.options.linebreaks = { automatic: true, width: 'container' };
          if (!out.options.fontURL) out.options.fontURL = localFontURL;
          (window.MathJax.chtml = window.MathJax.chtml || {}).fontURL = out.options.fontURL;
        }
      } catch {}

      // EBUS-Bridge
      const bus = window.EBUS;
      if (bus && !bus.__uid_mj_bridge__) {
        bus.__uid_mj_bridge__ = true;
        bus.on?.('uid:mathjax:typeset', (p = {}) => typeset(p.root || p.el || document.body));
        bus.emit?.('uid:mathjax:ready', { ok: true, used: SRC, offline: true });
      }

      console.info('[uid-mathjax] ready(local):', SRC);
      return true;
    } catch (e) {
      console.error('[uid-mathjax] Local build not found:', e);
      return false;
    }
  })();

  return READY;
}

export function typeset(root = document.body) {
  const MJ = window.MathJax;
  const nodes = Array.isArray(root) ? root : [root];
  return MJ?.typesetPromise ? MJ.typesetPromise(nodes).catch(()=>{}) : Promise.resolve();
}

/* Helpers */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.id = LOADER_ID;
    s.defer = true;
    s.src = src;
    s.onload  = () => resolve(true);
    s.onerror = (e) => reject(Object.assign(new Error('load error'), { src, cause: e }));
    document.head.appendChild(s);
  });
}
function waitForLoaded(timeoutMs = 2500, intervalMs = 50) {
  return new Promise((resolve, reject) => {
    const t0 = performance.now();
    (function loop() {
      const ok = typeof window.MathJax?.typesetPromise === 'function';
      if (ok) return resolve(true);
      if (performance.now() - t0 >= timeoutMs) return reject(new Error('timeout (MathJax.typesetPromise missing)'));
      setTimeout(loop, intervalMs);
    })();
  });
}
