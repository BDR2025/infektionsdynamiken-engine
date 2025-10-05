// UID-E · presentation/formula/index.js
import { on } from '../../12-1_base/bus.js';

export function mountFormula(hostId='formula') {
  const host = document.getElementById(hostId);
  if (!host) return;
  host.innerHTML = `
    <div>R₀ = β / γ → <b data-var="R0">—</b></div>
    <div>D = 1 / γ → <b data-var="D">—</b></div>
    <div>Rₑff(t) = R₀ · S/N → <b data-var="Reff">—</b></div>
  `;

  function setVar(key, val, digits=2) {
    const el = host.querySelector('[data-var="'+key+'"]');
    if (el) {
      el.textContent = Number(val).toFixed(digits);
      el.classList.add('pulse');
      setTimeout(() => el.classList.remove('pulse'), 400);
    }
  }

  let lastR0 = null, lastN = null;

  on('uid:e:model:update', (p) => {
    if (typeof p.R0 === 'number') { lastR0 = p.R0; setVar('R0', p.R0, 2); }
    if (typeof p.D === 'number')  { setVar('D', p.D, 2); }
    if (typeof p.N === 'number')  { lastN = p.N; }
  });

  on('uid:e:sim:data', ({ series, N }) => {
    const last = (series.t?.length || 1) - 1;
    const S = series.S?.[last] ?? N ?? lastN ?? 1;
    const r0 = lastR0 ?? 0;
    const reff = r0 * (S / (N ?? lastN ?? 1));
    setVar('Reff', reff, 2);
  });
}
