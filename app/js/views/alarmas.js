// Vista "Alarmas".
let editId = null;
const KIND = { despertador: 'Despertador', aviso: 'Aviso' }, DEV = { celu: 'Celu', pc: 'PC', ambos: 'Celu + PC' };

export default {
  title: 'Alarmas',
  render(root, { store, ui }) {
    const { esc, toMin, nowMin } = ui;
    const draw = () => {
      const list = [...store.get().alarms].sort((a, b) => toMin(a.time) - toMin(b.time));
      const now = nowMin();
      const next = list.find(a => a.on && toMin(a.time) > now);
      const ed = list.find(a => a.id === editId) || { time: '07:00', title: '', kind: 'aviso', device: 'celu', spotify: false };
      const opts = (o, v) => Object.entries(o).map(([k, n]) => `<option value="${k}"${k === v ? ' selected' : ''}>${n}</option>`).join('');
      root.innerHTML = `<div class="v-alarmas">
        <div class="page-head"><h1>Alarmas</h1></div>
        <p class="note muted">El despertador suena solo en el celular, sin «5 min más». Los avisos salen en la PC, en el celu o en ambos.</p>
        <div class="al-main"><ul class="al-list">${list.map(a => {
          const past = toMin(a.time) <= now;
          return `<li class="al${a.on ? '' : ' off'}${past ? ' past' : ''}${next && next.id === a.id ? ' next' : ''}">
            <span class="time serif">${a.time}</span>
            <div class="info"><strong>${esc(a.title)}</strong>
              <div class="tags">${next && next.id === a.id ? '<span class="tag nx">Próxima</span>' : ''}<span class="tag">${KIND[a.kind]} · ${DEV[a.device]}</span>${a.spotify ? '<span class="tag">Spotify</span>' : ''}</div></div>
            <div class="acts"><button class="sw" data-tg="${a.id}" aria-pressed="${a.on}" aria-label="${a.on ? 'Apagar' : 'Prender'} ${esc(a.title)}"><i></i></button>
              <button class="btn ghost sm" data-ed="${a.id}">Editar</button>
              <button class="x" data-del="${a.id}" aria-label="Borrar ${esc(a.title)}">×</button></div></li>`;
        }).join('') || '<li class="muted">No hay alarmas.</li>'}</ul>
        <form class="card addf"><h3>${editId ? 'Editar alarma' : 'Nueva alarma'}</h3>
          <label class="label">Hora<input class="input" type="time" name="time" value="${ed.time}" required></label>
          <label class="label">Título<input class="input" name="title" value="${esc(ed.title)}" required maxlength="60"></label>
          <label class="label">Tipo<select class="input" name="kind">${opts(KIND, ed.kind)}</select></label>
          <label class="label">Dónde suena<select class="input" name="device">${opts(DEV, ed.device)}</select></label>
          <label class="chk"><input type="checkbox" name="spotify"${ed.spotify ? ' checked' : ''}> Con música de Spotify</label>
          <div class="row"><button class="btn" type="submit">${editId ? 'Guardar' : 'Agregar'}</button>${editId ? '<button class="btn ghost" type="button" data-cancel>Cancelar</button>' : ''}</div></form></div></div>`;
    };
    root.onclick = e => {
      const t = e.target.closest('[data-tg],[data-ed],[data-del],[data-cancel]');
      if (!t) return;
      if (t.dataset.tg) store.set(s => { const a = s.alarms.find(x => x.id === t.dataset.tg); a.on = !a.on; });
      else if (t.dataset.ed) { editId = t.dataset.ed; draw(); root.querySelector('[name=title]').focus(); }
      else if (t.dataset.del) { if (editId === t.dataset.del) editId = null; store.set(s => { s.alarms = s.alarms.filter(x => x.id !== t.dataset.del); }); }
      else { editId = null; draw(); }
    };
    root.onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target), v = { time: f.get('time'), title: f.get('title').trim(), kind: f.get('kind'), device: f.get('device'), spotify: f.has('spotify') };
      if (!v.title || !v.time) return;
      store.set(s => { const a = editId && s.alarms.find(x => x.id === editId); if (a) Object.assign(a, v); else s.alarms.push({ id: ui.uid('a'), on: true, ...v }); });
      editId = null;
    };
    draw();
    const iv = setInterval(() => { if (!root.contains(document.activeElement) || document.activeElement === document.body) draw(); }, 60000);
    return () => { clearInterval(iv); root.onclick = root.onsubmit = null; };
  },
};
