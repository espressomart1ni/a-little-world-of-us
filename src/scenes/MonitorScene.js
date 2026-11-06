import Phaser from 'phaser';
import { getAudio } from '../audio/AudioManager.js';
import { CodingExperience } from '../monitor/CodingExperience.js';
import { MovieExperience } from '../monitor/MovieExperience.js';

// Full-viewport computer screen. The Room scene sleeps underneath, untouched, until ESC wakes it.
export class MonitorScene extends Phaser.Scene {
  constructor() { super('Monitor'); }

  init(data) { this.mode = (data && data.mode) || 'coding'; this.leaving = false; }

  create() {
    this.audio = getAudio(this);
    const cam = this.cameras.main;
    cam.setBackgroundColor('#000000');
    cam.fadeIn(380, 0, 0, 0);
    this.exp = this.mode === 'movie' ? new MovieExperience(this, this.audio) : new CodingExperience(this, this.audio);
    this.exp.start();
    this.input.keyboard.on('keydown-ESC', () => this.exit());
    this.game.events.emit('monitor:open', this.mode);
    this.events.once('shutdown', () => this.game.events.emit('monitor:close'));
  }

  update(time, delta) { if (this.exp) this.exp.update(time, delta); }

  exit() {
    if (this.leaving) return;
    this.leaving = true;
    this.audio.ui('click');
    const cam = this.cameras.main;
    cam.fadeOut(300, 0, 0, 0);
    cam.once('camerafadeoutcomplete', () => {
      this.exp.destroy(); this.exp = null;
      if (this.mode === 'movie') this.audio.playMusic('bgm', { fade: 1500 });   // back to room music
      this.audio.setDuck(1, 700);
      this.scene.wake('Room');
      this.scene.stop();
    });
  }
}