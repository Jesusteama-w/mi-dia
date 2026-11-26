// Datos de EJEMPLO genéricos (el código es público). Los datos reales viven en Supabase, detrás del login.
import { iso, addDays } from './ui.js';

let n = 0; const id = p => `${p}${++n}`;
const blk = (start, end, title, subs = []) => ({ id: id('b'), start, end, title, done: false, subtasks: subs.map(t => ({ id: id('s'), t, done: false })) });

export const VERSES = [
  { t: 'Yo les he dicho estas cosas para que en mí hallen paz. En este mundo afrontarán aflicciones, pero ¡anímense! Yo he vencido al mundo.', ref: 'Juan 16:33' },
  { t: 'El Señor es mi pastor, nada me falta.', ref: 'Salmo 23:1' },
  { t: 'Todo lo puedo en Cristo que me fortalece.', ref: 'Filipenses 4:13' },
  { t: 'Confía en el Señor de todo corazón, y no en tu propia inteligencia. Reconócelo en todos tus caminos, y él allanará tus sendas.', ref: 'Proverbios 3:5-6' },
  { t: 'Así que no temas, porque yo estoy contigo; no te angusties, porque yo soy tu Dios. Te fortaleceré y te ayudaré; te sostendré con mi diestra victoriosa.', ref: 'Isaías 41:10' },
  { t: '¡Sé fuerte y valiente! ¡No tengas miedo ni te desanimes! Porque el Señor tu Dios te acompañará dondequiera que vayas.', ref: 'Josué 1:9' },
  { t: 'El gran amor del Señor nunca se acaba, y su compasión jamás se agota. Cada mañana se renuevan sus bondades; ¡muy grande es su fidelidad!', ref: 'Lamentaciones 3:22-23' },
  { t: 'Más bien, busquen primeramente el reino de Dios y su justicia, y todas estas cosas les serán añadidas.', ref: 'Mateo 6:33' },
  { t: 'Sabemos que Dios dispone todas las cosas para el bien de quienes lo aman, los que han sido llamados de acuerdo con su propósito.', ref: 'Romanos 8:28' },
];

/** Secciones agregadas en la versión 2 (se suman a datos viejos sin borrar nada). */
export function extrasV2() {
  const hoy = new Date(), d = k => iso(addDays(hoy, k));
  const ym = iso(hoy).slice(0, 8);
  return {
    finanzas: {
      cats: [
        { id: 'comida', name: 'Comida', color: '#c4862a' },
        { id: 'rappi', name: 'Rappi', color: '#5b5346' },
        { id: 'personales', name: 'Gastos personales', color: '#7a6a55' },
        { id: 'transporte', name: 'Transporte', color: '#8d988d' },
        { id: 'servicios', name: 'Servicios (luz, gas)', color: '#b9a98a' },
        { id: 'colegio', name: 'Colegio', color: '#4f4a40' },
        { id: 'tarjetas', name: 'Tarjetas', color: '#a35f2a' },
      ],
      gastos: [
        { id: id('g'), date: ym + '03', amount: 18500, cat: 'comida', desc: 'Súper (ejemplo)' },
        { id: id('g'), date: ym + '08', amount: 9200, cat: 'rappi', desc: 'Pedido (ejemplo)' },
        { id: id('g'), date: ym + '12', amount: 6000, cat: 'transporte', desc: 'SUBE (ejemplo)' },
        { id: id('g'), date: ym + '15', amount: 24000, cat: 'servicios', desc: 'Luz (ejemplo)' },
        { id: id('g'), date: ym + '18', amount: 12000, cat: 'personales', desc: 'Auriculares (ejemplo)' },
        { id: id('g'), date: ym + '20', amount: 7400, cat: 'comida', desc: 'Verdulería (ejemplo)' },
        { id: id('g'), date: ym + '22', amount: 11000, cat: 'rappi', desc: 'Pedido (ejemplo)' },
      ],
    },
    colegio: {
      materias: ['Materia A', 'Materia B', 'Materia C', 'Materia D'],
      cats: ['Para llevar', 'Evaluación', 'TP', 'Investigación', 'Tarea', 'Pendiente'],
      items: [
        { id: id('c'), cat: 'Evaluación', materia: 'Materia B', text: 'Evaluación unidad 3 (ejemplo)', date: d(1), done: false },
        { id: id('c'), cat: 'Para llevar', materia: 'Materia B', text: 'Calculadora (ejemplo)', date: d(1), done: false },
        { id: id('c'), cat: 'TP', materia: 'Materia A', text: 'TP de lectura (ejemplo)', date: d(4), done: false },
        { id: id('c'), cat: 'Investigación', materia: 'Materia C', text: 'Buscar fuentes del tema 2 (ejemplo)', date: d(6), done: false },
        { id: id('c'), cat: 'Pendiente', materia: 'Materia D', text: 'Imprimir el PDF de eClass (ejemplo)', date: '', done: false },
      ],
    },
    musica: { devocionalAlbum: '', devocionalHora: '07:30' },
  };
}

export function ejemplo() {
  const hoy = new Date();
  const d = k => iso(addDays(hoy, k));
  return {
    v: 2,
    perfil: { nombre: '' },
    reading: 'Juan 1',
    // Texto NVI provisorio: reemplazar por la lista de Elias.
    verses: VERSES,
    schedule: [
      blk('07:00', '07:30', 'Despertar y orar', ['Orar', 'Tender la cama']),
      blk('07:30', '08:00', 'Devocional y Biblia', ['Poner música', 'Leer un capítulo']),
      blk('08:00', '08:30', 'Desayuno'),
      blk('08:30', '13:00', 'Estudio'),
      blk('13:00', '14:00', 'Almuerzo y descanso'),
      blk('14:00', '16:00', 'Tareas'),
      blk('16:00', '17:00', 'Orden y limpieza', ['Escritorio', 'Habitación']),
      blk('17:00', '19:00', 'Tiempo libre'),
      blk('19:00', '20:00', 'Cena'),
      blk('20:00', '21:00', 'Lectura y oración'),
      blk('21:00', '22:00', 'Preparar mañana y dormir', ['Mochila lista']),
    ],
    alarms: [
      { id: id('a'), time: '07:00', title: 'Despertar', kind: 'despertador', device: 'celu', spotify: false, on: true },
      { id: id('a'), time: '07:30', title: 'Devocional', kind: 'aviso', device: 'pc', spotify: true, on: true },
      { id: id('a'), time: '14:00', title: 'Hacer la tarea', kind: 'aviso', device: 'ambos', spotify: false, on: true },
      { id: id('a'), time: '21:00', title: 'A dormir', kind: 'aviso', device: 'ambos', spotify: false, on: true },
    ],
    events: [
      { id: id('e'), date: d(1), title: 'Evaluación de Materia B (ejemplo)', cat: 'colegio', note: 'Llevar calculadora' },
      { id: id('e'), date: d(1), title: 'Último día para pagar la luz (ejemplo)', cat: 'finanzas', note: '' },
      { id: id('e'), date: d(4), title: 'Entrega del TP de Materia A (ejemplo)', cat: 'colegio', note: '' },
      { id: id('e'), date: d(7), title: 'Pagar el colegio (ejemplo)', cat: 'finanzas', note: '' },
      { id: id('e'), date: d(9), title: 'Reunión de jóvenes (ejemplo)', cat: 'fe', note: '' },
      { id: id('e'), date: d(12), title: 'Pagar la tarjeta (ejemplo)', cat: 'finanzas', note: '' },
      { id: id('e'), date: d(-3), title: 'Limpieza a fondo de la habitación', cat: 'casa', note: '' },
    ],
    tomorrow: { materias: ['Materia A', 'Materia B', 'Materia C'], llevar: ['Carpeta de B', 'Calculadora'] },
    notes: [
      { id: id('n'), text: 'Comprar un cuaderno nuevo para Materia A (ejemplo)', created: d(0), done: false },
      { id: id('n'), text: 'Preguntar fecha del próximo TP (ejemplo)', created: d(-1), done: false },
    ],
    day: d(0),
    ...extrasV2(),
  };
}
