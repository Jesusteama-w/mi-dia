import { store } from './store.js';
import * as ui from './ui.js';
import { playIntro } from './intro.js';
import { afk } from './afk.js';
import { startFloaters } from './floaters.js';
import { sesionGuardada, conectar, pedirLogin } from './nube.js';
import { startAvisos } from './avisos.js';
import './theme.js';

const NAV = [
  { id: 'inicio', name: 'Inicio', ic: '◎' },
  { id: 'mes', name: 'Mes', ic: '▦' },
  { id: 'alarmas', name: 'Alarmas', ic: '◷' },
  { id: 'dia', name: 'Día', ic: '☰' },
  { id: 'libreta', name: 'Libreta', ic: '✎' },
  { id: 'colegio', name: 'Colegio', ic: '✦', secondary: true },
  { id: 'finanzas', name: 'Finanzas', ic: '$', secondary: true },
  { id: 'musica', name: 'Música', ic: '♪', secondary: true },
  { id: 'ajustes', name: 'Ajustes', ic: '⚙', secondary: true },
];
const IDLE_MS = 60_000;          // 1 minuto sin tocar nada → pantalla de espera

const nav = document.querySelector('.nav');
const view = document.getElementById('view');
let cleanup = null, current = null;

async function buildNav() {
  nav.innerHTML =
    `<a href="#/inicio" class="logo" aria-label="Inicio">${await ui.logoSvg({ icon: true })}</a>` +
    NAV.map(n => `<a href="#/${n.id}" data-id="${n.id}" class="${n.secondary ? 'secondary' : ''}"><span class="ic">${n.ic}</span>${n.name}</a>`).join('') +
    `<a href="#/mas" data-id="mas" class="more"><span class="ic">⋯</span>Más</a>` +
    `<a class="ps" href="#/inicio" id="go-ps5" title="En el paso 4 cambia la tele a la PS5"><span class="ic">▶</span>PS5</a>`;
  document.getElementById('go-ps5').addEventListener('click', e => { e.preventDefault(); alert('En el paso 4 este botón va a cambiar la tele a la entrada de la PS5.'); });
}

export const go = id => { location.hash = `#/${id}`; };
const ctx = { store, ui, go, NAV };

async function route() {
  const id = (location.hash.match(/^#\/([\w-]+)/) || [])[1] || 'inicio';
  if (id === current) return;
  current = id;
  nav.querySelectorAll('a[data-id]').forEach(a => a.classList.toggle('on', a.dataset.id === id || (a.dataset.id === 'mas' && NAV.find(n => n.id === id)?.secondary)));
  cleanup?.(); cleanup = null;
  let mod;
  try { mod = (await import(`./views/${id}.js`)).default; }
  catch (err) { console.warn(err); mod = { render: r => { r.innerHTML = `<div class="page-head"><h1>${ui.esc(id)}</h1></div><p class="muted">Esta sección está en construcción.</p>`; } }; }
  view.innerHTML = '';
  document.title = `${mod.title || ui.cap(id)} · mi día`;
  cleanup = mod.render(view, ctx) || null;
  view.scrollTop = 0; window.scrollTo(0, 0);
}

// Si cambian los datos desde otra parte (por ejemplo Claude en el paso 4), se redibuja la vista.
store.subscribe(() => { const c = current; current = null; location.hash = `#/${c}`; route(); });

// ---- inactividad → pantalla de espera ----
let idleTimer;
function poke() { clearTimeout(idleTimer); idleTimer = setTimeout(() => { if (!document.getElementById('intro').hidden || !document.getElementById('login').hidden) return; afk.show(); }, IDLE_MS); }
['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(ev => addEventListener(ev, poke, { passive: true }));

// Paneles que se abren y cierran (recuerdan si estaban abiertos aunque la vista se redibuje)
window.__drawers = {};
document.addEventListener('toggle', e => { const d = e.target; if (d.dataset?.drawer) window.__drawers[d.dataset.drawer] = d.open; }, true);

afk.onExit = () => { go('inicio'); route(); view.focus({ preventScroll: true }); poke(); };

// Instalable en el celu (y anda sin internet con lo último que se guardó). En la compu local no hace falta.
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

(async function start() {
  // Si ya entraste en este dispositivo, se conecta en segundo plano mientras corre la intro.
  const guardada = await sesionGuardada();
  if (guardada) conectar(guardada).catch(e => console.warn('[nube]', e));
  await buildNav();
  addEventListener('hashchange', route);
  await route();
  window.__verso = startFloaters(store, { canShow: () => !afk.visible && document.getElementById('intro').hidden && document.getElementById('login').hidden }).pop;
  const params = new URLSearchParams(location.search);
  if (!params.has('sinintro')) await playIntro();
  if (!guardada) await conectar(await pedirLogin());
  startAvisos(store);
  afk.show();
  poke();
})();
