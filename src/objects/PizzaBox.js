import { gridToScreen } from '../utils/isometric.js';
import { OBJECT_SPECS, objectSize } from '../assets/ProceduralTextures.js';

// White bedside table. x,y = back corner (grid units), size = footprint, TOP_Z = tabletop height in px.
// ADJUST x,y to put it beside your window.
export const SIDETABLE = { x: 0.05, y: 3.05, size: 0.85, topZ: 14 };

// The pizza box now sits centered on top of the side table.
const _spec = OBJECT_SPECS.pizza;
export const PIZZA_AT = {
  x: SIDETABLE.x + (SIDETABLE.size - _spec.w) / 2,
  y: SIDETABLE.y + (SIDETABLE.size - _spec.d) / 2,
};
const OPEN_FRAMES = ['pizza', 'pizza-lid-1', 'pizza-lid-2', 'pizza-lid-3', 'pizza-lid-4', 'pizza-open-6'];

// The pizza box: closed -> lid opens (animated) -> pizza inside -> slices can be taken.
export class PizzaBox {
  constructor(scene, audio) {
    this.scene = scene; this.audio = audio;
    this.state = 'closed';             // closed | opening | open
    this.slices = 6;
    const spec = OBJECT_SPECS.pizza, { W, H, ox, oy } = objectSize(spec);
    const p = gridToScreen(PIZZA_AT.x, PIZZA_AT.y);
    const tableDepth = SIDETABLE.x + SIDETABLE.size + SIDETABLE.y + SIDETABLE.size;
    this.image = scene.add.image(Math.round(p.x), Math.round(p.y) - SIDETABLE.topZ, 'pizza')
      .setOrigin(ox / W, oy / H)
      .setDepth(Math.max(PIZZA_AT.x + spec.w / 2 + PIZZA_AT.y + spec.d / 2, tableDepth + 0.1))
      .setInteractive({ useHandCursor: true });
  }

  open() {
    if (this.state !== 'closed') return Promise.resolve();
    this.state = 'opening';
    this.audio.play('sfx-pizza-open', { throttle: 200 });
    let i = 0;
    return new Promise((resolve) => {
      const next = () => {
        i++;
        this.image.setTexture(OPEN_FRAMES[i]);
        if (i < OPEN_FRAMES.length - 1) this.scene.time.delayedCall(85, next);
        else { this.state = 'open'; resolve(); }
      };
      this.scene.time.delayedCall(85, next);
    });
  }

  takeSlice() {                        // false if closed or empty
    if (this.state !== 'open' || this.slices <= 0) return false;
    this.slices--;
    this.image.setTexture(`pizza-open-${this.slices}`);
    return true;
  }
}