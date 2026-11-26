// Vista "Día": línea de tiempo del cronograma.
export default {
  title: 'Día',
  render(root, { store, ui }) {
    const { esc, toMin, nowMin, taskHtml, toggleTask } = ui;
    const find = id => { for (const b of store.get().schedule) { if (b.id === id) return b; const s = b.subtasks.find(x => x.id === id); if (s) return s; } };

    root.innerHTML = `<div class="v-dia"><div class="page-head"><h1>Día</h1><span class="muted" id="dstat"></span></div>
      <div class="dia-main"><div><ol class="tl" id="tl"></ol></div>
      <aside class="side"><div class="card" id="cur"></div>
        <form class="card addf" id="addb"><h3>Agregar bloque</h3>
          <div class="two"><label class="label">Desde<input class="input" type="time" name="start" required></label>
          <label class="label">Hasta<input class="input" type="time" name="end" required></label></div>
          <input class="input" name="title" placeholder="Qué vas a hacer" required maxlength="80" aria-label="Título">
          <button class="btn" type="submit">Agregar</button><p class="muted small" id="err" role="alert"></p></form></aside></div></div>`;
    const tl = root.querySelector('#tl'), cur = root.querySelector('#cur');

    const drawTl = () => {
      const sch = store.get().schedule;
      tl.innerHTML = sch.map(b => {
        const dur = toMin(b.end) - toMin(b.start);
        return `<li class="blk" data-b="${b.id}" style="min-height:${Math.max(4.2, dur / 60 * 3.4).toFixed(1)}rem">
          <span class="hrs serif">${b.start}<small>${b.end}</small></span>
          <div class="body"><span class="ahora" hidden>Ahora</span>
            <div class="top">${taskHtml(b.id, b.title, b.done)}<button class="x" data-delb="${b.id}" aria-label="Borrar ${esc(b.title)}">×</button></div>
            <div class="bar" hidden><i></i></div>
            ${b.subtasks.length ? `<div class="subs">${b.subtasks.map(s => taskHtml(s.id, s.t, s.done)).join('')}</div>` : ''}</div></li>`;
      }).join('');
      tick();
    };
    const stats = () => {
      const sch = store.get().schedule, d = sch.filter(b => b.done).length;
      root.querySelector('#dstat').textContent = `${d} de ${sch.length} hechos`;
      const w = root.querySelector('#dpg'), p = root.querySelector('#dpn');
      if (w) w.style.width = (sch.length ? d / sch.length * 100 : 0) + '%';
      if (p) p.innerHTML = `<b>${d}</b> de ${sch.length}`;
      return [d, sch.length];
    };
    const tick = () => {
      const sch = store.get().schedule, m = nowMin(), c = ui.currentBlock(sch, m);
      tl.querySelectorAll('.blk').forEach(li => {
        const b = sch.find(x => x.id === li.dataset.b); if (!b) return;
        const isNow = c.now && c.now.id === b.id;
        li.classList.toggle('now', !!isNow);
        li.classList.toggle('past', toMin(b.end) <= m);
        li.querySelector('.ahora').hidden = !isNow;
        const bar = li.querySelector('.bar'); bar.hidden = !isNow;
        if (isNow) bar.firstElementChild.style.width = (c.pct * 100).toFixed(1) + '%';
      });
      const d = sch.filter(b => b.done).length, n = sch.length;
      cur.innerHTML = `<span class="label">Bloque actual</span>` + (c.now
        ? `<h3 class="serif">${esc(c.now.title)}</h3><p class="muted small">${c.now.start}–${c.now.end} · faltan ${c.left} min</p>
           <div class="bar"><i style="width:${(c.pct * 100).toFixed(1)}%"></i></div>
           ${c.now.subtasks.length ? `<div class="subs">${c.now.subtasks.map(s => taskHtml(s.id, s.t, s.done)).join('')}</div>` : ''}`
        : `<h3 class="serif">Nada en este momento</h3><p class="muted small">${c.next ? `Sigue: ${esc(c.next.title)} a las ${c.next.start}` : 'Terminó el día.'}</p>`) +
        `<span class="label dp">Progreso del día</span><p class="serif big" id="dpn"></p><div class="bar"><i id="dpg"></i></div>`;
      stats();
    };
    const sync = () => {
      root.querySelectorAll('.task').forEach(t => { const o = find(t.dataset.id); if (o) { t.classList.toggle('done', o.done); t.setAttribute('aria-pressed', o.done); } });
      stats();
    };

    root.onclick = e => {
      const del = e.target.closest('[data-delb]'), t = e.target.closest('.task');
      if (del) store.set(s => { s.schedule = s.schedule.filter(b => b.id !== del.dataset.delb); });
      else if (t) toggleTask(t, done => {
        store.set(s => { for (const b of s.schedule) { if (b.id === t.dataset.id) b.done = done; b.subtasks.forEach(x => { if (x.id === t.dataset.id) x.done = done; }); } }, { quiet: true });
        sync();
      });
    };
    root.onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target), start = f.get('start'), end = f.get('end'), title = f.get('title').trim();
      if (!title || toMin(end) <= toMin(start)) { root.querySelector('#err').textContent = 'La hora de fin tiene que ser después del inicio.'; return; }
      store.set(s => { s.schedule.push({ id: ui.uid('b'), start, end, title, done: false, subtasks: [] }); s.schedule.sort((a, b) => toMin(a.start) - toMin(b.start)); });
    };
    drawTl();
    const iv = setInterval(tick, 30000);
    return () => { clearInterval(iv); root.onclick = root.onsubmit = null; };
  },
};
