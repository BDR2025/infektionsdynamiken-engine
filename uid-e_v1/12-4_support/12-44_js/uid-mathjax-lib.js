// UID · Custom MathJax Build (nur benötigte Pakete, kein Nachladen, keine CDN-Refs)
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { CHTML } from 'mathjax-full/js/output/chtml.js';
import { browserAdaptor } from 'mathjax-full/js/adaptors/browserAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';

// Nur die Pakete, die wir brauchen:
import 'mathjax-full/js/input/tex/base/BaseConfiguration.js';
import 'mathjax-full/js/input/tex/ams/AmsConfiguration.js';
import 'mathjax-full/js/input/tex/html/HtmlConfiguration.js';
import 'mathjax-full/js/input/tex/noerrors/NoErrorsConfiguration.js';
import 'mathjax-full/js/input/tex/noundefined/NoUndefinedConfiguration.js';
import 'mathjax-full/js/input/tex/textmacros/TextMacrosConfiguration.js';

// Browser-Adaptor registrieren
RegisterHTMLHandler(browserAdaptor());

// TeX-Input (nur die nötigen Pakete, passende Delimiter)
const tex = new TeX({
  packages: ['base','ams','html','noerrors','noundefined','textmacros'],
  inlineMath: [['$', '$'], ['\\(', '\\)']],
  displayMath: [['\\[','\\]'], ['$$','$$']],
  processEscapes: true
});

// CHTML-Output (Zeilenumbruch korrekt nur hier konfiguriert)
const chtml = new CHTML({
  linebreaks: { automatic: true, width: 'container' },
  // Lokale Fonts – Ordner relativ zu dieser Datei:
  fontURL: new URL('./output/chtml/fonts/woff-v2', import.meta.url).href
});

// MathJax-Dokument aus Input/Output bilden
const html = mathjax.document(document, { InputJax: tex, OutputJax: chtml });

// Schlanke, kompatible API auf window.MathJax bereitstellen
window.MathJax = {
  version: '3.2.x-uid-min',
  startup: {
    promise: Promise.resolve(), // sofort betriebsbereit
    output: chtml
  },
  typesetPromise: (nodes) => {
    const arr = nodes ? (Array.isArray(nodes) ? nodes : [nodes]) : [document.body];
    html.findMath({ elements: arr });
    html.compile();
    html.getMetrics();
    html.typeset();
    html.updateDocument();
    return Promise.resolve();
  },
  typesetClear: () => {}
};
