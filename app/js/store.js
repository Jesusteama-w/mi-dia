// Estado de la app. Hoy se guarda en este dispositivo; en el paso 4 se sincroniza con Supabase.
import { ejemplo, extrasV2, VERSES } from './data-ejemplo.js';
import { iso } from './ui.js';

const KEY = 'mi-dia-v1';
const subs = new Set();

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.v === 2) return s;
    if (s && s.v === 1) {                       // migración: se suman las secciones nuevas sin borrar lo tuyo
      Object.assign(s, extrasV2(), { v: 2 });
      if (s.verses.every(x => !x.t)) s.verses = VERSES;
      return s;
    }
  } catch {}
  return ejemplo();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }

let state = load();
// Día nuevo: se desmarcan las tareas del cronograma.
if (state.day !== iso(new Date())) {
  state.day = iso(new Date());
  state.schedule.forEach(b => { b.done = false; b.subtasks.forEach(s => s.done = false); });
  save();
}

export const store = {
  get: () => state,
  /** Cambia el estado. Con {quiet:true} no avisa a la vista (la vista ya actualizó su propio DOM). */
  set(fn, { quiet = false } = {}) { fn(state); save(); if (!quiet) subs.forEach(f => f(state)); },
  subscribe(f) { subs.add(f); return () => subs.delete(f); },
  reset() { state = ejemplo(); save(); subs.forEach(f => f(state)); },
};
