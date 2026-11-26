// Vista "Más": acceso a las secciones secundarias (celular).
const DESC = { colegio: 'Horario, materias y evaluaciones', finanzas: 'Vencimientos y gastos', musica: 'Devocional y momentos especiales', ajustes: 'Intro, datos y pantalla de espera' };

export default {
  title: 'Más',
  render(root, { NAV, ui }) {
    root.innerHTML = `<div class="v-mas"><div class="page-head"><h1>Más</h1></div><nav class="mas-list">${
      NAV.filter(n => n.secondary).map(n => `<a href="#/${n.id}"><span class="ic">${n.ic}</span><span class="t"><b class="serif">${ui.esc(n.name)}</b><small class="muted">${DESC[n.id] || ''}</small></span><span class="ar">→</span></a>`).join('')}</nav></div>`;
  },
};
