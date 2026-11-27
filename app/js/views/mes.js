// Vista "Mes": calendario mensual con eventos por día.
let ym = null, sel = null, newEv = null;

export default {
  title: 'Mes',
  render(root, { store, ui }) {
    const { esc, iso, parseIso, longDate, cap, MESES } = ui;
    const today = iso(new Date());
    if (!ym) { const n = new Date(); ym = { y: n.getFullYear(), m: n.getMonth() }; }
    if (!sel) sel = today;

    const draw = () => {
      const events = store.get().events, CATS = ui.evCats(store.get());
      const by = {};
      events.forEach(e => (by[e.date] ??= []).push(e));
      const cells = ui.monthCells(ym.y, ym.m).map(d => {
        if (!d) return '<div class="cell empty" aria-hidden="true"></div>';
        const k = iso(d), ev = by[k] || [];
        return `<button class="cell${k === today ? ' today' : ''}${k === sel ? ' sel' : ''}" data-d="${k}" aria-label="${esc(longDate(d))}, ${ev.length} eventos">` +
          `<span class="num">${d.getDate()}</span>` +
          ev.slice(0, 3).map(e => `<span class="ev"><i class="dot" style="--c:${CATS[e.cat]?.c}"></i><span>${esc(e.title)}</span></span>`).join('') +
          (ev.length > 3 ? `<span class="more">+${ev.length - 3} más</span>` : '') + `</button>`;
      }).join('');
      const dayEv = by[sel] || [];
      root.innerHTML = `<div class="v-mes">
        <div class="page-head"><h1>${cap(MESES[ym.m])} <span class="muted">${ym.y}</span></h1>
          <div class="nav-m"><button class="btn ghost" data-nav="-1" aria-label="Mes anterior">◀</button>
          <button class="btn ghost" data-nav="0">Hoy</button>
          <button class="btn ghost" data-nav="1" aria-label="Mes siguiente">▶</button></div></div>
        <div class="legend chips">${Object.values(CATS).map(c => `<span><i class="dot" style="--c:${c.c}"></i>${esc(c.name)}</span>`).join('')}${ui.addChip('ev')}</div>
        <div class="mes-main">
          <div class="cal"><div class="dow">${['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map(d => `<span class="label">${d}</span>`).join('')}</div>
            <div class="grid">${cells}</div></div>
          <aside class="card day-panel"><h3>${cap(longDate(parseIso(sel)))}</h3>
            ${dayEv.length ? `<ul class="evlist">${dayEv.map(e => `<li><i class="dot" style="--c:${CATS[e.cat]?.c}"></i>
              <div><strong>${esc(e.title)}</strong><div class="muted small">${CATS[e.cat]?.name || ''}${e.note ? ' · ' + esc(e.note) : ''}</div></div>
              <button class="x" data-del="${e.id}" aria-label="Borrar ${esc(e.title)}">×</button></li>`).join('')}</ul>`
              : '<p class="muted">Nada anotado este día.</p>'}
            <form class="addf"><span class="label">Agregar evento</span>
              <input class="input" name="title" placeholder="Título" required maxlength="80" aria-label="Título">
              <select class="input" name="cat" aria-label="Categoría">${Object.entries(CATS).map(([k, c]) => `<option value="${k}"${k === newEv ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
              <input class="input" name="note" placeholder="Nota (opcional)" maxlength="120" aria-label="Nota">
              <button class="btn" type="submit">Agregar</button></form>
          </aside></div></div>`;
    };

    root.onclick = e => {
      const add = e.target.closest('[data-addcat]');
      if (add) { ui.addChipInput(add, name => { const id = ui.uid('k'); newEv = id; store.set(s => { const cs = (s.eventCats ||= []); cs.push({ id, name, color: ui.colorLibre(Object.values(ui.evCats(s)).map(c => c.c)) }); }); }); return; }
      const nav = e.target.closest('[data-nav]'), cell = e.target.closest('[data-d]'), del = e.target.closest('[data-del]');
      if (nav) {
        const k = +nav.dataset.nav;
        if (k === 0) { const n = new Date(); ym = { y: n.getFullYear(), m: n.getMonth() }; sel = today; }
        else { const d = new Date(ym.y, ym.m + k, 1); ym = { y: d.getFullYear(), m: d.getMonth() }; sel = iso(d); }
        draw();
      } else if (cell) { sel = cell.dataset.d; draw(); }
      else if (del) store.set(s => { s.events = s.events.filter(x => x.id !== del.dataset.del); });
    };
    root.onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target), title = f.get('title').trim();
      if (!title) return;
      store.set(s => s.events.push({ id: ui.uid('e'), date: sel, title, cat: f.get('cat'), note: f.get('note').trim() }));
    };
    draw();
    return () => { root.onclick = root.onsubmit = null; };
  },
};
