import './style.css';
import Phaser from 'phaser';
import { createConfig } from './game/config.js';

const game = new Phaser.Game(createConfig());

const title = document.getElementById('title-screen');
const controls = document.getElementById('controls');

function start() {
  if (game.registry.get('started')) return;
  game.registry.set('started', true);
  title.classList.add('hide');
  controls.classList.remove('hide');
}
window.addEventListener('keydown', (e) => { if (e.code === 'Enter' || e.code === 'Space') start(); });
title.addEventListener('pointerdown', start);
