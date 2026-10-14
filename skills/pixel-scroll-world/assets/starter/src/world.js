// The world: one low-resolution canvas fixed behind the page, scaled up by a whole number so
// every pixel stays square. The traveller holds one screen column and the world slides under him
// by whole pixels, so nothing ever shimmers. The CV sections scroll over it as dialogue windows.
import * as A from './art.js';
import { createConductor } from './scroll.js';
import { STOPS, levelAt } from './route.js';

const { T } = A;
const U = 6;          // canvas pixels per route unit
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const ease = (t) => t * t * (3 - 2 * t);

export function startWorld({ reduced }) {
  const canvas = document.createElement('canvas'); canvas.id = 'world'; canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const g = canvas.getContext('2d');
  const glow = document.createElement('canvas'); const gg = glow.getContext('2d'); // lights, drawn again over the night wash
  const hud = document.querySelector('.hud-level');

  const stops = STOPS.map((s) => ({ ...s, el: document.getElementById(s.id) })).filter((s) => s.el);
  stops.forEach((s) => s.el.classList.add('stop'));
  let band = 0; // on a phone the world is a strip at the top and the windows scroll under it
  const conductor = createConductor(stops.map((s) => s.el), { reduced: reduced.matches, offset: () => band / 2 });

  // ---- scenery: route x, sprite (or two frames), how high its foot sits above the road, options.
  // far: a backdrop that moves at half speed. lit: its bright pixels glow at night.
  const SCENE = [];
  const put = (x, img, up = 0, opt = {}) => SCENE.push({ x, img, up, ...opt });
  for (let x = -20; x < 260; x += 23) put(x, A.cloud, 70 + (x % 3) * 6, { far: true });
  put(6, A.oak, 4); put(18, A.withSign(A.building(60, 3, '#e8c9a0', '#c9a67a', 2), 'HOME'), 4); put(33, A.blossom, 4); put(48, A.signpost('ABOUT'), 2);
  put(64, A.oak, 4); put(86, A.withSign(A.building(84, 4, '#e6f0f6', '#cddbe6', 5), 'UNIVERSITY'), 4); put(104, A.blossom, 4); put(118, A.signpost('PROJECTS'), 2);
  put(132, A.oak, 4); put(150, A.building(44, 5, '#bcd6c0', '#94b49a', 8), 4);
  for (let x = 168; x < 230; x += 9) put(x, A.building(40 + (x % 3) * 6, 6 + (x % 2), '#3a4060', '#2b3048', x), 4, { lit: true });
  for (let x = 172; x < 230; x += 14) put(x, A.lamp, 2, { lit: true, front: true });
  put(198, A.signpost('CONTACT'), 2, { front: true });
  SCENE.forEach((o) => { const im = o.img.width ? o.img : o.img[0]; o.w = im.width; o.lit &&= litPixels(im); });

  let W = 320, H = 180, PY = 100, HX = 200, scale = 3;
  function resize() {
    const narrow = innerWidth < 900;
    const view = narrow ? Math.round(innerHeight * 0.46) : innerHeight;
    band = narrow ? view : 0; document.documentElement.style.setProperty('--band', `${band}px`);
    scale = Math.max(2, Math.round(view / 200));
    W = Math.ceil(innerWidth / scale); H = Math.ceil(view / scale);
    HX = Math.round(W * (narrow ? 0.5 : 0.62)); PY = Math.round((H * (narrow ? 0.62 : 0.58)) / T) * T;
    canvas.width = glow.width = W; canvas.height = glow.height = H;
    canvas.style.width = `${W * scale}px`; canvas.style.height = `${H * scale}px`;
    g.imageSmoothingEnabled = false; conductor.measure();
  }
  addEventListener('resize', resize); resize();

  // the route position for a progress value: it eases into each stop and out again
  const railAt = (p) => { const i = clamp(Math.floor(p), 0, stops.length - 1); const a = stops[i], b = stops[Math.min(i + 1, stops.length - 1)]; return a.x + (b.x - a.x) * ease(clamp(p - i, 0, 1)); };

  let current = -1, lastX = null, walk = 0, lastMove = -9, face = 1;
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const t = now / 1000, still = reduced.matches;
    const st = conductor.state();
    const i = clamp(Math.round(st.exact), 0, stops.length - 1);
    if (i !== current) { stops[current]?.el.classList.remove('is-current'); stops[i].el.classList.add('is-current'); current = i; }
    const rx = railAt(st.smooth); const px = Math.round(rx * U); const cam = px - HX;
    const dx = lastX === null ? 0 : px - lastX; lastX = px; if (Math.abs(dx) > 0) { walk += Math.abs(dx); lastMove = t; if (Math.sign(dx) !== face) face = Math.sign(dx); }
    const level = levelAt(rx); if (hud && hud.textContent !== level.name) hud.textContent = level.name;
    const night = level.night || 0; if (night) gg.clearRect(0, 0, W, H);

    // sky, in bands
    const sky = level.sky; for (let y = 0; y < PY; y += 4) { g.fillStyle = y < PY / 2 ? sky[0] : sky[1]; g.fillRect(0, y, W, 4); }
    // ground: field above and below a two-tile road; each column takes the ground of the level it is in
    for (let tx = Math.floor(cam / T); tx * T - cam < W; tx++) {
      const set = A.GROUND[levelAt((tx * T) / U).ground];
      for (let ty = PY / T - 1; ty * T < H; ty++) {
        const road = ty === PY / T || ty === PY / T + 1; const h = Math.floor(A.hash(tx, ty) * 3);
        g.drawImage(road ? set[1][h] : set === A.GROUND.meadow && A.hash(tx + 9, ty) > 0.9 ? A.flower[Math.floor(t * 2) % 2] : set[0][h], tx * T - cam, ty * T);
      }
    }
    // scenery behind him, him, then what stands in front
    const draw = (o) => {
      const im = o.img.width ? o.img : o.img[Math.floor(t * 2) % 2];
      const x = Math.round(o.x * U - (o.far ? cam * 0.5 : cam) - o.w / 2); if (x > W || x + o.w < 0) return;
      const y = PY - o.up - im.height + (o.front ? 30 : 0);
      if (night) { gg.globalCompositeOperation = 'destination-out'; gg.drawImage(im, x, y); gg.globalCompositeOperation = 'source-over'; if (o.lit) gg.drawImage(o.lit, x, y); }
      g.drawImage(im, x, y);
    };
    SCENE.filter((o) => !o.front).forEach(draw);
    const moving = !still && t - lastMove < 0.14; const fr = moving ? 1 + (Math.floor(walk / 15) % 2) : 0;
    const hy = PY + 6; g.drawImage(A.shadow, HX + 1, hy + 15);
    if (face < 0) { g.save(); g.translate(HX + 14, 0); g.scale(-1, 1); g.drawImage(A.hero[fr], 0, hy); g.restore(); } else g.drawImage(A.hero[fr], HX, hy);
    SCENE.filter((o) => o.front).forEach(draw);
    if (night) { g.fillStyle = `rgba(14,20,76,${night})`; g.fillRect(0, 0, W, H); g.drawImage(glow, 0, 0); }
  }
  requestAnimationFrame(frame);
  requestAnimationFrame(() => document.documentElement.classList.add('world-ready'));
}

// the bright pixels of a sprite (windows, lamps), to draw again over the night wash
function litPixels(img) {
  return A.mk(img.width, img.height, (c) => {
    const d = img.getContext('2d').getImageData(0, 0, img.width, img.height); const p = d.data;
    for (let i = 0; i < p.length; i += 4) if (!(p[i] > 230 && p[i + 1] > 200 && p[i + 2] > 140 && p[i + 2] < 230)) p[i + 3] = 0;
    c.putImageData(d, 0, 0);
  });
}
