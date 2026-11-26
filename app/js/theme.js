// Tema claro / oscuro. "auto": oscuro de 19:00 a 7:00 (para no fulminarte los ojos a las 5).
const KEY = 'mi-dia-tema';

export function getMode() { try { return localStorage.getItem(KEY) || 'auto'; } catch { return 'auto'; } }
export function setMode(m) { try { localStorage.setItem(KEY, m); } catch {} applyTheme(); }

export function applyTheme() {
  const m = getMode(), h = new Date().getHours();
  const dark = m === 'oscuro' || (m === 'auto' && (h >= 19 || h < 7));
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0c0b09' : '#161513');
}

applyTheme();
setInterval(applyTheme, 60_000);
