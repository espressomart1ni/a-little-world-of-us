import { gridToScreen } from '../utils/isometric.js';
import { OBJECT_SPECS, objectSize } from '../assets/ProceduralTextures.js';

// x,y = grid position of the object's back corner. solid = [x0,y0,x1,y1] collision box (grid units).
const FURNITURE = [
  { key: 'bed',    x: 0,   y: 4,   solid: [0, 4, 3.2, 7] },
  { key: 'desk',   x: 2.4, y: 0,   solid: [2.4, 0, 5.4, 1.3] },
  { key: 'chair',  x: 3.7, y: 1.8, solid: [3.85, 1.95, 4.55, 2.65] },
  { key: 'fridge', x: 6.4, y: 0,   solid: [6.4, 0, 7.7, 1.2] },
  { key: 'pizza',  x: 5.9, y: 3.4 },
];

// Plushies sitting on the bed (z = height above floor in px)
const PLUSH = [
  { key: 'noah', gx: 1.7, gy: 4.9, z: 9.8 },
  { key: 'unicorn', gx: 1.9, gy: 6.3, z: 9.8 },
  { key: 'frog', gx: 2.7, gy: 5.5, z: 9.8 },
  { key: 'duck', gx: 2.6, gy: 6.8, z: 9.8 },
];

// pts = spots Yash can stand at to interact; r = reach; mark = where the "E" bubble floats [gx, gy, z]
const TARGETS = [
  { id: 'bed', name: 'Bed', pts: [[0.6, 3.6], [3.6, 5.4]], r: 1.1, mark: [1.6, 5.5, 24],
    lines: ['Soft, cozy, and very dark-themed.', '(Placeholder - a memory will go here later.)'] },
  { id: 'noah', name: 'Noah', pts: [[1.7, 3.6]], r: 1.0, mark: [1.7, 4.9, 28],
    lines: ['Noah the polar bear. Extremely huggable.', '(Placeholder message.)'] },
  { id: 'unicorn', name: 'Unicorn Plushie', pts: [[3.6, 6.5]], r: 1.0, mark: [1.9, 6.3, 32],
    lines: ['A pastel pink unicorn with three little hearts.', '(Placeholder message.)'] },
  { id: 'desk', name: 'Computer Desk', pts: [[5.1, 2.1], [2.9, 2.1]], r: 1.2, mark: [3.9, 0.7, 32],
    lines: ['Monitor, laptop, keyboard... and a few Red Bulls.', '(Placeholder - desktop interactions come later.)'] },
  { id: 'fridge', name: 'Mini Fridge', pts: [[7.05, 1.6]], r: 1.0, mark: [7.05, 0.6, 38],
    lines: ['Stocked with Elderflower Red Bull.', '(Placeholder message.)'] },
  { id: 'pizza', name: 'Pizza Box', pts: [[6.4, 3.9]], r: 1.0, mark: [6.4, 3.9, 10],
    lines: ['Pizza. Obviously.', '(Placeholder message.)'] },
];

export function buildRoom(scene) {
  const solids = [];

  FURNITURE.forEach((f) => {
    const spec = OBJECT_SPECS[f.key];
    const { W, H, ox, oy } = objectSize(spec);
    const p = gridToScreen(f.x, f.y);
    scene.add.image(Math.round(p.x), Math.round(p.y), f.key)
      .setOrigin(ox / W, oy / H)
      .setDepth(f.x + spec.w / 2 + f.y + spec.d / 2);
    if (f.solid) solids.push({ x0: f.solid[0], y0: f.solid[1], x1: f.solid[2], y1: f.solid[3] });
  });

  PLUSH.forEach((pl) => {
    const p = gridToScreen(pl.gx, pl.gy);
    scene.add.image(Math.round(p.x), Math.round(p.y - pl.z), pl.key).setOrigin(0.5, 1).setDepth(7.2);
  });

  const targets = TARGETS.map((t) => ({
    id: t.id, name: t.name, lines: t.lines, r: t.r,
    getPoints: () => t.pts,
    getMark: () => ({ gx: t.mark[0], gy: t.mark[1], z: t.mark[2] }),
  }));

  return { solids, targets };
}
