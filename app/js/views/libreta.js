// Vista "Libreta": notas rápidas con casilla.
let refocus = false;

export default {
  title: 'Libreta',
  render(root, { store, ui }) {
    const { iso, addDays, taskHtml, toggleTask } = ui;
    const now = new Date(), hoy = iso(now), ayer = iso(addDays(now, -1));
    const notes = store.get().notes;
    const groups = [['Hoy', n => n.created >= hoy], ['Ayer', n => n.created === ayer], ['Antes', n => n.created < ayer]];
    const sec = groups.map(([name, f]) => {
      const l = notes.filter(f).sort((a, b) => a.done - b.done);
      return l.length ? `<section><h3 class="label">${name}</h3>${l.map(n => `<div class="nrow">${taskHtml(n.id, n.text, n.done)}<button class="x" data-del="${n.id}" aria-label="Borrar nota">×</button></div>`).join('')}</section>` : '';
    }).join('');
    root.innerHTML = `<div class="v-libreta"><div class="page-head"><h1>Libreta</h1></div>
      <p class="muted note">Acá también voy a anotar yo (Claude) cuando me lo pidas.</p>
      <form class="quick"><input class="input" name="text" placeholder="Anotá algo y apretá Enter" autocomplete="off" maxlength="200" aria-label="Nueva nota"><button class="btn" type="submit">Anotar</button></form>
      <div class="card nlist">${sec || '<p class="muted">Todavía no hay notas.</p>'}</div></div>`;
    if (refocus) { refocus = false; root.querySelector('input').focus(); }

    root.onsubmit = e => {
      e.preventDefault();
      const text = new FormData(e.target).get('text').trim();
      if (!text) return;
      refocus = true;
      store.set(s => s.notes.unshift({ id: ui.uid('n'), text, created: iso(new Date()), done: false }));
    };
    root.onclick = e => {
      const del = e.target.closest('[data-del]'), t = e.target.closest('.task');
      if (del) store.set(s => { s.notes = s.notes.filter(n => n.id !== del.dataset.del); });
      else if (t) toggleTask(t, done => store.set(s => { s.notes.find(n => n.id === t.dataset.id).done = done; }, { quiet: true }));
    };
    return () => { root.onclick = root.onsubmit = null; };
  },
};
