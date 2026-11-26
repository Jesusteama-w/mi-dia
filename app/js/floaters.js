// Versículo en papel rasgado que aparece de golpe ("pop") cada tanto. Tocalo y se va.
const FIRST_MS = 35_000;        // primero, a los 35 s de entrar
const EVERY_MS = 3 * 60_000;    // después, cada 3 minutos
const STAY_MS = 40_000;         // si no lo tocás, se va solo a los 40 s

// borde rasgado: un polígono con pequeñas mordidas en los 4 lados
export function torn() {
  const p = [], j = (a) => (Math.random() * a).toFixed(2);
  for (let x = 0; x <= 100; x += 3 + Math.random() * 4) p.push(`${x.toFixed(1)}% ${j(4)}%`);
  for (let y = 0; y <= 100; y += 4 + Math.random() * 6) p.push(`${(100 - +j(2.5)).toFixed(2)}% ${y.toFixed(1)}%`);
  for (let x = 100; x >= 0; x -= 3 + Math.random() * 4) p.push(`${x.toFixed(1)}% ${(100 - +j(4)).toFixed(2)}%`);
  for (let y = 100; y >= 0; y -= 4 + Math.random() * 6) p.push(`${j(2.5)}% ${y.toFixed(1)}%`);
  return `polygon(${p.join(',')})`;
}

const SPOTS = [
  { right: '4%', bottom: '8%' }, { right: '5%', top: '12%' }, { left: 'calc(var(--nav-w) + 3%)', bottom: '10%' },
  { left: '38%', bottom: '6%' }, { right: '28%', top: '8%' },
];

export function startFloaters(store, { canShow = () => true } = {}) {
  let i = Math.floor(Math.random() * 100), live = null;

  function close(el, how = 'tear') {
    if (!el || el.classList.contains('bye')) return;
    el.classList.add('bye', how);
    setTimeout(() => el.remove(), 700);
    if (live === el) live = null;
  }

  function pop(force = false) {
    if (live || (!force && (document.hidden || !canShow()))) return;
    const vs = store.get().verses.filter(v => v.t); if (!vs.length) return;
    const v = vs[i++ % vs.length];
    const el = document.createElement('button');
    el.className = 'vpop';
    el.setAttribute('aria-label', `Versículo ${v.ref}. Tocá para cerrar`);
    Object.assign(el.style, SPOTS[Math.floor(Math.random() * SPOTS.length)]);
    el.style.setProperty('--rot', (Math.random() * 6 - 3).toFixed(1) + 'deg');
    el.innerHTML = `<span class="back" style="clip-path:${torn()}"></span>
      <span class="front" style="clip-path:${torn()}">
        <span class="vt">«${v.t.replace(/</g, '&lt;')}»</span>
        <span class="vr">${v.ref} · NVI</span>
      </span>`;
    el.addEventListener('click', () => close(el));
    document.body.appendChild(el);
    live = el;
    setTimeout(() => close(el, 'fade'), STAY_MS);
  }

  setTimeout(() => { pop(); setInterval(pop, EVERY_MS); }, FIRST_MS);
  return { pop: () => pop(true) };
}
