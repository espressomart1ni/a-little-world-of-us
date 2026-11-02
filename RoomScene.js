import Phaser from 'phaser';
import { GAME_W, GAME_H, ROOM_SIZE } from '../utils/isometric.js';
import { buildRoom } from '../objects/RoomObjects.js';
import { Yash } from '../characters/Yash.js';
import { Arkesha } from '../characters/Arkesha.js';
import { InteractionSystem } from '../systems/InteractionSystem.js';
import { DialogueBox } from '../ui/DialogueBox.js';

const WALL_MARGIN = 0.25;

export class RoomScene extends Phaser.Scene {
  constructor() { super('Room'); }

  create() {
    this.cameras.main.setBackgroundColor('#2b2133');
    this.add.image(0, 0, 'room').setOrigin(0, 0).setDepth(-100);

    const room = buildRoom(this);
    this.solids = room.solids;

    this.yash = new Yash(this, 4.6, 5.4);
    this.arkesha = new Arkesha(this, 5.8, 3.0, this.yash);
    this.solids.push(this.arkesha.solid);

    this.interaction = new InteractionSystem(this, [...room.targets, this.arkesha.target], this.yash);
    this.dialogue = new DialogueBox();

    // cozy lighting: warm multiply tint + soft vignette
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0xffe2b8)
      .setBlendMode(Phaser.BlendModes.MULTIPLY).setDepth(9000);
    this.add.image(0, 0, 'vignette').setOrigin(0, 0).setDepth(9001);

    this.input.keyboard.on('keydown-E', () => this.onInteract());
    this.input.keyboard.on('keydown-ESC', () => this.dialogue.close());
  }

  onInteract() {
    if (!this.registry.get('started')) return;
    if (this.dialogue.isOpen) { this.dialogue.advance(); return; }
    const t = this.interaction.current;
    if (t) this.dialogue.show(t.name, t.lines);
  }

  // true if a circle of radius r at (gx, gy) hits a wall or furniture
  isBlocked(gx, gy, r) {
    const lo = WALL_MARGIN, hi = ROOM_SIZE - WALL_MARGIN;
    if (gx < lo || gy < lo || gx > hi || gy > hi) return true;
    return this.solids.some((s) => gx > s.x0 - r && gx < s.x1 + r && gy > s.y0 - r && gy < s.y1 + r);
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    const locked = !this.registry.get('started') || this.dialogue.isOpen;
    this.yash.update(dt, locked);
    this.arkesha.update();
    this.interaction.update(time, locked);
  }
}
