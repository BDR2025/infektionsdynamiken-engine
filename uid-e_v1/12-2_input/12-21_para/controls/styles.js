/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Input Layer · Parameter Tool · Controls
 * File:     /parameters/controls/styles.js
 * Type:     Open Educational Resource (OER) · ESM
 * License:  CC BY 4.0
 *
 * Updated:  2025-10-02
 * Version:  6.1.1
 * Changelog:
 *   - v6.1.1  FIX: .pt-panel NICHT mehr verstecken (sonst leerer Body).
 *             Flat-Slot-Regeln + deine v6.0.0-Optik kombiniert.
 */

let __ctrlStylesInjected = false;

/** Deine bestehende v6.0.0-Optik (Classic) – bleibt erhalten */
export function inject(){
  if (__ctrlStylesInjected) return;
  __ctrlStylesInjected = true;

  const css = `
    .pt-accordion{ padding:8px; }
    .pt-acc-body[hidden]{ display:none !important; }

    .pt-acc-body .slider-row{ margin: 0 0 10px 0; }
    .pt-acc-body .slider-row .meta{
      display:flex; align-items:baseline; justify-content:space-between;
      gap:8px; margin-bottom:6px;
      font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1; line-height:1.25;
    }
    .pt-acc-body .slider-row .meta label{ opacity:.9; font-weight:400; font-size:1rem; }
    .pt-acc-body .slider-row .meta .val{   opacity:.9; font-weight:400; font-size:1rem; }

    .pt-acc-body .slider-row input[type="range"]{
      width:100%; max-width:100%; height:4px; background:transparent;
      -webkit-appearance:none; appearance:none; border:0!important; outline:0!important;
      box-sizing:border-box; display:block;
    }
    .pt-acc-body .slider-row input[type="range"]::-webkit-slider-runnable-track{
      height:4px; border-radius:3px;
      background: linear-gradient(90deg, rgba(69,224,224,.35), rgba(38,134,166,.35));
    }
    .pt-acc-body .slider-row input[type="range"]::-webkit-slider-thumb{
      -webkit-appearance:none; width:18px; height:18px; margin-top:-7px; border-radius:50%;
      background:#e7fbff; border:2px solid rgba(0,0,0,.35); transition: transform .05s ease;
    }
    .pt-acc-body .slider-row input[type="range"]:active::-webkit-slider-thumb{ transform: scale(.98); }
    .pt-acc-body .slider-row input[type="range"]::-moz-range-track{
      height:4px; border-radius:3px;
      background: linear-gradient(90deg, rgba(69,224,224,.35), rgba(38,134,166,.35));
    }
    .pt-acc-body .slider-row input[type="range"]::-moz-range-thumb{
      width:18px; height:18px; border-radius:50%;
      background:#e7fbff; border:2px solid rgba(0,0,0,.35);
    }
    .pt-acc-body .slider-row input[type="range"]:focus-visible{
      outline:2px solid #45e0e0; outline-offset:4px;
    }
  `;
  const st = document.createElement('style');
  st.id = 'pt-ctrl-style-v6';
  st.textContent = css;
  document.head.appendChild(st);
}

/** Flat / Slot-basierte Darstellung (randlos, host-scoped) */
export function ensurePTStyles(widgetEl){
  if (!widgetEl) return;

  // Classic-Optik sicher laden
  inject();

  // pro Widget nur einmal
  if (widgetEl.__ptFlatStylesApplied) return;
  widgetEl.__ptFlatStylesApplied = true;

  const css = `
  /* --- Legacy-Akkordeon ausblenden (ABER .pt-panel NICHT!) --- */
  .pt-acc-head, .pt-acc-section, .pt-acc-body { display: none !important; }

  /* --- Container flach & randlos --- */
  .pt-groups { margin: 0; padding: 0; }
  .pt-group  { margin: 0; padding: 0; background: transparent; }

  /* --- Sichtlogik: genau 1 Gruppe sichtbar --- */
  [data-pt-slot] [data-group] { display: none !important; }
  [data-pt-slot="learning"]   [data-group="learning"],
  [data-pt-slot="model"]      [data-group="model"],
  [data-pt-slot="simulation"] [data-group="simulation"] {
    display: block !important;
  }
  /* Slot "formulas": Controls komplett verbergen */
  [data-pt-slot="formulas"] [data-group] { display: none !important; }

  /* --- Zeilenlayout (ruhig, kompakt) --- */
  .pt-row { display:grid; grid-template-columns:1fr; grid-row-gap:6px; margin:10px 0 14px 0; }
  .pt-row-head { display:flex; align-items:baseline; justify-content:space-between; gap:10px; }
  .pt-label { font-weight:600; letter-spacing:.2px; }
  .pt-value { opacity:.9; font-variant-numeric: tabular-nums; }

  /* --- Slider-Optik für FLAT (.pt-range) --- */
  .pt-range{
    width:100%; max-width:100%; height:4px; background:transparent;
    -webkit-appearance:none; appearance:none; border:0!important; outline:0!important;
    box-sizing:border-box; display:block;
  }
  .pt-range::-webkit-slider-runnable-track{
    height:4px; border-radius:3px;
    background: linear-gradient(90deg, rgba(69,224,224,.35), rgba(38,134,166,.35));
  }
  .pt-range::-webkit-slider-thumb{
    -webkit-appearance:none; width:18px; height:18px; margin-top:-7px; border-radius:50%;
    background:#e7fbff; border:2px solid rgba(0,0,0,.35); transition: transform .05s ease;
  }
  .pt-range:active::-webkit-slider-thumb{ transform: scale(.98); }
  .pt-range::-moz-range-track{
    height:4px; border-radius:3px;
    background: linear-gradient(90deg, rgba(69,224,224,.35), rgba(38,134,166,.35));
  }
  .pt-range::-moz-range-thumb{
    width:18px; height:18px; border-radius:50%;
    background:#e7fbff; border:2px solid rgba(0,0,0,.35);
  }
  .pt-range:focus-visible{ outline:2px solid #45e0e0; outline-offset:4px; }

  /* a11y */
  .sr-only{
    position:absolute!important; clip:rect(1px,1px,1px,1px);
    clip-path:inset(50%); height:1px; width:1px; overflow:hidden; white-space:nowrap;
  }
  `;
  const style = document.createElement('style');
  style.setAttribute('data-pt-styles','flat');
  style.textContent = css;
  widgetEl.appendChild(style);
}

export default { inject, ensurePTStyles };
