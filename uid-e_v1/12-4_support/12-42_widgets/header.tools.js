/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Widget Logic (Header Tools)
 * File:     /uid/12-4_support/widgets/header.tools.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * License:  CC BY 4.0
 *
 * Created:  2025-10-03
 * Updated:  2025-10-04
 * Version:  1.5.0
 * Changelog:
 *   - v1.5.0  Header-Tooltips (scoped) und A11y:
 *              • Titel fokussierbar + data-tooltip (DE/EN).
 *              • %/# & HIT: data-tooltip statt title (keine Cursor-Doppel).
 *              • bindHeaderTips(header): Titel&Digits Hover+Focus; Burger/Power Focus-only.
 */

'use strict';

import * as EBUS from '../../12-1_base/bus.js';
import { ensureTooltips, bindHeaderTips } from './tips.js';

/**
 * attachHeaderTools({ widgetEl, headerEl?, model='SIR' }) → { dispose() }
 */
export function attachHeaderTools({ widgetEl, headerEl, model = 'SIR' } = {}){
  if (!widgetEl) throw new Error('[header-tools] widgetEl required');

  const header = headerEl || widgetEl.querySelector(':scope > .uidw-header, :scope > .widget-header');
  if (!header) throw new Error('[header-tools] header not found');

  // Layer bereitstellen (ohne globale Delegation)
  ensureTooltips(document);

  const isDE = String(document.documentElement.lang || 'de').toLowerCase().startsWith('de');
  const TXT = isDE
    ? {
        scaleTitle: 'Skala umschalten: Prozent ↔ Absolut',
        scaleAria:  'Skala: Prozent oder Absolut',
        hitOn:      'Herdimmunität anzeigen',
        hitOff:     'Herdimmunität ausblenden',
        hitNA:      'HIT ist für SIS nicht definiert',
        titleTip:   'Kennzahlen des Moduls'
      }
    : {
        scaleTitle: 'Toggle scale: Percent ↔ Absolute',
        scaleAria:  'Scale: percent or absolute',
        hitOn:      'Show herd immunity threshold',
        hitOff:     'Hide herd immunity threshold',
        hitNA:      'HIT is not defined for SIS',
        titleTip:   'Module key metrics'
      };

  // Titel referenzieren + fokusierbar + Tooltip
  const titleEl =
    header.querySelector(':scope .uidw-title, :scope .widget-title, :scope [data-title], :scope h2, :scope h3');
  if (titleEl) {
    if (!titleEl.hasAttribute('tabindex')) titleEl.setAttribute('tabindex', '0');
    if (!titleEl.getAttribute('data-tooltip')) titleEl.setAttribute('data-tooltip', TXT.titleTip);
    if (titleEl.hasAttribute('title')) titleEl.removeAttribute('title'); // Doppelungen vermeiden
  }

  // Globals-Slot rechts (vor Burger)
  let globals = header.querySelector(':scope > .uidw-right > .uidw-actions-globals');
  if (!globals){
    const right = header.querySelector(':scope > .uidw-right') || header;
    globals = document.createElement('div');
    globals.className = 'uidw-actions uidw-actions-globals';
    const burger = right.querySelector(':scope > .uidw-burger');
    right.insertBefore(globals, burger || right.firstChild);
  }

  // SCALE (%/#)
  const btnScale = document.createElement('button');
  btnScale.type = 'button';
  btnScale.className = 'wa-btn';
  btnScale.setAttribute('data-tooltip', TXT.scaleTitle);
  btnScale.setAttribute('aria-label', TXT.scaleAria);
  btnScale.innerHTML = `<span class="wa-txt">%/#</span>`;

  let scaleMode = 'abs';
  const syncScale = (mode) => btnScale.setAttribute('aria-pressed', String(mode === 'pct'));
  syncScale(scaleMode);

  btnScale.addEventListener('click', () => {
    scaleMode = (scaleMode === 'pct') ? 'abs' : 'pct';
    EBUS.emit('uid:e:viz:scale:set',     { mode: scaleMode, scope: widgetEl });
    EBUS.emit('uid:e:viz:scale:changed', { mode: scaleMode, scope: widgetEl });
    syncScale(scaleMode);
  });

  globals.appendChild(btnScale);

  const offScale = EBUS.on?.('uid:e:viz:scale:changed', ({ mode, scope })=>{
    if (scope && scope !== widgetEl) return;
    if (mode === 'pct' || mode === 'abs'){ scaleMode = mode; syncScale(scaleMode); }
  });

  // HIT
  const btnHIT = document.createElement('button');
  btnHIT.type = 'button';
  btnHIT.className = 'wa-btn';
  btnHIT.innerHTML = `<span class="wa-txt">HIT</span>`;
  if (model === 'SIS') {
    btnHIT.setAttribute('data-tooltip', TXT.hitNA);
    btnHIT.disabled = true;
  } else {
    btnHIT.setAttribute('data-tooltip', TXT.hitOn);
  }

  let hitOn = false;
  const syncHIT = () => btnHIT.setAttribute('aria-pressed', String(!!hitOn));
  syncHIT();

  btnHIT.addEventListener('click', ()=>{
    if (btnHIT.disabled) return;
    hitOn = !hitOn; syncHIT();
    btnHIT.setAttribute('data-tooltip', hitOn ? TXT.hitOff : TXT.hitOn);
    EBUS.emit('uid:e:lines:hit:toggle', { on: hitOn, scope: widgetEl });
    if (hitOn) EBUS.emit('uid:e:kpi:pulse', { kind:'HIT', scope: widgetEl });
  });

  globals.appendChild(btnHIT);

  const offHIT = EBUS.on?.('uid:e:lines:hit:toggle', ({ on, scope })=>{
    if (scope && scope !== widgetEl) return;
    if (typeof on === 'boolean'){
      hitOn = !!on; syncHIT();
      btnHIT.setAttribute('data-tooltip', hitOn ? TXT.hitOff : TXT.hitOn);
    }
  });

  // Header-Tooltips binden (Titel&Digits Hover+Focus; Burger/Power Focus-only)
  let disposeHeaderTips = null;
  try {
    disposeHeaderTips = bindHeaderTips(header, {
      hover: '.uidw-title,.widget-title,[data-title],[role="radiogroup"] [role="radio"],.wa-seg .wa-seg-btn',
      focus: '.uidw-title,.widget-title,[data-title],[role="radiogroup"] [role="radio"],.wa-seg .wa-seg-btn,.uidw-burger,.wa-btn-burger,button[aria-haspopup="menu"],.uidw-power,.wa-btn-power,[data-icon="power"]'
    });
  } catch (err){
    console.warn('[header-tools] bindHeaderTips failed', err);
  }

  return {
    dispose(){
      try{ offScale?.(); offHIT?.(); }catch{}
      try{ btnScale.remove(); btnHIT.remove(); }catch{}
      try{ disposeHeaderTips?.(); }catch{}
    }
  };
}

export default { attachHeaderTools };
