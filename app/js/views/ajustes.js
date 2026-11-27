// Vista "Ajustes".
import { getMode, setMode } from '../theme.js';
import { nube, salir } from '../nube.js';
import { DISPOSITIVOS, dispositivo, setDispositivo, mostrarAviso } from '../avisos.js';

const EST = { local: 'Sin conectar', conectando: 'Conectando…', guardando: 'Guardando…', 'al día': 'Al día ✓', 'sin conexión': 'Sin internet: se guarda acá y se sube cuando vuelva' };

const MODES = [['auto', 'Automático'], ['claro', 'Claro'], ['oscuro', 'Oscuro']];

export default {
  title: 'Ajustes',
  render(root, { store }) {
    const paint = () => {
      const m = getMode();
      root.innerHTML = `<div class="v-ajustes"><div class="page-head"><h1>Ajustes</h1></div>
        <div class="card"><h3>Tema</h3>
          <div class="seg" role="group" aria-label="Tema">${MODES.map(([k, n]) => `<button data-mode="${k}" aria-pressed="${m === k}">${n}</button>`).join('')}</div>
          <p class="muted" style="margin:.7rem 0 0;font-size:.88rem">Automático: oscuro de 19:00 a 7:00, así a las 5 de la mañana no te encandila.</p></div>
        <div class="card"><h3>Este dispositivo</h3>
          <div class="seg" role="group" aria-label="Este dispositivo">${Object.entries(DISPOSITIVOS).map(([k, n]) => `<button data-dev="${k}" aria-pressed="${dispositivo() === k}">${n}</button>`).join('')}</div>
          <p class="muted" style="margin:.7rem 0">Los avisos de alarma suenan según "Dónde suena" de cada alarma. El despertador sale solo del celu.</p>
          <div class="btns"><button class="btn ghost" data-a="notif">${'Notification' in window && Notification.permission === 'granted' ? 'Notificaciones activadas ✓' : 'Permitir notificaciones'}</button>
          <button class="btn ghost" data-a="probar">Probar un aviso</button></div></div>
        <div class="card"><h3>Intro y datos</h3><div class="btns">
          <button class="btn ghost" data-a="intro">Ver la intro de nuevo</button>
          <button class="btn ghost" data-a="verso">Mostrar un versículo ahora</button></div></div>
        <div class="card"><h3>Cuenta</h3><ul class="plist">
          <li>${nube.user ? 'Entraste como ' + nube.user.email.replace(/[<>&]/g, '') : 'Sin sesión'}</li>
          <li>Sincronización: <b class="aj-est">${EST[store.status()] || store.status()}</b></li></ul>
          <div class="btns"><button class="btn ghost" data-a="salir">Cerrar sesión en este dispositivo</button></div></div>
        <div class="card"><h3>Info</h3><ul class="plist">
          <li>Pantalla de espera: después de 1 minuto sin tocar nada</li>
          <li>Versículos en papel: aparecen cada 3 minutos; tocalos y se van</li>
          <li>Versión: paso 4 · tus datos se guardan en tu cuenta y se ven en todos tus dispositivos</li></ul></div></div>`;
    };
    paint();
    root.onclick = e => {
      const mode = e.target.closest('[data-mode]')?.dataset.mode;
      if (mode) { setMode(mode); paint(); return; }
      const dev = e.target.closest('[data-dev]')?.dataset.dev;
      if (dev) { setDispositivo(dev); paint(); return; }
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'intro') location.href = location.pathname;
      else if (a === 'verso') window.__verso?.();
      else if (a === 'notif' && 'Notification' in window) Notification.requestPermission().then(paint);
      else if (a === 'probar') mostrarAviso({ id: 'prueba', time: new Date().toTimeString().slice(0, 5), title: 'Así se ve un aviso', spotify: true }, store.get().musica?.devocionalAlbum);
      else if (a === 'salir' && confirm('¿Cerrar sesión en este dispositivo? Tus datos quedan guardados en tu cuenta.')) salir();
    };
    const off = store.onStatus(st => { const b = root.querySelector('.aj-est'); if (b) b.textContent = EST[st] || st; });
    return () => { root.onclick = null; off(); };
  },
};
