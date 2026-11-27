// Vista "Finanzas": gastos del mes, donut por categoría, categorías y vencimientos.
const PALETTE = ['#c4862a', '#5b5346', '#7a6a55', '#8d988d', '#b9a98a', '#4f4a40', '#a35f2a', '#6f7f94'];
const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
let ym = null, selCat = null, newColor = PALETTE[0], hl = null;

export default {
  title: 'Finanzas',
  render(root, { store, ui }) {
    const { esc, iso, parseIso, cap, MESES, DIAS } = ui;
    const today = iso(new Date());
    if (!ym) { const n = new Date(); ym = { y: n.getFullYear(), m: n.getMonth() }; }

    const short = k => { const d = parseIso(k); return `${DIAS[d.getDay()].slice(0, 3)} ${d.getDate()}`; };
    const polar = (r, a) => [100 + r * Math.cos(a), 100 + r * Math.sin(a)];
    const seg = (a0, a1) => {
      const R = 88, r = 56, big = a1 - a0 > Math.PI ? 1 : 0;
      const [x0, y0] = polar(R, a0), [x1, y1] = polar(R, a1), [x2, y2] = polar(r, a1), [x3, y3] = polar(r, a0);
      return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${R} ${R} 0 ${big} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}A${r} ${r} 0 ${big} 0 ${x3.toFixed(2)} ${y3.toFixed(2)}Z`;
    };

    const draw = () => {
      const st = store.get(), fin = st.finanzas;
      const cats = fin.cats, catOf = id => cats.find(c => c.id === id) || { name: 'Sin categoría', color: '#7a6a55' };
      if (!selCat || !cats.some(c => c.id === selCat)) selCat = cats[0]?.id || null;
      const pre = `${ym.y}-${String(ym.m + 1).padStart(2, '0')}-`;
      const gs = fin.gastos.filter(g => g.date.startsWith(pre)).sort((a, b) => b.date.localeCompare(a.date));
      const total = gs.reduce((s, g) => s + g.amount, 0);

      const byCat = cats.map(c => ({ ...c, sum: gs.filter(g => g.cat === c.id).reduce((s, g) => s + g.amount, 0) }))
        .filter(c => c.sum > 0).sort((a, b) => b.sum - a.sum);
      let acc = -Math.PI / 2;
      const segs = byCat.map(c => {
        const a0 = acc, a1 = Math.min(acc + (c.sum / total) * Math.PI * 2, a0 + Math.PI * 2 - 0.0001);
        acc += (c.sum / total) * Math.PI * 2;
        return `<path class="seg" data-cat="${c.id}" tabindex="0" d="${seg(a0, a1)}" fill="${c.color}" stroke="var(--card)" stroke-width="2" aria-label="${esc(c.name)}: ${money.format(c.sum)}"/>`;
      }).join('');

      const groups = [];
      gs.forEach(g => { const last = groups[groups.length - 1]; if (last && last.d === g.date) last.items.push(g); else groups.push({ d: g.date, items: [g] }); });

      const venc = st.events.filter(e => e.cat === 'finanzas' && e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
      const used = id => fin.gastos.some(g => g.cat === id);

      root.innerHTML = `<div class="v-finanzas">
        <div class="page-head"><h1>Finanzas</h1>
          <div class="fn-nav"><button class="btn ghost" data-nav="-1" aria-label="Mes anterior">◀</button>
          <span class="fn-mes serif">${cap(MESES[ym.m])} ${ym.y}</span>
          <button class="btn ghost" data-nav="1" aria-label="Mes siguiente">▶</button></div></div>
        <div class="fn-main">
          <div class="fn-col">
            <div class="card fn-total"><span class="label">Gastado en el mes</span><div class="fn-big serif">${money.format(total)}</div></div>
            <form class="card addf fn-form"><h3>Anotar un gasto</h3>
              <input class="input" name="amount" type="number" min="1" step="1" inputmode="numeric" placeholder="Monto en pesos" required aria-label="Monto">
              <div class="fn-chips" role="radiogroup" aria-label="Categoría">${cats.map(c =>
                `<button type="button" class="chip${c.id === selCat ? ' on' : ''}" data-chip="${c.id}" role="radio" aria-checked="${c.id === selCat}"><i class="dot" style="--c:${c.color}"></i>${esc(c.name)}</button>`).join('')}${ui.addChip('fn')}</div>
              <input class="input" name="desc" maxlength="80" placeholder="Descripción (opcional)" aria-label="Descripción">
              <input class="input" name="date" type="date" value="${today}" required aria-label="Fecha">
              <button class="btn" type="submit">Agregar gasto</button></form>
            <div class="card fn-list"><h3>Gastos del mes</h3>
              ${groups.length ? groups.map(gr => `<div class="fn-day"><span class="label">${esc(short(gr.d))}</span>
                ${gr.items.map(g => { const c = catOf(g.cat); return `<div class="fn-row"><i class="dot" style="--c:${c.color}"></i>
                  <div class="fn-d"><span>${esc(g.desc || c.name)}</span><span class="muted small">${esc(c.name)}</span></div>
                  <b class="serif">${money.format(g.amount)}</b>
                  <button class="x" data-del="${g.id}" aria-label="Borrar gasto">×</button></div>`; }).join('')}</div>`).join('')
                : '<p class="muted">Todavía no anotaste gastos este mes.</p>'}</div>
          </div>
          <div class="fn-col">
            <div class="card fn-chart"><h3>Por categoría</h3>
              ${total ? `<div class="fn-donut"><svg viewBox="0 0 200 200" role="img" aria-label="Gastos por categoría">${segs}</svg>
                <div class="fn-center"><span class="label">Total</span><b class="serif">${money.format(total)}</b></div></div>
                <ul class="fn-legend">${byCat.map(c => `<li class="lg" data-cat="${c.id}" tabindex="0"><i class="dot" style="--c:${c.color}"></i><span class="nm">${esc(c.name)}</span><span class="am">${money.format(c.sum)}</span><span class="pc muted">${Math.round(c.sum / total * 100)}%</span></li>`).join('')}</ul>`
                : '<p class="muted">Cuando anotes gastos, acá ves en qué se va la plata.</p>'}</div>
            <div class="card"><h3>Próximos vencimientos</h3>
              ${venc.length ? `<ul class="fn-venc">${venc.map(e => `<li><span class="label">${esc(short(e.date))}</span><span>${esc(e.title)}</span></li>`).join('')}</ul>`
                : '<p class="muted">No hay vencimientos anotados.</p>'}
              <p class="small"><a href="#/mes">Agregar más en el calendario →</a></p></div>
            <details class="card drawer" data-drawer="fn"${window.__drawers?.fn ? ' open' : ''}><summary>Editar categorías</summary>
              <ul class="fn-cats">${cats.map(c => `<li><i class="dot" style="--c:${c.color}"></i><span>${esc(c.name)}</span>
                ${used(c.id) ? '<span class="muted small">en uso</span>' : `<button class="x" data-delcat="${c.id}" aria-label="Borrar categoría ${esc(c.name)}">×</button>`}</li>`).join('')}</ul>
              <form class="addf fn-catf"><span class="label">Nueva categoría</span>
                <input class="input" name="cname" maxlength="30" placeholder="Nombre" required aria-label="Nombre de la categoría">
                <div class="fn-pal" role="radiogroup" aria-label="Color">${PALETTE.map(p => `<button type="button" class="sw${p === newColor ? ' on' : ''}" data-color="${p}" style="--c:${p}" role="radio" aria-checked="${p === newColor}" aria-label="Color ${p}"></button>`).join('')}</div>
                <button class="btn" type="submit">Agregar categoría</button></form></details>
          </div>
        </div>
        <p class="muted small fn-note">Esto es para ordenar tus gastos. No es asesoramiento financiero.</p></div>`;
      applyHl();
    };

    const applyHl = () => {
      const w = root.querySelector('.v-finanzas'); if (!w) return;
      w.classList.toggle('has-hl', !!hl);
      w.querySelectorAll('[data-cat]').forEach(el => el.classList.toggle('hl', el.dataset.cat === hl));
    };
    const hover = e => { const t = e.target.closest?.('.seg,.lg'); const v = t ? t.dataset.cat : null; if (v !== hl) { hl = v; applyHl(); } };

    root.onmouseover = root.onfocusin = hover;
    root.onmouseout = e => { if (!e.relatedTarget || !root.contains(e.relatedTarget) || !e.relatedTarget.closest?.('.seg,.lg')) { if (hl) { hl = null; applyHl(); } } };
    root.onfocusout = () => { if (hl) { hl = null; applyHl(); } };

    root.onclick = e => {
      const add = e.target.closest('[data-addcat]');
      if (add) { ui.addChipInput(add, name => { const id = ui.uid('c'); selCat = id; store.set(s => s.finanzas.cats.push({ id, name, color: ui.colorLibre(s.finanzas.cats.map(c => c.color)) })); }); return; }
      const nav = e.target.closest('[data-nav]'), chip = e.target.closest('[data-chip]'), del = e.target.closest('[data-del]'),
        dc = e.target.closest('[data-delcat]'), col = e.target.closest('[data-color]');
      if (nav) { const d = new Date(ym.y, ym.m + +nav.dataset.nav, 1); ym = { y: d.getFullYear(), m: d.getMonth() }; hl = null; draw(); }
      else if (chip) {
        selCat = chip.dataset.chip;
        root.querySelectorAll('[data-chip]').forEach(c => { const on = c === chip; c.classList.toggle('on', on); c.setAttribute('aria-checked', on); });
      } else if (col) {
        newColor = col.dataset.color;
        root.querySelectorAll('[data-color]').forEach(c => { const on = c === col; c.classList.toggle('on', on); c.setAttribute('aria-checked', on); });
      } else if (del) store.set(s => { s.finanzas.gastos = s.finanzas.gastos.filter(g => g.id !== del.dataset.del); });
      else if (dc) store.set(s => {
        if (!s.finanzas.gastos.some(g => g.cat === dc.dataset.delcat)) s.finanzas.cats = s.finanzas.cats.filter(c => c.id !== dc.dataset.delcat);
      });
    };
    root.onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target);
      if (e.target.classList.contains('fn-form')) {
        const amount = Math.round(Number(f.get('amount')));
        if (!(amount > 0) || !selCat) return;
        const date = f.get('date') || today;
        ym = { y: +date.slice(0, 4), m: +date.slice(5, 7) - 1 };
        store.set(s => s.finanzas.gastos.push({ id: ui.uid('g'), date, amount, cat: selCat, desc: String(f.get('desc')).trim() }));
      } else if (e.target.classList.contains('fn-catf')) {
        const name = String(f.get('cname')).trim();
        if (!name) return;
        store.set(s => s.finanzas.cats.push({ id: ui.uid('c'), name, color: newColor }));
      }
    };
    draw();
    return () => { root.onclick = root.onsubmit = root.onmouseover = root.onmouseout = root.onfocusin = root.onfocusout = null; hl = null; };
  },
};
