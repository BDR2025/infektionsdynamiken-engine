// ============================================================================
// UID-Chart · presentation/chart/index.js
// Public-API Wrapper: attachChart(hostId)
// - Lauscht auf uid:e:sim:data
// - Managed ResizeObserver + DPR
// - Playhead-Overlay (feine Linie + T-Label) inkl. Maussteuerung
// - Auto-Init-Handshake: Zeichnet erst, wenn Größe>0 und Daten da sind
// - Optional: Auto-Play (exponiert play/pause/toggle/clearPointer)
// CC BY 4.0
// ============================================================================

import { on, emit } from '../../12-1_base/bus.js';
import { createRenderer } from './core/chart-renderer.js';
import { makeScaleBridge } from './interaction/scale-bridge.js';
import { mountPlayhead } from './interaction/playhead-core.js';
import { attachPlayheadInput } from './interaction/playhead-input.js';
import { createAutoPlay } from './interaction/auto-play.js';
import { mountLegend } from './interaction/legend.js';
import { mountMarkers } from './interaction/markers.js';          // ← NEU (Playhead-Marker)
import { mountLines } from './interaction/lines.js';              // ← NEU (Peak-Linien)
import { mountOverlaysToggle } from './interaction/overlays-toggle.js'; // ← NEU (Overlay-Toggle)

// ---------- Single-Instance-Flag ----------
const DATA_FLAG = 'chartMounted';

export function attachChart(hostId = 'chart-host') {
  const host = document.getElementById(hostId);
  if (!host) return null;

  // ---------- Single-Instance-Guard ----------
  if (host.dataset[DATA_FLAG] === '1') {
    return host.__chartApi || null;
  }
  host.dataset[DATA_FLAG] = '1';

  const api = createRenderer(host); // { setSize, drawSeries, dispose, diag }
  const { setSize, drawSeries, dispose, diag } = api;

  // Auto-init handshake state
  let haveSize = false;
  let lastSeries = null;
  let lastT = [];

  // Sichtbarkeiten (Legend Halo-Dots)
  let visible = { S: true, E: true, I: true, R: true }; // Wird per Event aktualisiert

  // Bridge + Overlays
  const bridge = makeScaleBridge();
  const playhead = mountPlayhead(host, { bridge, pad: 32 });
  const markers = mountMarkers(host, { pad: 32 }); // ← NEU
  const lines = mountLines(host, { pad: 32 });     // ← NEU (dezent, unter Playhead/Markers)

  // Mouse input
  const input = attachPlayheadInput(host, {
    onMoveX: (x) => playhead.setIndexFromX(x),
    onLeave: () => playhead.clearPointer(),
  });

  // Auto-Play (Chart-interner Pointer-Lauf)
  const autoplay = createAutoPlay({
    getLen: () => bridge.tLen(),
    onTick: (i) => playhead.setIndex(i),
    speedIdxPerSec: 60,
  });
  window.__uidAutoPlay = autoplay;

  // Ensure host has non-zero size at mount
  queueMicrotask(() => {
    const r = host.getBoundingClientRect();
    const w = Math.max(1, Math.floor(r.width));
    const h = Math.max(1, Math.floor(r.height));
    if (w > 0 && h > 0) {
      setSize(w, h);
      playhead.setSize(w, h);
      haveSize = true;
      if (lastSeries) {
        try { drawFiltered(lastSeries); } catch (e) { console.warn('chart draw error (init)', e); }
        bridge.setDomain(lastT, 32, Math.max(32, w - 32));
      }
    }
  });

  const ro = new ResizeObserver((entries) => {
    for (const e of entries) {
      const cr = e.contentRect;
      const w = Math.max(1, Math.floor(cr.width));
      const h = Math.max(1, Math.floor(cr.height));
      setSize(w, h);
      playhead.setSize(w, h);
      haveSize = w > 0 && h > 0;
      bridge.setDomain(lastT, 32, Math.max(32, w - 32));
      if (lastSeries) {
        try { drawFiltered(lastSeries); } catch (err) { console.warn('chart draw error (resize)', err); }
      }
    }
  });
  ro.observe(host);

  // Serien zeichnen, dabei nach Sichtbarkeit filtern
  function drawFiltered(series) {
    const filtered = { ...series };
    const keys = Object.keys(series || {});
    for (const k of keys) {
      if (k === 't') continue;
      if (k in visible && !visible[k]) filtered[k] = null;
    }
    drawSeries(filtered);
  }

  // Daten
  const offData = on('uid:e:sim:data', ({ series }) => {
    lastSeries = series || {};
    lastT = lastSeries?.t || [];
    if (haveSize) {
      try { drawFiltered(lastSeries); } catch (err) { console.warn('chart draw error (data)', err); }
      const r = host.getBoundingClientRect();
      bridge.setDomain(lastT, 32, Math.max(32, r.width - 32));
    }
  });

  // Legend (Halo-Dots) mounten
  const legend = mountLegend(host, {
    getAvailableKeys: () => {
      const s = lastSeries || {};
      return ['S', 'E', 'I', 'R'].filter((k) => Array.isArray(s[k]) && s[k].length);
    },
  });

  // Overlay-Toggle hinzufügen (Peak-Linien ein-/ausblenden)
  const overlaysToggle = mountOverlaysToggle(host, { defaultEnabled: true });

  // Legend-Events (Sichtbarkeit) übernehmen und neu zeichnen
  const offViz = on('uid:e:viz:series:state', ({ visible: v }) => {
    visible = { ...visible, ...(v || {}) };
    if (lastSeries) {
      try { drawFiltered(lastSeries); } catch (e) { console.warn('chart draw (legend)', e); }
    }
  });

  // ---------- NEU: Power-Gating (Widget an/aus) ----------
  const widget = host.closest('.widget') || host.closest('.uid-widget') || host;
  const applyPowerState = () => {
    const enabled = (widget.getAttribute('data-widget-enabled') !== 'false');
    if (!enabled) {
      try { autoplay.stop(); } catch {}
      try { playhead.clearPointer(); } catch {}
      try { emit('uid:e:sim:pause', {}); } catch {}
      try { emit('uid:e:sim:pointer', { idx: null }); } catch {}
    }
  };
  applyPowerState();
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'attributes' && m.attributeName === 'data-widget-enabled') {
        applyPowerState();
      }
    }
  });
  try { mo.observe(widget, { attributes: true, attributeFilter: ['data-widget-enabled'] }); } catch {}

  // ---------- NEU: Sim-Status zwischenspeichern (für Diagnose) ----------
  let simStatus = { running:false, speed:1, idx:null };
  const offSim = on('uid:e:sim:status', (s) => {
    if (s && typeof s === 'object') simStatus = { ...simStatus, ...s };
  });

  // Forensik
  window.__uidChartDiag = function () {
    const r = host.getBoundingClientRect();
    const info = {
      haveSize,
      lastT_len: lastT?.length || 0,
      host_w: r.width | 0,
      host_h: r.height | 0,
      mounted_flag: host.dataset[DATA_FLAG] === '1',
      widget_enabled: (widget.getAttribute('data-widget-enabled') !== 'false'),
      // ---------- NEU ----------
      sim_running: !!simStatus.running,
      sim_speed:   simStatus.speed,
      sim_idx:     simStatus.idx
    };
    console.table(info);
    return info;
  };

  // ---------- API an Host hängen ----------
  const apiPublic = {
    dispose() {
      try { offData && offData(); } catch {}
      try { offViz && offViz(); } catch {}
      try { offSim && offSim(); } catch {}
      try { ro.disconnect(); } catch {}
      try { mo.disconnect(); } catch {}
      try { input.dispose(); } catch {}
      try { playhead.dispose(); } catch {}
      try { markers.dispose(); } catch {}
      try { lines.dispose(); } catch {}
      try { legend.dispose(); } catch {}
      try { dispose(); } catch {}
      try { delete host.dataset[DATA_FLAG]; } catch {}
      try { delete host.__chartApi; } catch {}
    },
    diag,
    play: () => autoplay.play(0),
    pause: () => autoplay.stop(),
    toggle: () => autoplay.toggle(),
    clearPointer: () => playhead.clearPointer(),
  };

  host.__chartApi = apiPublic;
  return apiPublic;
}
