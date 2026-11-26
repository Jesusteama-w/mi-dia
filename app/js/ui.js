// Utilidades compartidas por todas las vistas.

export const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const CATS = {
  colegio: { name: 'Colegio', c: 'var(--cat-colegio)' },
  finanzas: { name: 'Finanzas', c: 'var(--cat-finanzas)' },
  fe: { name: 'Fe', c: 'var(--cat-fe)' },
  casa: { name: 'Casa', c: 'var(--cat-casa)' },
};

const pad = n => String(n).padStart(2, '0');
export const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addDays = (d, k) => { const x = new Date(d); x.setDate(x.getDate() + k); return x; };
export const parseIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const hhmm = d => `${d.getHours()}:${pad(d.getMinutes())}`;
export const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
export const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
export const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
export const longDate = d => `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
export const uid = p => p + Math.random().toString(36).slice(2, 9);
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Bloque actual y siguiente del cronograma. */
export function currentBlock(schedule, m = nowMin()) {
  const i = schedule.findIndex(b => toMin(b.start) <= m && m < toMin(b.end));
  const next = schedule.find(b => toMin(b.start) > m) || null;
  if (i < 0) return { now: null, next, pct: 0, left: 0 };
  const b = schedule[i], s = toMin(b.start), e = toMin(b.end);
  return { now: b, next: schedule[i + 1] || null, pct: (m - s) / (e - s), left: e - m };
}

/** Versículo del día (rota cada día). */
export const verseOfDay = verses => verses[Math.floor(Date.now() / 864e5) % verses.length];
export const verseText = v => v.t ? `«${esc(v.t)}»` : '«Texto NVI de tu lista»';

/** Grilla del mes (lunes primero). Devuelve celdas {date|null}. */
export function monthCells(year, month) {
  const first = new Date(year, month, 1), days = new Date(year, month + 1, 0).getDate();
  const off = (first.getDay() + 6) % 7, cells = [];
  for (let i = 0; i < off; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7) cells.push(null);
  return cells;
}

/** HTML de una tarea con checkbox. data-id lo usa la vista para saber cuál es. */
export const taskHtml = (id, text, done, hr = '') =>
  `<button class="task${done ? ' done' : ''}" data-id="${id}" aria-pressed="${done}">` +
  `${hr ? `<span class="hr">${hr}</span>` : ''}<span class="ck"></span>` +
  `<span class="tx">${esc(text)}<svg viewBox="0 0 100 10" preserveAspectRatio="none"><path pathLength="100" d="M0 6 Q25 2 50 5 T100 4"/></svg></span></button>`;

/** Marca/desmarca una tarea con la animación de lápiz + papelitos. Llama onCommit(nuevoEstado). */
export function toggleTask(el, onCommit) {
  const done = !el.classList.contains('done');
  el.classList.toggle('done', done);
  el.setAttribute('aria-pressed', done);
  const path = el.querySelector('.tx path');
  if (path) {
    const L = 100;
    path.style.transition = 'none'; path.style.strokeDasharray = L; path.style.strokeDashoffset = done ? L : 0;
    path.getBoundingClientRect();
    path.style.transition = 'stroke-dashoffset .55s ease-out'; path.style.strokeDashoffset = done ? 0 : L;
  }
  if (done) {
    for (let i = 0; i < 12; i++) {
      const b = document.createElement('span');
      b.className = 'bit' + (i % 4 === 0 ? ' s' : i % 4 === 1 ? ' p' : '');
      b.style.left = '0.5rem'; b.style.top = '50%';
      b.style.setProperty('--x', (Math.random() * 150 - 20) + 'px');
      b.style.setProperty('--y', (Math.random() * -70 - 10) + 'px');
      b.style.setProperty('--r', (Math.random() * 540) + 'deg');
      el.appendChild(b); setTimeout(() => b.remove(), 900);
    }
  }
  onCommit(done);
}

/** SVG del logo (completo o solo ícono cruz + J), como texto. */
let logoSrc = null;
export async function logoSvg({ icon = false } = {}) {
  logoSrc ??= await fetch('assets/logo-completo.svg').then(r => r.text());
  if (!icon) return logoSrc;
  // ícono: se sacan las letras "esus" (último grupo) y se ajusta el recorte
  return logoSrc.replace(/<g transform="matrix\(1, 0, 0, 1, 251, 333\)">[\s\S]*<\/svg>/, '</svg>')
                .replace(/viewBox="[^"]*"/, 'viewBox="60 150 380 450"');
}
