import Phaser from 'phaser';
import { generateAllTextures, CHARACTER_KEYS } from '../assets/ProceduralTextures.js';
import { generateExtraTextures } from '../assets/ExtraTextures.js';
import { getAudio, loadAudio } from '../audio/AudioManager.js';
import { whenFontReady } from '../utils/theme.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // LATER: load real art here using the SAME keys and the generator will skip its placeholder, e.g.
    // this.load.spritesheet('yash', 'assets/yash.png', { frameWidth: 18, frameHeight: 28 }); // frames 0-1 idle, 2-5 walk, 6-7 sit, 8-9 eat
    const audio = getAudio(this);
    loadAudio(this.load);
    this.load.on('loaderror', (file) => audio.markMissing(file.key));   // missing audio never stops the game
  }

  create() {
    generateAllTextures(this);
    generateExtraTextures(this);
    CHARACTER_KEYS.forEach((k) => {
      this.anims.create({ key: `${k}-idle`, frames: [0, 1].map((f) => ({ key: k, frame: f })), frameRate: 2, repeat: -1 });
      this.anims.create({ key: `${k}-walk`, frames: [2, 3, 4, 5].map((f) => ({ key: k, frame: f })), frameRate: 8, repeat: -1 });
      this.anims.create({ key: `${k}-sit`, frames: [6, 7].map((f) => ({ key: k, frame: f })), frameRate: 2, repeat: -1 });
      this.anims.create({ key: `${k}-eat`, frames: [8, 9].map((f) => ({ key: k, frame: f })), frameRate: 4, repeat: -1 });
    });
    getAudio(this).onAssetsLoaded();
    whenFontReady().then(() => this.scene.start('Room'));
  }
}