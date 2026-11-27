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

// ---------- categorías nuevas con un botón ----------
export const PALETA = ['#c4862a', '#5b5346', '#7a6a55', '#8d988d', '#b9a98a', '#4f4a40', '#a35f2a', '#6f7f95', '#9a6b8a', '#5f8a6a', '#b0704f', '#3f6f78'];
/** Primer color de la paleta que todavía no se usa. */
export const colorLibre = usados => PALETA.find(c => !usados.includes(c)) || PALETA[usados.length % PALETA.length];

/** Categorías de eventos: las fijas + las que agregaste vos (state.eventCats). */
export function evCats(s) {
  const out = { ...CATS };
  (s.eventCats || []).forEach(c => { out[c.id] = { name: c.name, c: c.color }; });
  return out;
}

/** Botón "+ Nueva" que va al final de una fila de chips. */
export const addChip = (kind, txt = 'Nueva') => `<button type="button" class="chip chip-add" data-addcat="${kind}" aria-label="Agregar ${txt.toLowerCase()}">+ ${txt}</button>`;

/** Convierte el botón "+ Nueva" en un campito para escribir el nombre. Enter agrega, Esc cancela. */
export function addChipInput(btn, onAdd) {
  const w = document.createElement('span');
  w.className = 'chip chip-new';
  w.innerHTML = `<input maxlength="30" placeholder="Nombre…" aria-label="Nombre nuevo" autocomplete="off"><button type="button" aria-label="Agregar">✓</button>`;
  btn.replaceWith(w);
  const inp = w.querySelector('input');
  inp.focus();
  const cancel = () => { if (w.isConnected) w.replaceWith(btn); };
  const ok = () => { const v = inp.value.trim(); if (v) onAdd(v); else cancel(); };
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); ok(); }
    else if (e.key === 'Escape') cancel();
  });
  w.querySelector('button').addEventListener('click', e => { e.stopPropagation(); ok(); });
  inp.addEventListener('blur', () => setTimeout(() => { if (w.isConnected && !w.contains(document.activeElement) && !inp.value.trim()) cancel(); }, 200));
}
