import { Character } from './Character.js';

const HUB = [4.6, 4.6]; // open floor spot she routes through, so she never clips furniture
const SPOTS = {
  eat:    { at: [2.9, 3.4], z: 0,   dur: 7000 },
  work:   { at: [2.8, 5.5], z: 9.8, dur: 11000 },
  cuddle: { at: [1.8, 5.6], z: 9.8, dur: 9000 },
};
const ACTIVITIES = Object.keys(SPOTS);

export class Arkisha extends Character {
  constructor(scene, gx, gy, watched) {
    super(scene, gx, gy, 'arkisha');
    this.watched = watched;
    this.speed = 1.8;
    this.busy = false;        // true while talking to Yash
    this.scripted = false;    // true while a cutscene (pizza night) drives her
        this.hold = false;        // NEW: stay put (e.g. while Yash cuddles on the bed)
    this.walking = false;
    this.isWalking = false;
    this.activity = 'idle';
    this.route = [];
    this.zTarget = 0;
    this.timer = 1500;        // ms until her first activity
    this.queue = [];          // forced upcoming activities
    this.emoteT = 0;
    this.sprite.anims.setProgress(0.5);

    this.laptop = scene.add.image(0, 0, 'laptop').setOrigin(0.5, 1).setVisible(false);
    this.slice = scene.add.image(0, 0, 'slice').setVisible(false);

    const me = this;
    const off = () => me.scripted || me.walking || me.z > 1 || me.path.length > 0;   // no collision then
    this.solid = {
      get x0() { return off() ? -100 : me.gx - 0.3; }, get x1() { return off() ? -99 : me.gx + 0.3; },
      get y0() { return off() ? -100 : me.gy - 0.3; }, get y1() { return off() ? -99 : me.gy + 0.3; },
    };
    this.target = {
      id: 'arkisha', name: 'Arkisha', priority: 1.2, lines: [],
      get r() { return me.z > 1 ? 1.9 : 1.3; },
      getPoints: () => [[me.gx, me.gy]],
      getMark: () => ({ gx: me.gx, gy: me.gy, z: 36 + me.z }),
    };
  }

  setBusy(b) { this.busy = b; }

  setScripted(b) {
    this.scripted = b;
    if (b) { this.route = []; this.walking = false; this.queue = []; }
    else { this.path = []; this.activity = 'idle'; this.timer = 2500; }   // back to her own loop
  }

  faceWatched() {
    const dx = this.watched.gx - this.watched.gy - (this.gx - this.gy);
    if (Math.abs(dx) > 0.3) this.sprite.setFlipX(dx < 0);
  }

  update(dt) {
    if (this.scripted) {
      if (!this.stepPath(dt) && this.pose === 'stand') { this.setMoving(false); this.faceWatched(); }
    } else if (this.busy) {
      this.walking = false;
      this.setMoving(false);
      this.faceWatched();
    } else if (this.route.length) {
      this.walkRoute(dt);
    } else {
      this.setMoving(false);
            if (this.hold && !this.queue.length) this.timer = Math.max(this.timer, 4000);   // NEW
      this.timer -= dt * 1000;
      if (this.timer <= 0) this.next();
      if (this.activity === 'cuddle' && this.z > 9) {
        this.emoteT += dt;
        if (this.emoteT > 1.8) { this.emoteT = 0; this.emote('heart'); }
      }
    }
    // smooth climb onto / off the bed (and up onto Yash's lap)
    const step = 50 * dt, dz = this.zTarget - this.z;
    this.z += Math.abs(dz) < step ? dz : Math.sign(dz) * step;
    this.isWalking = this.walking || this.path.length > 0;
    this.sync();
    this.updateProps();
  }

  walkRoute(dt) {
    const [tx, ty] = this.route[0];
    const dx = tx - this.gx, dy = ty - this.gy, dist = Math.hypot(dx, dy), step = this.speed * dt;
    this.walking = true;
    this.setMoving(true);
    this.zTarget = this.route.length === 1 ? SPOTS[this.activity].z : 0;
    const sdx = dx - dy;
    if (Math.abs(sdx) > 0.01) this.sprite.setFlipX(sdx < 0);
    if (dist <= step) {
      this.gx = tx; this.gy = ty; this.route.shift();
      if (!this.route.length) this.arrive();
    } else {
      this.gx += (dx / dist) * step; this.gy += (dy / dist) * step;
    }
  }

  arrive() {
    this.walking = false;
    const s = SPOTS[this.activity];
    this.timer = this.queue.length ? 2000 : s.dur + Math.random() * 3000;
    this.sprite.setFlipX(this.activity === 'cuddle'); // faces Noah when cuddling
  }

  next() {
    let name = this.queue.shift();
    if (!name) {
      const opts = ACTIVITIES.filter((a) => a !== this.activity);
      name = opts[Math.floor(Math.random() * opts.length)];
    }
    this.go(name);
  }

  go(name) {
    this.activity = name;
    this.route = [HUB.slice(), SPOTS[name].at.slice()];
  }

  snapTo(name) {            // instant teleport (used after the fade-to-black)
    const s = SPOTS[name];
    this.setPose('stand'); this.offX = 0; this.depthBias = 0; this.setShadow(true);
    this.route = []; this.activity = name; this.walking = false;
    this.gx = s.at[0]; this.gy = s.at[1]; this.z = this.zTarget = s.z;
    this.timer = s.dur; this.sprite.setFlipX(true);
  }

  updateProps() {
    if (this.scripted) { this.laptop.setVisible(false); this.slice.setVisible(false); return; }
    const here = !this.route.length;
    const fx = this.sprite.flipX ? -1 : 1, d = this.gx + this.gy + 0.02;
    const sitting = here && this.activity === 'work' && this.z > 9;
    this.laptop.setVisible(sitting).setPosition(this.sprite.x + 6 * fx, this.sprite.y + 1).setDepth(d);
    const eating = here && this.activity === 'eat';
    this.slice.setVisible(eating)
      .setPosition(this.sprite.x + 5 * fx, this.sprite.y - 11 + Math.sin(this.scene.time.now / 220) * 2)
      .setDepth(d);
  }

  emote(tex = 'heart') {
    const s = this.scene.add.image(this.sprite.x + (Math.random() * 8 - 4), this.sprite.y - 30, tex).setDepth(9998);
    this.scene.tweens.add({ targets: s, y: s.y - 14, alpha: 0, duration: 1300, onComplete: () => s.destroy() });
  }
}