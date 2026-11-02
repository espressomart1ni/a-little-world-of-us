import Phaser from 'phaser';
import { generateAllTextures, CHARACTER_KEYS } from '../assets/ProceduralTextures.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // LATER: load real art here using the SAME keys and the generator will skip its placeholder, e.g.
    // this.load.spritesheet('yash', 'assets/yash.png', { frameWidth: 18, frameHeight: 28 }); // frames 0-1 idle, 2-5 walk
    // this.load.image('bed', 'assets/bed.png');
  }

  create() {
    generateAllTextures(this);
    CHARACTER_KEYS.forEach((k) => {
      this.anims.create({ key: `${k}-idle`, frames: [0, 1].map((f) => ({ key: k, frame: f })), frameRate: 2, repeat: -1 });
      this.anims.create({ key: `${k}-walk`, frames: [2, 3, 4, 5].map((f) => ({ key: k, frame: f })), frameRate: 8, repeat: -1 });
    });
    this.scene.start('Room');
  }
}
