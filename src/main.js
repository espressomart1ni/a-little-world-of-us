import './style.css';
import Phaser from 'phaser';
import { createConfig } from './game/config.js';
import { getAudio } from './audio/AudioManager.js';
import { AudioPanel } from './ui/AudioPanel.js';

const game = new Phaser.Game(createConfig());
const audio = getAudio(game);
const panel = new AudioPanel(audio);

const title = document.getElementById('title-screen');
const controls = document.getElementById('controls');

// Make the game canvas keyboard-focusable (canvas may not exist yet at this point, so also do it once the game is ready).
function makeCanvasFocusable() {
  game.canvas?.setAttribute('tabindex', '0');
}
makeCanvasFocusable();
game.events.once('ready', makeCanvasFocusable);

function start() {
  if (game.registry.get('started')) return;
  game.registry.set('started', true);
  title?.classList.add('hide');
  controls?.classList.remove('hide');
  panel.show();
  audio.playMusic('bgm');                      // first key press / click also unlocks browser audio
  makeCanvasFocusable();
  game.canvas?.focus();
}

function handleKeyDown(e) {
  if (game.registry.get('started')) return;    // only intercept keys on the title screen
  if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') {
    e.preventDefault();
    start();
  }
}

// Capture keyboard events at document level so nothing swallows the start key.
document.addEventListener('keydown', handleKeyDown, true);

// Keep mouse/touchpad interaction working.
title?.addEventListener('pointerdown', start);

// The monitor is a full-canvas Phaser scene, so hide the room's key hints while it is up.
game.events.on('monitor:open', () => controls?.classList.add('hide'));
game.events.on('monitor:close', () => controls?.classList.remove('hide'));