/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Widget Logic
 * File:     /uid/12-4_support/widgets/actions.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-03
 * Updated:  2025-10-03
 * Version:  1.4.2
 * Changelog:
 *   - v1.4.2  Repository-Polishing: Kopfzeile + Gliederung + A11y-Rollen ergänzt; keine Funktionsänderungen.
 *
 * eAnnotation:
 *   Mountet die Widget-Aktionsleisten (dynamisch & global) am Header eines Widgets.
 *   Optionaler Burger öffnet ein kategoriales Menü mit Toggle/Radio-Items (Sections).
 *   Exponiert buildBurgerSections() am Host für globale Header-Tools.
 */

/* ============================================================================
 * 1) Imports
 * ------------------------------------------------------------------------- */
import { validateSpec }      from './contracts.js';
import { open, close }       from './hub.js';
import { renderButton }      from './render/button.js';
import { renderToggle }      from './render/toggle.js';
import { renderSegmented }   from './render/segmented.js';
import { renderMultiToggle } from './render/multitoggle.js';
import { renderDropdown }    from './render/dropdown.js';

/* ============================================================================
 * 2) Public API
 *    mountWidgetActions(host, spec, { debug=false })
 * ---------------------------------------------------------------------------
 * @param {HTMLElement} host  - Widget-Host (enthält .uidw-header)
 * @param {Object}      spec  - Aktions-Spezifikation: { dyn:[], globals:[], burgerSections?, burgerCols? }
 * @param {Object}      opts  - { debug:boolean }
 * @returns {Object}         - { update(nextSpec), dispose() }
 * DOM-Kontrakt:
 *   host > .uidw-header/.uidw-head
 *     ├─ .uidw-actions-dyn
 *     └─ .uidw-actions-globals
 * A11y:
 *   - Burger-Menü als role="menu", Items als menuitem/menuitemradio/menuitemcheckbox.
 * CSS-Hooks:
 *   - .wa-menu, .wa-section, .wa-section-title, .wa-list, .wa-item, .wa-check, .selected
 * ------------------------------------------------------------------------- */
export function mountWidgetActions(host, spec, { debug=false } = {}){
  /* -------------------------------------------------------------------------
   * 2.1) Header & Slots auffinden
   * ----------------------------------------------------------------------- */
  const header = host.querySelector(':scope > .uidw-header, :scope > .uidw-head');
  if (!header){
    if (debug) console.warn('[widgets] no header on host', host);
    return { update(){}, dispose(){} };
  }
  const dyn     = header.querySelector('.uidw-actions-dyn');
  const globals = header.querySelector('.uidw-actions-globals');

  /* -------------------------------------------------------------------------
   * 2.2) Utilities
   * ----------------------------------------------------------------------- */
  /** Entfernt alle Kindknoten eines Elements. */
  function clear(el){ while (el && el.firstChild) el.removeChild(el.firstChild); }

  /**
   * Baut eine Seite (dyn/globals) aus einer Aktionsliste.
   * @param {HTMLElement} slotEl
   * @param {Array}       actions
   * @returns {Function}  disposer()
   */
  function buildSide(slotEl, actions = []){
    const disposers = [];
    for (const a of actions){
      if (a.type === 'button')           disposers.push(renderButton(slotEl, a));
      else if (a.type === 'toggle')      disposers.push(renderToggle(slotEl, a));
      else if (a.type === 'segmented')   disposers.push(renderSegmented(slotEl, a));
      else if (a.type === 'multitoggle') disposers.push(renderMultiToggle(slotEl, a));
      else if (a.type === 'dropdown')    disposers.push(renderDropdown(slotEl, a));
      else if (debug) console.warn('[widgets] unknown action type:', a?.type, a);
    }
    return () => { disposers.forEach(fn => { try{ fn(); }catch{} }); };
  }

  /* -------------------------------------------------------------------------
   * 2.3) Render-Loop (Spec → DOM)
   * ----------------------------------------------------------------------- */
  let disposeDyn = () => {}, disposeGlob = () => {};
  function render(){
    if (!validateSpec(spec, { debug })) return;
    disposeDyn(); disposeGlob();
    clear(dyn); clear(globals);
    disposeDyn  = buildSide(dyn,     spec?.dyn     || []);
    disposeGlob = buildSide(globals, spec?.globals || []);
  }

  /* -------------------------------------------------------------------------
   * 2.4) Burger-Sections (explizit oder heuristisch)
   * ----------------------------------------------------------------------- */
  function buildBurgerSections(){
    // (1) Explizit aus Spec
    if (Array.isArray(spec?.burgerSections) && spec.burgerSections.length){
      return { sections: spec.burgerSections, columns: spec.burgerColumns || spec.burgerCols || 3 };
    }

    // (2) Heuristik aus globals (optional)
    const sections = [];
    const globalsActs = spec?.globals || [];
    const mkSection = (title) => { const s = { title, items: [] }; sections.push(s); return s; };

    for (const a of globalsActs){
      if (a.type === 'toggle'){
        const s = mkSection(a.label || 'Optionen');
        s.items.push({
          label: a.label || 'Toggle',
          type:  'checkbox',
          selected: !!a.get?.(),
          onSelect: () => a.set?.(!a.get?.())
        });
      } else if (a.type === 'dropdown'){
        const s = mkSection(a.label || 'Optionen');
        (a.items || []).forEach(it => {
          s.items.push({
            label: it.label ?? String(it.value),
            type:  'radio',
            group: a.id || a.label || 'group',
            value: String(it.value ?? it.label ?? ''),
            selected: !!(it.selected ?? it.checked ?? (typeof it.isSelected === 'function' ? it.isSelected(it) : false)),
            onSelect: () => it.onSelect?.(it.value ?? it)
          });
        });
      }
    }
    return { sections, columns: Math.min(3, Math.max(1, sections.length || 1)) };
  }

  /* -------------------------------------------------------------------------
   * 2.5) Burger-Panel (leichtgewichtiges, kategoriales Menü)
   * ----------------------------------------------------------------------- */
  function openBurgerPanel(anchorBtn){
    const { sections, columns } = buildBurgerSections();
    if (!sections || !sections.length) return;

    const menu = document.createElement('div');
    menu.className = 'wa-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Widget options');
    menu.style.display = 'grid';
    menu.style.gridAutoFlow = 'column';
    menu.style.gridTemplateColumns = `repeat(${columns}, max-content)`;
    menu.style.columnGap = '16px';
    menu.style.rowGap = '6px';
    menu.style.alignItems = 'start';
    menu.style.alignContent = 'start';

    for (const sec of sections){
      const secEl = document.createElement('div');
      secEl.className = 'wa-section';

      const t = document.createElement('div');
      t.className = 'wa-section-title';
      t.textContent = sec.title || '';

      const list = document.createElement('div');
      list.className = 'wa-list';

      secEl.appendChild(t);
      secEl.appendChild(list);

      for (const it of (sec.items || [])){
        const b = document.createElement('button');
        b.className = 'wa-item';
        b.type = 'button';

        const role = (it.type === 'checkbox')
          ? 'menuitemcheckbox'
          : (it.type === 'radio' ? 'menuitemradio' : 'menuitem');

        b.setAttribute('role', role);

        if (role === 'menuitemradio'){
          b.dataset.group = it.group || 'group';
          b.dataset.value = String(it.value ?? it.label ?? '');
          b.setAttribute('aria-checked', String(!!it.selected));
        }
        if (role === 'menuitemcheckbox'){
          b.setAttribute('aria-checked', String(!!it.selected));
        }

        b.textContent = it.label || '';

        if (it.selected){
          b.classList.add('selected');
          const chk = document.createElement('span');
          chk.className = 'wa-check';
          chk.textContent = '✓';
          b.appendChild(chk);
        }

        b.addEventListener('click', () => {
          if (role === 'menuitemradio'){
            const g = b.dataset.group;
            menu.querySelectorAll(`.wa-item[role="menuitemradio"][data-group="${g}"]`).forEach(n => {
              n.setAttribute('aria-checked','false');
              n.classList.remove('selected');
              n.querySelector('.wa-check')?.remove();
            });
            b.setAttribute('aria-checked','true');
            b.classList.add('selected');
            const chk = document.createElement('span');
            chk.className = 'wa-check';
            chk.textContent = '✓';
            b.appendChild(chk);
          } else if (role === 'menuitemcheckbox'){
            const on = b.getAttribute('aria-checked') !== 'true';
            b.setAttribute('aria-checked', String(on));
            if (on){
              b.classList.add('selected');
              if (!b.querySelector('.wa-check')){
                const c = document.createElement('span');
                c.className = 'wa-check';
                c.textContent = '✓';
                b.appendChild(c);
              }
            } else {
              b.classList.remove('selected');
              b.querySelector('.wa-check')?.remove();
            }
          }

          try { it.onSelect?.(it); } catch{}
          // Panel bleibt offen (paralleles Schalten über Kategorien).
        });

        list.appendChild(b);
      }

      menu.appendChild(secEl);
    }

    try { open(anchorBtn, menu); }
    catch(e){ if (debug) console.warn('[widgets] burger open failed', e); }
  }

  /* -------------------------------------------------------------------------
   * 2.6) Burger-Knopf anklemmen & Host-API exponieren
   * ----------------------------------------------------------------------- */
  const burgerBtn = header.querySelector(':scope > .uidw-right > .uidw-burger');
  if (burgerBtn){
    burgerBtn.addEventListener('click', ()=>{
      try { openBurgerPanel(burgerBtn); }
      catch(e){ if (debug) console.warn('[widgets] burger failed', e); }
    });
  }

  host.__uidWA = host.__uidWA || {};
  host.__uidWA.buildBurgerSections = () => buildBurgerSections();

  /* -------------------------------------------------------------------------
   * 2.7) Initial-Render & Lifecycle
   * ----------------------------------------------------------------------- */
  render();

  return {
    /** Aktualisiert die Spec und rendert neu. */
    update(nextSpec){ spec = nextSpec; render(); },

    /** Räumt auf und schließt offene Overlays. */
    dispose(){
      try { close(); } catch{}
      disposeDyn(); disposeGlob();
      if (host.__uidWA) delete host.__uidWA.buildBurgerSections;
    }
  };
}
