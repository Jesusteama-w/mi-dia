// Estado de la app. Se guarda en este dispositivo (sirve sin internet) y, con la sesión iniciada,
// cada sección (clave de primer nivel) es una fila de la tabla `secciones` de Supabase, en tiempo real.
import { ejemplo, extrasV2, VERSES } from './data-ejemplo.js';
import { iso } from './ui.js';

const KEY = 'mi-dia-v1', SYNC_KEY = 'mi-dia-sync';
const subs = new Set(), statusSubs = new Set();

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
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); localStorage.setItem(SYNC_KEY, JSON.stringify(synced)); } catch {}
}

let state = load();
// clave → JSON tal como quedó en la nube la última vez (si difiere de lo local, hay un cambio por subir)
let synced = (() => { try { return JSON.parse(localStorage.getItem(SYNC_KEY)) || {}; } catch { return {}; } })();

// Día nuevo: se desmarcan las tareas del cronograma.
function newDay() {
  if (state.day === iso(new Date())) return false;
  state.day = iso(new Date());
  state.schedule.forEach(b => { b.done = false; b.subtasks?.forEach(s => s.done = false); });
  return true;
}
if (newDay()) save();

function notify() { subs.forEach(f => f(state)); }

// ---------- nube ----------
let cloud = null, channel = null, tPush = null, tRetry = null, status = 'local';
function setStatus(s) { if (s !== status) { status = s; statusSubs.forEach(f => f(s)); } }

const changedKeys = () => Object.keys(state).filter(k => JSON.stringify(state[k]) !== synced[k]);
function schedulePush(ms = 600) { if (!cloud) return; clearTimeout(tPush); tPush = setTimeout(flush, ms); }

async function flush() {
  if (!cloud) return;
  const keys = changedKeys(); if (!keys.length) { setStatus('al día'); return; }
  const sent = keys.map(k => JSON.stringify(state[k]));
  const rows = keys.map((k, i) => ({ user_id: cloud.uid, clave: k, datos: JSON.parse(sent[i]) }));
  setStatus('guardando');
  const { error } = await cloud.db.from('secciones').upsert(rows);
  if (!cloud) return;
  if (error) { console.warn('[nube]', error.message); setStatus('sin conexión'); clearTimeout(tRetry); tRetry = setTimeout(flush, 15_000); return; }
  keys.forEach((k, i) => { synced[k] = sent[i]; });
  save();
  if (changedKeys().length) schedulePush(); else setStatus('al día');
}

/** Aplica una sección que llegó de la nube. No pisa un cambio local que todavía no se subió. */
function applyRemote(k, datos) {
  const j = JSON.stringify(datos);
  if (synced[k] === j) return false;
  const localDirty = k in synced && JSON.stringify(state[k]) !== synced[k];
  if (localDirty) return false;
  state[k] = datos; synced[k] = j;
  return true;
}

async function pull() {
  if (!cloud) return;
  const { data, error } = await cloud.db.from('secciones').select('clave,datos');
  if (!cloud) return;
  if (error) { console.warn('[nube]', error.message); setStatus('sin conexión'); return; }
  let changed = false;
  for (const r of data) changed = applyRemote(r.clave, r.datos) || changed;
  if (newDay()) changed = true;
  save();
  if (changed) remoteNotify();
  flush();                                    // sube lo que haya local (o todo, si la nube estaba vacía)
}

// Si llega algo de afuera mientras escribís, se redibuja recién cuando salís del campo.
let pending = false;
function remoteNotify() {
  const a = document.activeElement;
  if (a?.matches?.('input, textarea, select') && a.closest('#view')) {
    if (!pending) { pending = true; a.addEventListener('blur', () => { pending = false; notify(); }, { once: true }); }
    return;
  }
  notify();
}

const onVisible = () => { if (document.visibilityState === 'visible') pull(); };
const onOnline = () => pull();

export const store = {
  get: () => state,
  /** Cambia el estado. Con {quiet:true} no avisa a la vista (la vista ya actualizó su propio DOM). */
  set(fn, { quiet = false } = {}) { fn(state); save(); schedulePush(); if (!quiet) notify(); },
  subscribe(f) { subs.add(f); return () => subs.delete(f); },
  status: () => status,
  onStatus(f) { statusSubs.add(f); return () => statusSubs.delete(f); },

  /** Conecta con Supabase: baja todo, sube lo pendiente y escucha cambios en tiempo real. */
  async attach(db, uid) {
    cloud = { db, uid };
    setStatus('conectando');
    channel = db.channel('secciones-' + uid)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'secciones', filter: `user_id=eq.${uid}` }, p => {
        if (p.new?.clave && applyRemote(p.new.clave, p.new.datos)) { save(); remoteNotify(); }
      })
      .subscribe(st => { if (st === 'SUBSCRIBED') pull(); });
    addEventListener('visibilitychange', onVisible);
    addEventListener('online', onOnline);
    await pull();
  },
  /** Cierra la sesión en este dispositivo: borra la copia local (tus datos siguen en la nube). */
  detach() {
    if (channel) cloud?.db.removeChannel(channel);
    cloud = channel = null; clearTimeout(tPush); clearTimeout(tRetry);
    removeEventListener('visibilitychange', onVisible);
    removeEventListener('online', onOnline);
    state = ejemplo(); synced = {};
    try { localStorage.removeItem(KEY); localStorage.removeItem(SYNC_KEY); } catch {}
    setStatus('local');
  },
};
