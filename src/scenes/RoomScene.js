import Phaser from 'phaser';
import { GAME_W, GAME_H, ROOM_SIZE, gridToScreen } from '../utils/isometric.js';
import { buildRoom } from '../objects/RoomObjects.js';
import { PizzaSlice } from '../objects/PizzaSlice.js';
import { Yash } from '../characters/Yash.js';
import { Arkisha } from '../characters/Arkisha.js';
import { InteractionSystem } from '../systems/InteractionSystem.js';
import { talkToArkisha } from '../systems/Conversations.js';
import { MovieNight, SEAT } from '../systems/MovieNight.js';
import { DialogueBox } from '../ui/DialogueBox.js';
import { getAudio } from '../audio/AudioManager.js';
import { BedCuddle } from '../systems/BedCuddle.js';

const WALL_MARGIN = 0.25;
const mp = gridToScreen(3.45, 0.55);                       // centre of the monitor face on the desk
const MONITOR_PX = [Math.round(mp.x), Math.round(mp.y - 22)];

export class RoomScene extends Phaser.Scene {
  constructor() { super('Room'); }

  create() {
    this.audio = getAudio(this);
    this.scripted = false;          // true while a cutscene drives the characters
    this.wakeResolve = null;
    this.cameras.main.setBackgroundColor('#2b2133');
    this.add.image(0, 0, 'room').setOrigin(0, 0).setDepth(-100);

    const room = buildRoom(this, this.audio);
    this.fridge = room.fridge; 
    this.solids = room.solids;
    this.pizza = room.pizza;

    this.yash = new Yash(this, 4.6, 5.4);
    this.Arkisha = new Arkisha(this, 5.8, 3.0, this.yash);
    this.solids.push(this.Arkisha.solid);

    this.dialogue = new DialogueBox(this.audio);
    this.movieNight = new MovieNight(this);
    this.bedCuddle = new BedCuddle(this, room.plush);

    // the green can that ends up on the desk when Yash sits down (tweak the offsets to line up with your desk art)
    const dp = gridToScreen(5.0, 0.9);
    this.deskCan = this.add.image(Math.round(dp.x), Math.round(dp.y - 20), 'can').setDepth(5).setVisible(false);

    // custom actions per target
    const byId = Object.fromEntries(room.targets.map((t) => [t.id, t]));
    byId.fridge.onTalk = () => this.openFridge();
    byId.desk.onTalk = () => this.deskMenu();
    byId.pizza.onTalk = () => this.usePizza();
    byId.bed.onTalk = () => this.bedCuddle.start();
    this.Arkisha.target.onTalk = () => talkToArkisha(this);

    this.interaction = new InteractionSystem(this, [...room.targets, this.Arkisha.target], this.yash);

    // clicking the monitor or the pizza box works like pressing E next to them
    this.monitorZone = this.add.zone(MONITOR_PX[0], MONITOR_PX[1], 28, 16).setInteractive({ useHandCursor: true });
    this.monitorZone.on('pointerdown', () => this.clickTarget('desk'));
    this.pizza.image.on('pointerdown', () => this.clickTarget('pizza'));

    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0xffe2b8)
      .setBlendMode(Phaser.BlendModes.MULTIPLY).setDepth(9000);
    this.add.image(0, 0, 'vignette').setOrigin(0, 0).setDepth(9001);

    this.input.keyboard.on('keydown-E', () => this.onInteract());
    this.input.keyboard.on('keydown-ESC', () => this.dialogue.close());

    this.events.on('wake', this.handleWake, this);
    this.events.on('sleep', () => this.audio.setLoop('sfx-footsteps', 0, 60));
  }

  /* ---------- interaction ---------- */
  onInteract() {
    if (!this.registry.get('started')) return;
    if (this.dialogue.isOpen) { this.dialogue.advance(); return; }
    if (this.scripted) return;
    this.interact();
  }

  interact() {
    const t = this.interaction.current;
    if (!t) return;
    this.audio.ui('click');
    if (t.onTalk) t.onTalk(); else this.dialogue.show(t.name, t.lines);
  }

  clickTarget(id) {
    if (!this.registry.get('started') || this.scripted || this.dialogue.isOpen) return;
    const t = this.interaction.current;
    if (t && t.id === id) { this.interact(); return; }
    this.dialogue.show('Yash', [id === 'desk' ? 'I should walk up to the desk first.' : 'I should get closer to the pizza first.']);
  }

    openFridge() {
    const y = this.yash;
    if (y.hasCan) { this.dialogue.show('Mini Fridge', ["You're already holding one. Go enjoy it!"]); return; }
    this.fridge?.open();                                   // door swings open, cans visible
    this.time.delayedCall(450, () => {
      y.hasCan = true;
      this.dialogue.show('Mini Fridge', ['You grab a cold Elderflower Red Bull.', '(Carry it over to the desk.)']);
    });
    this.time.delayedCall(1600, () => this.fridge?.close());   // shuts again after he takes it
  }
  
  async usePizza() {
    const pz = this.pizza, y = this.yash, d = this.dialogue;
    if (pz.state === 'opening') return;
    if (pz.state === 'closed') {                      // E / click: the lid opens
      this.scripted = true;
      await pz.open();
      this.scripted = false;
      if (!this.movieNight.armed) d.show('Pizza Box', ['Still warm. Look at that cheese.']);
      return;
    }
    if (y.slice) { d.show('Pizza Box', ['Your hands are full.']); return; }
    if (!pz.takeSlice()) { d.show('Pizza Box', ['Empty. Not a crumb left.']); return; }
    y.holdSlice(new PizzaSlice(this));                // second E: take a slice
    if (this.movieNight.armed) this.movieNight.run(); else this.movieNight.snack();
  }

  /* ---------- desk + monitor ---------- */
  async deskMenu() {
    const d = this.dialogue;
    const i = await d.choose(['Coding mode', 'Movie mode', 'Never mind'], 'Computer Desk', 'What do you want to do?');
    d.close();
    if (i === 0 || i === 1) await this.useComputer(i === 0 ? 'coding' : 'movie');
  }

  async useComputer(mode) {
    const y = this.yash;
    this.scripted = true;
    await y.walkPath(y.gx < SEAT[0] ? [[3.5, 2.3], SEAT.slice()] : [[5.1, 2.3], SEAT.slice()], 2.6);
    this.sitYash();
    await new Promise((r) => this.time.delayedCall(250, r));
    await this.enterMonitor(mode);
    y.setPose('stand'); y.depthBias = 0;
    await y.walkPath([[5.0, 2.4]], 2.4);
    this.scripted = false;
  }

  sitYash() {
    const y = this.yash;
    y.gx = SEAT[0]; y.gy = SEAT[1];
    y.setPose('sit'); y.sprite.setFlipX(false); y.depthBias = 0.4;
    if (y.hasCan) { y.hasCan = false; this.deskCan.setVisible(true); }   // the can goes on the desk
    y.sync();
  }

  // Zoom into the monitor, fade out, hand the whole viewport to MonitorScene. Resolves when you come back.
  enterMonitor(mode) {
    return new Promise((resolve) => {
      const cam = this.cameras.main;
      this.audio.ui('click');
      cam.pan(MONITOR_PX[0], MONITOR_PX[1], 700, 'Sine.easeInOut');
      cam.zoomTo(3.4, 700, 'Sine.easeInOut');
      this.time.delayedCall(760, () => {
        cam.fadeOut(280, 0, 0, 0);
        cam.once('camerafadeoutcomplete', () => {
          this.wakeResolve = resolve;
          this.audio.setLoop('sfx-footsteps', 0, 80);
          this.scene.launch('Monitor', { mode });
          this.scene.sleep();                          // the room is frozen exactly as it is
        });
      });
    });
  }

  handleWake() {
    const cam = this.cameras.main;
    cam.resetFX(); cam.setZoom(1); cam.centerOn(GAME_W / 2, GAME_H / 2);
    cam.fadeIn(420, 0, 0, 0);
    this.input.keyboard.resetKeys();                   // key-ups were missed while asleep
    const r = this.wakeResolve; this.wakeResolve = null;
    if (r) r();
  }

    // fade to black, show a caption, fade back in (optional looping sound while it's black)
  cinematic(text, sound = null) {
    return new Promise((res) => {
      const prev = this.scripted;
      this.scripted = true;
      const cam = this.cameras.main, cap = document.getElementById('caption');
      cam.fadeOut(900, 0, 0, 0);
      cam.once('camerafadeoutcomplete', () => {
        cap.textContent = text; cap.classList.remove('hide');
        if (sound) this.audio.setLoop(sound, 1, 300);          // fades in once it's dark
        this.time.delayedCall(2200, () => {
          if (sound) this.audio.setLoop(sound, 0, 700);        // fades out as the picture returns
          cap.classList.add('hide');
          cam.fadeIn(900, 0, 0, 0);
          cam.once('camerafadeincomplete', () => { this.scripted = prev; res(); });
        });
      });
    });
  }

  isBlocked(gx, gy, r) {
    const lo = WALL_MARGIN, hi = ROOM_SIZE - WALL_MARGIN;
    if (gx < lo || gy < lo || gx > hi || gy > hi) return true;
    return this.solids.some((s) => gx > s.x0 - r && gx < s.x1 + r && gy > s.y0 - r && gy < s.y1 + r);
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    const started = this.registry.get('started');
    const locked = !started || this.dialogue.isOpen || this.scripted;
    this.yash.update(dt, locked);
    if (started) this.Arkisha.update(dt);
    this.interaction.update(time, locked);
    // footsteps: full volume for Yash, faint when only Arkisha is walking
    this.audio.setLoop('sfx-footsteps', this.yash.isWalking ? 1 : this.Arkisha.isWalking ? 0.3 : 0);
  }
}