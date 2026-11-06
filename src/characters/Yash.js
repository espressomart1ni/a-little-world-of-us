import { Character } from './Character.js';
import { screenDirToGrid } from '../utils/isometric.js';

export class Yash extends Character {
  constructor(scene, gx, gy) {
    super(scene, gx, gy, 'yash');
    this.speed = 3.4; // tiles per second
    this.keys = scene.input.keyboard.addKeys({
      w: 'W', a: 'A', s: 'S', d: 'D', up: 'UP', left: 'LEFT', down: 'DOWN', right: 'RIGHT',
    });
    this.isWalking = false;
        this.zTarget = 0;                  // NEW: height he is climbing to (bed)
    this.hasCan = false;
    this.can = scene.add.image(0, 0, 'can').setVisible(false);
    this.slice = null;                 // PizzaSlice in hand
    this.sliceFx = { x: 0, y: 0 };     // tweened offset (hand -> mouth)
  }

  update(dt, locked) {
    let moving = false;
    if (this.path.length) {            // scripted walk (pizza night, sitting down)
      moving = true;
      this.stepPath(dt);
    } else if (this.pose === 'stand') {
      let sx = 0, sy = 0;
      if (!locked) {
        const k = this.keys;
        if (k.a.isDown || k.left.isDown) sx -= 1;
        if (k.d.isDown || k.right.isDown) sx += 1;
        if (k.w.isDown || k.up.isDown) sy -= 1;
        if (k.s.isDown || k.down.isDown) sy += 1;
      }
      moving = sx !== 0 || sy !== 0;
      if (moving) {
        const g = screenDirToGrid(sx, sy);
        const len = Math.hypot(g.x, g.y), step = this.speed * dt;
        this.moveBy((g.x / len) * step, (g.y / len) * step);
        if (sx !== 0) this.sprite.setFlipX(sx < 0);
      }
      this.setMoving(moving);
    }
        const zs = 50 * dt, dz = this.zTarget - this.z;          // NEW: smooth climb up / down
    this.z += Math.abs(dz) < zs ? dz : Math.sign(dz) * zs;
    this.isWalking = moving;
    this.sync();
    this.updateHeld();
  }

  handPos() {                          // where the hand rests, in screen pixels
    const f = this.sprite.flipX ? -1 : 1, sitting = this.pose !== 'stand';
    return [this.sprite.x + f * (sitting ? 8 : 6), this.sprite.y - (sitting ? 8 : 11)];
  }

  holdSlice(slice) {
    this.slice = slice;
    this.sliceFx.x = 0; this.sliceFx.y = 0;
    this.updateHeld();
  }

  updateHeld() {
    const [hx, hy] = this.handPos(), f = this.sprite.flipX ? -1 : 1;
    const d = this.sprite.depth + 0.02;
    this.can.setVisible(this.hasCan);
    if (this.hasCan) this.can.setPosition(hx + (this.slice ? -f * 12 : 0), hy + 2).setDepth(d);
    if (this.slice && this.slice.alive) this.slice.setPos(hx + this.sliceFx.x, hy + this.sliceFx.y);
  }
}