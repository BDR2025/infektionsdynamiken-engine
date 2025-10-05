/*!
 * Project:  Understanding Infection Dynamics · Infektionsdynamiken verstehen
 *           UID-Explore · Presentation Layer · Widget Actions (WA)
 * File:     /uid/12-3_presentation/<tool>/<tool>.widget-actions.js   ·   Template v1.2.1
 * Type:     Open Educational Resource (OER) · ESM
 * Authors:  B. D. Rausch · A. Heinz
 * Contact:  info@infectiondynamics.eu · info@infektionsdynamiken.de
 * License:  CC BY 4.0
 *
 * Created:  2025-10-03
 * Updated:  2025-10-03
 * Version:  1.2.1
 * Changelog:
 *   - v1.2.1  Repo-Kopfzeile & Pfad aktualisiert; Gliederung/Annotation geschärft; A11y-Rollen präzisiert.
 *   - v1.2.0  [STATE] lokaler Segmented-State + Event-Sync (robust gg. stale Getter, ARIA fix).
 *             [BUS]   Primärfeld + optional value:'1'.. ; auto-tag source:'wa'.
 *             [REH]   Rehydrate-Contract: Power/rehydrate → State anwenden + erneut broadcasten.
 *             [HDR]   Actions erzeugen NIE Header (One-Header-Policy).
 *             [I18N]  Labels via isDE-Muster.
 *             [CLEANUP] vollständige Listener-Offs & dispose().
 *   - v1.1.x  WA-Basis, Seeds/Replay-Muster, Burger-Scaffold.
 *
 * eAnnotation (Zweck, kurz):
 *   Kanonische WA-Vorlage für dezentrale Tools. Links: Segmented (dyn). Rechts: Burger.
 *   Bus-Contract & Rehydrate sind v4.4-konform. One-Header-Policy bleibt gewahrt.
 *
 * CONTRACT (Beispiel; bitte pro Tool anpassen):
 *   Topics (emit):
 *     - ${NS}:${SEG_KIND}  →  { [SEG_KIND]: <name>, value?: '1'|'2'|'3'|'4' }   // primär + optionaler Index
 *     - ${NS}:view:format  →  { mode: 'percent'|'absolute'|'hybrid' }          // (falls genutzt)
 *     - ${NS}:view:reduced →  { on: boolean }
 *   Rehydrate:
 *     - Auf 'uid:widget:power:on' und 'uid:widget:rehydrate' → aktuellen State broadcasten.
 *   Seeds (optional):
 *     - uid:e:params:change { bulk:{R0,gamma,N,I0,T,dt}, source:'seed' } u.a. (Explore-Defaults)
 */

'use strict';

import * as EBUS from '../../12-1_base/bus.js';
import { mountWidgetActions, presets } from '/uid-e_v1/12-4_support/12-42_widgets/index.js';

/* =========================================================================
 *  1) CONFIG — pro Tool anpassen
 * ========================================================================= */
const NS        = 'uid:e:tool';  // z. B. 'uid:e:gridwave' | 'uid:e:sv' | 'uid:e:leq'
const SEG_KIND  = 'mode';        // z. B. 'mode'|'view'|'lesson' — primäres Feld im Payload
const LEGACY_BRIDGE = false;     // optional: parallel im Alt-Namespace senden
const NS_OLD    = 'uid:tool';    // nur relevant, wenn LEGACY_BRIDGE=true

const FEATURES = {
  digitsAdditive:   false,       // Additive Ziffern (1..8)
  digitsSegmented:  true,        // Exklusiver Segmented-Switch (1..4) — dyn (links)
  burgerSections:   'single',    // 'none'|'single'|'multi' — siehe getBurgerModel()
  addIndexValue:    true,        // zusätzlich value:'1'.. mitsenden (UI/Tests/Replay)
  emitEnabled:      false,       // `${NS}:enabled {enabled:true}` beim Rehydrate
  mirrorInit:       true,        // initiale API-Werte spiegeln (queueMicrotask)
  seeds:            true         // Explore-Seeds (params:change, data:series, sim:*)
};

// Mapping Segmented (Beispiel) — pro Tool anpassen
const SEG_MAP    = { '1': 'mode1', '2': 'mode2', '3': 'mode3', '4': 'mode4' };
const SEG_TITLES = { '1': 'Modus 1', '2': 'Modus 2', '3': 'Modus 3', '4': 'Modus 4' };

// Additive Groups (optional)
const ADD_DIGITS = ['1','2','3','4','5','6','7','8'];
const ADD_MAP    = { '1':{id:'g1'}, '2':{id:'g2'}, '3':{id:'g3'}, '4':{id:'g4'}, '5':{id:'g5'}, '6':{id:'g6'}, '7':{id:'g7'}, '8':{id:'g8'} };

// Persistenz-Schlüsselbasis (pro Widget-Instanz)
const PERSIST = (root) => `uid:${root?.id || 'widget'}:${NS}`;

/* =========================================================================
 *  2) [BUS] helpers — auto-tag source:'wa' ; LEGACY bridge (optional)
 * ========================================================================= */
function makeEmit(bus){
  const raw = (ev, payload) => {
    const p = (payload && typeof payload === 'object' && !Array.isArray(payload) && !payload.source)
      ? { ...payload, source:'wa' } : payload;
    try { bus?.emit?.(ev, p); } catch {} try { EBUS.emit(ev, p); } catch {}
  };
  return {
    raw,
    both: (evNew, evOld, payload) => { raw(evNew, payload); if (LEGACY_BRIDGE) raw(evOld, payload); }
  };
}
function makeHas(bus){
  return (ev) => {
    try { if (bus?.getLast?.(ev) !== undefined) return true; } catch {}
    try { if (EBUS.getLast?.(ev) !== undefined) return true; } catch {}
    return false;
  };
}

/* =========================================================================
 *  3) [I18N] Labels
 * ========================================================================= */
const isDE = String(document.documentElement.lang || 'de').toLowerCase().startsWith('de');
const L = isDE
  ? { groupedTitle:'Anzeige', rel:'Relativ', abs:'Absolut', hyb:'Hybrid', reduced:'Reduziert' }
  : { groupedTitle:'Display', rel:'Relative', abs:'Absolute', hyb:'Hybrid', reduced:'Reduced' };

/* =========================================================================
 *  4) [STATE] mount
 * ========================================================================= */
export function mountToolWidgetActions(host, api = {}, { bus } = {}){
  const widgetEl = host?.closest?.('.widget') || host;
  if (!widgetEl) throw new Error('[wa.template] host missing');

  const EMIT = makeEmit(bus);
  const HAS  = makeHas(bus);

  // --- lokaler UI-State (segmented + additive + view options) ---
  const LS = {
    seg:   PERSIST(widgetEl)+':seg',
    fmt:   PERSIST(widgetEl)+':fmt',
    red:   PERSIST(widgetEl)+':reduced',
    groups:PERSIST(widgetEl)+':groups'
  };
  const read  = (k,f)=>{ try{ const v=localStorage.getItem(k); return v??f; }catch{ return f; } };
  const readJ = (k,f)=>{ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):f; }catch{ return f; } };
  const write = (k,v)=>{ try{ localStorage.setItem(k, v); }catch{} };
  const writeJ= (k,v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} };

  // Segmented (exklusiv 1..4)
  let seg = String(read(LS.seg, Object.keys(SEG_MAP)[0] || '1'));
  // Additive Groups (optional)
  const GROUPS = new Set(readJ(LS.groups, []));
  // View-Optionen (optional Beispiel)
  let fmtMode  = String(read(LS.fmt, 'hybrid'));      // 'percent'|'absolute'|'hybrid'
  let reduced  = read(LS.red, 'false') === 'true';

  const toName  = (d)=> SEG_MAP[String(d)];
  const toDigit = (name)=> {
    const e = Object.entries(SEG_MAP).find(([,n]) => n===name);
    return e ? e[0] : undefined;
  };

  /* =======================================================================
   *  5) [UI] Spec — dyn (links): segmented (+optional additive); Burger separat
   * ======================================================================= */
  function buildSpec(){
    const dyn = [];

    if (FEATURES.digitsSegmented){
      const options = Object.keys(SEG_MAP).slice(0,4).map(d => ({
        label: d, value: d, title: SEG_TITLES[d] || `Mode ${d}`
      }));
      dyn.push(presets.segmented({
        id: `${NS}:${SEG_KIND}`,
        options,
        get: ()=> seg,                                        // ← lokaler State (robust gg. stale Getter)
        set: (v)=> {
          seg = String(v || options[0]?.value || '1');        // 1) lokalen State setzen
          write(LS.seg, seg);
          const name = toName(seg) || SEG_MAP['1'];
          EMIT.raw(`${NS}:${SEG_KIND}`, { [SEG_KIND]: name }); // 2) Primärfeld
          if (FEATURES.addIndexValue)                         // 3) optionaler Index
            EMIT.raw(`${NS}:${SEG_KIND}`, { value: seg, __via:'bridge' });
          try { ctrl?.update?.(buildSpec()); } catch {}
        }
      }));
    }

    if (FEATURES.digitsAdditive){
      ADD_DIGITS.forEach(d=>{
        dyn.push(presets.toggle({
          id: `${NS}:g${d}`,
          label: d,
          title: `Group ${d}`,
          get: ()=> GROUPS.has(d),
          set: (on)=> {
            on ? GROUPS.add(d) : GROUPS.delete(d);
            writeJ(LS.groups, [...GROUPS]);
            const id = ADD_MAP[d]?.id ?? `g${d}`;
            EMIT.raw(`${NS}:group:set`, { id, on: !!on });
            try { ctrl?.update?.(buildSpec()); } catch {}
          }
        }));
      });
    }

    return { dyn, globals: [] }; // Burger via getBurgerModel()
  }

  /* =======================================================================
   *  6) Burger (Scaffold) — Tool-sektion(en) hier definieren
   * ======================================================================= */
  function getBurgerModel(){
    return {
      columns: 1,
      sections: [{
        title: L.groupedTitle,
        items: [
          { label: L.rel,    type:'radio', group:'fmt', selected: fmtMode==='percent',
            onSelect: ()=>{ fmtMode='percent'; write(LS.fmt, fmtMode); EMIT.raw(`${NS}:view:format`, { mode:fmtMode }); try { ctrl?.update?.(buildSpec()); }catch{} } },
          { label: L.abs,    type:'radio', group:'fmt', selected: fmtMode==='absolute',
            onSelect: ()=>{ fmtMode='absolute'; write(LS.fmt, fmtMode); EMIT.raw(`${NS}:view:format`, { mode:fmtMode }); try { ctrl?.update?.(buildSpec()); }catch{} } },
          { label: L.hyb,    type:'radio', group:'fmt', selected: fmtMode==='hybrid',
            onSelect: ()=>{ fmtMode='hybrid';  write(LS.fmt, fmtMode); EMIT.raw(`${NS}:view:format`, { mode:fmtMode }); try { ctrl?.update?.(buildSpec()); }catch{} } },
          { label: L.reduced,type:'checkbox',               selected: !!reduced,
            onSelect: ()=>{ reduced=!reduced; write(LS.red, String(reduced)); EMIT.raw(`${NS}:view:reduced`, { on: reduced }); try { ctrl?.update?.(buildSpec()); }catch{} } },
        ]
      }]
    };
  }

  // Mount & Burger-Bridge
  let ctrl = mountWidgetActions(widgetEl, buildSpec(), { debug:false });
  try { (widgetEl.__uidWA ||= {}).getBurgerModel = getBurgerModel; } catch {}

  /* =========================================================================
   *  7) [SEED] (optional) — Explore-Defaults setzen, falls noch nichts da ist
   * ========================================================================= */
  function seedIfNeeded(){
    if (!FEATURES.seeds) return;
    const has = (ev)=> HAS(ev);

    const P = { R0:3, gamma:0.2, N:1_000_000, I0:10, T:180, dt:0.5 };
    if (!has('uid:e:model:update') && !has('uid:e:params:change'))
      EMIT.raw('uid:e:params:change', { bulk:P, source:'seed' });

    if (!has('uid:e:data:series')){
      const t=[0,P.dt,P.dt*2];
      EMIT.raw('uid:e:data:series', { t, S:[P.N,P.N-1,P.N-2], I:[P.I0,P.I0+1,P.I0+2], R:[0,0,1], N:P.N, kind:'seed' });
    }
    if (!has('uid:e:sim:status'))   EMIT.raw('uid:e:sim:status',  { running:false, speed:1, idx:0, source:'seed' });
    if (!has('uid:e:sim:pointer'))  EMIT.raw('uid:e:sim:pointer', { idx:0, source:'seed' });
    if (!has('uid:e:viz:scale:changed')) EMIT.raw('uid:e:viz:scale:changed', { mode:'absolute' }); // 'percent'|'absolute'
  }

  /* =========================================================================
   *  8) [REH] Rehydrate/Power-On → aktuellen State erneut broadcasten
   * ========================================================================= */
  function pushInitial(){
    const name = toName(seg) || SEG_MAP['1'];
    EMIT.raw(`${NS}:${SEG_KIND}`, { [SEG_KIND]: name });
    if (FEATURES.addIndexValue) EMIT.raw(`${NS}:${SEG_KIND}`, { value: seg });

    // View-Opts (falls genutzt)
    EMIT.raw(`${NS}:view:format`,  { mode: fmtMode });
    EMIT.raw(`${NS}:view:reduced`, { on:   !!reduced });
  }

  function rehydrate(){
    seedIfNeeded();
    pushInitial();
    try { ctrl?.update?.(buildSpec()); } catch {}
  }

  // Initial-State (mirrorInit)
  if (FEATURES.mirrorInit){
    queueMicrotask(()=> {
      try {
        const primary = (SEG_KIND==='mode' ? (api.getMode?.() ?? null)
                          : SEG_KIND==='view' ? (api.getView?.() ?? null)
                          : SEG_KIND==='lesson' ? (api.getLesson?.() ?? null) : null);
        if (typeof primary === 'string'){
          const d = toDigit(primary); if (d){ seg = d; write(LS.seg, seg); }
        }
        rehydrate();
      } catch {}
    });
  } else {
    rehydrate();
  }

  // Events → lokale Spiegelung (replay-fähig)
  const offPrimary = (()=>{
    const topic = `${NS}:${SEG_KIND}`;
    return (bus?.on?.(topic, onEvt, { replay:true }) || EBUS.on?.(topic, onEvt, { replay:true }) || (()=>{}));
    function onEvt(e){
      if (typeof e?.value === 'string') seg = e.value;
      else if (e && typeof e[SEG_KIND] === 'string') seg = toDigit(e[SEG_KIND]) || seg;
      write(LS.seg, seg);
      try { ctrl?.update?.(buildSpec()); } catch {}
    }
  })();

  if (FEATURES.emitEnabled) EMIT.raw(`${NS}:enabled`, { enabled:true });

  // Rehydrate-Hooks
  const onPower = () => rehydrate();
  const onRehyd = () => rehydrate();
  try {
    widgetEl.addEventListener('uid:widget:power:on', onPower);
    widgetEl.addEventListener('uid:widget:rehydrate', onRehyd);
  } catch {}

  /* =========================================================================
   *  9) [CLEANUP]
   * ========================================================================= */
  return {
    update(){ try{ ctrl?.update?.(buildSpec()); }catch{} },
    dispose(){
      try { widgetEl.removeEventListener('uid:widget:power:on', onPower); } catch {}
      try { widgetEl.removeEventListener('uid:widget:rehydrate', onRehyd); } catch {}
      try { offPrimary?.(); } catch {}
      try { ctrl?.dispose?.(); } catch {}
    }
  };
}

/* ==== Kompat-Export (wenn Dateiname variieren darf) ==== */
export default { mountToolWidgetActions };
