const BED_Z = 9.8;                                   // height of the bed surface
const SPOT = {                                       // where Yash stands on the bed (grid units)
  arkisha: [2.4, 5.6],
  noah: [2.3, 4.95],
  sky: [2.45, 6.3],
};
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const wait = (s, ms) => new Promise((r) => s.time.delayedCall(ms, r));
const tween = (s, targets, props, duration) =>
  new Promise((r) => s.tweens.add({ targets, ...props, duration, onComplete: r }));
const waitUntil = (s, test, max = 9000) => new Promise((res) => {
  let t = 0;
  const ev = s.time.addEvent({ delay: 100, loop: true, callback: () => {
    t += 100;
    if (test() || t >= max) { ev.remove(); res(); }
  } });
});

// Yash climbs onto the bed and cuddles Arkisha, Noah and Sky.
export class BedCuddle {
  constructor(scene, plush) { this.s = scene; this.plush = plush; }

  async start() {
    const s = this.s, y = s.yash;
    if (s.movieNight.armed || s.movieNight.running) {
      s.dialogue.show('Yash', ['Later - the pizza is waiting.']);
      return;
    }
    s.scripted = true;
    try {
      await this.climbUp();
      await this.menu();
    } finally {
      await this.climbDown();
      s.scripted = false;
    }
  }

  async climbUp() {
    const s = this.s, y = s.yash, ark = s.Arkisha;
    y.depthBias = 0.3; y.zTarget = BED_Z;
    // call Arkisha over to her cuddle spot and keep her there until Yash gets down
    if (!ark.scripted) {
      ark.hold = true;
      if (!(ark.activity === 'cuddle' && !ark.route.length)) { ark.queue = ['cuddle']; ark.timer = 0; }
    }
    const path = y.gx > 3.2 ? [[3.1, 5.6], SPOT.arkisha] : [[0.9, 4.4], SPOT.arkisha];
    await y.walkPath(path, 2.4);
    y.sprite.setFlipX(true);
  }

  async menu() {
    const d = this.s.dialogue;
    while (true) {
      const i = await d.choose(['Cuddle Arkisha', 'Hug Noah', 'Hug Sky', 'Get down'], 'Bed', 'Cozy time...');
      d.close();
      if (i === 0) await this.cuddleArkisha();
      else if (i === 1) await this.hugPlush('noah', 'Noah, you are the softest.');
      else if (i === 2) await this.hugPlush('sky', 'Hi Sky. I saved you a spot.');
      else return;                                   // "Get down" or ESC
    }
  }

  async cuddleArkisha() {
    const s = this.s, y = s.yash, ark = s.Arkisha, d = s.dialogue;
    if (ark.route.length || ark.z < 9) {
      await d.say('Arkisha', 'Coming, baby!');
      d.close();
      await waitUntil(s, () => !ark.route.length && ark.z > 9);
    }
    await y.walkPath([SPOT.arkisha], 2.0);
    y.sprite.setFlipX(true); ark.sprite.setFlipX(false);          // face each other
    await tween(s, y, { offX: -4 }, 400);                          // lean in
    this.hearts(3);
    await d.say('Yash', 'Come here, baby.');
    await d.say('Arkisha', pick(['*snuggles in closer*', 'Mmm, stay right here.', 'This is my favourite spot.', 'I love you, Yash.']));
    d.close();
    await wait(s, 1500);
    await tween(s, y, { offX: 0 }, 400);
  }

  async hugPlush(key, line) {
    const s = this.s, y = s.yash, d = s.dialogue;
    await y.walkPath([SPOT[key]], 2.0);
    y.sprite.setFlipX(true);
    const img = this.plush[key === 'sky' ? 'unicorn' : 'noah'];
    s.tweens.add({ targets: img, scaleX: 1.25, scaleY: 1.25, duration: 200, yoyo: true, repeat: 1 });   // squish
    this.hearts(2);
    await d.say('Yash', line);
    d.close();
  }

  async climbDown() {
    const s = this.s, y = s.yash, ark = s.Arkisha;
    y.offX = 0; y.zTarget = 0;
    await y.walkPath([[3.1, 5.6], [3.6, 5.4]], 2.4);
    y.depthBias = 0;
    ark.hold = false; ark.timer = 3000;                            // she goes back to her own loop
  }

  hearts(n) {
    const s = this.s, y = s.yash;
    for (let k = 0; k < n; k++) {
      s.time.delayedCall(k * 250, () => {
        const h = s.add.image(y.sprite.x + Math.random() * 8 - 4, y.sprite.y - 30, 'heart').setDepth(9998);
        s.tweens.add({ targets: h, y: h.y - 16, alpha: 0, duration: 1200, onComplete: () => h.destroy() });
      });
    }
  }
}