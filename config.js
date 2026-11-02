import Phaser from 'phaser';
import { GAME_W, GAME_H } from './utils/isometric.js';
import { BootScene } from './scenes/BootScene.js';
import { RoomScene } from './scenes/RoomScene.js';

export const createConfig = () => ({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,            // small internal resolution = chunky, crisp pixels
  height: GAME_H,
  backgroundColor: '#2b2133',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, RoomScene],
});
