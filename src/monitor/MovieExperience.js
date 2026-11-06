import Phaser from 'phaser';
import { GAME_W as W, GAME_H as H } from '../utils/isometric.js';
import { FONT, crisp } from '../utils/theme.js';

const BAR = 24, TOP = BAR, BOT = H - BAR, MID = (TOP + BOT) / 2, A = BOT - TOP;

const mix = (a, b, k) => {
  const ca = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const cb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return (Math.round(ca[0] + (cb[0] - ca[0]) * k) << 16) | (Math.round(ca[1] + (cb[1] - ca[1]) * k) << 8) | Math.round(ca[2] + (cb[2] - ca[2]) * k);
};

// Edit the credits freely: [small line, big line]
const CREDITS = [
  ['PIXEL HEART PICTURES', 'presents'],
  ['starring', 'ARKISHA & YASH'],
  ['with', 'NOAH & SKY'],
  ['pizza by', 'A VERY GOOD BOX'],
  ['directed by', 'LOVE'],
];

const HEROINE = { skin: 0xf2c7a5, hair: 0x4a2c20, dress: 0xf8e08e, long: true };   // butter yellow dress
const HERO = { skin: 0xe0b28c, hair: 0x1c1c24, top: 0x3d5a80, bottom: 0x22263a };
const SUIT = { skin: 0xf0c8a8, hair: 0x888888, top: 0x1a1a22, bottom: 0x1a1a22, suit: true };

// Original short film, all drawn in code: night-sky credits -> stairs chase -> bridge kiss -> THE END.
export class MovieExperience {
  constructor(scene, audio) {
    this.s = scene; this.audio = audio; this.grain = []; this.stage = null; this.black = null;
  }

  /* ---------- helpers ---------- */
  txt(x, y, str, size, color, extra = {}) {
    return crisp(this.s.add.text(x, y, str, { fontFamily: FONT, fontSize: `${size}px`, color, ...extra }));
  }
  wait(ms) { return new Promise((r) => this.s.time.delayedCall(ms, r)); }
  tw(targets, props, ms, ease = 'Linear', onUpdate) {
    return new Promise((r) => this.s.tweens.add({ targets, ...props, duration: ms, ease, onUpdate, onComplete: r }));
  }
  fadeIn(ms = 600) { return this.tw(this.black, { alpha: 0 }, ms); }
  fadeOut(ms = 600) { return this.tw(this.black, { alpha: 1 }, ms); }

  newStage() {
    const s = this.s;
    s.tweens.killAll();
    if (this.stage) this.stage.destroy();
    this.stage = s.add.container(0, 0).setDepth(10);
    return this.stage;
  }

  skyBands(parent, y0, y1, top, bottom) {
    const bands = 22, bh = (y1 - y0) / bands;
    for (let i = 0; i < bands; i++) {
      parent.add(this.s.add.rectangle(0, y0 + i * bh, W, bh + 1, mix(top, bottom, i / (bands - 1))).setOrigin(0));
    }
  }

  // Little pixel person, origin = feet. look: {skin, hair, top, bottom, dress, long, suit}
  person(x, y, L, sc) {
    const g = this.s.add.graphics();
    if (L.dress) {
      g.fillStyle(L.skin).fillRect(-3.5, -10, 2.5, 10).fillRect(1, -10, 2.5, 10);
      g.fillStyle(L.dress).fillPoints([{ x: -6, y: -9 }, { x: 6, y: -9 }, { x: 3, y: -21 }, { x: -3, y: -21 }], true);
    } else {
      g.fillStyle(L.bottom).fillRect(-3.5, -11, 3, 11).fillRect(0.5, -11, 3, 11);
      g.fillStyle(L.top).fillRect(-4.5, -21, 9, 11);
      if (L.suit) { g.fillStyle(0xffffff).fillRect(-1.5, -21, 3, 5); g.fillStyle(0xb02a2a).fillRect(-0.5, -21, 1, 5); }
    }
    g.fillStyle(L.dress ? L.skin : L.top).fillRect(-6.5, -20, 2, 8).fillRect(4.5, -20, 2, 8);
    g.fillStyle(L.skin).fillRect(-6.5, -12, 2, 2).fillRect(4.5, -12, 2, 2).fillRect(-3.5, -28, 7, 7);
    g.fillStyle(L.hair).fillRect(-4, -30, 8, 3.5);
    if (L.long) g.fillRect(-4.5, -28, 2, 11);
    g.fillStyle(0x222222).fillRect(1.5, -25.5, 1, 1);
    const c = this.s.add.container(x, y, [g]).setScale(sc);
    this.stage.add(c);
    return c;
  }
  face(c, d) { c.scaleX = Math.abs(c.scaleX) * d; }          // 1 = right, -1 = left
  bob(c, on, ms = 110) {
    const g = c.list[0];
    if (c._bob) { c._bob.stop(); c._bob = null; g.y = 0; }
    if (on) c._bob = this.s.tweens.add({ targets: g, y: -2, duration: ms, yoyo: true, repeat: -1 });
  }
  async go(c, x, y, ms, ease = 'Linear', bobMs = 110) {
    if (x !== c.x) this.face(c, x > c.x ? 1 : -1);
    this.bob(c, true, bobMs);
    await this.tw(c, { x, y }, ms, ease);
    this.bob(c, false);
  }
  shake(c, n = 10) { this.s.tweens.add({ targets: c, x: c.x + 1, duration: 55, yoyo: true, repeat: n }); }

  // Speech bubble drawn at screen scale (so it stays crisp even when the stage is zoomed).
  bubble(c, str, ms = 900, color = '#000000') {
    const st = this.stage;
    const x = st.x + st.scaleX * c.x, y = st.y + st.scaleY * (c.y - 32 * Math.abs(c.scaleY));
    const t = this.txt(x, y, str, 8, color, { backgroundColor: '#ffffff', padding: { x: 2, y: 1 } }).setOrigin(0.5, 1).setDepth(60);
    this.s.time.delayedCall(ms, () => t.destroy());
  }

  hearts(x, y, n) {
    for (let i = 0; i < n; i++) {
      this.s.time.delayedCall(i * 260, () => {
        const h = this.s.add.image(x + Math.random() * 14 - 7, y, 'heart');
        this.stage.add(h);
        this.s.tweens.add({ targets: h, y: y - 26, alpha: 0, duration: 1600, onComplete: () => h.destroy() });
      });
    }
  }

  // "Camera" for the stage: scale k, with local point (fx, fy) centred on screen.
  zoom(k, fx, fy) { this.stage.setScale(k).setPosition(W / 2 - fx * k, MID - fy * k); }
  glide(a, b, ms) {
    return new Promise((r) => this.s.tweens.addCounter({
      from: 0, to: 1, duration: ms, ease: 'Sine.easeInOut',
      onUpdate: (tw) => { const v = tw.getValue(); this.zoom(a[0] + (b[0] - a[0]) * v, a[1] + (b[1] - a[1]) * v, a[2] + (b[2] - a[2]) * v); },
      onComplete: r,
    }));
  }

  /* ---------- lifecycle (same interface as before) ---------- */
  start() {
    const s = this.s;
    if (!this.audio.playMusic('movie-music', { fade: 1400 })) this.audio.setDuck(0.35, 800);   // no movie music? just duck
    for (let i = 0; i < 46; i++) this.grain.push(s.add.rectangle(0, 0, 1, 1, 0xffffff, 0.2).setOrigin(0).setDepth(800));
    s.add.image(0, 0, 'vignette').setOrigin(0).setDepth(850).setAlpha(0.8);
    this.black = s.add.rectangle(0, 0, W, H, 0x000000, 1).setOrigin(0).setDepth(700);   // fade curtain (under the bars)
    s.add.rectangle(0, 0, W, BAR, 0x000000).setOrigin(0).setDepth(900);
    s.add.rectangle(0, H - BAR, W, BAR, 0x000000).setOrigin(0).setDepth(900);
    this.txt(6, 8, 'ESC: BACK TO ROOM', 8, '#6d5a70').setDepth(950);
    this.run();
  }

  update() {
    this.grain.forEach((g) => { g.setPosition(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H)); g.setAlpha(Math.random() * 0.22); });
  }

  destroy() {}

  async run() {
    await this.intro();
    await this.stairs();
    await this.bridge();
  }

  /* ---------- 1. intro: night sky, Noah & Sky jumping, credits ---------- */
  async intro() {
    const s = this.s, st = this.newStage();
    this.zoom(1, W / 2, MID);
    this.skyBands(st, TOP, BOT, '#050816', '#1b2457');
    st.add(s.add.circle(W * 0.8, TOP + 34, 22, 0xfff4c9, 0.15));
    st.add(s.add.circle(W * 0.8, TOP + 34, 12, 0xfff4c9));
    for (let i = 0; i < 46; i++) {
      const star = s.add.rectangle(Phaser.Math.Between(2, W - 2), Phaser.Math.Between(TOP + 2, BOT - 30), 1, 1, 0xffffff);
      st.add(star);
      s.tweens.add({ targets: star, alpha: 0.15, duration: Phaser.Math.Between(500, 1600), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 1000) });
    }
    [['noah', 24, 0], ['unicorn', W - 24, 190]].forEach(([key, x, delay]) => {      // Noah bottom-left, Sky bottom-right
      const im = s.add.image(x, BOT - 2, key).setOrigin(0.5, 1).setScale(2);
      st.add(im);
      s.tweens.add({ targets: im, y: BOT - 2 - 22, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.easeOut', delay });
    });

    await this.fadeIn(700);
    for (const [small, big] of CREDITS) {
      const card = s.add.container(0, 0).setDepth(30).setAlpha(0);
      card.add([
        this.txt(W / 2, MID - 14, small.toUpperCase(), 8, '#cfd8ff', { stroke: '#000000', strokeThickness: 2 }).setOrigin(0.5),
        this.txt(W / 2, MID + 8, big, 16, '#ffe9a8', { stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5),
      ]);
      await this.tw(card, { alpha: 1 }, 450);
      await this.wait(1700);
      await this.tw(card, { alpha: 0 }, 450);
      card.destroy();
    }
    await this.fadeOut(600);
  }

  /* ---------- 2. stairs: chase, fight, necklace stolen, separate ways ---------- */
  async stairs() {
    const s = this.s, st = this.newStage();
    this.zoom(1, W / 2, MID);
    const sc = 1.5, floorY = BOT - 8, x0 = W * 0.1, y0 = TOP + 34, n = 10, dx = W * 0.04, dy = (floorY - y0) / n;
    const g = s.add.graphics(); st.add(g);
    g.fillStyle(0x3b2a45).fillRect(0, TOP, W, A);
    g.fillStyle(0x45324f);
    for (let x = 0; x < W; x += 16) g.fillRect(x, TOP, 6, floorY - TOP);              // wallpaper stripes
    g.fillStyle(0x241a2c).fillRect(0, floorY, W, BOT - floorY);
    g.fillStyle(0x6b4a5e).fillRect(0, y0, x0, floorY - y0);                             // top landing
    g.fillStyle(0x8a6479).fillRect(0, y0, x0, 2);
    for (let i = 0; i < n; i++) {
      g.fillStyle(0x6b4a5e).fillRect(x0 + i * dx, y0 + i * dy, dx + 1, floorY - (y0 + i * dy));
      g.fillStyle(0x8a6479).fillRect(x0 + i * dx, y0 + i * dy, dx + 1, 2);
    }
    g.lineStyle(1, 0xc9a37a);                                                           // railing
    g.lineBetween(x0, y0 - 24, x0 + n * dx, floorY - 24);
    for (let i = 0; i <= n; i += 2) g.lineBetween(x0 + i * dx, y0 + i * dy - 24, x0 + i * dx, y0 + i * dy);

    const heroine = this.person(x0 - 8, y0, HEROINE, sc);
    const hero = this.person(x0 - 22, y0, HERO, sc);
    const bottomX = x0 + (n + 0.5) * dx;
    const neck = s.add.graphics().setScale(sc);                                          // the diamond necklace
    neck.fillStyle(0xd8f1ff).fillPoints([{ x: 0, y: -2 }, { x: 2, y: 0 }, { x: 0, y: 2.5 }, { x: -2, y: 0 }], true);
    st.add(neck);
    s.tweens.add({ targets: neck, alpha: 0.5, duration: 250, yoyo: true, repeat: -1 });
    const placeNeck = () => neck.setPosition(heroine.x, heroine.y - 20 * sc);
    placeNeck();

    await this.fadeIn(600);
    const follow = s.time.addEvent({ delay: 16, loop: true, callback: () => { if (!neck.detached) placeNeck(); } });

    // chase down the stairs (she is the butter-yellow dress, he chases)
    await Promise.all([
      (async () => {
        await this.go(heroine, x0 + dx * 0.5, y0, 250, 'Linear', 80);
        await this.go(heroine, bottomX, floorY, 1400, 'Linear', 80);
        await this.go(heroine, W * 0.62, floorY, 450, 'Linear', 80);
      })(),
      (async () => {
        await this.wait(450);
        await this.go(hero, x0 + dx * 0.5, y0, 400, 'Linear', 80);
        await this.go(hero, bottomX, floorY, 1400, 'Linear', 80);
        await this.go(hero, W * 0.5, floorY, 500, 'Linear', 80);
      })(),
    ]);

    // they fight
    this.face(hero, 1); this.face(heroine, -1);
    this.bubble(hero, '#@%!', 1200, '#c0151f');
    this.bubble(heroine, '!!', 1200, '#c0151f');
    this.shake(hero); this.s.time.delayedCall(40, () => this.shake(heroine));
    await this.wait(1500);

    // a man in a suit takes the necklace
    const man = this.person(W + 20, floorY + 2, SUIT, sc);
    await this.go(man, heroine.x + 28, floorY + 2, 1500);
    this.face(man, -1);
    this.bubble(heroine, '!', 900, '#c0151f');
    await this.wait(400);
    neck.detached = true;
    await this.tw(neck, { x: man.x - 6, y: man.y - 12 * sc }, 500);
    this.s.tweens.add({ targets: neck, x: neck.x + (W + 30 - man.x), duration: 1500 });
    await this.go(man, W + 30, floorY + 2, 1500);
    follow.remove();
    await this.wait(600);

    // separate ways
    await Promise.all([
      this.go(hero, -30, floorY, 2200),
      (async () => { await this.wait(600); await this.go(heroine, W + 30, floorY, 2200); })(),
    ]);
    await this.fadeOut(600);
  }

  /* ---------- 3. the bridge ---------- */
  drawBridge(D) {
    const s = this.s, st = this.stage, g = s.add.graphics();
    this.skyBands(st, TOP, D + 1, '#232a5c', '#f6a65c');
    st.add(g);
    g.fillStyle(0xffc878, 0.35).fillCircle(W * 0.5, D, A * 0.2);
    g.fillStyle(0xffd99a, 0.9).fillCircle(W * 0.5, D - 3, A * 0.1);
    g.fillStyle(0x2b2450);                                                              // skyline
    for (let x = 0; x < W; ) { const w = Phaser.Math.Between(8, 20), h = A * (0.04 + Math.random() * 0.12); g.fillRect(x, D - h, w, h); x += w + 1; }
    g.fillStyle(0x1b2a55).fillRect(0, D, W, BOT - D + 40);                              // water
    for (let k = 0; k < 10; k++) g.fillStyle(0xf6a65c, 0.25).fillRect(W * 0.5 - (6 + k * 4), D + A * 0.14 + k * 4, 12 + k * 8, 1);
    const tL = W * 0.22, tR = W * 0.78, top = TOP + A * 0.06, sag = D - A * 0.07;
    for (const tx of [tL, tR]) {
      g.fillStyle(0x3a2f4f).fillRect(tx - 4, top, 8, D + A * 0.28 - top);
      g.fillRect(tx - 4, TOP + A * 0.18, 8, 2).fillRect(tx - 4, TOP + A * 0.32, 8, 2);
    }
    const cable = (x) => (x < tL ? top + (D - 4 - top) * ((tL - x) / tL)
      : x > tR ? top + (D - 4 - top) * ((x - tR) / (W - tR))
      : sag - (sag - top) * Math.pow((x - W / 2) / (W / 2 - tL), 2));
    g.lineStyle(1, 0xe8c9a0, 0.6);
    for (let x = 8; x < W; x += 8) g.lineBetween(x, cable(x), x, D - 4);
    g.lineStyle(1, 0xe8c9a0, 1).beginPath().moveTo(0, cable(0));
    for (let x = 4; x <= W; x += 4) g.lineTo(x, cable(x));
    g.strokePath();
    g.fillStyle(0x34344a).fillRect(0, D, W, A * 0.09);                                  // road
    g.fillStyle(0xe8d27a);
    for (let x = 0; x < W; x += 20) g.fillRect(x, D + A * 0.045, 10, 1);
    g.fillStyle(0xc9b9a0).fillRect(0, D - 4, W, 2);
    g.fillStyle(0x251f3c).fillRect(0, D + A * 0.09, W, A * 0.025);
    for (let x = 20; x < W; x += 40) {                                                  // street lamps
      g.fillStyle(0x3a2f4f).fillRect(x, D - 14, 1.5, 12);
      g.fillStyle(0xffe08a, 0.5).fillCircle(x, D - 15, 4);
    }
  }

  taxi(x, y, sc) {
    const s = this.s, g = s.add.graphics();
    g.fillStyle(0xf2c230).fillRect(-17, -9, 34, 8).fillRect(-9, -16, 19, 8);
    g.fillStyle(0x9fd0e8).fillRect(-7, -15, 7, 6).fillRect(2, -15, 7, 6);
    g.fillStyle(0xffffff).fillRect(-4, -19, 8, 3);
    g.fillStyle(0xfff6b0).fillRect(-18, -7, 2, 3);
    g.fillStyle(0x111111).fillCircle(-10, -1, 3.5).fillCircle(10, -1, 3.5);
    const r = s.add.graphics();                                                         // heroine in the window
    r.fillStyle(0xf2c7a5).fillRect(-5, -14, 4, 4);
    r.fillStyle(0x4a2c20).fillRect(-5.5, -15, 5, 2);
    const c = s.add.container(x, y, [g, r]).setScale(sc);
    c.rider = r;
    this.stage.add(c);
    return c;
  }

  bike(x, y, sc) {
    const s = this.s, g = s.add.graphics();
    g.fillStyle(0x111111).fillCircle(-9, -4, 4).fillCircle(9, -4, 4);
    g.fillStyle(0x888888).fillCircle(-9, -4, 1.5).fillCircle(9, -4, 1.5);
    g.fillStyle(0xc0392b).fillRect(-6, -10, 12, 4).fillRect(-3, -12, 6, 3);
    g.fillStyle(0x999999).fillRect(-9, -12, 1.5, 8).fillRect(-9.5, -14, 4, 1.5);
    g.fillStyle(0x222222).fillRect(1, -11, 7, 2);
    g.fillStyle(0xfff6b0).fillRect(-11.5, -11, 2, 2);
    const c = s.add.container(x, y, [g]).setScale(sc);
    this.stage.add(c);
    return c;
  }

  async bridge() {
    const s = this.s, st = this.newStage();
    const sc = 0.8, D = TOP + A * 0.62;
    const laneT = D + A * 0.05, laneB = D + A * 0.075, laneK = D + A * 0.065;
    this.drawBridge(D);

    const taxi = this.taxi(W * 0.8, laneT, sc * 1.1);
    const bike = this.bike(W * 1.05, laneB, sc);
    const hero = this.person(bike.x, bike.y, HERO, sc);
    this.face(hero, -1);
    const ride = () => hero.setPosition(bike.x + 2 * sc, bike.y - 6 * sc);
    ride();
    this.zoom(2.3, W * 0.46, D);
    await this.fadeIn(600);

    // hero on a motorcycle cuts off the taxi
    await Promise.all([
      this.tw(taxi, { x: W * 0.53 }, 2200, 'Sine.easeOut'),
      this.tw(bike, { x: W * 0.4 }, 1900, 'Cubic.easeOut', ride),
    ]);
    await this.go(hero, W * 0.435, laneK, 500);

    // she steps out in the butter yellow dress, the taxi leaves
    const heroine = this.person(taxi.x - 4 * sc, laneT + 1, HEROINE, sc);
    taxi.rider.destroy();
    st.bringToTop(heroine);
    await this.go(heroine, taxi.x - 24 * sc, laneK, 500);
    this.tw(taxi, { x: W * 1.2 }, 1600, 'Quad.easeIn');
    this.face(heroine, -1); this.face(hero, 1);
    this.bubble(heroine, '...', 900);
    await this.wait(1300);

    // she walks away
    await this.go(heroine, W * 0.6, laneK, 1800);
    await this.wait(400);

    // "BULLSHIT"
    this.shake(hero, 6);
    this.bubble(hero, 'BULLSHIT!', 1500);
    await this.wait(1700);

    // she runs back, the kiss
    const mx = W * 0.5;
    await Promise.all([
      this.go(heroine, mx + 3.5 * sc, laneK, 900, 'Linear', 70),
      this.go(hero, mx - 3.5 * sc, laneK, 900, 'Linear', 70),
    ]);
    this.face(hero, 1); this.face(heroine, -1);
    hero.angle = -5; heroine.angle = 5;
    this.hearts(mx, laneK - 30 * sc, 12);
    await this.wait(1500);

    // zoom out to the scenic bridge
    await this.glide([2.3, W * 0.46, D], [1, W / 2, MID], 3600);
    await this.wait(300);

    const dim = s.add.rectangle(0, TOP, W, A, 0x000000, 0).setOrigin(0).setDepth(40);
    const end = this.txt(W / 2, MID, 'THE END', 24, '#ffe9a8', { stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5).setDepth(41).setAlpha(0);
    this.tw(dim, { alpha: 0.5 }, 1200);
    await this.tw(end, { alpha: 1 }, 1200);
    await this.wait(7000);                              // hold on THE END for 7 seconds
    this.s.input.keyboard.emit('keydown-ESC');          // then leave, same as pressing ESC
  }
}