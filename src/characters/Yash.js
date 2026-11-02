import { Character } from './Character.js';
import { screenDirToGrid } from '../utils/isometric.js';

export class Yash extends Character {
  constructor(scene, gx, gy) {
    super(scene, gx, gy, 'yash');
    this.speed = 3.4; // tiles per second
    this.keys = scene.input.keyboard.addKeys({
      w: 'W', a: 'A', s: 'S', d: 'D', up: 'UP', left: 'LEFT', down: 'DOWN', right: 'RIGHT',
    });
  }

  update(dt, locked) {
    let sx = 0, sy = 0;
    if (!locked) {
      const k = this.keys;
      if (k.a.isDown || k.left.isDown) sx -= 1;
      if (k.d.isDown || k.right.isDown) sx += 1;
      if (k.w.isDown || k.up.isDown) sy -= 1;
      if (k.s.isDown || k.down.isDown) sy += 1;
    }
    const moving = sx !== 0 || sy !== 0;
    if (moving) {
      const g = screenDirToGrid(sx, sy);
      const len = Math.hypot(g.x, g.y), step = this.speed * dt;
      this.moveBy((g.x / len) * step, (g.y / len) * step);
      if (sx !== 0) this.sprite.setFlipX(sx < 0);
    }
    this.setMoving(moving);
    this.sync();
  }
}
