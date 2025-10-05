// UID-Chart · interaction/playhead-input.js
// Desktop-Maussteuerung: bewegt den Playhead via mousemove auf dem Canvas/Host
// FIX 2025-09-29: Verhindert Endlos-Rekursion durch Namensschatten von "onLeave".

export function attachPlayheadInput(domTarget, { onMoveX, onLeave: onLeaveCb } = {}) {
  if (!domTarget) return { dispose(){} };

  function onMove(ev) {
    const rect = domTarget.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    if (onMoveX) onMoveX(x);
  }

  // Wichtig: nicht "onLeave" nennen, sonst Schatten auf Parameter → Self-Call
  function handleLeave(/* ev */) {
    if (onLeaveCb) onLeaveCb();
  }

  domTarget.addEventListener('mousemove', onMove, { passive: true });
  domTarget.addEventListener('mouseleave', handleLeave, { passive: true });

  return {
    dispose(){
      try { domTarget.removeEventListener('mousemove', onMove); } catch {}
      try { domTarget.removeEventListener('mouseleave', handleLeave); } catch {}
    }
  };
}
