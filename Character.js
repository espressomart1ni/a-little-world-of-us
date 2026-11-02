import { gridToScreen } from '../utils/isometric.js';

// Shared base for anything that walks around the room. Positions are in grid space.
export class Character {
  constructor(scene, gx, gy, key) {
    this.scene = scene; this.key = key; this.gx = gx; this.gy = gy; this.radius = 0.22;
    this.shadow = scene.add.image(0, 0, 'shadow');
    this.sprite = scene.add.sprite(0, 0, key, 0).setOrigin(0.5, 27 / 28);
    this.sprite.play(`${key}-idle`);
    this.sync();
  }

  moveBy(dx, dy) {            // axis-separated so you slide along walls and furniture
    if (!this.scene.isBlocked(this.gx + dx, this.gy, this.radius)) this.gx += dx;
    if (!this.scene.isBlocked(this.gx, this.gy + dy, this.radius)) this.gy += dy;
  }

  setMoving(moving) {
    const a = `${this.key}-${moving ? 'walk' : 'idle'}`;
    if (!this.sprite.anims.currentAnim || this.sprite.anims.currentAnim.key !== a) this.sprite.play(a);
  }

  sync() {                    // screen position + depth sorting (further front = higher gx+gy)
    const p = gridToScreen(this.gx, this.gy);
    const x = Math.round(p.x), y = Math.round(p.y);
    this.sprite.setPosition(x, y).setDepth(this.gx + this.gy);
    this.shadow.setPosition(x, y).setDepth(this.gx + this.gy - 0.01);
  }
}
