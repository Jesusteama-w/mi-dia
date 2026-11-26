// Inicio: hora y versículo → AHORA / LO PRÓXIMO → Mes, Alarmas, Día → Mañana tenés + Libreta.
export default {
  title: 'Inicio',
  render(root, { store, ui }) {
    const s = store.get(), d = new Date(), v = ui.verseOfDay(s.verses), m = ui.nowMin();
    const hour = d.getHours(), greet = hour < 12 ? 'Buen día' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
    const cells = ui.monthCells(d.getFullYear(), d.getMonth()), today = ui.iso(d);
    const evDays = new Set(s.events.map(e => e.date));
    const alarms = [...s.alarms].filter(a => a.on).sort((a, b) => ui.toMin(a.time) - ui.toMin(b.time));
    const tmr = ui.iso(ui.addDays(d, 1)), tmrEv = s.events.filter(e => e.date === tmr);
    const pend = s.notes.filter(n => !n.done).slice(0, 3);

    root.innerHTML = `<div class="v-inicio">
      <header class="i-top">
        <div><div class="i-clock">${ui.hhmm(d)}</div><div class="label">${ui.longDate(d)}</div></div>
        <div class="i-verse">${ui.verseText(v)}<span class="label">Versículo del día · ${ui.esc(v.ref)} · NVI</span></div>
        <div class="i-hello"><span class="serif">${greet}${s.perfil?.nombre ? ', ' + ui.esc(s.perfil.nombre) : ''}</span><span class="label">Lectura: ${ui.esc(s.reading)}</span></div>
      </header>

      <section class="card i-now" aria-live="polite"></section>

      <div class="i-three">
        <a class="card i-mes" href="#/mes"><h3>${ui.cap(ui.MESES[d.getMonth()])}</h3>
          <div class="i-cal">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(x => `<b>${x}</b>`).join('')}
          ${cells.map(c => !c ? '<span></span>' : `<span class="${ui.iso(c) === today ? 't' : ''}${evDays.has(ui.iso(c)) ? ' e' : ''}">${c.getDate()}</span>`).join('')}</div></a>
        <section class="card"><h3><a href="#/alarmas">Alarmas de hoy</a></h3>
          ${alarms.map(a => `<div class="i-al${ui.toMin(a.time) <= m ? ' past' : ''}"><span class="serif">${a.time}</span><span>${ui.esc(a.title)}</span><span class="tag">${a.kind === 'despertador' ? 'celu' : a.device}${a.spotify ? ' · spotify' : ''}</span></div>`).join('')}
        </section>
        <section class="card i-day"><h3><a href="#/dia">Día</a> <small class="muted i-count"></small></h3>
          <div class="i-tasks"></div></section>
      </div>

      <div class="i-bottom">
        <section class="card"><h3>Mañana tenés</h3>
          <p><span class="label">Materias</span> ${s.tomorrow.materias.map(ui.esc).join(' · ')}</p>
          ${tmrEv.map(e => `<p><i class="dot" style="--c:${ui.CATS[e.cat]?.c}"></i> ${ui.esc(e.title)}${e.note ? ` <span class="muted">· ${ui.esc(e.note)}</span>` : ''}</p>`).join('')}
          <p><span class="label">Llevar</span> ${s.tomorrow.llevar.map(ui.esc).join(' · ')}</p>
        </section>
        <section class="card i-note"><h3><a href="#/libreta">Libreta</a></h3>
          <form class="i-add"><input class="input" name="t" placeholder="Anotar algo…" autocomplete="off" aria-label="Anotar en la libreta"></form>
          <ul>${pend.map(n => `<li>${ui.esc(n.text)}</li>`).join('')}</ul>
        </section>
      </div>
    </div>`;

    // AHORA / LO PRÓXIMO (se actualiza solo)
    const nowBox = root.querySelector('.i-now');
    const paintNow = () => {
      const c = ui.currentBlock(store.get().schedule);
      nowBox.innerHTML = c.now
        ? `<div><span class="label">Ahora</span><b class="serif">${ui.esc(c.now.title)}</b><small>${c.now.start} – ${c.now.end}</small></div>
           <div><span class="label">Lo próximo</span><b class="serif">${c.next ? ui.esc(c.next.title) : 'Descansar'}</b><small>${c.next ? c.next.start : ''}</small></div>
           <div class="i-prog"><small>Faltan ${c.left} min</small><div class="bar"><i style="width:${Math.round(c.pct * 100)}%"></i></div></div>`
        : `<div><span class="label">Ahora</span><b class="serif">Descanso</b><small>Nada en el cronograma</small></div>
           <div><span class="label">Lo próximo</span><b class="serif">${c.next ? ui.esc(c.next.title) : 'Despertar'}</b><small>${c.next ? c.next.start : 'mañana 5:00'}</small></div><div></div>`;
      root.querySelector('.i-clock').textContent = ui.hhmm(new Date());
    };
    paintNow();
    const iv = setInterval(paintNow, 30_000);

    // Día: tareas del cronograma
    const tasks = root.querySelector('.i-tasks'), count = root.querySelector('.i-count');
    const paintTasks = () => {
      const sc = store.get().schedule, cur = ui.currentBlock(sc).now;
      const m = ui.nowMin(), nextI = sc.findIndex(b => ui.toMin(b.start) > m);
      const at = cur ? sc.indexOf(cur) : nextI >= 0 ? nextI : sc.length - 4;
      const start = Math.max(0, Math.min(at - 1, sc.length - 5));
      tasks.innerHTML = sc.slice(start, start + 5).map(b => ui.taskHtml(b.id, b.title, b.done, b.start)).join('');
      count.textContent = `${sc.filter(b => b.done).length} de ${sc.length}`;
    };
    paintTasks();
    tasks.addEventListener('click', e => {
      const t = e.target.closest('.task'); if (!t) return;
      ui.toggleTask(t, done => {
        store.set(st => { st.schedule.find(b => b.id === t.dataset.id).done = done; }, { quiet: true });
        const sc = store.get().schedule; count.textContent = `${sc.filter(b => b.done).length} de ${sc.length}`;
      });
    });

    // Libreta rápida
    root.querySelector('.i-add').addEventListener('submit', e => {
      e.preventDefault();
      const t = e.target.t.value.trim(); if (!t) return;
      store.set(st => { st.notes.unshift({ id: ui.uid('n'), text: t, created: ui.iso(new Date()), done: false }); });
    });

    return () => clearInterval(iv);
  },
};
