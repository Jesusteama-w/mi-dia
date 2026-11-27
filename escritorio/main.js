// Mi día en la compu: pantalla completa, avisos con sonido y notificación, y queda en la bandeja al cerrar.
//   npm start                 → abre la app publicada (GitHub Pages)
//   npm run local             → abre el servidor local (python servidor.py 5173)
//   npm run activar-inicio    → que se abra sola al prender la compu (todavía NO está activado)
//   npm run desactivar-inicio → lo saca del inicio de Windows
const { app, BrowserWindow, Tray, Menu, shell, session, nativeImage } = require('electron');
const path = require('path');

const URL_APP = process.argv.includes('--local') ? 'http://localhost:5173/' : 'https://jesusteama-w.github.io/mi-dia/';
const ICONO = path.join(__dirname, 'icono.png');

// ---- inicio con Windows: solo si lo pedís a propósito (menú de la bandeja o npm run activar-inicio) ----
const inicioArgs = app.isPackaged ? [] : [path.resolve(__dirname)];
const inicioActivo = () => app.getLoginItemSettings({ path: process.execPath, args: inicioArgs }).openAtLogin;
const setInicio = on => app.setLoginItemSettings({ openAtLogin: on, path: process.execPath, args: inicioArgs });
if (process.argv.includes('--activar-inicio') || process.argv.includes('--desactivar-inicio')) {
  const on = process.argv.includes('--activar-inicio');
  app.whenReady().then(() => {
    setInicio(on);
    console.log(on ? 'Listo: Mi día se abre al prender la compu.' : 'Listo: Mi día ya no se abre al prender la compu.');
    app.quit();
  });
  return;
}

if (!app.requestSingleInstanceLock()) { app.quit(); return; }
app.setAppUserModelId('mi.dia');            // para que Windows muestre las notificaciones con el nombre

let win, tray, saliendo = false;

function crearVentana() {
  win = new BrowserWindow({
    width: 1280, height: 800, fullscreen: true, autoHideMenuBar: true, backgroundColor: '#161513',
    title: 'Mi día', icon: ICONO, show: false,
    webPreferences: { autoplayPolicy: 'no-user-gesture-required', backgroundThrottling: false },
  });
  win.loadURL(URL_APP);
  win.once('ready-to-show', () => win.show());

  // Links externos (Spotify, etc.) en el navegador de siempre.
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });

  // F11 pantalla completa, F5 recargar, Esc sale de pantalla completa.
  win.webContents.on('before-input-event', (e, i) => {
    if (i.type !== 'keyDown') return;
    if (i.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    else if (i.key === 'F5') { win.reload(); e.preventDefault(); }
    else if (i.key === 'Escape' && win.isFullScreen()) win.setFullScreen(false);
  });

  // Cerrar = queda en la bandeja (así siguen sonando los avisos). Salir de verdad: menú de la bandeja.
  win.on('close', e => { if (!saliendo) { e.preventDefault(); win.hide(); } });
}

function mostrar() { if (!win) return crearVentana(); win.show(); win.focus(); }

app.on('second-instance', mostrar);
app.on('before-quit', () => { saliendo = true; });

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_wc, perm, cb) => cb(['notifications', 'media', 'fullscreen'].includes(perm)));
  crearVentana();
  tray = new Tray(nativeImage.createFromPath(ICONO).resize({ width: 16, height: 16 }));
  tray.setToolTip('Mi día');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Abrir Mi día', click: mostrar },
    { label: 'Recargar', click: () => win?.reload() },
    { label: 'Abrir al prender la compu', type: 'checkbox', checked: inicioActivo(), click: item => setInicio(item.checked) },
    { type: 'separator' },
    { label: 'Salir', click: () => { saliendo = true; app.quit(); } },
  ]));
  tray.on('click', mostrar);
});
