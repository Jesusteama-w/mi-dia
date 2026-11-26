// Pantalla de espera: rota Calendario → Cronograma → Alarmas (10 s cada una) hasta que toques algo.
import { store } from './store.js';
import * as ui from './ui.js';

const SLIDE_MS = 10_000;
const el = document.getElementById('afk');
let timers = [], idx = 0;

function slideMes(s) {
  const d = new Date(), cells = ui.monthCells(d.getFullYear(), d.getMonth()), today = ui.iso(d);
  const evs = {}; s.events.forEach(e => (evs[e.date] ||= []).push(e));
  return `<h2>${ui.cap(ui.MESES[d.getMonth()])} ${d.getFullYear()}</h2>
  <div class="a-mgrid">${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(x => `<b>${x}</b>`).join('')}
  ${cells.map(c => { if (!c) return '<div></div>'; const k = ui.iso(c);
    return `<div class="${k === today ? 'today' : ''}"><span>${c.getDate()}</span>${(evs[k] || []).slice(0, 2).map(e => `<em><i class="dot" style="--c:${ui.CATS[e.cat]?.c}"></i>${ui.esc(e.title)}</em>`).join('')}</div>`; }).join('')}</div>`;
}
function slideDia(s) {
  const m = ui.nowMin(), cur = ui.currentBlock(s.schedule, m).now;
  return `<h2>Cronograma de hoy</h2><div class="a-rows">${s.schedule.map(b => {
    const cls = b === cur ? 'now' : ui.toMin(b.end) <= m ? 'past' : '';
    return `<div class="a-row ${cls}"><span>${b.start}</span><span>${ui.esc(b.title)}</span><span>${b === cur ? 'AHORA' : b.done ? '✓' : ''}</span></div>`; }).join('')}</div>`;
}
function slideAlarmas(s) {
  const m = ui.nowMin(), list = [...s.alarms].filter(a => a.on).sort((a, b) => ui.toMin(a.time) - ui.toMin(b.time));
  const next = list.find(a => ui.toMin(a.time) > m);
  return `<h2>Alarmas de hoy</h2><div class="a-rows">${list.map(a => `<div class="a-row ${ui.toMin(a.time) <= m ? 'past' : a === next ? 'now' : ''}">
    <span>${a.time}</span><span>${ui.esc(a.title)}</span><span class="tag">${a.kind === 'despertador' ? 'despertador' : 'aviso'} · ${a.device}${a.spotify ? ' · spotify' : ''}</span></div>`).join('')}</div>`;
}
const SLIDES = [slideMes, slideDia, slideAlarmas];

async function paint() {
  const s = store.get(), d = new Date(), v = ui.verseOfDay(s.verses);
  el.innerHTML = `
    <div class="ink" style="width:220px;height:170px;right:-60px;bottom:-70px"></div>
    <div class="ink" style="width:34px;height:34px;right:180px;bottom:60px"></div>
    <div class="ink" style="width:14px;height:14px;right:120px;bottom:150px"></div>
    <div class="top">
      <div><div class="clock">${ui.hhmm(d)}</div><div class="date">${ui.longDate(d)}</div></div>
      <div class="verse">${ui.verseText(v)}<small>Versículo del día · ${ui.esc(v.ref)} · NVI</small></div>
      <div class="mk">${await ui.logoSvg()}</div>
    </div>
    <div class="stage">${SLIDES.map((f, i) => `<section class="slide${i === idx ? ' on' : ''}">${f(s)}</section>`).join('')}</div>
    <div class="foot">
      <div class="dots">${SLIDES.map((_, i) => `<i class="${i === idx ? 'on' : ''}"></i>`).join('')}</div>
      <div class="bar prog"><i></i></div>
      <div class="hint">Tocá o hacé clic para entrar</div>
    </div>`;
  runBar();
}
function runBar() {
  const bar = el.querySelector('.prog i'); if (!bar) return;
  bar.style.transition = 'none'; bar.style.width = '0';
  bar.getBoundingClientRect();
  bar.style.transition = `width ${SLIDE_MS}ms linear`; bar.style.width = '100%';
}
function next() {
  idx = (idx + 1) % SLIDES.length;
  const s = store.get();
  el.querySelectorAll('.slide').forEach((sl, i) => { if (i === idx) sl.innerHTML = SLIDES[i](s); sl.classList.toggle('on', i === idx); });
  el.querySelectorAll('.dots i').forEach((d, i) => d.classList.toggle('on', i === idx));
  runBar();
}
function tickClock() { const c = el.querySelector('.clock'); if (c) c.textContent = ui.hhmm(new Date()); }

function exit(e) {
  e?.preventDefault?.();
  afk.hide();
  afk.onExit?.();
}

export const afk = {
  onExit: null,
  get visible() { return !el.hidden; },
  async show() {
    if (!el.hidden) return;
    idx = 0;
    el.hidden = false; el.classList.add('fade');
    await paint();
    requestAnimationFrame(() => el.classList.remove('fade'));
    timers = [setInterval(next, SLIDE_MS), setInterval(tickClock, 15_000)];
    // se entra con clic, toque o tecla (mover el mouse no alcanza)
    setTimeout(() => { el.addEventListener('pointerdown', exit, { once: true }); addEventListener('keydown', exit, { once: true }); }, 400);
  },
  hide() {
    timers.forEach(clearInterval); timers = [];
    el.removeEventListener('pointerdown', exit); removeEventListener('keydown', exit);
    el.classList.add('fade');
    setTimeout(() => { el.hidden = true; el.classList.remove('fade'); }, 500);
  },
};
