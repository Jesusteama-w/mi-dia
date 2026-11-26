// Intro: hoja con escalas → papel rasgado → líneas a lápiz que CONSTRUYEN la cruz → el lápiz dibuja el logo
// → se rellena en tinta. Al costado, el problema de los 3 cuerpos dibujado a lápiz.
import { logoSvg } from './ui.js';
import { torn } from './floaters.js';

const NS = 'http://www.w3.org/2000/svg';
const wait = ms => new Promise(r => setTimeout(r, ms));
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const PENCIL = `<svg class="pencil" viewBox="0 0 120 24" aria-hidden="true"><path d="M0 12 L16 6 L16 18 Z" fill="#2a2621"/><path d="M5 10.2 L0 12 L5 13.8 Z" fill="#111"/>
  <rect x="16" y="6" width="80" height="12" fill="#c4862a"/><rect x="16" y="6" width="80" height="4" fill="#d9a043"/>
  <rect x="96" y="6" width="8" height="12" fill="#9a9a9a"/><rect x="104" y="6" width="14" height="12" rx="3" fill="#c98b84"/></svg>`;
const FILTER = `<svg width="0" height="0" style="position:absolute"><filter id="lapiz"><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="1.8"/></filter></svg>`;

function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent?.appendChild(e); return e; }

/** Escalas, rayitas y ángulos en los bordes (estilo eje3, sin cuadrícula). */
function ticks(w, h) {
  const s = el('svg', { class: 'ticks', viewBox: `0 0 ${w} ${h}`, width: w, height: h });
  let d = '';
  for (let x = 40; x < w - 40; x += 12) { const L = x % 60 < 12 ? 14 : 6; d += `M${x} 22v${L}M${x} ${h - 22}v${-L}`; }
  for (let y = 40; y < h - 40; y += 12) { const L = y % 60 < 12 ? 14 : 6; d += `M22 ${y}h${L}`; }
  el('path', { d }, s);
  for (const [x, y, sx, sy] of [[30, 30, 1, 1], [w - 30, 30, -1, 1], [30, h - 30, 1, -1], [w - 30, h - 30, -1, -1]])
    el('path', { d: `M${x} ${y + 26 * sy}V${y}H${x + 26 * sx}` }, s);
  [[60, 18, '0'], [w / 2, 18, `${Math.round(w / 2)}`], [w - 90, 18, `${w}`], [36, h / 2, `${Math.round(h / 2)}`], [w - 140, h - 34, 'escala 1 : 1']]
    .forEach(([x, y, t]) => { const tx = el('text', { x, y }, s); tx.textContent = t; });
  return s;
}

/** Líneas que ayudan a formar la cruz, calculadas a partir de la cruz real del logo. */
function construction(svg, cross) {
  const M = svg.getScreenCTM().inverse().multiply(cross.getScreenCTM());
  const b = cross.getBBox();
  const p = (x, y) => new DOMPoint(x, y).matrixTransform(M);
  const a = p(b.x, b.y), c = p(b.x + b.width, b.y + b.height);
  const W = c.x - a.x, H = c.y - a.y, ext = W * 0.14;           // la cruz tiene relieve hacia la derecha/abajo
  const fw = W - ext, fh = H - ext, cx = a.x + fw / 2, cy = a.y + fh * 0.30, r = fw / 2;
  const g = el('g', { class: 'build', filter: 'url(#lapiz)' });
  svg.insertBefore(g, svg.firstChild.nextSibling);
  const line = (d, extra = {}) => el('path', { d, pathLength: 1, ...extra }, g);
  line(`M${cx} ${a.y - 170}V${a.y + fh + 140}`);                                   // eje vertical
  line(`M${cx - 330} ${cy}H${cx + 330}`);                                          // eje del travesaño
  line(`M${cx} ${cy - r}a${r} ${r} 0 1 1 -0.1 0`);                                  // círculo del cruce
  line(`M${cx} ${cy - r * 1.7}a${r * 1.7} ${r * 1.7} 0 1 1 -0.1 0`, { class: 'dash' });
  line(`M${cx - 230} ${cy - 230}L${cx + 230} ${cy + 230}`);                        // la X
  line(`M${cx + 230} ${cy - 230}L${cx - 230} ${cy + 230}`);
  line(`M${a.x} ${a.y}h${fw}v${fh}h${-fw}Z`, { class: 'dash' });                   // caja de la cruz
  line(`M${a.x - 42} ${a.y}v${fh}M${a.x - 50} ${a.y}h16M${a.x - 50} ${a.y + fh}h16`); // cota de alto
  line(`M${a.x} ${a.y - 34}h${fw}M${a.x} ${a.y - 42}v16M${a.x + fw} ${a.y - 42}v16`); // cota de ancho
  line(`M${cx + 40} ${cy}A40 40 0 0 0 ${cx + 28.3} ${cy - 28.3}`);                  // ángulo 45°
  const lab = (x, y, t) => { const e = el('text', { x, y }, g); e.textContent = t; };
  lab(a.x - 70, a.y + fh / 2, `h ${Math.round(fh)}`);
  lab(cx - 18, a.y - 46, `a ${Math.round(fw)}`);
  lab(cx + 46, cy - 12, '45°');
  lab(cx + r + 8, cy + 16, `r ${Math.round(r)}`);
  lab(cx + 8, a.y - 150, 'x');
  lab(cx + 310, cy - 8, 'y');
  return g;
}

/** El problema de los 3 cuerpos (órbita en ocho), dibujado a lápiz. */
function threeBody(host) {
  const s = el('svg', { class: 'orbit', viewBox: '-130 -80 260 160' }, host);
  const pts = []; for (let i = 0; i <= 200; i++) { const t = i / 200 * Math.PI * 2; pts.push(`${(100 * Math.sin(t)).toFixed(1)} ${(55 * Math.sin(t) * Math.cos(t)).toFixed(1)}`); }
  el('path', { d: 'M' + pts.join('L'), pathLength: 1, class: 'path', filter: 'url(#lapiz)' }, s);
  el('path', { d: 'M-120 0H120M0 -70V70', class: 'axis', filter: 'url(#lapiz)' }, s);
  const bodies = [0, 1, 2].map(i => el('circle', { r: i === 0 ? 5 : 4, class: `b b${i}` }, s));
  const tx = el('text', { x: -120, y: 74 }, s); tx.textContent = '3 cuerpos · órbita en ocho';
  let raf, t0 = performance.now();
  const loop = now => {
    const t = (now - t0) / 4200 * Math.PI * 2;
    bodies.forEach((b, i) => { const u = t + i * 2 * Math.PI / 3; b.setAttribute('cx', 100 * Math.sin(u)); b.setAttribute('cy', 55 * Math.sin(u) * Math.cos(u)); });
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}

const drawLine = (p, dur, delay) => {
  p.style.strokeDasharray = 1; p.style.strokeDashoffset = 1; p.getBoundingClientRect();
  p.style.transition = `stroke-dashoffset ${dur}s cubic-bezier(.5,0,.3,1) ${delay}s`; p.style.strokeDashoffset = 0;
};

/** El lápiz recorre cada trazo del logo. */
function pencilDraw(paths, pencil, stage, k) {
  const dur = [2.0, 1.6, 0.45, 0.45, 0.45, 0.45].map(d => d * k * 1000);
  const Ls = paths.map(p => p.getTotalLength());
  paths.forEach((p, i) => { p.style.strokeDasharray = Ls[i]; p.style.strokeDashoffset = Ls[i]; });
  return new Promise(res => {
    let i = 0, start = performance.now();
    const step = now => {
      if (i >= paths.length) { pencil.style.opacity = 0; return res(); }
      const t = Math.min(1, (now - start) / dur[i]), e = ease(t), p = paths[i];
      p.style.strokeDashoffset = Ls[i] * (1 - e);
      const pt = p.getPointAtLength(Ls[i] * e).matrixTransform(p.getScreenCTM()), sr = stage.getBoundingClientRect();
      pencil.style.transform = `translate(${pt.x - sr.left}px, ${pt.y - sr.top}px) rotate(-38deg)`;
      if (t >= 1) { i++; start = now; }
      requestAnimationFrame(step);
    };
    pencil.style.opacity = 1;
    requestAnimationFrame(step);
  });
}

export async function playIntro() {
  const root = document.getElementById('intro');
  const fast = matchMedia('(max-width: 820px)').matches;   // en el celular, versión corta
  const k = fast ? 0.5 : 1;                                 // las animaciones van siempre, aunque Windows tenga "reducir animaciones"
  root.innerHTML = FILTER + `<div class="stage"><span class="ppr back" style="clip-path:${torn()}"></span><span class="ppr front" style="clip-path:${torn()}"></span>
    <div class="mark">${await logoSvg()}</div>${PENCIL}</div><div class="side"></div><div class="skip">Tocá o apretá una tecla para saltar</div>`;
  root.prepend(ticks(innerWidth, innerHeight));
  root.hidden = false;

  let skipped = false, resolveSkip;
  const skip = new Promise(r => (resolveSkip = r));
  const onSkip = () => { skipped = true; resolveSkip(); };
  addEventListener('pointerdown', onSkip, { once: true });
  addEventListener('keydown', onSkip, { once: true });

  const audio = new Audio('assets/intro.mp3');              // tu canción (cuando la subas)
  audio.volume = 0.8; audio.play().catch(() => {});

  const stage = root.querySelector('.stage'), mark = root.querySelector('.mark'), svg = mark.querySelector('svg');
  const paths = [...svg.querySelectorAll(':scope > g path')];
  const stopOrbit = fast ? () => {} : threeBody(root.querySelector('.side'));

  const run = (async () => {
    root.classList.add('s1');                                              // escalas + papel
    await wait(700 * k);
    const build = construction(svg, paths[0]);
    [...build.querySelectorAll('path')].forEach((p, i) => drawLine(p, 1.3 * k, i * 0.2 * k));
    root.classList.add('s2');                                              // órbita
    await wait(2300 * k);
    build.classList.add('labels');
    await pencilDraw(paths, root.querySelector('.pencil'), stage, k);
    mark.classList.add('fill');
    build.classList.add('soft');
    await wait(2000 * k);
  })();

  await Promise.race([run, skip]);
  removeEventListener('pointerdown', onSkip); removeEventListener('keydown', onSkip);
  root.classList.add('out');
  await wait(skipped ? 300 : 900);
  stopOrbit();
  root.hidden = true; root.className = 'intro'; root.innerHTML = '';
  if (skipped) audio.pause(); else fadeOut(audio);
}

function fadeOut(a) { const id = setInterval(() => { a.volume = Math.max(0, a.volume - 0.05); if (a.volume === 0) { a.pause(); clearInterval(id); } }, 200); }
