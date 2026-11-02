// ALL placeholder pixel art is generated here. To use real art later, load an image in
// BootScene.preload() with the same key (e.g. 'yash', 'bed') and the generator skips it.
import { HW, HH, ROOM_SIZE, WALL_H, ORIGIN, GAME_W, GAME_H } from '../utils/isometric.js';

const INK = '#2a1b26';
export const CHARACTER_KEYS = ['yash', 'arkisha'];
export const CHAR_FRAME = { w: 18, h: 28 };

/* ---------- helpers ---------- */
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const shade = (hex, f) =>
  '#' + rgb(hex).map((v) => Math.max(0, Math.min(255, Math.round(v * f))).toString(16).padStart(2, '0')).join('');

function newCanvas(scene, key, w, h) {
  if (scene.textures.exists(key)) return null;
  const tex = scene.textures.createCanvas(key, w, h);
  return { tex, c: tex.getContext(), w, h };
}

// Hard-edge alpha (no blurry anti-aliasing) + optional dark pixel outline.
function finish(cv, { crisp = true, outline = INK } = {}) {
  const { tex, c, w, h } = cv;
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (crisp || outline) {
    const img = c.getImageData(0, 0, w, h);
    const d = img.data;
    if (crisp) for (let i = 3; i < d.length; i += 4) d[i] = d[i] > 110 ? 255 : 0;
    if (outline) {
      const [r, g, b] = rgb(outline);
      const src = new Uint8ClampedArray(d);
      const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 0;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++)
          if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) {
            const i = (y * w + x) * 4;
            d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
          }
    }
    c.putImageData(img, 0, 0);
  }
  tex.refresh();
}

const rect = (c, col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
const disc = (c, col, x, y, r) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
const poly = (c, pts, col) => {
  c.fillStyle = col; c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath(); c.fill();
};
const reset = (c) => c.setTransform(1, 0, 0, 1, 0, 0);
// Draw flat shapes ON a plane: faceY = plane facing lower-left (gy const), topZ = horizontal plane.
const faceY = (c, P, Y) => { const [e, f] = P(0, Y, 0); c.setTransform(HW, HH, 0, -1, e, f); };
const topZ = (c, P, Z) => { const [e, f] = P(0, 0, Z); c.setTransform(HW, HH, -HW, HH, e, f); };

// An isometric box. x,y,z = corner in tiles/pixels; w,d = footprint tiles; h = pixel height.
function box(c, P, x, y, z, w, d, h, col) {
  poly(c, [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], shade(col, 0.82));
  poly(c, [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], shade(col, 0.62));
  poly(c, [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], col);
}
const can = (c, P, x, y, z) => {
  box(c, P, x, y, z, 0.2, 0.2, 5, '#ece3f6');
  box(c, P, x - 0.01, y - 0.01, z + 1.5, 0.22, 0.22, 1, '#d8384a');
};

/* ---------- furniture specs: footprint (w,d tiles), height h (px), draw(c,P) ---------- */
export const OBJECT_SPECS = {
  bed: { w: 3.2, d: 3, h: 20, draw(c, P) {
    box(c, P, 0, 0, 0, 0.3, 3, 20, '#6b432a');            // headboard
    box(c, P, 0.3, 0, 0, 2.9, 3, 5, '#8b5a3a');           // frame
    box(c, P, 0.3, 0.05, 5, 2.85, 2.9, 4, '#3a3a46');     // charcoal mattress
    box(c, P, 1.4, 0.05, 9, 1.75, 2.9, 0.8, '#2b2b35');   // folded duvet
    box(c, P, 0.4, 0.25, 9, 0.8, 1.0, 1.6, '#f4efe9');    // pillow 1
    box(c, P, 0.4, 1.75, 9, 0.8, 1.0, 1.6, '#f4efe9');    // pillow 2
  } },
  desk: { w: 3, d: 1.3, h: 28, draw(c, P) {
    box(c, P, 0.05, 0.05, 0, 0.15, 0.15, 12, '#8b5a3a');
    box(c, P, 2, 0, 0, 1, 1.3, 12, '#a06a44');            // drawers
    box(c, P, 0.05, 1.1, 0, 0.15, 0.15, 12, '#8b5a3a');
    box(c, P, 2.4, 1.3, 8.5, 0.2, 0.05, 1, '#f1d9a0');
    box(c, P, 2.4, 1.3, 3.5, 0.2, 0.05, 1, '#f1d9a0');
    box(c, P, 0, 0, 12, 3, 1.3, 2, '#c98d52');            // desktop
    topZ(c, P, 14); rect(c, '#3b3548', 0.35, 0.6, 1.5, 0.65); reset(c); // desk mat
    can(c, P, 0.08, 0.2, 14);
    box(c, P, 0.8, 0.4, 14, 0.7, 0.4, 0.4, '#2d2d33');    // monitor base + neck
    box(c, P, 1.05, 0.52, 14.4, 0.2, 0.15, 3, '#2d2d33');
    box(c, P, 0.25, 0.45, 17.5, 1.6, 0.1, 9, '#1d1d24');  // monitor
    faceY(c, P, 0.55);
    rect(c, '#14264a', 0.33, 18.2, 1.44, 7.4);
    rect(c, '#6ad0ff', 0.4, 24, 0.6, 1); rect(c, '#ff8fb8', 0.4, 22.2, 0.9, 1);
    rect(c, '#a6f0a0', 0.55, 20.4, 0.5, 1); rect(c, '#ffd36a', 1.25, 24, 0.4, 1);
    reset(c);
    box(c, P, 2.0, 0.45, 14, 0.8, 0.55, 3, '#bfc3cf');    // laptop stand
    box(c, P, 2.05, 0.5, 17, 0.7, 0.5, 0.5, '#a9adba');   // laptop base
    box(c, P, 2.05, 0.5, 17.5, 0.7, 0.06, 5, '#9a9eac');  // laptop lid
    faceY(c, P, 0.56); rect(c, '#4b3a78', 2.1, 18.2, 0.6, 3.6); rect(c, '#ff9ec4', 2.3, 19.6, 0.18, 1); reset(c);
    box(c, P, 0.5, 0.8, 14, 1.0, 0.3, 0.5, '#efe9f4');    // keyboard
    box(c, P, 1.7, 0.85, 14, 0.2, 0.28, 0.7, '#35323f');  // mouse
    can(c, P, 0.12, 0.9, 14);
  } },
  chair: { w: 1, d: 1, h: 30, draw(c, P) {
    box(c, P, 0.1, 0.42, 0, 0.8, 0.16, 1.2, '#2a2a30');
    box(c, P, 0.42, 0.1, 0, 0.16, 0.8, 1.2, '#2a2a30');
    box(c, P, 0.42, 0.42, 1.2, 0.16, 0.16, 5, '#55565f');
    box(c, P, 0.1, 0.1, 6, 0.8, 0.8, 3, '#38404f');       // seat
    box(c, P, 0.05, 0.15, 9, 0.1, 0.6, 0.8, '#2a2a30');   // armrests
    box(c, P, 0.85, 0.15, 9, 0.1, 0.6, 0.8, '#2a2a30');
    box(c, P, 0.1, 0.78, 9, 0.8, 0.14, 14, '#323a49');    // backrest
    box(c, P, 0.2, 0.92, 13, 0.6, 0.03, 5, '#e0698a');    // lumbar cushion
    box(c, P, 0.25, 0.78, 23, 0.5, 0.14, 4.5, '#323a49'); // headrest
  } },
  fridge: { w: 1.3, d: 1.2, h: 34, draw(c, P) {
    box(c, P, 0, 0, 0, 1.3, 1.2, 28, '#bfe3d4');
    faceY(c, P, 1.2);
    rect(c, '#8fb8a8', 0, 19.5, 1.3, 1.2);
    rect(c, '#6d7c78', 0.12, 21, 0.07, 6); rect(c, '#6d7c78', 0.12, 10, 0.07, 8);
    rect(c, '#ff7aa5', 0.7, 22, 0.18, 2.5); rect(c, '#ffffff', 0.75, 12, 0.3, 3.5);
    reset(c);
    can(c, P, 0.2, 0.2, 28); can(c, P, 0.6, 0.25, 28); can(c, P, 0.4, 0.7, 28);
  } },
  pizza: { w: 1, d: 1, h: 8, draw(c, P) {
    box(c, P, 0, 0, 1.5, 1, 0.08, 5, '#d9aa6c');          // open lid
    faceY(c, P, 0.08); rect(c, '#d4452f', 0.2, 3.5, 0.6, 1.2); reset(c);
    box(c, P, 0, 0, 0, 1, 1, 1.5, '#caa064');
    topZ(c, P, 1.5);
    disc(c, '#e6b04c', 0.5, 0.5, 0.42); disc(c, '#d4452f', 0.5, 0.5, 0.34); disc(c, '#f6d36e', 0.5, 0.5, 0.3);
    [[0.4, 0.4], [0.62, 0.45], [0.5, 0.64], [0.35, 0.6]].forEach(([x, y]) => disc(c, '#b2262e', x, y, 0.07));
    reset(c);
  } },
};

export const objectSize = (s) => {
  const ox = Math.round(s.d * HW) + 1, oy = s.h + 1;
  return { ox, oy, W: ox + Math.ceil(s.w * HW) + 2, H: Math.ceil(oy + (s.w + s.d) * HH) + 2 };
};

function mkObject(scene, key, spec) {
  const { W, H, ox, oy } = objectSize(spec);
  const cv = newCanvas(scene, key, W, H); if (!cv) return;
  const P = (gx, gy, gz = 0) => [ox + (gx - gy) * HW, oy + (gx + gy) * HH - gz];
  spec.draw(cv.c, P);
  finish(cv);
}

/* ---------- plushies ---------- */
function mkPlush(scene, key, w, h, draw) {
  const cv = newCanvas(scene, key, w + 2, h + 2); if (!cv) return;
  draw((x, y, ww, hh, col) => rect(cv.c, col, x + 1, y + 1, ww, hh));
  finish(cv);
}
function plushies(scene) {
  const W = '#fbfbfb', PINK = '#f6b6d2', LIL = '#c9a0ec';
  mkPlush(scene, 'noah', 14, 14, (R) => {
    R(2, 0, 3, 3, W); R(9, 0, 3, 3, W); R(3, 1, 1, 1, '#f4b6c4'); R(10, 1, 1, 1, '#f4b6c4');
    R(3, 1, 8, 6, W); R(2, 7, 10, 6, W); R(1, 8, 2, 4, W); R(11, 8, 2, 4, W); R(3, 12, 3, 2, W); R(8, 12, 3, 2, W);
    R(11, 8, 1, 5, '#dfe6ee'); R(10, 2, 1, 4, '#dfe6ee'); R(5, 5, 4, 2, '#eef1f6');
    R(5, 3, 1, 2, INK); R(8, 3, 1, 2, INK); R(6, 5, 2, 1, INK); R(3, 7, 8, 1, '#d84a58');
  });
  mkPlush(scene, 'unicorn', 14, 18, (R) => {
    R(6, 0, 2, 3, '#ffe27a'); R(6, 1, 2, 1, '#f2c14e');
    R(3, 3, 2, 2, PINK); R(9, 3, 2, 2, PINK); R(3, 3, 8, 6, PINK); R(2, 4, 2, 8, LIL);
    R(2, 9, 10, 6, PINK); R(3, 15, 3, 2, PINK); R(8, 15, 3, 2, PINK); R(11, 9, 1, 6, '#e79cc0'); R(12, 10, 2, 4, LIL);
    R(5, 5, 1, 2, INK); R(8, 5, 1, 2, INK); R(4, 7, 2, 1, '#ff8fb0'); R(9, 7, 2, 1, '#ff8fb0');
    [3, 6, 9].forEach((x) => { R(x, 10, 1, 1, '#ff4f86'); R(x + 2, 10, 1, 1, '#ff4f86'); R(x, 11, 3, 1, '#ff4f86'); R(x + 1, 12, 1, 1, '#ff4f86'); });
  });
  mkPlush(scene, 'frog', 10, 9, (R) => {
    R(1, 2, 8, 6, '#7fd08a'); R(1, 0, 3, 3, '#7fd08a'); R(6, 0, 3, 3, '#7fd08a'); R(2, 1, 1, 1, INK); R(7, 1, 1, 1, INK);
    R(3, 5, 4, 1, '#f3a3b3'); R(2, 7, 2, 2, '#6bb877'); R(6, 7, 2, 2, '#6bb877');
  });
  mkPlush(scene, 'duck', 10, 9, (R) => {
    R(1, 3, 8, 5, '#ffe066'); R(2, 0, 5, 4, '#ffe066'); R(7, 2, 3, 1, '#ff9f43'); R(4, 1, 1, 1, INK); R(2, 5, 4, 2, '#f5c93c');
  });
}

/* ---------- characters: 6 frames (0-1 idle, 2-5 walk), 18x28 each ---------- */
const STYLES = {
  yash: {
    hair: '#2f2a3a', skin: '#f2c9a0', top: '#4a7bd0', bottom: '#3b4468', shoes: '#f3efe6', spiky: true,
    detail(R, t) {
      R(4, 12 + t, 8, 1, '#365aa0'); R(6, 13 + t, 1, 3, '#f3efe6'); R(9, 13 + t, 1, 3, '#f3efe6'); R(5, 17 + t, 6, 2, '#365aa0');
    },
  },
  arkisha: {
    hair: '#4a2c2a', skin: '#f6d2b0', top: '#f4a6c0', bottom: '#f6d2b0', shoes: '#6b3f4a', skirt: '#7a5aa8', long: true,
    detail(R, t) { R(6, 12 + t, 4, 1, '#fff7ee'); R(8, 14 + t, 1, 1, '#fff7ee'); R(8, 16 + t, 1, 1, '#fff7ee'); },
    after(R, t) { R(10, 2 + t, 2, 1, '#ffd35a'); },
  },
};

function drawChar(c, ox, f, s) {
  const walk = f >= 2, step = f - 2;
  const by = 1 - (walk && step % 2 === 1 ? 1 : 0);   // little hop on passing frames
  const t = !walk && f === 1 ? 1 : 0;                // idle breathing
  const R = (x, y, w, h, col) => rect(c, col, ox + 1 + x, by + y, w, h);
  const lL = walk && step === 0 ? 1 : 0, rL = walk && step === 2 ? 1 : 0;
  if (s.long) R(3, 3 + t, 10, 13, s.hair);
  R(5, 20, 3, 4 - lL, s.bottom); R(8, 20, 3, 4 - rL, s.bottom);
  R(5, 24 - lL, 3, 2, s.shoes); R(8, 24 - rL, 3, 2, s.shoes);
  R(4, 12 + t, 8, 8 - t, s.top); R(2, 13 + t, 2, 6, s.top); R(12, 13 + t, 2, 6, s.top);
  R(2, 19 + t, 2, 1, s.skin); R(12, 19 + t, 2, 1, s.skin);
  if (s.skirt) R(3, 18, 10, 4, s.skirt);
  s.detail(R, t);
  R(4, 5 + t, 8, 7, s.skin);
  R(3, 1 + t, 10, 5, s.hair); R(3, 5 + t, 1, 4, s.hair); R(12, 5 + t, 1, 4, s.hair); R(4, 5 + t, 8, 1, s.hair);
  if (s.spiky) { R(5, 0 + t, 2, 1, s.hair); R(8, 0 + t, 3, 1, s.hair); }
  R(5, 8 + t, 2, 2, INK); R(9, 8 + t, 2, 2, INK); R(5, 8 + t, 1, 1, '#ffffff'); R(9, 8 + t, 1, 1, '#ffffff');
  R(4, 10 + t, 2, 1, '#f08a9a'); R(10, 10 + t, 2, 1, '#f08a9a'); R(7, 11 + t, 2, 1, '#b5675f');
  if (s.long) { R(3, 12 + t, 2, 5, s.hair); R(11, 12 + t, 2, 5, s.hair); }
  s.after && s.after(R, t);
}

function mkCharacter(scene, key, style) {
  const N = 6, { w, h } = CHAR_FRAME;
  const cv = newCanvas(scene, key, w * N, h); if (!cv) return;
  for (let f = 0; f < N; f++) drawChar(cv.c, f * w, f, style);
  finish(cv);
  for (let f = 0; f < N; f++) cv.tex.add(f, 0, f * w, 0, w, h);
}

/* ---------- the room itself (floor, two walls, decorations) ---------- */
function mkRoom(scene) {
  const cv = newCanvas(scene, 'room', GAME_W, GAME_H); if (!cv) return;
  const { c } = cv;
  const OX = ORIGIN.x, OY = ORIGIN.y, N = ROOM_SIZE, WH = WALL_H;
  const P = (gx, gy, z = 0) => [OX + (gx - gy) * HW, OY + (gx + gy) * HH - z];
  const floorT = () => c.setTransform(HW, HH, -HW, HH, OX, OY);
  const rightT = () => c.setTransform(HW, HH, 0, -1, OX, OY);  // wall along the gy=0 edge, u = gx
  const leftT = () => c.setTransform(-HW, HH, 0, -1, OX, OY);  // wall along the gx=0 edge, u = gy

  poly(c, [P(0, N), P(N, N), P(N, N, -7), P(0, N, -7)], '#7a4526'); // floor slab edge
  poly(c, [P(N, 0), P(N, N), P(N, N, -7), P(N, 0, -7)], '#5e3319');

  // warm wooden planks
  floorT();
  const cols = ['#c98d52', '#bf8248', '#d29a5c', '#b9793f'];
  for (let i = 0; i < N * 2; i++) {
    const y = i * 0.5;
    rect(c, cols[i % 4], 0, y, N, 0.5);
    rect(c, '#8f5a2e', 0, y, N, 0.06);
    for (let x = ((i * 37) % 10) / 10 * 1.5; x < N; x += 1.6 + (i % 3) * 0.3) rect(c, '#8f5a2e', x, y, 0.05, 0.5);
    rect(c, '#dca96b', ((i * 53) % 70) / 10, y + 0.2, 0.35, 0.05);
  }
  // rug
  rect(c, '#7e3548', 3.8, 4.6, 3.2, 2.8); rect(c, '#a94b62', 3.95, 4.75, 2.9, 2.5);
  rect(c, '#e8c27a', 4.1, 4.9, 2.6, 0.08); rect(c, '#e8c27a', 4.1, 7.0, 2.6, 0.08);
  rect(c, '#e8c27a', 4.1, 4.9, 0.08, 2.18); rect(c, '#e8c27a', 6.62, 4.9, 0.08, 2.18);
  rect(c, '#c96b80', 4.6, 5.4, 1.6, 1.2);
  // window light patch
  c.fillStyle = 'rgba(255,244,190,.16)'; c.beginPath();
  c.moveTo(0, 1); c.lineTo(0, 2.8); c.lineTo(2.8, 4.0); c.lineTo(2.8, 2.2); c.closePath(); c.fill();
  reset(c);

  const wall = (base) => {
    rect(c, base, 0, 0, N, WH);
    for (let u = 0; u < N; u += 0.5) rect(c, shade(base, 0.95), u, 0, 0.25, WH);
    rect(c, '#7a4a30', 0, 0, N, 17);
    for (let u = 0; u < N; u += 1) rect(c, '#6a3e28', u, 0, 0.05, 17);
    rect(c, '#d9b98a', 0, 17, N, 2); rect(c, '#4d2e1d', 0, 0, N, 3);
    rect(c, '#f3e0b8', 0, WH, N, 3); rect(c, '#c9a574', 0, WH - 1, N, 1);
    rect(c, '#c7a272', N, 0, 0.12, WH + 3);
  };
  const lights = (from, to, v0) => {
    const cl = ['#ffd36a', '#ff8fb8', '#9fe3ff', '#ffe9a8'];
    for (let u = from, i = 0; u < to; u += 0.45, i++) {
      const v = v0 - 4 * Math.sin((((u - from) % 1.8) / 1.8) * Math.PI);
      rect(c, '#3d5a40', u, v + 2, 0.5, 1);
      rect(c, 'rgba(255,225,150,.16)', u + 0.02, v - 5, 0.45, 9);
      rect(c, cl[i % 4], u + 0.12, v - 1, 0.1, 3);
    }
  };
  const HEART = ['01010', '11111', '11111', '01110', '00100'];
  const pix = (rows, u, v, k, col) => rows.forEach((row, r) => [...row].forEach((ch, x) => {
    if (ch === '1') rect(c, col, u + (x * k) / HW, v + (rows.length - 1 - r) * k, k / HW, k);
  }));

  // right wall (behind the desk)
  rightT(); wall('#e6c9a0');
  rect(c, '#5b3a26', 3.0, 35, 1.8, 17); rect(c, '#f6ecd8', 3.08, 36.5, 1.64, 14); pix(HEART, 3.59, 38, 2, '#e0516f');
  rect(c, '#5b3a26', 1.0, 26, 0.9, 11); rect(c, '#bfe5f5', 1.08, 27.5, 0.74, 8); pix(HEART, 1.25, 30, 1, '#ff8fb8');
  rect(c, '#c7a272', 0, 0, 0.1, WH);
  lights(0.4, 7.6, 51); reset(c);

  // left wall (behind the bed + window)
  leftT(); wall(shade('#e6c9a0', 0.84));
  rect(c, '#d9b98a', 0.95, 18, 1.9, 2);
  rect(c, '#6b432a', 1.0, 20, 1.8, 28); rect(c, '#9fd3ee', 1.1, 22, 1.6, 24); rect(c, '#bfe5f5', 1.1, 22, 1.6, 10);
  rect(c, '#6b432a', 1.88, 22, 0.06, 24); rect(c, '#6b432a', 1.1, 33, 1.6, 1.5);
  rect(c, '#e98fa8', 0.8, 20, 0.35, 30); rect(c, '#e98fa8', 2.65, 20, 0.35, 30);
  rect(c, '#5b3a26', 4.4, 28, 1.1, 15); rect(c, '#f6ecd8', 4.48, 29.5, 0.94, 12); pix(HEART, 4.62, 32, 2, '#e0516f');
  rect(c, '#5b3a26', 5.9, 30, 0.8, 11); rect(c, '#bfe5f5', 5.98, 31.5, 0.64, 8);
  lights(0.4, 7.6, 51); reset(c);

  finish(cv, { outline: null });
}

/* ---------- small UI textures ---------- */
function mkUi(scene) {
  let cv = newCanvas(scene, 'prompt', 13, 15);
  if (cv) {
    const { c } = cv;
    rect(c, INK, 1, 1, 11, 11); rect(c, '#f7e7c6', 2, 2, 9, 9);
    rect(c, INK, 4, 4, 5, 1); rect(c, INK, 4, 4, 1, 5); rect(c, INK, 4, 6, 4, 1); rect(c, INK, 4, 8, 5, 1);
    rect(c, INK, 5, 12, 3, 1); rect(c, INK, 6, 13, 1, 1);
    finish(cv, { outline: null });
  }
  cv = newCanvas(scene, 'shadow', 14, 6);
  if (cv) { cv.c.fillStyle = 'rgba(30,10,30,.35)'; cv.c.beginPath(); cv.c.ellipse(7, 3, 6, 2.4, 0, 0, 7); cv.c.fill(); finish(cv, { crisp: false, outline: null }); }
  cv = newCanvas(scene, 'vignette', GAME_W, GAME_H);
  if (cv) {
    const g = cv.c.createRadialGradient(GAME_W / 2, GAME_H / 2, GAME_H * 0.35, GAME_W / 2, GAME_H / 2, GAME_W * 0.62);
    g.addColorStop(0, 'rgba(20,8,30,0)'); g.addColorStop(1, 'rgba(20,8,30,.6)');
    cv.c.fillStyle = g; cv.c.fillRect(0, 0, GAME_W, GAME_H);
    finish(cv, { crisp: false, outline: null });
  }
}

export function generateAllTextures(scene) {
  mkRoom(scene);
  Object.entries(OBJECT_SPECS).forEach(([k, s]) => mkObject(scene, k, s));
  plushies(scene);
  CHARACTER_KEYS.forEach((k) => mkCharacter(scene, k, STYLES[k]));
  mkUi(scene);
}
