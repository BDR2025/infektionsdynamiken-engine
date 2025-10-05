/*! 
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Input Layer · Parameter Tool
 * File:     /parameters/tabs.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-01
 * Updated:  2025-10-01
 * Version:  6.0.0
 * Changelog:
 *   - v6.0.0 Minimaler ARIA-Tab-Umschalter (Regler/Formeln), host-scoped
 *
 * eAnnotation:
 *   Schaltet zwischen „Regler“ und „Formeln“ um (ARIA-konform, host-scoped).
 *   Setzt aria-selected/hidden korrekt; kein Reflow-Overhead, keine Bus-Logik.
 */

/**
 * Initialisiert die Tabs „Regler/Formeln“ innerhalb des gegebenen Scopes.
 * Erwartet folgende IDs im Scope:
 *   #pt-tab-sliders, #pt-tab-formulas, #pt-view-sliders, #pt-view-formulas
 * @param {HTMLElement|Document} scope
 */
export function initPTabs(scope){
  const root  = (scope || document);
  const btnS  = root.querySelector('#pt-tab-sliders');
  const btnF  = root.querySelector('#pt-tab-formulas');
  const viewS = root.querySelector('#pt-view-sliders');
  const viewF = root.querySelector('#pt-view-formulas');

  if (!btnS || !btnF || !viewS || !viewF) return;

  // Grund-ARIA (einmalig)
  btnS.setAttribute('role','tab');
  btnF.setAttribute('role','tab');
  viewS.setAttribute('role','tabpanel');
  viewF.setAttribute('role','tabpanel');

  function show(which){
    const showSliders = (which === 'sliders');

    // Tabs: aria-selected + tabindex
    btnS.setAttribute('aria-selected', String(showSliders));
    btnF.setAttribute('aria-selected', String(!showSliders));
    btnS.tabIndex = showSliders ? 0 : -1;
    btnF.tabIndex = showSliders ? -1 : 0;

    // Panels: hidden toggeln
    viewS.toggleAttribute('hidden', !showSliders);
    viewF.toggleAttribute('hidden', showSliders);

    // Fokus auf aktiven Tab
    (showSliders ? btnS : btnF).focus({ preventScroll: true });
  }

  // Klick
  btnS.addEventListener('click', (e)=>{ e.preventDefault(); show('sliders'); });
  btnF.addEventListener('click', (e)=>{ e.preventDefault(); show('formulas'); });

  // Keyboard (Links/Rechts/Home/End) – optional, leichtgewichtig
  function onKey(e){
    const key = e.key;
    if (key === 'ArrowLeft' || key === 'ArrowUp'){
      e.preventDefault(); show('sliders');
    } else if (key === 'ArrowRight' || key === 'ArrowDown'){
      e.preventDefault(); show('formulas');
    } else if (key === 'Home'){
      e.preventDefault(); show('sliders');
    } else if (key === 'End'){
      e.preventDefault(); show('formulas');
    }
  }
  btnS.addEventListener('keydown', onKey);
  btnF.addEventListener('keydown', onKey);

  // Default
  show('sliders');
}
