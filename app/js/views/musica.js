// Vista "Música": panel tipo reproductor. Spotify (búsqueda y alarmas) se conecta en el paso 4.
let query = '';
const MSG = 'La búsqueda en Spotify se conecta en el paso 4, con tu cuenta Premium.';
const MOMENTOS = [
  { t: 'Devocional', d: 'Álbum del devocional' },
  { t: 'Orden y limpieza', d: 'Sin música asignada' },
  { t: 'Antiguo Testamento', d: 'Sin música asignada' },
];

export default {
  title: 'Música',
  render(root, { store, ui }) {
    const { esc } = ui;
    const mu = store.get().musica, album = esc(mu.devocionalAlbum || ''), hora = esc(mu.devocionalHora || '');
    root.innerHTML = `<div class="v-musica">
      <div class="page-head"><h1>Música</h1></div>
      <form class="mu-search" role="search"><span class="mu-ic" aria-hidden="true">⌕</span>
        <input class="input" name="q" type="search" value="${esc(query)}" placeholder="Buscá una canción, artista o álbum" aria-label="Buscar música" autocomplete="off">
        <button class="btn" type="submit">Buscar</button></form>
      <p class="mu-msg" role="status" hidden>${MSG}</p>
      <div class="mu-main">
        <div class="card mu-dev"><h3>Devocional · ${hora}</h3>
          ${album ? `<iframe src="https://open.spotify.com/embed/album/${album}?utm_source=generator&theme=0" width="100%" height="352" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style="border-radius:12px" title="Álbum del devocional"></iframe>`
            : '<p class="muted">Todavía no elegiste el álbum del devocional.</p>'}
          <p class="muted small">Todos los días a las ${hora} la app va a poner este álbum.</p>
          <details class="drawer" data-drawer="mu"${window.__drawers?.mu ? ' open' : ''}><summary>Cambiar álbum u hora</summary>
            <form class="mu-alb"><input class="input" name="link" placeholder="Pegá el link del álbum o playlist de Spotify" aria-label="Link de Spotify">
              <input class="input" name="hora" type="time" value="${hora}" aria-label="Hora del devocional"><button class="btn" type="submit">Guardar</button></form></details></div>
        <div class="card mu-mom"><h3>Momentos</h3>
          <ul>${MOMENTOS.map(m => `<li><div><strong>${esc(m.t)}</strong><div class="muted small">${esc(m.d)}</div></div><button class="btn ghost" type="button" data-asignar>asignar</button></li>`).join('')}</ul></div>
      </div></div>`;
    const msg = root.querySelector('.mu-msg');
    root.oninput = e => { if (e.target.name === 'q') query = e.target.value; };
    root.onsubmit = e => {
      e.preventDefault();
      if (e.target.classList.contains('mu-alb')) {
        const link = e.target.link.value.trim(), m = link.match(/album\/([A-Za-z0-9]{22})/), h = e.target.hora.value;
        store.set(st => { if (m) st.musica.devocionalAlbum = m[1]; if (h) st.musica.devocionalHora = h; });
        return;
      }
      query = e.target.q.value; msg.hidden = false;
    };
    root.onclick = e => { if (e.target.closest('[data-asignar]')) msg.hidden = false; };
    return () => { root.onclick = root.onsubmit = root.oninput = null; };
  },
};
