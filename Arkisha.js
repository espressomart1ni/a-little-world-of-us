import { Character } from './Character.js';

export class Arkisha extends Character {
  constructor(scene, gx, gy, watched) {
    super(scene, gx, gy, 'arkisha');
    this.watched = watched;
    this.sprite.anims.setProgress(0.5);
    const me = this;
    this.solid = {   // live collision box that follows her
      get x0() { return me.gx - 0.3; }, get x1() { return me.gx + 0.3; },
      get y0() { return me.gy - 0.3; }, get y1() { return me.gy + 0.3; },
    };
    this.target = {
      id: 'arkesha', name: 'Arkisha', r: 1.3,
      lines: ['Hi Yash! :)', '(Placeholder - a real conversation will live here in a later phase.)'],
      getPoints: () => [[me.gx, me.gy]],
      getMark: () => ({ gx: me.gx, gy: me.gy, z: 36 }),
    };
  }

  update() {   // idle, but she turns to look at Yash
    const dx = this.watched.gx - this.watched.gy - (this.gx - this.gy);
    if (Math.abs(dx) > 0.3) this.sprite.setFlipX(dx < 0);
    this.sync();
  }
}
