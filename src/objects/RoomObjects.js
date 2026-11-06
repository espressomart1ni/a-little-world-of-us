import { gridToScreen } from '../utils/isometric.js';
import { OBJECT_SPECS, objectSize } from '../assets/ProceduralTextures.js';
import { PizzaBox, SIDETABLE } from './PizzaBox.js';

// x,y = grid position of the object's back corner. solid = [x0,y0,x1,y1] collision box (grid units).
// The pizza box is its own animated object (see PizzaBox.js).
const FURNITURE = [
  { key: 'bed',    x: 0,   y: 4,   solid: [0, 4, 3.2, 7] },
  { key: 'desk',   x: 2.4, y: 0,   solid: [2.4, 0, 5.4, 1.3] },
  { key: 'chair',  x: 3.7, y: 1.8, solid: [3.85, 1.95, 4.55, 2.65] },
  { key: 'fridge', x: 6.4, y: 0,   solid: [6.4, 0, 7.7, 1.2] },
];

// Plushies sitting on the bed (z = height above floor in px)
const PLUSH = [
  { key: 'noah',    gx: 1.7, gy: 4.9, z: 9.8 },
  { key: 'unicorn', gx: 1.9, gy: 6.3, z: 9.8 },
];

// Where Yash stands to use the pizza: just in front of the side table.
const PIZZA_STAND = [0.6, 2.5];   // open floor beside the table, toward the corner

// pts = spots Yash can stand at to interact; r = reach; mark = where the "E" bubble floats [gx, gy, z]
const TARGETS = [
  { id: 'bed', name: 'Bed', pts: [[1.4, 3.6], [3.6, 5.4]], r: 1.1, mark: [1.6, 5.5, 24],
    lines: ['Soft, cozy, and very dark-themed.', '(Placeholder - a memory will go here later.)'] },
  { id: 'noah', name: 'Noah', pts: [[1.7, 3.6]], r: 1.0, mark: [1.7, 4.9, 28],
    lines: ['Noah. Extremely huggable.', '(Placeholder message.)'] },
  { id: 'unicorn', name: 'Sky', pts: [[3.6, 6.5]], r: 1.0, mark: [1.9, 6.3, 32],
    lines: ['Sky always keeps the best spot on the bed.', '(Placeholder message.)'] },
  { id: 'desk', name: 'Computer Desk', pts: [[5.1, 2.1], [2.9, 2.1]], r: 1.2, mark: [3.9, 0.7, 32],
    lines: ['Monitor, laptop, keyboard... and a few Red Bulls.'] },
  { id: 'fridge', name: 'Mini Fridge', pts: [[7.05, 1.6]], r: 1.0, mark: [7.05, 0.6, 38],
    lines: ['Stocked with Elderflower Red Bull.'] },
  { id: 'pizza', name: 'Pizza Box', pts: [PIZZA_STAND], r: 1.0,
    mark: [SIDETABLE.x + SIDETABLE.size / 2, SIDETABLE.y + SIDETABLE.size / 2, SIDETABLE.topZ + 18],
    lines: ['Pizza. Obviously.'] },
];

// White bedside table, drawn as a small isometric box (24 x 26 px; top diamond 24x12, 14 px tall).
function makeSideTableTexture(scene) {
  if (scene.textures.exists('sidetable')) return;     // real art can override later
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xffffff).fillPoints([{ x: 12, y: 0 }, { x: 24, y: 6 }, { x: 12, y: 12 }, { x: 0, y: 6 }], true);   // top
  g.fillStyle(0xe8ecef).fillPoints([{ x: 0, y: 6 }, { x: 12, y: 12 }, { x: 12, y: 26 }, { x: 0, y: 20 }], true);  // left face
  g.fillStyle(0xd3d9dd).fillPoints([{ x: 12, y: 12 }, { x: 24, y: 6 }, { x: 24, y: 20 }, { x: 12, y: 26 }], true); // right face
  g.fillStyle(0xc2c9ce).fillPoints([{ x: 15, y: 15 }, { x: 22, y: 11.5 }, { x: 22, y: 16.5 }, { x: 15, y: 20 }], true); // drawer
  g.fillStyle(0x9aa3a9).fillRect(17, 15, 3, 1);        // handle
  g.generateTexture('sidetable', 24, 26);
  g.destroy();
}

// Open mini fridge: copies the closed fridge texture, then paints the open interior on its front-left face.
// TUNE: FACE.x/y/w/h are fractions of the fridge texture size.
const FACE = { x: 0.10, y: 0.30, w: 0.40, h: 0.55 };
function makeFridgeOpenTexture(scene) {
  if (scene.textures.exists('fridge-open') || !scene.textures.exists('fridge')) return;
  const src = scene.textures.get('fridge').getSourceImage();
  const W = src.width, H = src.height;
  const tex = scene.textures.createCanvas('fridge-open', W, H);
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0);

  const fw = Math.round(W * FACE.w), fh = Math.round(H * FACE.h);
  ctx.save();
  ctx.translate(Math.round(W * FACE.x), Math.round(H * FACE.y));
  ctx.transform(1, 0.5, 0, 1, 0, 0);                    // skew flat drawing onto the isometric face
  ctx.fillStyle = '#9aa7ad'; ctx.fillRect(0, 0, fw, fh);                 // inner shell
  ctx.fillStyle = '#eef4f6'; ctx.fillRect(2, 2, fw - 4, fh - 4);         // bright interior
  const shelves = 3, sh = Math.floor((fh - 4) / shelves);
  for (let s = 0; s < shelves; s++) {
    const baseY = 2 + (s + 1) * sh;                      // shelf line
    ctx.fillStyle = '#b0bec5'; ctx.fillRect(2, baseY - 1, fw - 4, 1);
    const cols = Math.max(2, Math.floor((fw - 6) / 4));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < 2; r++) {                      // two cans stacked
        const cx = 3 + c * 4, cy = baseY - 1 - (r + 1) * 5;
        if (cy < 3) continue;
        ctx.fillStyle = '#a5d66b'; ctx.fillRect(cx, cy, 3, 5);           // green elderflower can
        ctx.fillStyle = '#e8f5d0'; ctx.fillRect(cx, cy + 2, 3, 1);       // label stripe
        ctx.fillStyle = '#cfd8dc'; ctx.fillRect(cx, cy, 3, 1);           // silver top
      }
    }
  }
  ctx.restore();
  tex.refresh();
}

export function buildRoom(scene, audio) {
  const solids = [];
  const furniture = {};

  FURNITURE.forEach((f) => {
    const spec = OBJECT_SPECS[f.key];
    const { W, H, ox, oy } = objectSize(spec);
    const p = gridToScreen(f.x, f.y);
    furniture[f.key] = scene.add.image(Math.round(p.x), Math.round(p.y), f.key)
      .setOrigin(ox / W, oy / H)
      .setDepth(f.x + spec.w / 2 + f.y + spec.d / 2);
    if (f.solid) solids.push({ x0: f.solid[0], y0: f.solid[1], x1: f.solid[2], y1: f.solid[3] });
  });

  // White side table (the pizza box sits on top of it).
  makeSideTableTexture(scene);
  const tFront = gridToScreen(SIDETABLE.x + SIDETABLE.size, SIDETABLE.y + SIDETABLE.size);
  scene.add.image(Math.round(tFront.x), Math.round(tFront.y), 'sidetable')
    .setOrigin(0.5, 1)
    .setDepth(SIDETABLE.x + SIDETABLE.size + SIDETABLE.y + SIDETABLE.size);
  solids.push({ x0: SIDETABLE.x, y0: SIDETABLE.y, x1: SIDETABLE.x + SIDETABLE.size, y1: SIDETABLE.y + SIDETABLE.size });

  // Plushies get a tiny 2-frame idle: a 1px bob, staggered so they never move in sync.
  const plush = {};
  PLUSH.forEach((pl, i) => {
    const p = gridToScreen(pl.gx, pl.gy);
    const baseY = Math.round(p.y - pl.z);
    const img = scene.add.image(Math.round(p.x), baseY, pl.key).setOrigin(0.5, 1).setDepth(7.2);
    plush[pl.key] = img;
    let up = false;
    scene.time.addEvent({ delay: 650 + i * 170, loop: true, callback: () => { up = !up; img.y = baseY - (up ? 1 : 0); } });
  });

  const pizza = new PizzaBox(scene, audio);

  // Fridge door: open() shows the 'fridge-open' texture once it exists; until then it does nothing.
    const fridge = {
    image: furniture.fridge,
    open()  { makeFridgeOpenTexture(scene); if (scene.textures.exists('fridge-open')) furniture.fridge.setTexture('fridge-open'); },
    close() { furniture.fridge.setTexture('fridge'); },
  };

  const targets = TARGETS.map((t) => ({
    id: t.id, name: t.name, lines: t.lines, r: t.r,
    getPoints: () => t.pts,
    getMark: () => ({ gx: t.mark[0], gy: t.mark[1], z: t.mark[2] }),
  }));

  return { solids, targets, pizza, plush, fridge };
}