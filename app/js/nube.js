// Sesión con Supabase y pantalla de entrada (correo + contraseña, un solo usuario).
import { SUPABASE_URL, SUPABASE_KEY, SUPABASE_JS } from './config.js';
import { store } from './store.js';
import { logoSvg } from './ui.js';

let db = null;
async function client() {
  if (db) return db;
  const { createClient } = await import(SUPABASE_JS);
  db = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'mi-dia-auth' } });
  return db;
}

export const nube = { user: null };

/** Devuelve la sesión guardada en este dispositivo (sirve sin internet), o null. */
export async function sesionGuardada() {
  try { const { data } = await (await client()).auth.getSession(); return data.session; }
  catch (e) { console.warn('[nube]', e); return null; }
}

export async function conectar(session) {
  nube.user = session.user;
  await store.attach(await client(), session.user.id);
}

export async function salir() {
  store.detach(); nube.user = null;
  try { await (await client()).auth.signOut({ scope: 'local' }); } catch {}
  location.reload();
}

/** Muestra la pantalla de entrada y resuelve con la sesión cuando el usuario entra. */
export function pedirLogin() {
  const box = document.getElementById('login');
  return new Promise(async resolve => {
    box.innerHTML = `<div class="lg-paper">
      <div class="lg-logo">${await logoSvg({ icon: true })}</div>
      <h1 class="serif">mi día</h1>
      <p class="muted">Entrá para ver tus cosas en la compu, la tele, la Play y el celu.</p>
      <form class="lg-form" autocomplete="on">
        <label><span class="label">Correo</span><input class="input" type="email" name="email" autocomplete="username" required></label>
        <label><span class="label">Contraseña</span><input class="input" type="password" name="pass" autocomplete="current-password" required></label>
        <button class="btn" type="submit">Entrar</button>
        <p class="lg-err" role="alert"></p>
      </form></div>`;
    box.hidden = false;
    const f = box.querySelector('form'), err = box.querySelector('.lg-err');
    f.email.focus();
    f.addEventListener('submit', async e => {
      e.preventDefault(); err.textContent = ''; f.querySelector('button').disabled = true;
      try {
        const { data, error } = await (await client()).auth.signInWithPassword({ email: f.email.value.trim(), password: f.pass.value });
        if (error) throw error;
        box.hidden = true; box.innerHTML = '';
        resolve(data.session);
      } catch (e2) {
        err.textContent = /invalid/i.test(e2.message || '') ? 'Correo o contraseña incorrectos.' : 'No se pudo entrar. ¿Hay internet?';
        f.querySelector('button').disabled = false;
      }
    });
  });
}
