// Genera los íconos PNG (celu, escritorio) a partir del logo. Uso: npm run iconos
const { app, BrowserWindow } = require('electron');
const fs = require('fs'), path = require('path'), os = require('os');

const APP = path.join(__dirname, '..', 'app');
const svg = fs.readFileSync(path.join(APP, 'assets', 'logo-completo.svg'), 'utf8')
  .replace(/<g transform="matrix\(1, 0, 0, 1, 251, 333\)">[\s\S]*<\/svg>/, '</svg>')
  .replace(/viewBox="[^"]*"/, 'viewBox="60 150 380 450"');

const page = (size, pad) => `<html><body style="margin:0;width:${size}px;height:${size}px;background:#161513;display:grid;place-items:center;color:#ebe4d4">
  <div style="width:${size * (1 - pad * 2)}px;height:${size * (1 - pad * 2)}px">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div></body></html>`;

const SALIDAS = [
  [512, .16, path.join(APP, 'assets', 'icon-512.png')],
  [192, .16, path.join(APP, 'assets', 'icon-192.png')],
  [512, .22, path.join(APP, 'assets', 'icon-maskable-512.png')],   // Android recorta en círculo: más margen
  [256, .12, path.join(__dirname, 'icono.png')],
];

app.on('window-all-closed', () => {});   // que no se cierre entre ícono e ícono
app.whenReady().then(async () => {
  for (const [size, pad, out] of SALIDAS) {
    const w = new BrowserWindow({ width: size, height: size, show: false, useContentSize: true, webPreferences: { offscreen: true } });
    const tmp = path.join(os.tmpdir(), `mi-dia-icono-${size}-${pad}.html`);
    fs.writeFileSync(tmp, page(size, pad));
    await w.loadFile(tmp);
    // recorte justo al dibujo, así queda centrado
    await w.webContents.executeJavaScript(`(() => { const s = document.querySelector('svg'), b = s.getBBox();
      s.setAttribute('viewBox', [b.x, b.y, b.width, b.height].join(' ')); })()`);
    await new Promise(r => setTimeout(r, 300));
    const img = await w.webContents.capturePage();
    fs.writeFileSync(out, img.resize({ width: size, height: size }).toPNG());
    console.log('ok', path.basename(out));
    w.destroy();
  }
  app.quit();
});
