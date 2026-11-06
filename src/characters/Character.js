import { gridToScreen } from '../utils/isometric.js';

// Shared base for anything that walks around the room. Positions are in grid space.
export class Character {
  constructor(scene, gx, gy, key) {
    this.scene = scene; this.key = key; this.gx = gx; this.gy = gy; this.radius = 0.22;
    this.z = 0;                 // height above the floor (px), e.g. sitting on the bed
    this.offX = 0;              // screen-pixel nudge (lap sitting)
    this.depthBias = 0;         // depth tweak so a seated character draws in front of the chair
    this.pose = 'stand';        // 'stand' | 'sit' | 'eat'
    this.path = []; this.pathSpeed = 2.4; this.pathDone = null;
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
    if (this.pose !== 'stand') return;
    const a = `${this.key}-${moving ? 'walk' : 'idle'}`;
    if (!this.sprite.anims.currentAnim || this.sprite.anims.currentAnim.key !== a) this.sprite.play(a);
  }

  setPose(pose) {             // 'stand' (idle/walk), 'sit', 'eat' (sitting, hand raised)
    if (pose === this.pose) return;
    this.pose = pose;
    this.sprite.play(pose === 'stand' ? `${this.key}-idle` : `${this.key}-${pose}`);
  }

  setShadow(v) { this.shadow.setVisible(v); }

  // Scripted walking in grid space (no teleporting, no collision). Resolves on arrival.
  walkPath(points, speed = 2.4) {
    this.path = points.map((p) => [p[0], p[1]]);
    this.pathSpeed = speed;
    return new Promise((res) => { this.pathDone = res; });
  }

  stepPath(dt) {              // returns true while still walking
    if (!this.path.length) return false;
    const [tx, ty] = this.path[0];
    const dx = tx - this.gx, dy = ty - this.gy, dist = Math.hypot(dx, dy), step = this.pathSpeed * dt;
    const sdx = dx - dy;      // screen-x direction of this grid move
    if (Math.abs(sdx) > 0.01) this.sprite.setFlipX(sdx < 0);
    this.setMoving(true);
    if (dist <= step) {
      this.gx = tx; this.gy = ty; this.path.shift();
      if (!this.path.length) {
        this.setMoving(false);
        const r = this.pathDone; this.pathDone = null;
        if (r) r();
      }
    } else {
      this.gx += (dx / dist) * step; this.gy += (dy / dist) * step;
    }
    return true;
  }

  mouthPos() {                // where a bite lands, in screen pixels
    const f = this.sprite.flipX ? -1 : 1;
    return { x: this.sprite.x + 3 * f, y: this.sprite.y - 14 };
  }

  sync() {                    // screen position + depth sorting (further front = higher gx+gy)
    const p = gridToScreen(this.gx, this.gy);
    const x = Math.round(p.x), y = Math.round(p.y);
    this.sprite.setPosition(x + this.offX, y - Math.round(this.z)).setDepth(this.gx + this.gy + this.depthBias);
    this.shadow.setPosition(x + this.offX, y).setDepth(this.gx + this.gy - 0.01 + this.depthBias);
  }
}