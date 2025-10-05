/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Widget Logic (Render · Dropdown)
 * File:     /uid/12-4_support/widgets/render/dropdown.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-03
 * Updated:  2025-10-03
 * Version:  1.4.2
 * Changelog:
 *   - v1.4.2  Repo-Polishing + Hub-API vereinheitlicht (Hub.open(anchor, menu)).
 *              ARIA bleibt: btn[aria-haspopup="menu"][aria-expanded].
 *
 * eAnnotation:
 *   Renderer für Dropdown/Burger:
 *   - Simple List: act.items = [{label, icon?, onSelect, isSelected?()}]
 *   - Sections Grid: act.sections = [...], act.columns = 1..3 (auto max-content)
 *   - API: dispose.open(), dispose.close(), dispose.sync(map), dispose.el/btn/menu
 */

'use strict';

import Hub from '../hub.js';
import { mkBtn } from './button.js';

/* ============================================================================
 * 1) Public: renderDropdown(slot, act)
 * -------------------------------------------------------------------------- */
export function renderDropdown(slot, act = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'wa-dd';

  // Burger "≡" statt „…“; wirkt visuell mittiger
  const btn  = mkBtn(act.label, (act.icon ?? '≡'), act.title || 'Optionen');
  btn.setAttribute('aria-haspopup','menu');
  btn.setAttribute('aria-expanded','false');
  btn.classList.add('wa-iconbtn');

  const menu = document.createElement('div');
  menu.className = 'wa-menu';
  menu.setAttribute('role','menu');
  // kompaktere Grundabstände (global, ohne extra CSS-Datei)
  menu.style.boxSizing   = 'border-box';
  menu.style.padding     = '12px';
  menu.style.borderRadius= '12px';

  // --- Item-Bau -------------------------------------------------------------
  const addItem = (parent, item) => {
    const b = document.createElement('button');
    b.className = 'wa-item';
    b.type = 'button';

    const role = item.role || item.type || 'command';
    if (role === 'radio'){
      b.setAttribute('role','menuitemradio');
      b.dataset.group = item.group ?? 'group';
      b.dataset.value = String(item.value ?? item.label ?? '');
      b.setAttribute('aria-checked','false');
    } else if (role === 'checkbox'){
      b.setAttribute('role','menuitemcheckbox');
      b.setAttribute('aria-checked','false');
    } else {
      b.setAttribute('role','menuitem');
    }

    // kompakter padding → mehr Inhalt sichtbar
    b.style.padding = '4px 10px';

    if (item.icon) {
      const i = document.createElement('span'); i.className='wa-ico'; i.textContent = item.icon;
      b.appendChild(i);
    }
    const s = document.createElement('span'); s.textContent = item.label || '';
    b.appendChild(s);

    const initiallySelected = !!(item.selected ?? (typeof item.isSelected === 'function' ? item.isSelected(item) : false));
    if (role === 'radio' && initiallySelected){
      b.dataset._preselect = '1'; // nach DOM-Insert finalisieren
    } else if (role === 'checkbox' && initiallySelected){
      b.setAttribute('aria-checked','true');
      b.classList.add('selected');
      const chk = document.createElement('span'); chk.className='wa-check'; chk.textContent='✓'; b.appendChild(chk);
    } else if (role === 'command' && initiallySelected){
      b.classList.add('selected');
      const chk = document.createElement('span'); chk.className='wa-check'; chk.textContent='✓'; b.appendChild(chk);
    }

    if (item.disabled){ b.setAttribute('aria-disabled','true'); b.disabled = true; }

    b.addEventListener('click', () => {
      if (b.disabled) return;

      if (role === 'radio'){
        const g = b.dataset.group;
        menu.querySelectorAll(`.wa-item[role="menuitemradio"][data-group="${g}"]`).forEach(n => {
          n.setAttribute('aria-checked','false'); n.classList.remove('selected'); n.querySelector('.wa-check')?.remove();
        });
        b.setAttribute('aria-checked','true'); b.classList.add('selected');
        const chk = document.createElement('span'); chk.className='wa-check'; chk.textContent='✓'; b.appendChild(chk);
      } else if (role === 'checkbox'){
        const on = b.getAttribute('aria-checked') !== 'true';
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        if (on){ b.classList.add('selected'); if (!b.querySelector('.wa-check')){ const c=document.createElement('span'); c.className='wa-check'; c.textContent='✓'; b.appendChild(c);} }
        else { b.classList.remove('selected'); b.querySelector('.wa-check')?.remove(); }
      }

      try{ item.onSelect?.(item); } catch {}
      if ((act.autoClose ?? true) && role !== 'checkbox'){
        try { Hub.close(); } catch {}
        btn.setAttribute('aria-expanded','false');
      }
    });

    parent.appendChild(b);
  };

  // --- Sections / Grid-Layout (inhaltsbasiert) ------------------------------
  if (Array.isArray(act.sections) && act.sections.length) {
    const cols = Math.max(1, Math.min(3, act.columns || act.sections.length));
    menu.dataset.cols = String(cols);

    // Grid: schmale Columns je nach Inhalt (max-content), top aligned
    menu.style.display         = 'grid';
    menu.style.gridAutoFlow    = 'column';
    menu.style.gridTemplateColumns = `repeat(${cols}, max-content)`;
    menu.style.columnGap       = '16px';
    menu.style.rowGap          = '6px';
    menu.style.alignItems      = 'start';
    menu.style.alignContent    = 'start';

    act.sections.forEach(sec => {
      const secEl = document.createElement('div'); secEl.className='wa-section';
      // jede Section packt sich selbst → keine Füllbreite
      secEl.style.display   = 'flex';
      secEl.style.flexDirection = 'column';
      secEl.style.gap       = '6px';
      secEl.style.minWidth  = 'max-content';

      if (sec.title) {
        const t = document.createElement('div'); t.className = 'wa-section-title'; t.textContent = sec.title;
        t.style.fontWeight = '700'; t.style.opacity = '.9'; t.style.margin = '2px 0 8px';
        secEl.appendChild(t);
      }
      const list = document.createElement('div'); list.className='wa-list';
      list.style.display = 'flex'; list.style.flexDirection = 'column'; list.style.gap = '4px';
      (sec.items || []).forEach(item => addItem(list, item));
      secEl.appendChild(list);
      menu.appendChild(secEl);
    });
  } else {
    // einfache Liste
    (act.items || []).forEach(item => addItem(menu, item));
  }

  // Preselected Radios nach DOM-Insert korrekt mit ✓ versehen
  function lateSyncPreselectedRadios(){
    menu.querySelectorAll('.wa-item[role="menuitemradio"][data-_preselect="1"]').forEach(n => {
      const g = n.dataset.group;
      menu.querySelectorAll(`.wa-item[role="menuitemradio"][data-group="${g}"]`).forEach(x => {
        x.setAttribute('aria-checked','false'); x.classList.remove('selected'); x.querySelector('.wa-check')?.remove();
      });
      n.removeAttribute('data-_preselect');
      n.setAttribute('aria-checked','true'); n.classList.add('selected');
      const chk = document.createElement('span'); chk.className='wa-check'; chk.textContent='✓'; n.appendChild(chk);
    });
  }

  // Öffnen/Schließen über Hub
  function openMenu(){
    Hub.open(btn, menu); // ← vereinheitlichte Hub-API (anchor, menu)
    btn.setAttribute('aria-expanded','true');
    requestAnimationFrame(() => lateSyncPreselectedRadios());
  }
  function closeMenu(){
    try { Hub.close(); } catch {}
    btn.setAttribute('aria-expanded','false');
  }

  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    if (expanded) closeMenu(); else openMenu();
  });

  wrap.append(btn, menu);
  slot.appendChild(wrap);

  /* ------------------------------------------------------------------------
   * 2) Dispose & externe Sync-API
   * ---------------------------------------------------------------------- */
  const dispose = () => {
    try{ closeMenu(); }catch{}
    try{ wrap.remove(); }catch{}
  };

  // Externe Sync-API beibehalten
  dispose.open  = openMenu;
  dispose.close = closeMenu;
  dispose.sync  = (map={}) => {
    for (const [g, v] of Object.entries(map)) {
      const target = menu.querySelector(`.wa-item[role="menuitemradio"][data-group="${g}"][data-value="${String(v)}"]`);
      if (!target) continue;
      menu.querySelectorAll(`.wa-item[role="menuitemradio"][data-group="${g}"]`).forEach(n => {
        n.setAttribute('aria-checked','false'); n.classList.remove('selected'); n.querySelector('.wa-check')?.remove();
      });
      target.setAttribute('aria-checked','true'); target.classList.add('selected');
      const chk = document.createElement('span'); chk.className='wa-check'; chk.textContent='✓'; target.appendChild(chk);
    }
  };
  dispose.el   = wrap;
  dispose.btn  = btn;
  dispose.menu = menu;

  return dispose;
}

export default { renderDropdown };
