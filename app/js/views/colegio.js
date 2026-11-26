// Vista "Colegio": lo de mañana, alta de pendientes y tablero por categoría.
let selCat = null, selMat = null;

export default {
  title: 'Colegio',
  render(root, { store, ui }) {
    const { esc, iso, addDays, parseIso, DIAS } = ui;
    const tomorrow = iso(addDays(new Date(), 1));
    const short = k => { const d = parseIso(k); return `${DIAS[d.getDay()].slice(0, 3)} ${d.getDate()}`; };

    const draw = () => {
      const st = store.get(), co = st.colegio, items = co.items;
      if (!selCat || !co.cats.includes(selCat)) selCat = co.cats[0];
      if (selMat && !co.materias.includes(selMat)) selMat = null;
      const tom = items.filter(i => i.date === tomorrow && !i.done);
      const tomCats = co.cats.filter(c => tom.some(i => i.cat === c));
      const mats = st.tomorrow?.materias || [];

      root.innerHTML = `<div class="v-colegio">
        <div class="page-head"><h1>Colegio</h1></div>
        <div class="card co-tom"><h3>Mañana tenés</h3>
          ${mats.length ? `<p class="co-mats"><span class="label">Materias</span> ${mats.map(m => `<span class="tag">${esc(m)}</span>`).join(' ')}</p>` : ''}
          ${tomCats.length ? tomCats.map(c => `<div class="co-tc"><span class="label">${esc(c)}</span><ul>${tom.filter(i => i.cat === c).map(i =>
              `<li>${esc(i.text)}${i.materia ? ` <span class="tag">${esc(i.materia)}</span>` : ''}</li>`).join('')}</ul></div>`).join('')
            : '<p class="muted">No hay nada anotado para mañana.</p>'}</div>
        <form class="card addf co-form"><h3>Anotar algo</h3>
          <span class="label">Qué es</span>
          <div class="co-chips" role="radiogroup" aria-label="Categoría">${co.cats.map(c => `<button type="button" class="chip${c === selCat ? ' on' : ''}" data-cat="${esc(c)}" role="radio" aria-checked="${c === selCat}">${esc(c)}</button>`).join('')}</div>
          <span class="label">De qué materia</span>
          <div class="co-chips" role="radiogroup" aria-label="Materia">${co.materias.map(m => `<button type="button" class="chip${m === selMat ? ' on' : ''}" data-mat="${esc(m)}" role="radio" aria-checked="${m === selMat}">${esc(m)}</button>`).join('') || '<span class="muted small">Agregá una materia abajo.</span>'}</div>
          <div class="co-row"><input class="input" name="text" maxlength="120" placeholder="Qué tenés que hacer o llevar" required aria-label="Texto">
          <input class="input" name="date" type="date" aria-label="Fecha (opcional)"></div>
          <button class="btn" type="submit">Agregar</button></form>
        <div class="co-board">${co.cats.map(c => {
          const list = items.filter(i => i.cat === c).sort((a, b) => (a.done - b.done) || (a.date || '9').localeCompare(b.date || '9'));
          return `<section class="card co-card"><h3>${esc(c)} <span class="muted small">${list.filter(i => !i.done).length || ''}</span></h3>
            ${list.length ? list.map(i => `<div class="co-it${i.done ? ' dn' : ''}">
              ${ui.taskHtml(i.id, i.text, i.done)}
              <span class="co-meta">${i.materia ? `<span class="tag">${esc(i.materia)}</span>` : ''}${i.date ? `<span class="muted small">${esc(short(i.date))}</span>` : ''}</span>
              <button class="x" data-del="${i.id}" aria-label="Borrar ${esc(i.text)}">×</button></div>`).join('')
              : '<p class="muted small">Vacío.</p>'}</section>`;
        }).join('')}</div>
        <details class="card drawer co-mgr" data-drawer="co"${window.__drawers?.co ? ' open' : ''}><summary>Editar categorías y materias</summary>
          <span class="label">Categorías</span>
          <ul class="co-ml">${co.cats.map(c => `<li><span>${esc(c)}</span>${co.items.some(i => i.cat === c) ? '<span class="muted small">en uso</span>' : `<button class="x" data-delcat="${esc(c)}" aria-label="Borrar ${esc(c)}">×</button>`}</li>`).join('')}</ul>
          <form class="co-catf"><input class="input" name="cat" maxlength="30" placeholder="Nueva categoría" required aria-label="Nueva categoría"><button class="btn" type="submit">Agregar</button></form>
          <span class="label" style="display:block;margin-top:1rem">Materias</span>
          <ul class="co-ml">${co.materias.map(m => `<li><span>${esc(m)}</span><button class="x" data-delmat="${esc(m)}" aria-label="Borrar ${esc(m)}">×</button></li>`).join('')}</ul>
          <form class="co-matf"><input class="input" name="mat" maxlength="40" placeholder="Nueva materia" required aria-label="Nueva materia"><button class="btn" type="submit">Agregar</button></form></details>
        <p class="muted small">Más adelante se conecta con tu eClass.</p></div>`;
    };

    const setOn = (sel, el, attr) => root.querySelectorAll(sel).forEach(c => { const on = c === el; c.classList.toggle('on', on); c.setAttribute('aria-checked', on); });

    root.onclick = e => {
      const cat = e.target.closest('[data-cat]'), mat = e.target.closest('[data-mat]'), del = e.target.closest('[data-del]'),
        dm = e.target.closest('[data-delmat]'), dc = e.target.closest('[data-delcat]'), task = e.target.closest('.task');
      if (cat) { selCat = cat.dataset.cat; setOn('.co-form [data-cat]', cat); }
      else if (mat) {
        selMat = selMat === mat.dataset.mat ? null : mat.dataset.mat;
        root.querySelectorAll('[data-mat]').forEach(c => { const on = c.dataset.mat === selMat; c.classList.toggle('on', on); c.setAttribute('aria-checked', on); });
      } else if (del) store.set(s => { s.colegio.items = s.colegio.items.filter(i => i.id !== del.dataset.del); });
      else if (dc) store.set(s => { if (!s.colegio.items.some(i => i.cat === dc.dataset.delcat)) s.colegio.cats = s.colegio.cats.filter(c => c !== dc.dataset.delcat); });
      else if (dm) store.set(s => { s.colegio.materias = s.colegio.materias.filter(m => m !== dm.dataset.delmat); });
      else if (task) ui.toggleTask(task, done => {
        store.set(s => { const it = s.colegio.items.find(i => i.id === task.dataset.id); if (it) it.done = done; }, { quiet: true });
        task.closest('.co-it')?.classList.toggle('dn', done);
      });
    };
    root.onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target);
      if (e.target.classList.contains('co-form')) {
        const text = String(f.get('text')).trim();
        if (!text) return;
        store.set(s => s.colegio.items.push({ id: ui.uid('c'), cat: selCat, materia: selMat || '', text, date: f.get('date') || '', done: false }));
      } else if (e.target.classList.contains('co-catf')) {
        const c = String(f.get('cat')).trim();
        if (c) store.set(s => { if (!s.colegio.cats.includes(c)) s.colegio.cats.push(c); });
      } else if (e.target.classList.contains('co-matf')) {
        const m = String(f.get('mat')).trim();
        if (!m) return;
        store.set(s => { if (!s.colegio.materias.includes(m)) s.colegio.materias.push(m); });
      }
    };
    draw();
    return () => { root.onclick = root.onsubmit = null; };
  },
};
