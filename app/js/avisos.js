// Avisos de alarma en este dispositivo: un papel con la alarma, un sonido suave y (si lo permitiste) la notificación del sistema.
// El despertador NO suena acá: sale solo del celu (app nativa, más adelante).
import { iso, esc, nowMin, toMin } from './ui.js';

const DEV_KEY = 'mi-dia-dispositivo', FIRED_KEY = 'mi-dia-avisos';
const GRACE = 2;                                   // minutos de margen por si la compu estaba ocupada

export const DISPOSITIVOS = { pc: 'Compu / tele', celu: 'Celular' };
export function dispositivo() {
  try { const d = localStorage.getItem(DEV_KEY); if (d) return d; } catch {}
  return /Android|iPhone/i.test(navigator.userAgent) ? 'celu' : 'pc';
}
export function setDispositivo(d) { try { localStorage.setItem(DEV_KEY, d); } catch {} }

function fired() {
  try { const f = JSON.parse(localStorage.getItem(FIRED_KEY)); if (f?.date === iso(new Date())) return f; } catch {}
  return { date: iso(new Date()), ids: [] };
}
function markFired(id) { const f = fired(); f.ids.push(id); try { localStorage.setItem(FIRED_KEY, JSON.stringify(f)); } catch {} }

let ac;
export function sonar() {
  try {
    ac ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    [[659.25, 0], [783.99, .22], [1046.5, .44]].forEach(([f, t]) => {
      const o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime + t;
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.22, t0 + .03); g.gain.exponentialRampToValueAtTime(.001, t0 + 1.4);
      o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + 1.5);
    });
  } catch {}
}

export function mostrarAviso(a, album) {
  let box = document.querySelector('.avisos');
  if (!box) { box = document.createElement('div'); box.className = 'avisos'; box.setAttribute('aria-live', 'assertive'); document.body.append(box); }
  const el = document.createElement('div');
  el.className = 'aviso';
  el.innerHTML = `<span class="label">Aviso · ${esc(a.time)}</span><b class="serif">${esc(a.title)}</b>
    <div class="av-btns">${a.spotify && album ? `<a class="btn ghost" href="https://open.spotify.com/album/${esc(album)}" target="_blank" rel="noopener">Abrir el álbum</a>` : ''}
    <button class="btn" type="button">Listo</button></div>`;
  el.querySelector('button').addEventListener('click', () => { el.classList.add('out'); setTimeout(() => el.remove(), 400); });
  box.append(el);
  sonar();
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(a.title, { body: `Aviso de las ${a.time}`, icon: 'assets/logo-completo.svg', tag: a.id }); } catch {}
  }
}

export function startAvisos(store) {
  const check = () => {
    const s = store.get(), dev = dispositivo(), m = nowMin(), done = fired().ids;
    for (const a of s.alarms || []) {
      if (!a.on || a.kind === 'despertador' || done.includes(a.id)) continue;
      if (!(a.device === 'ambos' || a.device === dev)) continue;
      const diff = m - toMin(a.time);
      if (diff >= 0 && diff <= GRACE) { markFired(a.id); mostrarAviso(a, s.musica?.devocionalAlbum); }
    }
  };
  check();
  setInterval(check, 15_000);
}
