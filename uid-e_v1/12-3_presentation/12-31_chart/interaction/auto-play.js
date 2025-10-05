// UID-Chart · interaction/auto-play.js
// Konstante Geschwindigkeit: bewegt Playhead-Index von 0..n-1
export function createAutoPlay({ getLen, onTick, speedIdxPerSec = 60 } = {}) {
  let raf = 0, playing = false, i = 0, lastTs = 0;

  function loop(ts){
    if (!playing) return;
    if (!lastTs) lastTs = ts;
    const dt = (ts - lastTs) / 1000; // sec
    lastTs = ts;

    const n = Math.max(0, (getLen?.()|0) - 1);
    if (n <= 0) { stop(); return; }

    i += dt * speedIdxPerSec;
    if (i >= n) { i = n; stop(); } // stop am Ende
    onTick && onTick(Math.round(i));
    raf = requestAnimationFrame(loop);
  }

  function play(from=0){
    i = Math.max(0, from|0);
    if (playing) return;
    playing = true; lastTs = 0;
    raf = requestAnimationFrame(loop);
  }
  function stop(){
    playing = false;
    if (raf) cancelAnimationFrame(raf), raf = 0;
  }
  function toggle(){
    playing ? stop() : play(i);
  }
  function isPlaying(){ return playing; }

  return { play, stop, toggle, isPlaying };
}
