// Vista "Ajustes".
import { getMode, setMode } from '../theme.js';

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
        <div class="card"><h3>Intro y datos</h3><div class="btns">
          <button class="btn ghost" data-a="intro">Ver la intro de nuevo</button>
          <button class="btn ghost" data-a="verso">Mostrar un versículo ahora</button>
          <button class="btn ghost" data-a="reset">Volver a los datos de ejemplo</button></div></div>
        <div class="card"><h3>Info</h3><ul class="plist">
          <li>Pantalla de espera: después de 1 minuto sin tocar nada</li>
          <li>Versículos en papel: aparecen cada 3 minutos; tocalos y se van</li>
          <li>Versión: prototipo (paso 3) · datos guardados solo en este dispositivo</li></ul></div></div>`;
    };
    paint();
    root.onclick = e => {
      const mode = e.target.closest('[data-mode]')?.dataset.mode;
      if (mode) { setMode(mode); paint(); return; }
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'intro') location.href = location.pathname;
      else if (a === 'verso') window.__verso?.();
      else if (a === 'reset' && confirm('¿Seguro? Se pierden tus cambios y vuelven los datos de ejemplo.')) store.reset();
    };
    return () => { root.onclick = null; };
  },
};
