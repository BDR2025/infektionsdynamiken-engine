/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Support Layer · Widget Logic (Hub)
 * File:     /uid/12-4_support/widgets/hub.js
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-03
 * Updated:  2025-10-03
 * Version:  1.4.2
 * Changelog:
 *   - v1.4.2  Repo-Polishing: Kopfzeile/Gliederung, ARIA/Fokus, Close bei resize/orientationchange.
 *              API unverändert: default Hub, { open, close, openMenu, closeMenu }.
 *
 * eAnnotation:
 *   Leichtgewichtiges Overlay-Hub für Widget-Menüs (Burger/Dropdown).
 *   Funktionen: open(anchor, menuEl), close(), openMenu(anchor, model), closeMenu().
 *   A11y: host[role="menu"], menuitems als radio/checkbox; Escape schließt; Fokus-Rückgabe.
 */

'use strict';

// Hub: Dropdown-Overlay (open/close) + optionaler Model-Builder (openMenu)
// Exports: default Hub, { open, close, openMenu, closeMenu }

let openRef = null;

/* ============================================================================
 * 1) open(anchorBtn, menuEl)
 *    Hängt ein Menü an document.body, positioniert unter dem Anker und
 *    verkabelt Escape/Outside-Click/Scroll → close().
 * -------------------------------------------------------------------------- */
function open(anchorBtn, menuEl) {
  close();

  // Host für Overlay
  const host = document.createElement('div');
  host.className = 'uidw-menu-host';
  host.style.position = 'absolute';
  host.style.zIndex   = '9999';
  host.setAttribute('role','menu');
  host.tabIndex = -1;

  // Inline-Minimalstil (kein externes CSS erforderlich)
  const css = document.createElement('style');
  css.textContent = `
    .uidw-menu-host{ pointer-events:auto; }
    .uidw-menu{
      min-inline-size:280px; max-inline-size:520px;
      color:inherit; background:rgba(15,23,42,.92);
      backdrop-filter:blur(6px);
      border:1px solid rgba(148,163,184,.25);
      border-radius:12px; padding:10px 12px;
      box-shadow:0 8px 30px rgba(0,0,0,.45);
    }
    .uidw-menu h4{ margin:0 0 8px 0; font:700 12px/1.1 system-ui; letter-spacing:.2px; opacity:.85; }
    .uidw-menu ul{ list-style:none; margin:0; padding:0; display:grid; gap:6px; }
    .uidw-menu [role="menuitemradio"],
    .uidw-menu [role="menuitemcheckbox"]{
      display:inline-flex; align-items:center; gap:8px;
      padding:6px 8px; border-radius:8px;
      font-size:12px; line-height:1.2;
      background:transparent; border:0; cursor:pointer;
    }
    .uidw-menu [role="menuitemradio"][aria-checked="true"],
    .uidw-menu [role="menuitemcheckbox"][aria-checked="true"]{ background:rgba(255,255,255,.08); }
  `;
  host.appendChild(css);

  // Menü einhängen
  menuEl.classList.add('uidw-menu');
  host.appendChild(menuEl);
  document.body.appendChild(host);

  // Position unter dem Anker
  const r = anchorBtn.getBoundingClientRect();
  const top  = window.scrollY + r.bottom + 8;
  const left = Math.max(
    8,
    Math.min(
      window.scrollX + r.left,
      window.scrollX + window.innerWidth - host.offsetWidth - 8
    )
  );
  host.style.top  = `${top}px`;
  host.style.left = `${left}px`;

  // Events
  const onKey = (e) => {
    if (e.key === 'Escape'){
      close();
      try { anchorBtn.focus(); } catch {}
    }
  };
  const onDocClick = (e) => {
    if (!host.contains(e.target) && e.target !== anchorBtn) close();
  };
  const onScroll = () => close();
  const onResize = () => close();
  const onOrientation = () => close();

  host.addEventListener('keydown', onKey);
  // Deferred, damit der initiale Click nicht sofort schließt
  setTimeout(() => {
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('scroll', onScroll, { passive:true });
    window.addEventListener('resize', onResize, { passive:true });
    window.addEventListener('orientationchange', onOrientation);
  }, 0);

  // Fokus auf Host setzen (Escape funktioniert sofort, Screenreader Einstieg)
  try { host.focus(); } catch {}

  openRef = { host, anchorBtn, onKey, onDocClick, onScroll, onResize, onOrientation };
  try { anchorBtn.setAttribute('aria-expanded','true'); } catch {}
}

/* ============================================================================
 * 2) close()
 * -------------------------------------------------------------------------- */
function close(){
  if (!openRef) return;
  const { host, anchorBtn, onKey, onDocClick, onScroll, onResize, onOrientation } = openRef;
  try { host.removeEventListener('keydown', onKey); }catch{}
  try { document.removeEventListener('mousedown', onDocClick); }catch{}
  try { window.removeEventListener('scroll', onScroll); }catch{}
  try { window.removeEventListener('resize', onResize); }catch{}
  try { window.removeEventListener('orientationchange', onOrientation); }catch{}
  try { host.remove(); }catch{}
  try { anchorBtn.setAttribute('aria-expanded','false'); }catch{}
  openRef = null;
}

/* ============================================================================
 * 3) openMenu(anchorBtn, model, { columns=3 })
 *    Baut Menü-DOM aus Model (sections/items) und zeigt es via open().
 * -------------------------------------------------------------------------- */
function openMenu(anchorBtn, model = {}, { columns = 3 } = {}) {
  const sections = model.sections || [];
  if (!sections.length) return;

  const menu = document.createElement('div');
  const grid = document.createElement('div');
  grid.style.display='grid';
  grid.style.gap='18px';
  grid.style.gridTemplateColumns = `repeat(${model.columns || columns}, minmax(0,1fr))`;

  for (const sec of sections){
    const col = document.createElement('div');
    const h  = document.createElement('h4'); h.textContent = sec.title || '';
    const ul = document.createElement('ul');

    for (const it of (sec.items || [])){
      const li  = document.createElement('li');
      const btn = document.createElement('button');

      const type = it.type || (it.group ? 'radio' : 'checkbox');
      const role = type === 'radio' ? 'menuitemradio' : 'menuitemcheckbox';
      btn.setAttribute('role', role);

      if (it.selected != null) btn.setAttribute('aria-checked', it.selected ? 'true' : 'false');
      btn.textContent = it.label ?? '';

      btn.addEventListener('click', (e)=>{
        e.preventDefault();
        try { it.onSelect?.(it); } catch {}

        if (role === 'menuitemradio'){
          ul.querySelectorAll('[role="menuitemradio"]').forEach(n => n.setAttribute('aria-checked','false'));
          btn.setAttribute('aria-checked','true');
        } else {
          const v = btn.getAttribute('aria-checked') === 'true';
          btn.setAttribute('aria-checked', v ? 'false' : 'true');
        }
      });

      li.appendChild(btn);
      ul.appendChild(li);
    }

    col.append(h, ul);
    grid.appendChild(col);
  }

  menu.appendChild(grid);
  open(anchorBtn, menu);
}

/* ============================================================================
 * 4) Exports
 * -------------------------------------------------------------------------- */
const closeMenu = close;
const Hub = { open, close, openMenu, closeMenu };

export default Hub;
export { open, close, openMenu, closeMenu };
