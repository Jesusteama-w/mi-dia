#!/usr/bin/env node
// Herramienta para que Claude lea y escriba en "Mi día" desde la compu. Los cambios aparecen al instante
// en todos los dispositivos (tiempo real). Necesita la clave secreta de Supabase en el archivo .env
// de la raíz del proyecto (NUNCA se sube a GitHub):
//   SUPABASE_SECRET_KEY=sb_secret_...
//
// Uso:
//   node herramientas/claude-db.mjs leer [clave]                     → muestra todo, o una sección (notes, events, alarms…)
//   node herramientas/claude-db.mjs anotar "texto"                    → agrega a la libreta
//   node herramientas/claude-db.mjs evento AAAA-MM-DD "título" [cat] [nota]   (cat: colegio|finanzas|fe|casa)
//   node herramientas/claude-db.mjs gasto MONTO "detalle" [cat] [AAAA-MM-DD]
//   node herramientas/claude-db.mjs colegio "Categoría" "Materia" "texto" [AAAA-MM-DD]
//   node herramientas/claude-db.mjs poner clave archivo.json          → reemplaza una sección entera
//   node herramientas/claude-db.mjs cargar-semilla [archivo.json]     → carga todas las secciones (por defecto privado/semilla-elias.json)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL_DB = 'https://lzrsggrhnsgdpcqzdwzg.supabase.co';

function clave() {
  const f = path.join(RAIZ, '.env');
  if (!existsSync(f)) salir('Falta el archivo .env en la raíz del proyecto con SUPABASE_SECRET_KEY=…');
  const m = readFileSync(f, 'utf8').match(/^\s*SUPABASE_SECRET_KEY\s*=\s*"?([^"\r\n]+)"?/m);
  if (!m) salir('El .env no tiene SUPABASE_SECRET_KEY=…');
  return m[1].trim();
}
function salir(msg) { console.error(msg); process.exit(1); }

const KEY = clave();
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function api(ruta, opts = {}) {
  const r = await fetch(URL_DB + ruta, { ...opts, headers: { ...H, ...opts.headers } });
  const t = await r.text();
  if (!r.ok) salir(`Error ${r.status}: ${t}`);
  return t ? JSON.parse(t) : null;
}

// La app tiene un solo usuario: se usa ese.
async function usuario() {
  const d = await api('/auth/v1/admin/users?per_page=10');
  const us = d.users || d;
  if (!us.length) salir('Todavía no hay usuario. Crealo en Supabase → Authentication → Users → Add user.');
  return us[0].id;
}

const leer = async (uid, k) =>
  api(`/rest/v1/secciones?select=clave,datos,actualizado&user_id=eq.${uid}${k ? `&clave=eq.${encodeURIComponent(k)}` : ''}`);

async function poner(uid, filas) {
  return api('/rest/v1/secciones?on_conflict=user_id,clave', {
    method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(filas.map(([k, datos]) => ({ user_id: uid, clave: k, datos }))),
  });
}

async function cambiar(uid, k, fn, vacio) {
  const [f] = await leer(uid, k);
  const datos = f ? f.datos : vacio;
  fn(datos);
  await poner(uid, [[k, datos]]);
}

const id = p => p + Math.random().toString(36).slice(2, 9);
const hoy = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' });
const fecha = s => { if (s && !/^\d{4}-\d{2}-\d{2}$/.test(s)) salir(`Fecha inválida: ${s} (usá AAAA-MM-DD)`); return s; };

const [cmd, ...a] = process.argv.slice(2);
const uid = await usuario();

switch (cmd) {
  case 'leer': {
    const filas = await leer(uid, a[0]);
    console.log(JSON.stringify(a[0] ? filas[0]?.datos ?? null : Object.fromEntries(filas.map(f => [f.clave, f.datos])), null, 2));
    break;
  }
  case 'anotar':
    if (!a[0]) salir('Falta el texto.');
    await cambiar(uid, 'notes', n => n.unshift({ id: id('n'), text: a.join(' '), created: hoy(), done: false }), []);
    console.log('Anotado en la libreta.');
    break;
  case 'evento':
    if (!fecha(a[0]) || !a[1]) salir('Uso: evento AAAA-MM-DD "título" [cat] [nota]');
    await cambiar(uid, 'events', e => e.push({ id: id('e'), date: a[0], title: a[1], cat: a[2] || 'casa', note: a[3] || '' }), []);
    console.log('Evento agregado.');
    break;
  case 'gasto': {
    const monto = Number(String(a[0]).replace(/\./g, '').replace(',', '.'));
    if (!monto || !a[1]) salir('Uso: gasto MONTO "detalle" [cat] [AAAA-MM-DD]');
    await cambiar(uid, 'finanzas', f => f.gastos.push({ id: id('g'), date: fecha(a[3]) || hoy(), amount: monto, cat: a[2] || 'personales', desc: a[1] }), { cats: [], gastos: [] });
    console.log('Gasto agregado.');
    break;
  }
  case 'colegio':
    if (!a[2]) salir('Uso: colegio "Categoría" "Materia" "texto" [AAAA-MM-DD]');
    await cambiar(uid, 'colegio', c => c.items.push({ id: id('c'), cat: a[0], materia: a[1], text: a[2], date: fecha(a[3]) || '', done: false }), { materias: [], cats: [], items: [] });
    console.log('Agregado a Colegio.');
    break;
  case 'poner':
    if (!a[0] || !a[1]) salir('Uso: poner clave archivo.json');
    await poner(uid, [[a[0], JSON.parse(readFileSync(a[1], 'utf8'))]]);
    console.log(`Sección "${a[0]}" reemplazada.`);
    break;
  case 'cargar-semilla': {
    const archivo = a[0] || path.join(RAIZ, 'privado', 'semilla-elias.json');
    const datos = JSON.parse(readFileSync(archivo, 'utf8'));
    await poner(uid, Object.entries(datos));
    console.log(`Cargadas ${Object.keys(datos).length} secciones.`);
    break;
  }
  default:
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 16).map(l => l.replace(/^\/\/ ?/, '')).join('\n'));
}
