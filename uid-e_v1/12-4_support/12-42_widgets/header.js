/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Widget Logic (Header)
 * File:     /uid/12-4_support/widgets/header.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-03
 * Updated:  2025-10-03
 * Version:  1.4.2
 * Changelog:
 *   - v1.4.2  Repo-Polishing: Kopfzeile, Gliederung, I18N-Texte (Burger/Power), A11y-Notizen.
 *              One-Header-Policy beibehalten. Keine Funktionsänderung.
 *
 * eAnnotation:
 *   Erzeugt/sichert den Widget-Header (Titel, dyn-/global-Actions, Burger, Power) und
 *   synchronisiert ARIA für Segmented-Gruppen. Stellt Collapse-Handling & Dispose bereit.
 */

'use strict';

/* ============================================================================
 * 1) Imports
 * -------------------------------------------------------------------------- */
import { watchHeaderCollapse } from './measure.js';
import { open as openOverlay, openMenu as openByModel, close as closeOverlay } from './hub.js';
import { applyOffState } from './off-policy.js';

/* ============================================================================
 * 2) Public API
 * ---------------------------------------------------------------------------
 * attachWidgetHeader(host, {
 *   title='Widget', subtitle='', storageKey, defaultEnabled=true, dynAlign='right'
 * }) → { header, slots:{dyn,globals}, dispose() }
 *
 * DOM-Kontrakt:
 *   host > .uidw-header
 *     ├─ .uidw-left  → .uidw-title, (optional) .uidw-actions-dyn
 *     └─ .uidw-right → .uidw-actions-globals, .uidw-burger, .uidw-power
 *
 * A11y:
 *   - Header: role="group"
 *   - Burger: aria-haspopup="menu", aria-expanded
 *   - Segmented: radiogroup/role=radio via applyARIA()
 * ------------------------------------------------------------------------- */
export function attachWidgetHeader(host, opts = {}) {
  if (!host) throw new Error('[widgets/header] host missing');

  const {
    title = 'Widget',
    subtitle = '',
    storageKey,
    defaultEnabled = true,
    dynAlign = 'right'
  } = opts;

  // I18N (DE/EN)
  const isDE = String(document.documentElement.lang || 'de').toLowerCase().startsWith('de');
  const TXT = isDE
    ? { options:'Optionen', power:'Ein/Aus', powerAria:'Widget ein- oder ausschalten' }
    : { options:'Options',  power:'On/Off', powerAria:'Toggle widget on or off' };

  /* -----------------------------------------------------------------------
   * 2.1) Header finden/erzeugen (One-Header-Policy)
   * --------------------------------------------------------------------- */
  let header = host.querySelector(':scope > .uidw-header');
  if (!header) {
    header = document.createElement('div');
    header.className = 'uidw-header';
    header.setAttribute('role','group');

    const left  = document.createElement('div');  left.className  = 'uidw-left';
    const right = document.createElement('div');  right.className = 'uidw-right';

    const titleBox = document.createElement('div');
    titleBox.className = 'uidw-title'; titleBox.tabIndex = 0;
    titleBox.innerHTML = `<span class="uidw-title-text"></span><small></small>`;
    left.appendChild(titleBox);

    const dyn = document.createElement('div'); dyn.className = 'uidw-actions uidw-actions-dyn';
    const glb = document.createElement('div'); glb.className = 'uidw-actions uidw-actions-globals';
    left.appendChild(dyn); right.appendChild(glb);

    const burger = document.createElement('button');
    burger.className = 'uidw-burger'; burger.type='button';
    burger.setAttribute('aria-haspopup','menu'); burger.setAttribute('aria-expanded','false');
    burger.title = TXT.options;
    burger.innerHTML = `<span class="ico" aria-hidden="true">≡</span>`;
    right.appendChild(burger);

    const power = document.createElement('button');
    power.className = 'uidw-power'; power.type='button';
    power.title = TXT.power; power.setAttribute('aria-label', TXT.powerAria);
    power.innerHTML = `<span class="ico" aria-hidden="true">⏻</span>`;
    right.appendChild(power);

    header.append(left, right);

    // dyn-Aktionen optional rechts ausrichten
    if (dynAlign === 'right') {
      right.insertBefore(dyn, glb);
      left.innerHTML = '';
      left.appendChild(titleBox);
    }

    host.prepend(header);

    // Kompakter Header-Style (nur einmal pro Header)
    const style = document.createElement('style');
    style.textContent = `
      .uidw-header{display:grid;grid-template-columns:1fr auto;align-items:center;gap:8px;padding:6px 8px;position:relative;z-index:20}
      .uidw-left,.uidw-right{display:inline-flex;align-items:center;gap:8px}
      .uidw-title{display:inline-flex;align-items:baseline;gap:6px}
      .uidw-title .uidw-title-text{font-size:12px;font-weight:600;line-height:1.2}
      .uidw-title small{font-size:11px;opacity:.75}
      .uidw-title:focus{outline:2px solid rgba(255,255,255,.35);outline-offset:2px;border-radius:6px}
      .uidw-actions{display:inline-flex;align-items:center;gap:6px}
      .uidw-header .wa-seg button, .uidw-burger, .uidw-power{
        width:28px;height:28px;border-radius:9999px;display:grid;place-items:center;
        background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06);color:inherit;border:0
      }
      .uidw-header .wa-seg button[aria-checked="true"]{
        background:rgba(255,255,255,.14);
        box-shadow:0 0 10px rgba(255,255,255,.20), inset 0 0 0 1px rgba(255,255,255,.10)
      }
      .uidw-burger .ico{font-size:14px;line-height:1;transform:translateY(-.5px);background:none!important}
      .uidw-power  .ico{font-size:15px;line-height:1;transform:translateY(-.5px);background:none!important}
      .uidw-header[data-enabled="true"]  .uidw-power .ico{color:#fff;text-shadow:0 0 8px rgba(255,255,255,.45)}
      .uidw-header[data-enabled="false"] .uidw-power .ico{color:rgba(255,255,255,.55);text-shadow:none}
      .uidw-power{position:relative;z-index:1001}
      .uidw-header[data-enabled="false"] .uidw-actions-dyn,
      .uidw-header[data-enabled="false"] .uidw-actions-globals,
      .uidw-header[data-enabled="false"] .uidw-burger{display:none!important}
    `;
    header.appendChild(style);

    // Burger → Modell/Sections
    const onBurgerClick = (e)=>{
      e.preventDefault(); e.stopPropagation();
      const api = host.__uidWA||{};
      const btn = header.querySelector('.uidw-burger');
      if (!btn) return;

      // Versuch 1: Modell-API (columns/sections)
      if (typeof api.getBurgerModel === 'function'){
        const model = api.getBurgerModel() || {};
        if (model.sections?.length){
          btn.setAttribute('aria-expanded','true');
          openByModel(btn, model);
          return;
        }
      }
      // Versuch 2: alte Sections-API
      if (typeof api.buildBurgerSections === 'function'){
        const sections = api.buildBurgerSections() || [];
        if (!sections.length) return;
        const menu = document.createElement('div');
        const grid = document.createElement('div');
        grid.style.cssText='display:grid;gap:18px;grid-template-columns:repeat(3,minmax(0,1fr))';
        for (const sec of sections){
          const col=document.createElement('div');
          const h=document.createElement('h4'); h.textContent=sec.title||'';
          const ul=document.createElement('ul'); ul.style.cssText='list-style:none;margin:0;padding:0;display:grid;gap:6px';
          for (const it of (sec.items||[])){
            const li=document.createElement('li'); const btn2=document.createElement('button');
            const type=it.type||(it.group?'radio':'checkbox');
            const role=type==='radio'?'menuitemradio':'menuitemcheckbox';
            btn2.setAttribute('role',role);
            if (it.selected!=null) btn2.setAttribute('aria-checked',it.selected?'true':'false');
            btn2.textContent=it.label??'';
            btn2.addEventListener('click',(ev)=>{
              ev.preventDefault(); try{ it.onSelect?.(); }catch{}
              if (role==='menuitemradio'){
                ul.querySelectorAll('[role="menuitemradio"]').forEach(n=>n.setAttribute('aria-checked','false'));
                btn2.setAttribute('aria-checked','true');
              } else {
                const v=btn2.getAttribute('aria-checked')==='true';
                btn2.setAttribute('aria-checked', v?'false':'true');
              }
            });
            li.appendChild(btn2); ul.appendChild(li);
          }
          col.append(h,ul); grid.appendChild(col);
        }
        menu.appendChild(grid);
        btn.setAttribute('aria-expanded','true');
        openOverlay(btn, menu);
      }
    };
    header.querySelector('.uidw-burger').addEventListener('click', onBurgerClick);

    // Power
    const onPowerClick = ()=>{
      const goingOff = header.getAttribute('data-enabled')!=='false';
      applyOffState(header, goingOff);
      const nowOn = !goingOff;
      host.dataset.widgetEnabled = nowOn ? 'true' : 'false';
      if (storageKey){ try{ localStorage.setItem(storageKey, String(nowOn)); }catch{} }
      closeOverlay();
      if (nowOn){ try{ host.dispatchEvent(new CustomEvent('uid:widget:power:on',{bubbles:true})); }catch{} }
    };
    header.querySelector('.uidw-power').addEventListener('click', onPowerClick);
  }

  /* -----------------------------------------------------------------------
   * 2.2) Titel/Subtitle & Enabled-State
   * --------------------------------------------------------------------- */
  header.querySelector('.uidw-title-text')?.replaceChildren(document.createTextNode(title));
  const small = header.querySelector('.uidw-title small');
  if (small) small.textContent = subtitle || '';
  if (subtitle) header.querySelector('.uidw-title')?.setAttribute('title', subtitle);

  const persisted = storageKey
    ? (()=>{ try{const v=localStorage.getItem(storageKey); return v==null?null:(v!=='false'); }catch{return null} })()
    : null;
  const enabled = (persisted==null) ? !!defaultEnabled : !!persisted;
  header.setAttribute('data-enabled', enabled ? 'true' : 'false');
  host.dataset.widgetEnabled = enabled ? 'true' : 'false';

  /* -----------------------------------------------------------------------
   * 2.3) Collapse-Handling
   * --------------------------------------------------------------------- */
  const disposeCollapse = watchHeaderCollapse(header);

  /* -----------------------------------------------------------------------
   * 2.4) ARIA für Segmented (robust)
   * --------------------------------------------------------------------- */
  const isActiveBtn = (b) =>
    b.classList.contains('is-active') ||
    b.getAttribute('aria-pressed') === 'true' ||
    b.dataset.selected === 'true' ||
    b.getAttribute('data-selected') === 'true';

  const syncGroup = (group) => {
    if (!group) return;
    const btns = [...group.querySelectorAll('button')];
    const activeIdx = btns.findIndex(isActiveBtn);
    group.setAttribute('role','radiogroup');
    btns.forEach((b,i)=>{
      b.setAttribute('role','radio');
      b.setAttribute('aria-checked', i === activeIdx ? 'true' : 'false');
    });
  };

  const applyARIA = () => {
    header.querySelectorAll('.wa-seg, .segmented').forEach(syncGroup);
  };

  // Click-Delegation nur einmal anhängen
  if (!header.__ariaSyncAttached) {
    header.addEventListener('click',(e)=>{
      const b = e.target.closest('.wa-seg button, .segmented button');
      if (!b || !header.contains(b)) return;
      const g = b.closest('.wa-seg, .segmented');
      requestAnimationFrame(()=> syncGroup(g)); // nach Re-Render synchronisieren
    }, { capture:true, passive:true });
    header.__ariaSyncAttached = true;
  }

  // MutationObserver nur einmal anhängen
  if (!header.__ariaMO) {
    const dynSlot = header.querySelector('.uidw-actions-dyn');
    if (dynSlot){
      const mo = new MutationObserver(() => applyARIA());
      mo.observe(dynSlot, {
        childList:true,
        subtree:true,
        attributes:true,
        attributeFilter:['class','aria-pressed','data-selected']
      });
      header.__ariaMO = mo;
    }
  }

  // initial synchronisieren
  applyARIA();

  /* -----------------------------------------------------------------------
   * 2.5) Dispose
   * --------------------------------------------------------------------- */
  return {
    header,
    slots: {
      dyn:     header.querySelector('.uidw-actions-dyn'),
      globals: header.querySelector('.uidw-actions-globals'),
    },
    dispose: () => { try{ disposeCollapse(); }catch{} closeOverlay(); }
  };
}

export default { attachWidgetHeader };
