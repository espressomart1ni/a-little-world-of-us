export const SEAT = [4.2, 2.3];        // chair seat centre
const LAP = { dx: -8, z: 5 };          // Arkisha's offset when she sits on Yash's lap
const HUB = [4.6, 4.6];

const wait = (s, ms) => new Promise((r) => s.time.delayedCall(ms, r));
const tween = (s, target, props, duration, ease = 'Sine.easeInOut') =>
  new Promise((r) => s.tweens.add({ targets: target, ...props, duration, ease, onComplete: r }));

// Director for the pizza-and-movie night. RoomScene owns the objects; this drives them.
export class MovieNight {
  constructor(scene) { this.s = scene; this.armed = false; this.running = false; }

  // Called from the conversation: Arkisha walks to the chair area and waits for Yash to bring a slice.
  // She waits well away from the pizza table so her prompt never overlaps the pizza's.
  arm() {
    if (this.armed || this.running) return;
    const a = this.s.Arkisha;
    this.armed = true;
    a.setScripted(true); a.zTarget = 0;
    a.walkPath([HUB.slice(), [3.0, 2.6]], 2.0);
  }

  // Yash grabbed a slice with no movie night planned: he just eats it where he stands.
  async snack() {
    const s = this.s, y = s.yash;
    s.scripted = true;
    await this.eatLoop([y, y, y, y]);
    s.scripted = false;
  }

  // Yash grabbed a slice while armed: the full sequence.
  async run() {
    const s = this.s, y = s.yash, a = s.Arkisha, d = s.dialogue;
    this.armed = false; this.running = true; s.scripted = true;
    a.setScripted(true);

    // 1. both walk to the chair (Yash from the pizza table, Arkisha from her waiting spot)
    await Promise.all([
      y.walkPath([[2.2, 3.5], [4.4, 3.2], SEAT.slice()], 2.6),
      a.walkPath([[3.4, 2.5]], 2.3),
    ]);

    // 2. Yash sits in the chair
    s.sitYash();
    await wait(s, 300);
    await d.say('Yash', 'Come sit with me, baby.');
    d.close();

    // 3. Arkisha walks over and settles on his lap
    await a.walkPath([[3.8, 2.5], SEAT.slice()], 1.6);
    a.setPose('sit'); a.sprite.setFlipX(true);
    a.offX = LAP.dx; a.zTarget = LAP.z; a.depthBias = 0.2; a.setShadow(false);
    a.emote('heart');
    await wait(s, 500);

    // 4. share the slice, bite by bite
    await d.say('Arkisha', 'Pizza time!');
    d.close();
    await this.eatLoop([y, a, y, a]);
    a.emote('heart');

    // 5. movie
    await d.say('Yash', 'Ready for the movie?');
    await d.say('Arkisha', 'Press play!');
    d.close();
    await s.enterMonitor('movie');

    // 6. afterwards
    a.emote('heart');
    await d.say('Arkisha', 'That was perfect. I love you, Yash.');
    d.close();
    await this.standUp();
  }

  async eatLoop(biters) {
    const s = this.s, y = s.yash, slice = y.slice;
    for (const who of biters) {
      if (!slice || !slice.alive) break;
      if (who.pose !== 'stand') who.setPose('eat');
      const [hx, hy] = y.handPos(), m = who.mouthPos();
      await tween(s, y.sliceFx, { x: m.x - hx, y: m.y - hy }, 320);       // slice goes to the mouth
      s.audio.play('sfx-eating');
      const gone = slice.bite();                                           // slice changes state
      this.crumbs(m.x, m.y);
      await wait(s, 450);
      if (gone) { y.slice = null; y.sliceFx.x = 0; y.sliceFx.y = 0; }
      else await tween(s, y.sliceFx, { x: 0, y: 0 }, 280);
      if (who.pose === 'eat') who.setPose('sit');
      await wait(s, 250);
    }
  }

  crumbs(x, y) {
    const s = this.s;
    for (let i = 0; i < 3; i++) {
      const c = s.add.rectangle(x + i * 2 - 2, y, 1, 1, 0xf3d9a4).setDepth(9998);
      s.tweens.add({ targets: c, y: y + 8 + i * 2, x: c.x + (i - 1) * 3, alpha: 0, duration: 520, onComplete: () => c.destroy() });
    }
  }

  async standUp() {
    const s = this.s, y = s.yash, a = s.Arkisha;
    a.setPose('stand'); a.offX = 0; a.zTarget = 0; a.depthBias = 0; a.setShadow(true);
    y.setPose('stand'); y.depthBias = 0;
    await Promise.all([y.walkPath([[5.1, 2.4]], 2.4), a.walkPath([[3.5, 2.5]], 2.0)]);
    a.setScripted(false);                 // she goes back to her own loop
    s.scripted = false; this.running = false;
  }
}