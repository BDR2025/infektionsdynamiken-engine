/*! 
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Input Layer · Parameter Tool · Formulas
 * File:     /parameters/formulas/styles.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-01
 * Updated:  2025-10-01
 * Version:  6.0.0
 * Changelog:
 *   - v6.0.0 Grundstil für Formeln-Panel injiziert (eine Typo-Stimme, Tabs stabil)
 *
 * eAnnotation:
 *   Injiziert die Basis-Styles für das Formeln-Panel (einheitliches Schriftbild).
 *   Bringt Grid, Karten, MJX-Typo, Slider-Track und Mark/Pulse ohne globale Eingriffe.
 */

let __feStylesInjected = false;

/**
 * Styles für das Formeln-Panel einmalig injizieren.
 * Keine globalen Overrides; alles ist auf Panel-Selektoren gescopet.
 */
export function inject(){
  if (__feStylesInjected) return;
  __feStylesInjected = true;

  const css = `
    /* Layout */
    .fe-panel{ display:grid; grid-template-columns:1fr; gap:12px; }
    .fe-panel.pt-flat .fe-card{ border:none; padding:0; background:transparent; }

    /* Karten */
    .fe-card{
      border:1px solid rgba(255,255,255,.06);
      border-radius:10px;
      padding:12px;
      background:transparent;
    }

    /* Ein einheitliches Schriftbild (wie Bruchschreibweise) */
    .fe-chain mjx-container,
    .fe-sym   mjx-container,
    .fe-num   mjx-container{
      font-size: 1em;
      line-height: 1.2;
      font-weight: 400; /* kein Bold im Ergebnis */
    }

    /* Ruhige Zahlen (tabular) – sowohl \text als auch echte Math-Zahlen */
    .fe-card mjx-mtext,
    .fe-card mjx-mn{
      font-variant-numeric: tabular-nums;
      font-feature-settings: "tnum" 1;
    }

    /* Ketten sind einzeilig */
    .fe-chain{ margin:0; white-space:nowrap; display:block; }

    /* Zielklassen – alle gleichwertig (keine Lautstärkedifferenz) */
    .fe-chain .fe-lhs,
    .fe-chain .fe-prod,
    .fe-chain .fe-res,
    .fe-chain .fe-res-unit{
      font-size: 1em;
      font-weight: 400;
      opacity: 1;
    }

    /* Slider unter den Formeln (lokal, dark-tauglich) */
    .fe-ctrl{ margin-top:8px; }
    .fe-ctrl input[type=range]{
      width:100%; height:4px; background:transparent;
      -webkit-appearance:none; appearance:none; border:0; outline:0;
    }
    .fe-ctrl input[type="range"]::-webkit-slider-runnable-track{
      height:4px; border-radius:3px;
      background: linear-gradient(90deg, rgba(69,224,224,.45), rgba(38,134,166,.45));
    }
    .fe-ctrl input[type="range"]::-webkit-slider-thumb{
      -webkit-appearance:none; width:18px; height:18px; margin-top:-7px;
      border-radius:50%; background:#e7fbff; border:2px solid rgba(0,0,0,.35);
      transition: transform .05s ease;
    }
    .fe-ctrl input[type="range"]::-moz-range-track{
      height:4px; border-radius:3px;
      background: linear-gradient(90deg, rgba(69,224,224,.45), rgba(38,134,166,.45));
    }
    .fe-ctrl input[type="range"]::-moz-range-thumb{
      width:18px; height:18px; border-radius:50%;
      background:#e7fbff; border:2px solid rgba(0,0,0,.35);
    }
    .fe-ctrl input[type="range"]:focus-visible{
      outline:2px solid #45e0e0; outline-offset:4px;
    }

    /* Mark/Pulse – rein optisch, kein Layout-Shift */
    .fe-var{ padding:0 2px; border-radius:4px; transition:color .25s ease, text-shadow .25s ease; }
    .fe-drag{ color:#03C3FC; text-shadow:0 0 2px rgba(3,195,252,.35), 0 0 6px rgba(3,195,252,.2); }
    @keyframes feNeonWave {
      0% { color:#03C3FC; text-shadow:0 0 0 rgba(3,195,252,0) }
      30%{ color:#03C3FC; text-shadow:0 0 4px rgba(3,195,252,.7), 0 0 8px rgba(3,195,252,.4) }
      60%{ color:#9fe9ff; text-shadow:0 0 10px rgba(3,195,252,.35), 0 0 16px rgba(3,195,252,.18) }
      100%{ color:#fff;   text-shadow:0 0 0 rgba(3,195,252,0) }
    }
    .fe-pulse{ animation: feNeonWave 900ms ease-out both; }
  `;

  const st = document.createElement('style');
  st.id = 'fe-style';
  st.textContent = css;
  document.head.appendChild(st);
}
